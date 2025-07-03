#!/bin/bash
MESSAGE="$1"

# 標準入力からテキストを読み込む（パイプやリダイレクトで渡された場合）
if [ ! -t 0 ]; then
    STDIN_TEXT=$(cat)
    if [ -n "$STDIN_TEXT" ]; then
        # 標準入力がある場合は、メッセージに追加
        MESSAGE="${MESSAGE}\n\`\`\`\n${STDIN_TEXT}\n\`\`\`"
    fi
fi

# .envファイルから取得
DISCORD_WEBHOOK_URL=$(grep DISCORD_WEBHOOK_URL .env | cut -d '=' -f2)

# メッセージをエスケープ処理
ESCAPED_MESSAGE=$(echo -e "$MESSAGE" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"${ESCAPED_MESSAGE}\"}" "${DISCORD_WEBHOOK_URL}"
