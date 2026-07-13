#!/bin/sh
set -e

if [ -f /run/secrets/ocr_space_api_key ]; then
  export OCR_SPACE_API_KEY="$(cat /run/secrets/ocr_space_api_key)"
fi

if [ -f /run/secrets/openrouter_api_key ]; then
  export OPENROUTER_API_KEY="$(cat /run/secrets/openrouter_api_key)"
fi

if [ "$1" = "migrate-and-start" ]; then
  npx prisma migrate deploy
  exec node dist/server.js
fi

exec "$@"
