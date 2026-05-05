# Dev Codespaces Private Networking

The dev PostgreSQL Flexible Servers are private-only. GitHub Codespaces cannot
reach them directly over the public internet. This guide covers the supported
private-network path and explains why earlier approaches were dropped.

## Will this work in a Codespace today?

> **Short answer: end-to-end, no — not on `codecurrent-sandbox`.**
> The Azure-side scaffold in this repo is correct and deployable today, but the
> step that actually attaches a Codespace to that VNet (creating a
> **Codespaces** network configuration that points at the
> `GitHub.Network/networkSettings` resource) is gated behind a GitHub-side
> private preview that this repo's account is not enrolled in.

Concretely:

| Layer                                                                           | Status today                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Azure resource provider `GitHub.Network`                                        | **GA** — registers and accepts the resource.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `GitHub.Network/networkSettings@2024-04-02` Terraform scaffold                  | **GA** — applies cleanly with `enable_hosted_compute_private_networking = true`.                                                                                                                                                                                                                                                                                                                                                                                              |
| GitHub-hosted **Actions runner** network configuration pointing at the resource | **GA** — [docs][runner-docs]. Wire this up today and Actions runs will reach private dev PostgreSQL.                                                                                                                                                                                                                                                                                                                                                                          |
| GitHub **Codespaces** network configuration pointing at the resource            | **Private preview** — [GitHub roadmap #534][roadmap], titled _"Codespaces: Private networking with Azure VNETs (Preview)"_. The card states _"This functionality will be supported for the GitHub Enterprise Cloud plan."_ The public Codespaces docs at [Connecting to a private network][codespaces-pn-docs] still list only the deprecated `gh net` bridge and customer-supplied VPN/Tailscale as supported options for ordinary Codespaces customers — VNet is not there. |

So the practical deliverable today is:

- A correct Azure scaffold that an enterprise admin enrolled in the preview can
  hook a Codespaces network configuration to.
- An immediate working path for **Actions runners** if you want CI/CD to talk
  to the private dev databases.
- For day-to-day **hosted Codespaces** development against the private DBs,
  this path does not yet work without preview enrollment. Treat this doc as
  the runbook for the moment that changes.

[roadmap]: https://github.com/github/roadmap/issues/534
[runner-docs]: https://docs.github.com/en/enterprise-cloud@latest/admin/configuring-settings/configuring-private-networking-for-hosted-compute-products/about-azure-private-networking-for-github-hosted-runners-in-your-enterprise
[codespaces-pn-docs]: https://docs.github.com/en/codespaces/developing-in-a-codespace/connecting-to-a-private-network

## Why not OpenVPN Point-to-Site?

A previous iteration of this repo provisioned an Azure VPN Gateway and pushed
an OpenVPN profile into Codespaces secrets. GitHub-hosted Codespaces are
unprivileged containers without the `NET_ADMIN` Linux capability, so OpenVPN
cannot create the TUN interface required to route traffic. The certificates
authenticated and routes were pushed, but `TUNSETIFF` failed with
`Operation not permitted`. Self-hosted/local devcontainers can still use a
VPN, but for hosted Codespaces this approach is permanently blocked. All VPN
infrastructure, scripts, and helpers were removed from this repository in
favor of the GitHub-managed networking path described below.

## Architecture

The dev networking module gates a small set of Azure resources behind
`enable_hosted_compute_private_networking = true`:

| Resource                                         | Purpose                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Delegated subnet                                 | A `/24` subnet (`10.0.252.0/24` by default) delegated to `GitHub.Network/networkSettings`. |
| `GitHub.Network/networkSettings`                 | Azure resource GitHub uses to attach hosted Codespaces / Actions runners to the dev VNet.  |
| Subnet NSG                                       | Default-deny inbound NSG associated with the delegated subnet.                             |
| DB NSG rule (`AllowPostgreSQLFromHostedCompute`) | Allows TCP 5432 from the hosted-compute subnet to the private PostgreSQL flexible servers. |

The Azure VNet `10.0.0.0/16` and the AKS / database / Redis subnets are
unchanged. PostgreSQL public network access remains disabled.

## Prerequisites

- The Azure subscription must register the `GitHub.Network` resource
  provider once (one-time, out-of-band before the first
  `terraform apply`): `az provider register --namespace GitHub.Network`.
- You need the GitHub `databaseId` that owns the GitHub network
  configuration this Azure scaffold will be attached to. **Use the
  enterprise `databaseId` if your Codespaces VNet preview enrollment is
  enterprise-scoped** (the typical Codespaces preview shape) and the
  GitHub network configuration is created at enterprise level. Use the
  **organization `databaseId`** if you are only wiring this up for
  GitHub-hosted Actions runner private networking at org scope. Fetch
  whichever you need (admin scope required):

  ```bash
  # Enterprise databaseId (recommended for Codespaces preview)
  gh api graphql -f query='{ enterprise(slug: "<enterprise-slug>") { databaseId } }'

  # Organization databaseId (Actions runner networking at org scope)
  gh api graphql -f query='{ organization(login: "codecurrent-sandbox") { databaseId } }'
  ```

  Set the chosen value as a repository-level GitHub Actions variable:

  ```bash
  gh variable set DEV_HOSTED_COMPUTE_BUSINESS_ID --body "<databaseId>"
  ```

- To roll out the Azure scaffold, set the feature flag:

  ```bash
  gh variable set DEV_ENABLE_HOSTED_COMPUTE_PRIVATE_NETWORKING --body true
  ```

## Deploying the Azure scaffold

The scaffold is opt-in so a missing business id does not break unrelated
Terraform plans. With `DEV_ENABLE_HOSTED_COMPUTE_PRIVATE_NETWORKING=true`
and `DEV_HOSTED_COMPUTE_BUSINESS_ID` set, run the dev infrastructure
workflow:

```bash
gh workflow run "Deploy Dev Infrastructure"
```

Or apply locally from `infrastructure/terraform/environments/dev/`:

```bash
export TF_VAR_enable_hosted_compute_private_networking=true
export TF_VAR_hosted_compute_business_id="<github-org-or-enterprise-database-id>"
terraform plan -out=tfplan
terraform apply tfplan
```

Useful Terraform outputs after apply:

- `hosted_compute_subnet_id`
- `hosted_compute_network_settings_id`

## Connecting a Codespace to the network

The Azure-side scaffold is necessary but not sufficient. To actually route
Codespace traffic through the dev VNet, GitHub needs an org-level
**Codespaces network configuration** that points at the
`GitHub.Network/networkSettings` resource above.

1. In **Org settings → Code, planning, and automation → Codespaces →
   Networking** (private preview UI), create a network configuration. Provide
   the Azure subscription, resource group, and `GitHub.Network/networkSettings`
   resource id (use the `hosted_compute_network_settings_id` Terraform
   output).
2. Assign the configuration to the policy that governs Codespaces for this
   repository.
3. Recreate any existing Codespaces — only newly created Codespaces will
   pick up the network configuration.

If the org is not yet enrolled in the Codespaces VNet preview, the same
scaffold can also back GitHub-hosted Actions runners (GA). Create a
**hosted-compute network configuration** under Org settings → Actions, runner
networking, pointing at the same resource id.

## Validating from a Codespace

### Azure-side scaffold (always testable)

This works as soon as Terraform has applied, even before any Codespaces
network configuration is attached on the GitHub side. From a Codespace:

```bash
az login --use-device-code
az account set --subscription "$AZURE_SUBSCRIPTION_ID"

# Confirm the GitHub.Network/networkSettings resource exists
az resource show \
  --resource-group octoeshop-dev-rg \
  --resource-type GitHub.Network/networkSettings \
  --name octoeshop-dev-hosted-compute-network \
  --query "{name:name, businessId:properties.businessId, subnetId:properties.subnetId, status:properties.provisioningState}" -o table

# Confirm the DB NSG rule exists
az network nsg rule show \
  --resource-group octoeshop-dev-rg \
  --nsg-name octoeshop-dev-db-nsg \
  --name AllowPostgreSQLFromHostedCompute
```

### End-to-end private connectivity (requires GitHub-side wiring)

Only achievable after the GitHub org has attached a Codespaces (or runner)
network configuration that uses the resource above and the Codespace has been
recreated. From a Codespace:

```bash
# Discover the dev PostgreSQL FQDN(s) (any of user/product/order DBs)
az postgres flexible-server list \
  --resource-group octoeshop-dev-rg \
  --query '[].{name:name, fqdn:fullyQualifiedDomainName}' -o table

# Verify private DNS resolves to a 10.0.x.x address inside the VNet
getent hosts <fqdn>

# Verify TCP 5432 connectivity
nc -zv <fqdn> 5432
```

A non-private IP, an unresolved FQDN, or a TCP timeout means the Codespace is
not on the dev VNet — re-check the GitHub Codespaces network configuration
assignment and re-create the Codespace.

## Defaults & customization

| Variable                                   | Default             | Notes                                                                         |
| ------------------------------------------ | ------------------- | ----------------------------------------------------------------------------- |
| `enable_hosted_compute_private_networking` | `false`             | Master toggle — keeps the scaffold off until you have prerequisites in place. |
| `hosted_compute_subnet_prefix`             | `["10.0.252.0/24"]` | Must be at least `/24` per GitHub.Network/networkSettings requirements.       |
| `hosted_compute_business_id`               | `""`                | GitHub org or enterprise `databaseId`.                                        |
| `hosted_compute_network_settings_name`     | _project-env name_  | Optional override for the Azure resource name.                                |
