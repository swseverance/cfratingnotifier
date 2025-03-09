#!/bin/bash
if [[ -z "$1" ]]; then
  echo "Error: Missing environment argument. Usage: ./deploy.sh <dev|prod>"
  exit 1
fi

if [[ "$1" != "dev" && "$1" != "prod" ]]; then
  echo "Error: Invalid environment '$1'. Usage: ./deploy.sh <dev|prod>"
  exit 1
fi

TARGET_ENV="$1"

firebase use "$TARGET_ENV"
npm run test --prefix functions
npm run build --prefix functions
npm run deploy --prefix functions
firebase use dev