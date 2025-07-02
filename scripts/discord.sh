#!/bin/bash
MESSAGE="$1"
# .envファイルから取得
DISCORD_WEBHOOK_URL=$(grep DISCORD_WEBHOOK_URL .env | cut -d '=' -f2)

curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"${MESSAGE}\"}" "${DISCORD_WEBHOOK_URL}"
