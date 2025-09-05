# リポジトリ運用ガイドライン

## プロジェクト構成とモジュール整理
- ソース: ドメイン別に構成された `src/` 配下（`core/`, `phases/`, `world/`, `player/`, `battle/`, `commands/`, `ui/`, `items/`, `equipment/`, `typing/`, `utils/`, `test-utils/`）。
- テスト: `src/**` に `*.test.ts` として同居配置。Jest セットアップ: `src/tests/setup/jest.setup.ts`。
- データ: `data/`（例: `develop/*.json`, `skills/skills.json`, 各種ステータス JSON）。
- ビルド成果物: `dist/`。ドキュメント: `docs/`。ユーティリティスクリプト: `scripts/`。

## ドキュメント構成
コードを変更する度に、関連ドキュメントを更新してください。
- ゲームシステム(docs/game-systems.md) - ゲーム内システムの詳細仕様
- 開発ガイドライン(docs/development-guidelines.md) - TDD手法とコーディング規約
- プロジェクト概要(docs/project-overview.md) - ゲームの基本概念と技術アーキテクチャ
- プロジェクト構造(docs/project-structure.md) - ソースコードとディレクトリ構造
- 開発コマンド(docs/development-commands.md) - 開発・テスト・ゲーム実行コマンド一覧
- 実装状況(docs/implementation-status.md) - 完了済み機能と実装予定タスク
- テストガイド(docs/testing-guide.md) - テスト実行方法と品質保証
- アジャイル開発計画(docs/agile-development-plan.md) - 分割した開発計画

## ビルド・テスト・開発コマンド
- `npm run dev`: `tsx` で TypeScript をホットリロード実行。
- `npm run build`: `tsc` で TS をコンパイルし `dist/` へ出力。
- `npm test` | `test:watch` | `test:coverage`: Jest 実行（ts-jest, ESM）。`pretest` で format と lint を実行。
- `npm run check`: format + lint + tests をまとめて実行。

## コーディングスタイルと命名規則
- 言語: TypeScript（`strict: true`）。
- コメント: JSDoc形式でクラスやメソッドの説明を書くのは推奨。他の部分はできるだけ書かないのが望ましい。
  - 特に、「レビュー対応」などの開発者に向けたコメントや「〜〜をする」などのWhatを説明するコメントは避ける。
- フォーマット: Prettier（`.prettierrc`）: 2 スペース、100 桁、シングルクォート、セミコロンあり。
- Lint: ESLint（`eslint.config.js`）: `const` を優先、`var` 禁止、重複 import 禁止、循環的複雑度 ≤ 10、ネスト深さ ≤ 4、引数個数 ≤ 4。`src/**` では `any` を禁止（テストは許可）。
- 命名: クラス/型は PascalCase、変数/関数は camelCase、定数は `UPPER_SNAKE_CASE`。

## テスト方針
- フレームワーク: `ts-jest`（ESM）を用いた Jest。テストはコードと同階層の `.test.ts`。
- 実行: `npm test`（quiet、`forceExit: true`）。カバレッジは `src/index.ts` を除く `src/**/*.ts` から収集。
- 目標: カバレッジを高水準で維持（`docs/testing-guide.md` 参照、目安 ≥ 約94%）。
- ヘルパー: `src/test-utils/**` と Jest セットアップのグローバルマッチャーを活用。

## コミットとプルリクエストの方針
- コミット: 履歴に準拠した Conventional Commits を使用（`feat:`, `fix:`, `docs:`, `refactor:`, `test:`）。メッセージは命令形かつ具体的に（日本語/英語いずれも可）。
- PR: 明確な要約、関連 Issue（例: `Issue #53`）、背景/意図、UI/UX 変更時は CLI 出力やスクリーンショットを含める。`npm run check` を通し、必要に応じてテストを追加/調整。

## セキュリティと設定上の注意
- シークレット: `.env` をコミットしない。Webhook スクリプトは `.env` の `DISCORD_WEBHOOK_URL` を参照。
- データ分離: 開発用は `data/develop/*.json` を使用。ハードコードされた絶対パスは避ける。
- 成果物: `dist/` 配下は編集しない。変更は常に `src/**` を更新。
