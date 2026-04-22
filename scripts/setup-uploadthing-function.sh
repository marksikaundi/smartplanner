#!/usr/bin/env bash
set -euo pipefail

if ! command -v appwrite >/dev/null 2>&1; then
  echo "Appwrite CLI is not installed. Install it first: npm i -g appwrite"
  exit 1
fi

if [[ -z "${APPWRITE_FUNCTION_ID:-}" ]]; then
  echo "Missing APPWRITE_FUNCTION_ID env var."
  echo "Example: export APPWRITE_FUNCTION_ID=YOUR_FUNCTION_ID"
  exit 1
fi

if [[ -z "${APPWRITE_FUNCTION_NAME:-}" ]]; then
  echo "Missing APPWRITE_FUNCTION_NAME env var."
  echo "Example: export APPWRITE_FUNCTION_NAME=uploadthing"
  exit 1
fi

if [[ -z "${UPLOADTHING_SECRET:-}" ]]; then
  echo "Missing UPLOADTHING_SECRET env var."
  exit 1
fi

if [[ -z "${UPLOADTHING_APP_ID:-}" ]]; then
  echo "Missing UPLOADTHING_APP_ID env var."
  exit 1
fi

RUNTIME="${APPWRITE_FUNCTION_RUNTIME:-node-18.0}"
EXECUTE="${APPWRITE_FUNCTION_EXECUTE:-any}"

if ! appwrite functions create \
  --functionId "$APPWRITE_FUNCTION_ID" \
  --name "$APPWRITE_FUNCTION_NAME" \
  --runtime "$RUNTIME" \
  --execute "$EXECUTE"; then
  echo "Function may already exist, continuing..."
fi

if ! appwrite functions createVariable \
  --functionId "$APPWRITE_FUNCTION_ID" \
  --key "UPLOADTHING_SECRET" \
  --value "$UPLOADTHING_SECRET"; then
  appwrite functions updateVariable \
    --functionId "$APPWRITE_FUNCTION_ID" \
    --key "UPLOADTHING_SECRET" \
    --value "$UPLOADTHING_SECRET"
fi

if ! appwrite functions createVariable \
  --functionId "$APPWRITE_FUNCTION_ID" \
  --key "UPLOADTHING_APP_ID" \
  --value "$UPLOADTHING_APP_ID"; then
  appwrite functions updateVariable \
    --functionId "$APPWRITE_FUNCTION_ID" \
    --key "UPLOADTHING_APP_ID" \
    --value "$UPLOADTHING_APP_ID"
fi

echo "Function setup complete."
