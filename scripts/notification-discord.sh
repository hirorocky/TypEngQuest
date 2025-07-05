#!/bin/bash
MESSAGE="$1"

# 標準入力からテキストを読み込む（パイプやリダイレクトで渡された場合）
if [ ! -t 0 ]; then
    STDIN_TEXT=$(cat)
    if [ -n "$STDIN_TEXT" ]; then
        # JSONから"message"フィールドの値を抽出
        JSON_MESSAGE=$(echo "$STDIN_TEXT" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/')
        if [ -n "$JSON_MESSAGE" ]; then
            # messageフィールドがある場合は追加
            MESSAGE="${MESSAGE}\n${JSON_MESSAGE}"
        else
            # messageフィールドがない場合は元のテキストを追加
            MESSAGE="${MESSAGE}\n\`\`\`\n${STDIN_TEXT}\n\`\`\`"
        fi
    fi
fi

# .envファイルから取得
DISCORD_WEBHOOK_URL=$(grep DISCORD_WEBHOOK_URL .env | cut -d '=' -f2)

# メッセージをエスケープ処理
ESCAPED_MESSAGE=$(echo -e "$MESSAGE" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')

curl -H "Content-Type: application/json" -X POST -d "{\"content\":\"${ESCAPED_MESSAGE}\"}" "${DISCORD_WEBHOOK_URL}"
