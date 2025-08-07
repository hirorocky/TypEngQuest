# 開発コマンド一覧

## 開発・実行
- `npm run dev` - ホットリロード付き開発モード（tsx使用）
- `npm run dev:test` - テストモードで実行
- `npm run build` - TypeScriptコンパイル（dist/へ出力）
- `npm run start` - コンパイル済みバージョン実行
- `npm run watch` - ウォッチモード開発（nodemon使用）

## テスト実行
- `npm run test` - テスト実行（実行前にLint・Format自動実行）
- `npm run test:watch` - テストウォッチモード
- `npm run test:coverage` - カバレッジ付きテスト実行

## コード品質
- `npm run lint` - ESLintによるコード品質チェック
- `npm run lint:fix` - ESLintによる自動修正
- `npm run format` - Prettierによるコード整形
- `npm run format:check` - Prettierによる整形チェック
- `npm run check` - 全品質チェック (Format + Lint + Test)

## Git操作（macOS）
- `git status` - 変更状況確認
- `git diff` - 変更内容確認
- `git add .` - 全変更をステージング
- `git commit -m "message"` - コミット
- `git push` - リモートへプッシュ
- `git checkout -b branch-name` - 新ブランチ作成
- `git log --oneline` - コミット履歴確認

## システムコマンド（macOS/Darwin）
- `ls` - ファイル一覧
- `cd` - ディレクトリ移動
- `pwd` - 現在のディレクトリ表示
- `date` - 現在時刻取得
- `find . -name "*.ts"` - TypeScriptファイル検索
- `grep -r "pattern" .` - パターン検索（rgも利用可能）

## 重要な注意事項
- `npm test`実行前に自動でLint・Formatが実行される（pretestフック）
- テスト駆動開発のため、新機能実装前に必ずテストを先に書く
- 品質チェックは`npm run check`で一括実行可能