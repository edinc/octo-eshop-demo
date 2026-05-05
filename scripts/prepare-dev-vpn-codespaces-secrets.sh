#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

RESOURCE_GROUP="${RESOURCE_GROUP:-octoeshop-dev-rg}"
VPN_GATEWAY_NAME="${VPN_GATEWAY_NAME:-octoeshop-dev-p2s-vng}"
DNS_SERVER="${DNS_SERVER:-10.0.253.4}"
OUT_DIR="${OUT_DIR:-.vpn/dev-p2s}"
CLIENT_CERT="${CLIENT_CERT:-$OUT_DIR/codespaces-dev.crt}"
CLIENT_KEY="${CLIENT_KEY:-$OUT_DIR/codespaces-dev.key}"
PROFILE_ZIP="$OUT_DIR/vpn-profile.zip"
BASE_PROFILE="$OUT_DIR/vpnconfig.azure.ovpn"
CODESPACES_PROFILE="$OUT_DIR/vpnconfig.codespaces.base.ovpn"
PROFILE_EXTRACT_DIR="$OUT_DIR/azure-profile"
PROFILE_SOURCE=""
UNZIP_STATUS=0

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required"
}

base64_no_wrap() {
  base64 < "$1" | tr -d '\n'
}

set_b64_secret() {
  local name="$1"
  local file="$2"
  local body

  body="$(base64_no_wrap "$file")"
  if [ "${#body}" -gt 48000 ]; then
    fail "$name is too large for a GitHub secret (${#body} bytes after base64 encoding)"
  fi

  gh secret set "$name" --app codespaces --body "$body"
}

set_plain_secret() {
  local name="$1"
  local value="$2"

  if [ -n "$value" ] && [ "$value" != "None" ]; then
    gh secret set "$name" --app codespaces --body "$value"
  fi
}

set_postgres_host_secret() {
  local secret_name="$1"
  local name_fragment="$2"
  local host

  if host="$(
    az postgres flexible-server list \
      --resource-group "$RESOURCE_GROUP" \
      --query "[?contains(name, '$name_fragment')].fullyQualifiedDomainName | [0]" \
      -o tsv 2>/dev/null
  )" && [ -n "$host" ] && [ "$host" != "None" ]; then
    set_plain_secret "$secret_name" "$host"
  else
    echo "WARNING: Could not resolve $name_fragment PostgreSQL host; $secret_name was not set." >&2
  fi
}

require_command az
require_command awk
require_command base64
require_command curl
require_command gh
require_command tr
require_command unzip

gh auth status >/dev/null || fail "GitHub CLI must be authenticated before setting Codespaces secrets"
az account show >/dev/null || fail "Azure CLI must be authenticated in this local/admin environment"

[ -f "$CLIENT_CERT" ] || fail "Missing $CLIENT_CERT. Use the cert material that matches the deployed VPN gateway root certificate."
[ -f "$CLIENT_KEY" ] || fail "Missing $CLIENT_KEY. Use the cert material that matches the deployed VPN gateway root certificate."

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

echo "Generating Azure VPN client profile from $VPN_GATEWAY_NAME..."
PROFILE_URL="$(
  az network vnet-gateway vpn-client generate \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VPN_GATEWAY_NAME" \
    --authentication-method EAPTLS \
    --processor-architecture Amd64 \
    -o tsv | tail -n 1 | tr -d '"\r'
)"

[ -n "$PROFILE_URL" ] || fail "Azure did not return a VPN profile URL"

curl -fsSL "$PROFILE_URL" -o "$PROFILE_ZIP"
rm -rf "$PROFILE_EXTRACT_DIR"
mkdir -p "$PROFILE_EXTRACT_DIR"
unzip -q -o "$PROFILE_ZIP" -d "$PROFILE_EXTRACT_DIR" || UNZIP_STATUS=$?
[ "$UNZIP_STATUS" -le 1 ] || fail "Could not extract Azure VPN profile zip"

PROFILE_SOURCE="$(find "$PROFILE_EXTRACT_DIR" -type f -name '*vpnconfig.ovpn' -print -quit)"
[ -n "$PROFILE_SOURCE" ] || fail "Could not find vpnconfig.ovpn in the Azure VPN profile zip"

cp "$PROFILE_SOURCE" "$BASE_PROFILE"
[ -s "$BASE_PROFILE" ] || fail "Extracted Azure OpenVPN profile is empty"

grep -vE '^(cert|key|dhcp-option DNS) ' "$BASE_PROFILE" > "$CODESPACES_PROFILE"
printf '\ndhcp-option DNS %s\n' "$DNS_SERVER" >> "$CODESPACES_PROFILE"

echo "Setting Codespaces VPN secrets..."
set_b64_secret DEV_P2S_VPN_PROFILE_B64 "$CODESPACES_PROFILE"
set_b64_secret DEV_P2S_VPN_CLIENT_CERT_B64 "$CLIENT_CERT"
set_b64_secret DEV_P2S_VPN_CLIENT_KEY_B64 "$CLIENT_KEY"
set_plain_secret DEV_P2S_VPN_DNS_SERVER "$DNS_SERVER"

echo "Setting Codespaces PostgreSQL host secrets..."
set_postgres_host_secret DEV_POSTGRES_USER_HOST "user-db"
set_postgres_host_secret DEV_POSTGRES_PRODUCT_HOST "product-db"
set_postgres_host_secret DEV_POSTGRES_ORDER_HOST "order-db"

echo
echo "Current dev PostgreSQL state:"
az postgres flexible-server list \
  --resource-group "$RESOURCE_GROUP" \
  --query "[].{name:name,state:state,publicAccess:network.publicNetworkAccess}" \
  -o table 2>/dev/null || echo "WARNING: Could not list PostgreSQL server state." >&2

echo
echo "Codespaces secrets are prepared. Stop and restart existing Codespaces so the new secrets are injected."
