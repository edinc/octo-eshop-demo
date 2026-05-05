#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

OUT_DIR="${OUT_DIR:-.vpn/dev-p2s}"
OPENVPN_PID="$OUT_DIR/openvpn.pid"
HOSTS_START="# octo-eshop dev VPN hosts start"
HOSTS_END="# octo-eshop dev VPN hosts end"

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

if [ -f "$OPENVPN_PID" ]; then
  pid="$(cat "$OPENVPN_PID")"
  if sudo kill -0 "$pid" 2>/dev/null; then
    sudo kill "$pid"
  fi
  rm -f "$OPENVPN_PID"
fi

remove_hosts_block
echo "VPN is disconnected."
