#!/usr/bin/env bash

set -euo pipefail

OUT_DIR="${OUT_DIR:-.vpn/dev-p2s}"
ROOT_NAME="${ROOT_NAME:-octoeshop-dev-p2s-root}"
CLIENT_NAME="${CLIENT_NAME:-codespaces-dev}"
DAYS="${DAYS:-365}"

mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"

ROOT_EXT="$OUT_DIR/$ROOT_NAME.ext"
CLIENT_EXT="$OUT_DIR/$CLIENT_NAME.ext"

cat > "$ROOT_EXT" <<EOF
basicConstraints=critical,CA:TRUE,pathlen:1
keyUsage=critical,keyCertSign,cRLSign
subjectKeyIdentifier=hash
EOF

cat > "$CLIENT_EXT" <<EOF
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=clientAuth
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer
EOF

openssl genrsa -out "$OUT_DIR/$ROOT_NAME.key" 4096
openssl req -new \
  -key "$OUT_DIR/$ROOT_NAME.key" \
  -out "$OUT_DIR/$ROOT_NAME.csr" \
  -subj "/CN=$ROOT_NAME"

openssl x509 -req \
  -in "$OUT_DIR/$ROOT_NAME.csr" \
  -signkey "$OUT_DIR/$ROOT_NAME.key" \
  -sha256 \
  -days "$DAYS" \
  -out "$OUT_DIR/$ROOT_NAME.crt" \
  -extfile "$ROOT_EXT"

openssl genrsa -out "$OUT_DIR/$CLIENT_NAME.key" 4096
openssl req -new \
  -key "$OUT_DIR/$CLIENT_NAME.key" \
  -out "$OUT_DIR/$CLIENT_NAME.csr" \
  -subj "/CN=$CLIENT_NAME"

openssl x509 -req \
  -in "$OUT_DIR/$CLIENT_NAME.csr" \
  -CA "$OUT_DIR/$ROOT_NAME.crt" \
  -CAkey "$OUT_DIR/$ROOT_NAME.key" \
  -CAcreateserial \
  -out "$OUT_DIR/$CLIENT_NAME.crt" \
  -days "$DAYS" \
  -sha256 \
  -extfile "$CLIENT_EXT"

awk '
  /BEGIN CERTIFICATE/ { next }
  /END CERTIFICATE/ { next }
  { printf "%s", $0 }
' "$OUT_DIR/$ROOT_NAME.crt" > "$OUT_DIR/root-cert-data.txt"

cat > "$OUT_DIR/README.txt" <<EOF
Generated dev Point-to-Site VPN certificate material.

Set the GitHub Actions secret DEV_P2S_VPN_ROOT_CERTIFICATE_PUBLIC_DATA to:
  $OUT_DIR/root-cert-data.txt

Use these client files when preparing the OpenVPN profile in Codespaces:
  $OUT_DIR/$CLIENT_NAME.crt
  $OUT_DIR/$CLIENT_NAME.key

Do not commit this directory. It is ignored by .gitignore.
EOF

echo "Generated dev VPN certificates in $OUT_DIR"
echo "Root certificate data for Terraform/GitHub secret:"
echo "$OUT_DIR/root-cert-data.txt"
