# Dev Codespaces Private Networking

The dev PostgreSQL Flexible Servers are private-only. GitHub Codespaces cannot
reach them directly over the public internet. This guide covers the supported
private-network path and explains why earlier approaches were dropped.

> **Status:** GitHub Codespaces VNet integration via
> `GitHub.Network/networkSettings` is in **private preview** at the time of
> writing (see GitHub roadmap [#534][roadmap]). The Azure-side scaffold this
> document deploys works today, but joining a Codespace to that network requires
> the GitHub organization to be enrolled in the preview and to attach a
> Codespaces network configuration. The same Azure resource is also used by
> GitHub-hosted Actions runner private networking, which is GA. Once your org
> is enrolled the same scaffold supports either consumer.

[roadmap]: https://github.com/github/roadmap/issues/534

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
