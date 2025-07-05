#!/bin/bash

# PR番号を引数として受け取る
if [ $# -ne 1 ]; then
    echo "使用方法: $0 <PR番号>"
    exit 1
fi

PR_NUMBER=$1

# PR番号が数値かどうかチェック
if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "エラー: PR番号は数値である必要があります"
    exit 1
fi

# GraphQL APIクエリを実行してPRレビューコメントを取得
gh api graphql -f owner="hirorocky" -f repo="TypEngQuest" -F pr="$PR_NUMBER" -f query='
query FetchReviewComments($owner: String!, $repo: String!, $pr: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        edges {                   
          node {     
            isResolved          
            isOutdated
            comments(first: 100) {
              nodes {
                author { login }
                body
                url
                path
                line
              }
            }
          }
        }                                                                                                             
      }  
    }
  }
}'