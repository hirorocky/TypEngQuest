# 開発ワークフローとブランチ戦略

## ブランチ戦略
- **mainブランチ**: デフォルトブランチ、プロダクション相当
- **feature/issue-#番号**: 機能開発用ブランチ（例: feature/issue-#40）

## 開発ワークフロー
1. **Issue作成**: GitHubでIssueを作成し、実装内容を明確化
2. **承認待機**: ステークホルダーの承認を待つ
3. **ブランチ作成**: `git checkout -b feature/issue-#番号`
4. **TDD実装**:
   - テストを先に書く（Red）
   - 最小限の実装（Green）
   - リファクタリング（Refactor）
5. **品質チェック**: `npm run check`を実行
6. **コミット**: 適切な単位でコミット
7. **プッシュ**: `git push origin feature/issue-#番号`
8. **PR作成**: `gh pr create`でプルリクエスト作成
9. **レビュー対応**: フィードバックに基づき修正
10. **マージ**: 承認後mainにマージ

## コミットメッセージ規約
- feat: 新機能追加
- fix: バグ修正
- refactor: リファクタリング
- test: テスト追加・修正
- docs: ドキュメント更新
- chore: その他の変更

例：
- `feat: スキルシステムのelement削除とmpCharge/actionCost追加`
- `fix: Skillインターフェースの新プロパティをBattle.tsで実装`

## 現在の状況（git status）
- 現在のブランチ: main
- 変更ファイル: mise.toml (Modified)

## GitHub CLI (gh)コマンド
- `gh issue create` - Issue作成
- `gh pr create` - PR作成
- `gh pr view` - PR詳細表示
- `gh pr comment` - PRにコメント