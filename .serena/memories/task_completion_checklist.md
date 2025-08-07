# タスク完了時のチェックリスト

## 必須実行コマンド
タスク完了時は以下のコマンドを必ず実行してください：

### 1. コード品質チェック
```bash
npm run check  # Format + Lint + Test を一括実行
```

このコマンドは以下を実行します：
- `npm run format` - Prettierによるコード整形
- `npm run lint` - ESLintによるコード品質チェック  
- `npm run test` - Jestによるテスト実行

### 2. 個別チェック（必要に応じて）
```bash
npm run test:coverage  # カバレッジ確認（95%以上を維持）
npm run lint:fix       # ESLintエラーの自動修正
```

## 確認事項
- [ ] 全テストが成功している
- [ ] ESLintエラーが0件
- [ ] Prettierフォーマット準拠
- [ ] コードカバレッジ95%以上を維持
- [ ] 新機能の場合、テストが先に書かれている（TDD）
- [ ] JSDocコメントが日本語で記載されている
- [ ] ユーザー向けメッセージがUnix風英語

## ドキュメント更新
- [ ] `@docs/implementation-status.md` - 実装状況を更新
- [ ] `@docs/project-structure.md` - 設計変更があれば更新

## Git操作
- [ ] 適切な単位でコミット（プロジェクト完了時または区切りの良いところ）
- [ ] コミットメッセージは変更内容を的確に表現

## 重要な禁止事項
- package.jsonのtypeフィールドを変更しない
- ランダムな要素はモック化してテストがFlakyにならないようにする