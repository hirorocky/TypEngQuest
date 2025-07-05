#!/bin/bash
MESSAGE="$1"

# .envファイルから取得
DISCORD_WEBHOOK_URL=$(grep DISCORD_WEBHOOK_URL .env | cut -d '=' -f2)

# メッセージをエスケープ処理
ESCAPED_MESSAGE=$(echo -e "$MESSAGE" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')

curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"${ESCAPED_MESSAGE}\"}" "${DISCORD_WEBHOOK_URL}"
