#!/usr/bin/env bash
#
# Brings up the Point-to-Site OpenVPN tunnel from this Codespace into the dev
# Azure VNet so the codespace can reach the private dev PostgreSQL Flexible
# Servers. Designed to be idempotent and to be invoked by the
# `postStartCommand` in .devcontainer/devcontainer.json on every codespace
# start.
#
# Inputs:
#   * OPENVPNCONFIG (Codespaces user secret) - full body of the
#     vpnconfig.ovpn file produced by scripts/build-codespaces-openvpn-config.sh.
#     If the secret is not set, the script prints a notice and exits 0.
#
# Outputs:
#   * .ignore/openvpn.config  - profile written to disk (also git-ignored)
#   * .ignore/openvpn.log     - openvpn daemon log
#   * .ignore/openvpn.pid     - openvpn PID file (used for idempotency)
#
# See docs/dev-codespaces-openvpn.md for the full flow.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IGNORE_DIR="${REPO_ROOT}/.ignore"
CONFIG_FILE="${IGNORE_DIR}/openvpn.config"
LOG_FILE="${IGNORE_DIR}/openvpn.log"
PID_FILE="${IGNORE_DIR}/openvpn.pid"

mkdir -p "${IGNORE_DIR}"

if [[ -z "${OPENVPNCONFIG:-}" ]]; then
    echo "ℹ️  OPENVPNCONFIG secret not set; skipping VPN startup."
    echo "    Add a Codespaces user secret named OPENVPNCONFIG to enable the"
    echo "    OpenVPN P2S tunnel. See docs/dev-codespaces-openvpn.md."
    exit 0
fi

if [[ ! -c /dev/net/tun ]]; then
    echo "❌ /dev/net/tun is not present in the container."
    echo "   The devcontainer must be rebuilt with --device=/dev/net/tun and"
    echo "   --cap-add=NET_ADMIN. See .devcontainer/devcontainer.json runArgs."
    echo "   Use Codespaces command 'Rebuild Container' (full rebuild, not"
    echo "   just restart) to pick up runArgs changes."
    exit 1
fi

# Idempotency: if openvpn is already running for our config, bail out cleanly.
# The daemon runs as root (started via sudo), so a non-privileged kill -0
# from the `node` user returns EPERM, which would otherwise be indistinguishable
# from "process is dead". Use `sudo -n kill -0` so we ask the kernel as root.
if [[ -f "${PID_FILE}" ]]; then
    existing_pid="$(cat "${PID_FILE}" 2>/dev/null || true)"
    if [[ -n "${existing_pid}" ]] && sudo -n kill -0 "${existing_pid}" 2>/dev/null; then
        echo "✅ OpenVPN already running (pid ${existing_pid}). Logs: ${LOG_FILE}"
        exit 0
    fi
    sudo -n rm -f "${PID_FILE}"
fi

umask 077
printf '%s\n' "${OPENVPNCONFIG}" > "${CONFIG_FILE}"
chmod 600 "${CONFIG_FILE}"

if [[ ! -s "${CONFIG_FILE}" ]]; then
    echo "❌ OPENVPNCONFIG secret is empty after expansion; nothing to do."
    exit 1
fi

# `sudo -n` ensures we never block on a password prompt during postStart;
# the base image grants the `node` user password-less sudo, so this works
# unprivileged-then-elevated.
if ! sudo -n true 2>/dev/null; then
    echo "❌ password-less sudo is not configured for $(id -un); cannot launch openvpn."
    exit 1
fi

echo "🔐 Starting OpenVPN tunnel (config: ${CONFIG_FILE})"

sudo -n nohup openvpn \
    --config "${CONFIG_FILE}" \
    --log "${LOG_FILE}" \
    --writepid "${PID_FILE}" \
    --daemon

# Give openvpn a moment to either come up or fail.
for _ in $(seq 1 20); do
    if [[ -s "${LOG_FILE}" ]] && grep -q "Initialization Sequence Completed" "${LOG_FILE}"; then
        echo "✅ OpenVPN tunnel up. PID: $(cat "${PID_FILE}" 2>/dev/null || echo unknown)"
        echo "   Log: ${LOG_FILE}"
        exit 0
    fi
    sleep 1
done

echo "⚠️  OpenVPN did not finish initialization within 20s."
echo "    Tail of ${LOG_FILE}:"
tail -n 25 "${LOG_FILE}" 2>/dev/null || true
echo "    Re-run this script to retry, or 'Rebuild Container' if /dev/net/tun"
echo "    is missing. The codespace remains usable for non-VPN work."
exit 1
