#!/usr/bin/env bash
#
# Builds the OpenVPN profile that the Codespace will use to connect to the dev
# Azure VPN Gateway and prints it to stdout. The output is meant to be saved
# verbatim into the OPENVPNCONFIG GitHub Codespaces user secret.
#
# Flow:
#   1. terraform output -raw resource_group_name / codespaces_vpn_gateway_name
#      to find the gateway provisioned by Terraform.
#   2. `az network vnet-gateway vpn-client generate` returns a URL to a zip
#      that contains the gateway-specific OpenVPN profile template. Download
#      and extract it.
#   3. Replace the $CLIENTCERTIFICATE and $PRIVATEKEY placeholders in
#      OpenVPN/vpnconfig.ovpn with the client cert/key from
#      codespaces-vpn-secrets/azure-vpn-client.pem.
#   4. Append `disable-dco` to work around an Azure P2S incompatibility with
#      OpenVPN >= 2.6 Data Channel Offload mode (Microsoft's official Linux
#      OpenVPN guidance, current at time of writing).
#   5. Print the final profile to stdout.
#
# Pre-requisites:
#   * `az` (Azure CLI) logged in to the dev subscription.
#   * `terraform`, `jq`, `unzip`, `curl`.
#   * scripts/generate-codespaces-vpn-cert.sh has been run.
#   * `terraform apply` of environments/dev with
#     enable_dev_codespaces_openvpn = true has completed.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="${REPO_ROOT}/infrastructure/terraform/environments/dev"
SECRETS_DIR="${REPO_ROOT}/codespaces-vpn-secrets"
CLIENT_PEM="${SECRETS_DIR}/azure-vpn-client.pem"

for cmd in az terraform jq unzip curl openssl; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ Required command '$cmd' is not on PATH." >&2
        exit 1
    fi
done

if [[ ! -s "${CLIENT_PEM}" ]]; then
    echo "❌ ${CLIENT_PEM} is missing or empty." >&2
    echo "   Run scripts/generate-codespaces-vpn-cert.sh first." >&2
    exit 1
fi

cd "${TERRAFORM_DIR}"

# Pull the names that identify the gateway from terraform state. tf must
# already have been applied with enable_dev_codespaces_openvpn = true.
RG_NAME="$(terraform output -raw resource_group_name 2>/dev/null)"
GW_NAME="$(terraform output -raw codespaces_vpn_gateway_name 2>/dev/null || true)"
GW_PUBLIC_IP="$(terraform output -raw codespaces_vpn_gateway_public_ip 2>/dev/null || true)"

if [[ -z "${GW_NAME}" || "${GW_NAME}" == "null" ]]; then
    echo "❌ codespaces_vpn_gateway_name is null in terraform state." >&2
    echo "   Did you set enable_dev_codespaces_openvpn = true and apply?" >&2
    exit 1
fi

echo "🌐 Resource group:       ${RG_NAME}" >&2
echo "🌐 VPN gateway:          ${GW_NAME}" >&2
echo "🌐 Gateway public IP:    ${GW_PUBLIC_IP:-<unknown>}" >&2

# `az network vnet-gateway vpn-client generate` returns the URL of a zip
# that the caller must download separately. Capture it as raw text.
echo "🌐 Requesting OpenVPN profile from Azure (this may take ~1 minute)..." >&2
ZIP_URL="$(az network vnet-gateway vpn-client generate \
    --resource-group "${RG_NAME}" \
    --name "${GW_NAME}" \
    --processor-architecture Amd64 \
    -o tsv)"

if [[ -z "${ZIP_URL}" ]]; then
    echo "❌ az returned an empty URL for the vpn-client zip." >&2
    exit 1
fi

WORKDIR="$(mktemp -d)"
trap 'rm -rf "${WORKDIR}"' EXIT

curl -fsSL "${ZIP_URL}" -o "${WORKDIR}/vpnclient.zip"
unzip -q "${WORKDIR}/vpnclient.zip" -d "${WORKDIR}/vpnclient"

OVPN_TEMPLATE="${WORKDIR}/vpnclient/OpenVPN/vpnconfig.ovpn"
if [[ ! -s "${OVPN_TEMPLATE}" ]]; then
    echo "❌ Could not find OpenVPN/vpnconfig.ovpn inside the downloaded zip." >&2
    echo "   Files extracted:" >&2
    find "${WORKDIR}/vpnclient" -maxdepth 3 -type f >&2
    exit 1
fi

# Pull the cert and key out of the combined PEM file so we can splice them
# into the .ovpn template. -outform PEM keeps Azure-friendly formatting.
CLIENT_CERT_BLOCK="$(openssl x509 -in "${CLIENT_PEM}" -outform PEM)"
CLIENT_KEY_BLOCK="$(openssl rsa -in "${CLIENT_PEM}" -outform PEM 2>/dev/null \
    || openssl pkey -in "${CLIENT_PEM}" -outform PEM)"

if [[ -z "${CLIENT_CERT_BLOCK}" || -z "${CLIENT_KEY_BLOCK}" ]]; then
    echo "❌ Failed to extract client cert/key from ${CLIENT_PEM}." >&2
    exit 1
fi

# Splice in cert and key, replacing the literal $CLIENTCERTIFICATE and
# $PRIVATEKEY placeholders. awk is used so the multi-line cert/key is
# inserted verbatim without sed-style escaping pitfalls.
FINAL_OVPN="$(awk -v cert="${CLIENT_CERT_BLOCK}" -v key="${CLIENT_KEY_BLOCK}" '
    {
        gsub(/\$CLIENTCERTIFICATE/, cert)
        gsub(/\$PRIVATEKEY/,        key)
        print
    }
' "${OVPN_TEMPLATE}")"

# Defensive check: if Azure ever changes placeholder names, fail loudly
# rather than silently emit a broken profile.
# shellcheck disable=SC2016
if grep -qE '\$CLIENTCERTIFICATE|\$PRIVATEKEY' <<< "${FINAL_OVPN}"; then
    echo "❌ Placeholder substitution failed. Inspect ${OVPN_TEMPLATE}." >&2
    exit 1
fi

# Append disable-dco so OpenVPN >= 2.6 (the Debian 13-shipped version) does
# not negotiate Data Channel Offload, which currently does not interoperate
# with Azure VPN Gateway.
FINAL_OVPN="${FINAL_OVPN}"$'\n'"disable-dco"$'\n'

printf '%s' "${FINAL_OVPN}"

echo >&2
echo "✅ OpenVPN profile written to stdout." >&2
echo "   Pipe to a file or copy directly into the OPENVPNCONFIG Codespaces user secret:" >&2
echo "     gh secret set OPENVPNCONFIG --user --body \"\$(scripts/build-codespaces-openvpn-config.sh)\"" >&2
echo "   …then rebuild the codespace." >&2
