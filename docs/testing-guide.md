# テスト実行方法

## 基本テスト実行
```bash
npm test              # 全テスト実行
npm run test:watch    # ウォッチモードでテスト実行
npm run test:coverage # カバレッジレポート付きテスト実行
npm run check         # 包括的品質チェック (Lint + Format + Test)
```

## コード品質チェック
```bash
npm run lint          # ESLintによるコード品質チェック
npm run lint:fix      # ESLint自動修正
npm run format        # Prettierによるコード整形
npm run format:check  # Prettier整形チェック
```

## テストファイル構造
- **src/core/__tests__/**: コアロジックテスト
- **src/commands/__tests__/**: コマンド処理テスト
- **Jest設定**: ESM対応、TypeScript対応、Chalkモック対応
- **ESLint設定**: TypeScript対応、複雑度チェック、コード品質ルール
- **Prettier設定**: 一貫したコードスタイル

## デグレ防止とコード品質保証
- **新機能追加前**: `npm run check` を実行
- **テスト自動実行**: `npm test` 実行前にLint・Formatチェック
- **品質基準維持**: 
  - 全テストが成功することを確認
  - カバレッジが94%以上を維持
  - ESLintエラーが0件
  - Prettierフォーマット準拠