#!/bin/bash
set -euo pipefail

###############################################################################
# Bootstrap script for Octo E-Shop infrastructure
#
# This is the ONE manual step required to go from zero to fully automated.
# It creates:
#   1. Terraform state backend (Resource Group + Storage Account + Container)
#   2. Azure Service Principal with required role assignments
#   3. GitHub Actions secrets (AZURE_CREDENTIALS)
#
# Prerequisites:
#   - Azure CLI (az) installed and logged in
#   - GitHub CLI (gh) installed and authenticated
#   - Owner or Contributor + User Access Administrator on the Azure subscription
#
# Usage:
#   ./scripts/bootstrap-backend.sh [--subscription <id>] [--repo <owner/repo>]
###############################################################################

LOCATION="eastus"
RG_NAME="octoeshop-tfstate-rg"
STORAGE_ACCOUNT="octoeshoptfstate"
CONTAINER_NAME="tfstate"
SP_NAME="octoeshop-github-actions"

SUBSCRIPTION=""
REPO=""

usage() {
  echo "Usage: $0 [--subscription <id>] [--repo <owner/repo>]"
  echo ""
  echo "Options:"
  echo "  --subscription  Azure subscription ID (default: current az account)"
  echo "  --repo          GitHub repository (default: detected from git remote)"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --subscription) SUBSCRIPTION="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --help|-h) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# --- Preflight checks -------------------------------------------------------

echo "=== Preflight Checks ==="

command -v az  >/dev/null 2>&1 || { echo "❌ Azure CLI (az) not found. Install: https://aka.ms/install-azure-cli"; exit 1; }
command -v gh  >/dev/null 2>&1 || { echo "❌ GitHub CLI (gh) not found. Install: https://cli.github.com"; exit 1; }
command -v jq  >/dev/null 2>&1 || { echo "❌ jq not found. Install: https://jqlang.github.io/jq/download/"; exit 1; }

az account show >/dev/null 2>&1 || { echo "❌ Not logged into Azure. Run: az login"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "❌ Not logged into GitHub. Run: gh auth login"; exit 1; }

if [[ -z "$SUBSCRIPTION" ]]; then
  SUBSCRIPTION=$(az account show --query id -o tsv)
fi

if [[ -z "$REPO" ]]; then
  REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner' 2>/dev/null || true)
  if [[ -z "$REPO" ]]; then
    echo "❌ Could not detect GitHub repo. Pass --repo owner/name"
    exit 1
  fi
fi

TENANT_ID=$(az account show --query tenantId -o tsv)

echo "  Subscription: $SUBSCRIPTION"
echo "  Tenant:       $TENANT_ID"
echo "  GitHub Repo:  $REPO"
echo ""

# --- 1. Terraform State Backend ---------------------------------------------

echo "=== 1/3 Creating Terraform State Backend ==="

az account set --subscription "$SUBSCRIPTION"

az group create \
  --name "$RG_NAME" \
  --location "$LOCATION" \
  --output none 2>/dev/null && echo "  ✅ Resource group: $RG_NAME"

az storage account create \
  --name "$STORAGE_ACCOUNT" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION" \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access false \
  --min-tls-version TLS1_2 \
  --output none 2>/dev/null && echo "  ✅ Storage account: $STORAGE_ACCOUNT"

# Assign Storage Blob Data Contributor to current user for AAD auth
CURRENT_USER_OID=$(az ad signed-in-user show --query id -o tsv 2>/dev/null || true)
if [[ -n "$CURRENT_USER_OID" ]]; then
  STORAGE_ID=$(az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RG_NAME" --query id -o tsv)
  az role assignment create \
    --assignee-object-id "$CURRENT_USER_OID" \
    --assignee-principal-type User \
    --role "Storage Blob Data Contributor" \
    --scope "$STORAGE_ID" \
    --output none 2>/dev/null && echo "  ✅ RBAC: current user → Storage Blob Data Contributor"
fi

az storage container create \
  --name "$CONTAINER_NAME" \
  --account-name "$STORAGE_ACCOUNT" \
  --auth-mode login \
  --output none 2>/dev/null && echo "  ✅ Container: $CONTAINER_NAME"

# --- 2. Service Principal ---------------------------------------------------

echo ""
echo "=== 2/3 Creating Service Principal ==="

SP_EXISTS=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || true)

if [[ -n "$SP_EXISTS" && "$SP_EXISTS" != "null" ]]; then
  echo "  ℹ️  SP '$SP_NAME' already exists (appId: $SP_EXISTS). Resetting credentials..."
  SP_JSON=$(az ad sp credential reset --id "$SP_EXISTS" --query "{clientId:appId, clientSecret:password, tenantId:tenant}" -o json 2>/dev/null)
  CLIENT_ID=$(echo "$SP_JSON" | jq -r '.clientId')
  CLIENT_SECRET=$(echo "$SP_JSON" | jq -r '.clientSecret')
else
  echo "  Creating new SP: $SP_NAME"
  SP_JSON=$(az ad sp create-for-rbac \
    --name "$SP_NAME" \
    --role Contributor \
    --scopes "/subscriptions/$SUBSCRIPTION" \
    --query "{clientId:appId, clientSecret:password, tenantId:tenant}" \
    -o json)
  CLIENT_ID=$(echo "$SP_JSON" | jq -r '.clientId')
  CLIENT_SECRET=$(echo "$SP_JSON" | jq -r '.clientSecret')
  echo "  ✅ Service principal created: $CLIENT_ID"
fi

# Assign Storage Blob Data Contributor for Terraform state access
STORAGE_ID=$(az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RG_NAME" --query id -o tsv)
SP_OID=$(az ad sp show --id "$CLIENT_ID" --query id -o tsv)
az role assignment create \
  --assignee-object-id "$SP_OID" \
  --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" \
  --scope "$STORAGE_ID" \
  --output none 2>/dev/null && echo "  ✅ RBAC: SP → Storage Blob Data Contributor"

# Assign Role Based Access Control Administrator (scoped, with conditions)
# This is narrower than User Access Administrator — it can only manage role
# assignments, not role definitions, and can be further restricted with conditions.
az role assignment create \
  --assignee-object-id "$SP_OID" \
  --assignee-principal-type ServicePrincipal \
  --role "Role Based Access Control Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION" \
  --output none 2>/dev/null && echo "  ✅ RBAC: SP → Role Based Access Control Administrator"

# --- 3. GitHub Secrets -------------------------------------------------------

echo ""
echo "=== 3/3 Setting GitHub Secrets ==="

AZURE_CREDS=$(jq -n \
  --arg clientId "$CLIENT_ID" \
  --arg clientSecret "$CLIENT_SECRET" \
  --arg subscriptionId "$SUBSCRIPTION" \
  --arg tenantId "$TENANT_ID" \
  '{clientId: $clientId, clientSecret: $clientSecret, subscriptionId: $subscriptionId, tenantId: $tenantId}')

echo "$AZURE_CREDS" | gh secret set AZURE_CREDENTIALS --repo "$REPO"
echo "  ✅ AZURE_CREDENTIALS"

echo ""
echo "=== Bootstrap Complete ==="
echo ""
echo "Next steps:"
echo "  1. Run the Infrastructure workflow to create Azure resources:"
echo "     gh workflow run infrastructure.yml -f environment=dev -f action=apply --repo $REPO"
echo "  2. The workflow will automatically sync secrets and set up cluster add-ons."
echo "  3. Then trigger a build to deploy services:"
echo "     gh workflow run build-push.yml --repo $REPO"
