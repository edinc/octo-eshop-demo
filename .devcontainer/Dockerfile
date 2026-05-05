# syntax=docker/dockerfile:1
#
# Devcontainer image for the dev codespaces OpenVPN P2S approach.
#
# This is the standard typescript-node image used by the rest of the project,
# extended with the OpenVPN client so the post-start script can bring up a
# Point-to-Site tunnel into the dev Azure VNet. See
# docs/dev-codespaces-openvpn.md for the end-to-end flow.
ARG VARIANT=20
FROM mcr.microsoft.com/devcontainers/typescript-node:${VARIANT}

# Install the OpenVPN client. iproute2 ships with the base image but is named
# explicitly so that the post-start script can rely on `ip` being on PATH.
# resolvconf is required for OpenVPN to honour the DNS servers Azure pushes
# on connect.
RUN export DEBIAN_FRONTEND=noninteractive \
    && apt-get update \
    && apt-get -y install --no-install-recommends \
        openvpn \
        iproute2 \
        resolvconf \
        ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# The default 'node' user already has password-less sudo via the base image
# (/etc/sudoers.d/node), which the post-start script relies on to launch
# openvpn with the privileges granted by --cap-add=NET_ADMIN.
