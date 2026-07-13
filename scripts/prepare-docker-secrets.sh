#!/usr/bin/env bash
# Crea archivos de secrets vacíos para docker compose si no existen.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/secrets"
for name in ocr_space_api_key openrouter_api_key; do
  target="$ROOT/secrets/$name"
  if [[ ! -f "$target" ]]; then
    cp "$ROOT/secrets/$name.example" "$target" 2>/dev/null || : > "$target"
    echo "Created $target (vacío — añade claves reales para producción)"
  fi
done
