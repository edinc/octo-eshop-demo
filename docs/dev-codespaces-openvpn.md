# Dev Codespaces ↔ Azure Private PostgreSQL via OpenVPN P2S

> **Status:** Alternative approach implemented on `feature/dev-codespaces-openvpn`.
> See [Comparison to the hosted-compute approach](#comparison-to-the-hosted-compute-approach) below.

The dev PostgreSQL Flexible Servers are private-only
(`public_network_access_enabled = false`, attached to a delegated subnet on
the dev VNet). GitHub Codespaces cannot reach them over the public internet.

This guide covers an end-to-end **OpenVPN Point-to-Site** approach modelled
on Daniel Meixner's article
[Connecting Codespaces to Azure VNets via VPN](https://danielmeixner.github.io/Codespaces-VPN-Azure/)
and the canonical [`codespaces-contrib/codespaces-openvpn`](https://github.com/codespaces-contrib/codespaces-openvpn)
sample. It is intentionally testable end-to-end **without CI/CD** — provision
locally, paste a Codespaces secret, rebuild the codespace.

---

## Architecture

```
                    ┌───────────────────────────────┐
                    │      GitHub Codespace         │
                    │ (typescript-node:20 +         │
                    │  openvpn, NET_ADMIN cap,      │
                    │  /dev/net/tun)                │
                    │                               │
                    │  postStartCommand:            │
                    │  install-dev-tools.sh         │
                    │  └── openvpn --config         │
                    │      .ignore/openvpn.config   │
                    └──────────┬────────────────────┘
                               │ OpenVPN over TLS
                               │ (certificate auth)
                               ▼
              ┌──────────────────────────────────────┐
              │ Azure VPN Gateway (VpnGw1, P2S)      │
              │   public IP: <gateway_public_ip>     │
              │   client pool: 172.16.201.0/24       │
              │   OpenVPN tunnel type, cert auth     │
              └──────────────┬───────────────────────┘
                             │ inside dev VNet
                             ▼
   ┌────────────────────────────────────────────────────────┐
   │ dev VNet 10.0.0.0/16                                  │
   │  ├─ aks-subnet      10.0.1.0/24                       │
   │  ├─ database-subnet 10.0.2.0/24  ← PostgreSQL Flex   │
   │  ├─ redis-subnet    10.0.3.0/24                       │
   │  └─ GatewaySubnet   10.0.255.0/27                     │
   │                                                        │
   │ db-nsg:                                                │
   │  100  Allow tcp/5432 from aks-subnet                  │
   │  110  Allow tcp/5432 from 172.16.201.0/24  ← new     │
   │  4096 Deny  *                                         │
   └────────────────────────────────────────────────────────┘
```

## Azure resources

All gated by `var.enable_dev_codespaces_openvpn` (default `false`).

| Resource (Terraform)                                                                | Purpose                                                                                                                                                     |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `azurerm_subnet.gateway` (`GatewaySubnet`, `10.0.255.0/27`)                         | Azure-mandated dedicated subnet for the gateway. Name must be exactly `GatewaySubnet`.                                                                      |
| `azurerm_public_ip.gateway` (Standard, Static; zonal only when SKU ends in `AZ`)    | Public endpoint for OpenVPN clients to reach. Zones are set automatically based on `gateway_sku`: regional for `VpnGw1/2/3`, zone-redundant for `*AZ`.      |
| `azurerm_virtual_network_gateway.main` (`VpnGw1`, `Generation1`, `RouteBased`)      | The P2S gateway. `vpn_client_configuration` enables OpenVPN tunnel type, certificate auth, address pool, and trusted root cert.                             |
| `security_rule "AllowPostgreSQLFromAdditionalSources"` (inside `module.networking`) | Allow tcp/5432 from `172.16.201.0/24`. Priority `110`, between the AKS allow (100) and deny-all (4096). Managed inline alongside the existing DB NSG rules. |
| Outputs (`environments/dev`)                                                        | `codespaces_vpn_gateway_name`, `codespaces_vpn_gateway_public_ip`, `codespaces_vpn_client_address_pool`, `*_db_fqdn`, etc.                                  |

The gateway is the dominant cost: **VpnGw1 is roughly USD 140 / month** at
the time of writing. Basic SKU does not support OpenVPN, so VpnGw1 is the
floor. Provisioning takes **30–45 minutes** and so does destroy, so flip
`enable_dev_codespaces_openvpn` on/off deliberately.

## Files in this branch

| Path                                                                    | What it does                                                                             |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `.devcontainer/Dockerfile`                                              | Adds `openvpn`, `iproute2`, `resolvconf` to the standard `typescript-node:20` image.     |
| `.devcontainer/devcontainer.json`                                       | Switches from inline `image:` to `build:`, adds `runArgs` for capabilities + TUN device. |
| `.devcontainer/postcreate/install-dev-tools.sh`                         | Reads `OPENVPNCONFIG` secret, writes `.ignore/openvpn.config`, starts OpenVPN.           |
| `.gitignore`                                                            | Adds `.ignore/` and `codespaces-vpn-secrets/` so private material never gets committed.  |
| `infrastructure/terraform/modules/codespaces_vpn/`                      | New module: GatewaySubnet, public IP, P2S OpenVPN gateway.                               |
| `infrastructure/terraform/modules/networking/outputs.tf`                | Exposes the database NSG name + VNet name needed by the new module / NSG rule.           |
| `infrastructure/terraform/environments/dev/{main,variables,outputs}.tf` | Wire up the module, variables, outputs.                                                  |
| `scripts/generate-codespaces-vpn-cert.sh`                               | Local helper: generates the root + client certs Azure expects.                           |
| `scripts/build-codespaces-openvpn-config.sh`                            | Local helper: pulls Azure's profile and splices in the client cert/key.                  |

---

## Prerequisites

- Azure subscription with rights to create a resource group, public IP, and
  Virtual Network Gateway in the dev region (`swedencentral`).
- `az` CLI signed in to the subscription (`az login`).
- `terraform >= 1.5.0` (matches the rest of the repo).
- `openssl`, `jq`, `unzip`, `curl`.
- A GitHub account that can:
  - Add a Codespaces **user** secret (`OPENVPNCONFIG`).
  - Create / rebuild a Codespace on this fork.

## Manual local test flow (no CI/CD)

Everything below runs from your laptop / dev workstation. CI/CD is not
involved at any step.

### 1. Generate the certificates

```bash
./scripts/generate-codespaces-vpn-cert.sh
```

Produces `codespaces-vpn-secrets/`:

- `azure-vpn-root.{key,crt}` — root CA (`CA:TRUE`, `keyCertSign + cRLSign`).
- `azure-vpn-root-public.txt` — base64 body of the root cert with the
  `-----BEGIN/END-----` markers and line breaks stripped, ready to feed
  into `vpn_client_configuration.root_certificate.public_cert_data`.
- `azure-vpn-client.{key,crt,pem}` — client cert with `clientAuth` EKU,
  signed by the root.

The directory is `0700` and is git-ignored. **Treat the `.key` and `.pem`
files as secrets — they grant tunnel access.**

### 2. Apply Terraform with the gateway enabled

```bash
cd infrastructure/terraform/environments/dev

export TF_VAR_codespaces_vpn_root_certificate_public_data="$(cat ../../../codespaces-vpn-secrets/azure-vpn-root-public.txt)"
export TF_VAR_enable_dev_codespaces_openvpn=true

terraform init                # or `terraform init -reconfigure` if backend changes
terraform plan -out=tfplan    # confirm: GatewaySubnet, public IP, gateway, NSG rule
terraform apply tfplan        # 30-45 minutes
```

When apply finishes you should have:

```bash
$ terraform output codespaces_vpn_gateway_name
"octoeshop-dev-codespaces-vpn-gw"

$ terraform output codespaces_vpn_gateway_public_ip
"<the gateway's public IP>"
```

### 3. Build the OpenVPN profile

```bash
cd "$(git rev-parse --show-toplevel)"
./scripts/build-codespaces-openvpn-config.sh > /tmp/vpnconfig.ovpn
```

The script:

1. Reads the gateway and resource group names from `terraform output`.
2. Calls `az network vnet-gateway vpn-client generate --processor-architecture Amd64`
   which returns a SAS URL.
3. Downloads the zip, extracts `OpenVPN/vpnconfig.ovpn`.
4. Replaces the `$CLIENTCERTIFICATE` and `$PRIVATEKEY` placeholders with
   the cert and key from `codespaces-vpn-secrets/azure-vpn-client.pem`.
5. Appends `disable-dco` so OpenVPN ≥ 2.6 (which the Debian 13-based
   devcontainer ships) does not negotiate Data Channel Offload —
   currently incompatible with Azure VPN Gateway per Microsoft's Linux
   OpenVPN guidance.
6. Prints the final profile to stdout.

### 4. Add the Codespaces secret

The secret name is **`OPENVPNCONFIG`** (no underscore — matching the
referenced article). Use a **user-level** secret (not repo-level) so that
the secret value is yours alone, then grant it to this repository:

Either via the GitHub web UI:

> Settings → Codespaces → Secrets → New secret  
> Name: `OPENVPNCONFIG`  
> Value: paste the contents of `/tmp/vpnconfig.ovpn`  
> Repository access: pick this repo

Or via `gh`:

```bash
gh secret set OPENVPNCONFIG \
    --user \
    --repos "$(gh repo view --json nameWithOwner -q .nameWithOwner)" \
    --body "$(cat /tmp/vpnconfig.ovpn)"
```

### 5. Rebuild the Codespace and verify

> **Important — rebuild, not restart.** Changes to `Dockerfile` or `runArgs`
> in `devcontainer.json` are not picked up by a plain restart. From the
> Codespaces command palette, choose **“Codespaces: Rebuild Container”**
> (full rebuild). For a fresh Codespace, just create a new one on the
> `feature/dev-codespaces-openvpn` branch.

After the rebuild, the `postStartCommand` calls `install-dev-tools.sh`,
which:

- Verifies `/dev/net/tun` exists in the container (preflight check).
- Writes `OPENVPNCONFIG` to `.ignore/openvpn.config` (mode `600`).
- Launches `openvpn` as a daemon, logs to `.ignore/openvpn.log`, and
  records the PID in `.ignore/openvpn.pid`.
- Polls the log for `Initialization Sequence Completed` for up to 20s.

Verify in the Codespace terminal:

```bash
# 1. Tunnel up?
sudo ip addr show tun0

# 2. Routes pointing into the dev VNet?
ip route | grep 10.0

# 3. Reach a private dev resource. Use the gateway-pushed DNS for resolve;
#    otherwise resolve via the workaround below.
nslookup "$(terraform -chdir=infrastructure/terraform/environments/dev output -raw user_db_fqdn)" 168.63.129.16 || true

# 4. TCP probe — the simplest "is the route alive?" test. The PostgreSQL
#    Flexible Server's private IP is in 10.0.2.0/24.
nc -vz <user_db_private_ip> 5432
```

### 6. Connect with `psql` (DNS workaround)

P2S clients sit outside the VNet, so Azure's link-local DNS
(`168.63.129.16`) does not resolve `*.postgres.database.azure.com` for
them. The simplest no-extra-cost test is to use the private IP directly:

```bash
# Pull the FQDN the connection string expects
USER_DB_FQDN="$(terraform -chdir=infrastructure/terraform/environments/dev \
    output -raw user_db_fqdn)"
USER_DB_NAME="$(basename "$USER_DB_FQDN" .postgres.database.azure.com)"
DNS_ZONE="$(terraform -chdir=infrastructure/terraform/environments/dev \
    output -raw postgresql_private_dns_zone_name)"
RG="$(terraform -chdir=infrastructure/terraform/environments/dev \
    output -raw resource_group_name)"

# Look up the private IP via the private DNS zone (operator-side; az has
# Reader access, no VPN needed)
USER_DB_IP="$(az network private-dns record-set a show \
    --resource-group "$RG" \
    --zone-name "$DNS_ZONE" \
    --name "$USER_DB_NAME" \
    --query 'aRecords[0].ipv4Address' -o tsv)"

# Map the FQDN to the IP inside the codespace
echo "$USER_DB_IP $USER_DB_FQDN" | sudo tee -a /etc/hosts

# Connect (sslmode=require skips hostname-vs-IP verification)
PGPASSWORD="$(az keyvault secret show \
    --vault-name "$(terraform -chdir=infrastructure/terraform/environments/dev output -raw key_vault_name)" \
    --name user-db-connection-string -o tsv --query value | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')" \
psql "host=$USER_DB_FQDN port=5432 dbname=userdb user=pgadmin sslmode=require"
```

For ongoing use, deploy an Azure DNS Private Resolver inbound endpoint and
push its IP via the gateway's `vpn_client_configuration.dns_servers`
attribute. That is intentionally **out of scope** for this branch to keep
cost down — see [Future improvements](#future-improvements).

### 7. Tear down when done

`VpnGw1` bills hourly. Tear it down as soon as you finish testing:

```bash
cd infrastructure/terraform/environments/dev
unset TF_VAR_enable_dev_codespaces_openvpn
terraform apply
```

(or set the var back to `false`). This destroys the gateway, public IP,
GatewaySubnet, and NSG rule. The rest of the dev environment is unchanged.

---

## Security model

Read this section before enabling the gateway.

- **The gateway has a public IP by design.** Authentication is
  certificate-based (Azure rejects connections without a client cert
  signed by the registered root).
- **Cert auth is not MFA.** Whoever holds `azure-vpn-client.pem` has
  network-level access to the dev VNet. Treat it like an SSH key.
- **Use a Codespaces _user_ secret, not a repository secret.** Repository
  secrets are visible to anyone who can create a Codespace on the repo;
  user secrets are only available to the user who created them, even
  when granted to a repo.
- **Per-user client certs.** For more than one developer, generate one
  client cert per user and put each user's `.pem` in their own
  `codespaces-vpn-secrets/`. The same root cert authenticates all of them
  and the gateway tracks each tunnel separately.
- **Revocation.** Compromised client certs are revoked by adding their
  thumbprint to `vpn_client_configuration.revoked_certificate` blocks.
  Compromised root means re-issuing all client certs and re-applying.
- **PostgreSQL is still TLS.** The NSG rule only opens tcp/5432 from
  `172.16.201.0/24`. Connections still require the PostgreSQL admin
  password from Key Vault.
- **`.ignore/` and `codespaces-vpn-secrets/` are git-ignored.** Do not
  weaken those rules and do not remove the `umask 077` / `chmod 600`
  guards in the scripts.
- **Logs.** `.ignore/openvpn.log` may contain endpoint / route
  information. Don't paste it into public issues unredacted.

## Comparison to the hosted-compute approach

There is a sibling branch `feature/dev-codespaces-vpn` implementing a
different solution: GitHub-managed
[hosted-compute private networking](https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise)
via `GitHub.Network/networkSettings`.

| Dimension             | OpenVPN P2S (this branch)                                                                  | Hosted-compute private networking (sibling)                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Today's status        | Works in any GitHub plan that allows `runArgs` capability flags.                           | Works for hosted Actions runners now; **Codespaces** integration is a private preview not enabled on this account. |
| Egress public IP      | A new Azure public IP attached to the VPN Gateway.                                         | None — traffic egresses to Azure across GitHub-managed peering.                                                    |
| Codespace changes     | Custom Dockerfile, `--cap-add=NET_ADMIN`, `/dev/net/tun`, openvpn client.                  | None inside the Codespace; networking happens before user code runs.                                               |
| Recurring Azure cost  | ~USD 140 / month for VpnGw1 (cheapest SKU that supports OpenVPN).                          | Just the delegated subnet + NSG; no gateway.                                                                       |
| Provisioning time     | 30–45 min apply, 30–45 min destroy.                                                        | Minutes.                                                                                                           |
| Auth                  | Self-signed root + per-user client cert.                                                   | Managed by GitHub via the org/enterprise network configuration.                                                    |
| DNS for private FQDNs | Not solved by default — operator side-loads `/etc/hosts` or deploys an Azure DNS Resolver. | Same — needs Azure-side DNS strategy.                                                                              |
| Client OS support     | Anywhere with OpenVPN ≥ 2.4 (with `disable-dco` for ≥ 2.6).                                | Only GitHub-hosted compute.                                                                                        |

Pick the OpenVPN approach when you need a tunnel **today** and are willing
to pay the gateway cost. Pick hosted-compute private networking when your
account is in the Codespaces preview and you want zero per-codespace setup.

---

## Troubleshooting

| Symptom                                                                                  | Likely cause                                                                                                                                                         | Fix                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `❌ /dev/net/tun is not present in the container.`                                       | Codespace was restarted but not rebuilt after `runArgs` change.                                                                                                      | Run **Codespaces: Rebuild Container** or open a new Codespace.                                                                                                             |
| `TUNSETIFF: Operation not permitted`                                                     | NET_ADMIN capability not granted.                                                                                                                                    | Confirm `runArgs` includes `--cap-add=NET_ADMIN` and rebuild. Verify with `capsh --print`.                                                                                 |
| `OpenVPN ROUTE: failed to parse/resolve`, or tunnel up but `nc` to private IP times out. | Stale routes from a previous run.                                                                                                                                    | `sudo pkill openvpn` then re-run `bash .devcontainer/postcreate/install-dev-tools.sh`.                                                                                     |
| `OpenVPN data channel offload not available with kernel: …`                              | Running OpenVPN ≥ 2.6 without `disable-dco`. The `build-codespaces-openvpn-config.sh` script appends it for you, so this only appears if you hand-built the profile. | Append `disable-dco` to your `vpnconfig.ovpn` and update the secret.                                                                                                       |
| `Initialization Sequence Completed` never logged.                                        | Cert mismatch (client cert not signed by registered root) or the gateway is still provisioning.                                                                      | `terraform output codespaces_vpn_gateway_name` and check `az network vnet-gateway show -g <RG> -n <name> --query provisioningState`. Re-run cert + config build if needed. |
| `psql` fails with `server certificate verification failed`.                              | Connecting to the FQDN with `sslmode=verify-full` while bypassing public DNS via `/etc/hosts`.                                                                       | Use `sslmode=require`, or deploy a DNS resolver and use the FQDN through it.                                                                                               |

The OpenVPN log lives at `.ignore/openvpn.log`. The PID lives at
`.ignore/openvpn.pid`. Stop the tunnel with
`sudo kill $(cat .ignore/openvpn.pid)`.

## Future improvements

- **Azure DNS Private Resolver** (inbound endpoint) so `*.postgres.database.azure.com` resolves end-to-end inside Codespaces without `/etc/hosts` workarounds. Adds another monthly cost.
- **Per-user client certs in a Key Vault.** Today the operator distributes `azure-vpn-client.pem` directly. A small wrapper around `az keyvault secret set/get` would centralise rotation.
- **Wire `enable_dev_codespaces_openvpn` into `terraform-deploy.yml`** once the manual flow has bedded in. This branch deliberately leaves CI/CD untouched.
- **`pg_hba.conf`-equivalent IP allow-list** at the database firewall layer for defence in depth (currently only NSG-gated).

---

## References

- Daniel Meixner, _Connecting Codespaces to Azure VNets via VPN_ — https://danielmeixner.github.io/Codespaces-VPN-Azure/
- `codespaces-contrib/codespaces-openvpn` — https://github.com/codespaces-contrib/codespaces-openvpn
- Azure VPN Gateway P2S OpenVPN docs — https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-howto-openvpn-clients
- Codespaces — Connecting to a private network — https://docs.github.com/en/codespaces/developing-in-codespaces/connecting-to-a-private-network
