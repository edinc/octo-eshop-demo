#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

OUT_DIR="${OUT_DIR:-.vpn/dev-p2s}"
DNS_SERVER="${DEV_P2S_VPN_DNS_SERVER:-10.0.253.4}"
PROFILE="$OUT_DIR/vpnconfig.codespaces.ovpn"
CLIENT_CERT="$OUT_DIR/codespaces-dev.crt"
CLIENT_KEY="$OUT_DIR/codespaces-dev.key"
OPENVPN_PID="$OUT_DIR/openvpn.pid"
OPENVPN_LOG="$OUT_DIR/openvpn.log"
HOSTS_START="# octo-eshop dev VPN hosts start"
HOSTS_END="# octo-eshop dev VPN hosts end"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required. Install the documented Codespaces VPN tools first."
}

require_env() {
  local name="$1"
  [ -n "${!name:-}" ] || fail "Missing $name. Run scripts/prepare-dev-vpn-codespaces-secrets.sh from an Azure-authenticated local/admin environment, then restart this Codespace."
}

decode_secret() {
  local name="$1"
  local destination="$2"

  printf '%s' "${!name}" | base64 -d > "$destination"
}

remove_hosts_block() {
  local tmp_hosts

  tmp_hosts="$(mktemp)"
  sudo awk -v start="$HOSTS_START" -v end="$HOSTS_END" '
    $0 == start { skip = 1; next }
    $0 == end { skip = 0; next }
    skip != 1 { print }
  ' /etc/hosts > "$tmp_hosts"
  sudo cp "$tmp_hosts" /etc/hosts
  rm -f "$tmp_hosts"
}

add_postgres_hosts() {
  local hosts=()
  local host
  local ip
  local tmp_block

  for var_name in DEV_POSTGRES_USER_HOST DEV_POSTGRES_PRODUCT_HOST DEV_POSTGRES_ORDER_HOST; do
    if [ -n "${!var_name:-}" ]; then
      hosts+=("${!var_name}")
    fi
  done

  [ "${#hosts[@]}" -gt 0 ] || return 0

  tmp_block="$(mktemp)"
  {
    echo "$HOSTS_START"
    for host in "${hosts[@]}"; do
      ip="$(dig +short @"$DNS_SERVER" "$host" A | awk '/^[0-9.]+$/ { print; exit }')"
      [ -n "$ip" ] || fail "Could not resolve $host through $DNS_SERVER"
      printf '%s %s\n' "$ip" "$host"
    done
    echo "$HOSTS_END"
  } > "$tmp_block"

  remove_hosts_block
  sudo tee -a /etc/hosts < "$tmp_block" >/dev/null
  rm -f "$tmp_block"
}

require_command awk
require_command base64
require_command dig
require_command nc
require_command openvpn
require_command sudo

require_env DEV_P2S_VPN_PROFILE_B64
require_env DEV_P2S_VPN_CLIENT_CERT_B64
require_env DEV_P2S_VPN_CLIENT_KEY_B64

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

decode_secret DEV_P2S_VPN_PROFILE_B64 "$PROFILE"
decode_secret DEV_P2S_VPN_CLIENT_CERT_B64 "$CLIENT_CERT"
decode_secret DEV_P2S_VPN_CLIENT_KEY_B64 "$CLIENT_KEY"
chmod 600 "$CLIENT_KEY"

grep -vE '^(cert|key|dhcp-option DNS) ' "$PROFILE" > "$PROFILE.tmp"
mv "$PROFILE.tmp" "$PROFILE"
{
  printf '\ncert %s\n' "$(pwd)/$CLIENT_CERT"
  printf 'key %s\n' "$(pwd)/$CLIENT_KEY"
  printf 'dhcp-option DNS %s\n' "$DNS_SERVER"
} >> "$PROFILE"

if [ -f "$OPENVPN_PID" ] && sudo kill -0 "$(cat "$OPENVPN_PID")" 2>/dev/null; then
  echo "OpenVPN is already running with PID $(cat "$OPENVPN_PID")."
else
  sudo openvpn \
    --config "$PROFILE" \
    --daemon \
    --writepid "$OPENVPN_PID" \
    --log "$OPENVPN_LOG"
fi

sleep "${VPN_WAIT_SECONDS:-20}"
tail -50 "$OPENVPN_LOG"

grep -q 'Initialization Sequence Completed' "$OPENVPN_LOG" || fail "OpenVPN did not complete initialization. See $OPENVPN_LOG."

add_postgres_hosts

if [ "${SKIP_POSTGRES_CHECKS:-false}" != "true" ] && [ -n "${DEV_POSTGRES_USER_HOST:-}" ]; then
  dig @"$DNS_SERVER" "$DEV_POSTGRES_USER_HOST"
  nc -vz "$DEV_POSTGRES_USER_HOST" 5432
fi

echo "VPN is connected."
