# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## ドキュメント構成

このプロジェクトのドキュメントは以下のように分割されています：

- **[プロジェクト概要](docs/project-overview.md)** - ゲームの基本概念と技術アーキテクチャ
- **[開発コマンド](docs/development-commands.md)** - 開発・テスト・ゲーム実行コマンド一覧
- **[プロジェクト構造](docs/project-structure.md)** - ソースコードとディレクトリ構造
- **[実装状況](docs/implementation-status.md)** - 完了済み機能と実装予定タスク
- **[ゲームシステム](docs/game-systems.md)** - ゲーム内システムの詳細仕様
- **[テストガイド](docs/testing-guide.md)** - テスト実行方法と品質保証
- **[開発ガイドライン](docs/development-guidelines.md)** - TDD手法とコーディング規約

## 現在のステータス

### 📊 プロジェクト状況
- **テスト数**: 283個 (全て成功) 🎉
- **カバレッジ**: 95%+
- **実装フェーズ**: TDD Green段階 - 次期実装準備中

### 🎯 最新の成果 (2025-06-27)
**✅ ファイル調査システム実装完了**:
- FileInvestigationCommandsクラス: file/cat/head コマンド
- file: ファイルタイプ・危険度・潜在要素ヒント表示
- cat: ファイル内容・要素生成配置・探索状態更新
- head: 軽量調査・プレビュー表示
- 22個の新規テスト (🔴Red → 🟢Green移行成功)
- ElementManager統合による段階的ファイル発見システム

**🚧 相互作用システム実装進行中**:
- InteractionCommandsクラス: TDD Red段階完了
- 27個のテストケース作成完了
- interact コマンド基本実装完了（95%）
- 残課題: Playerクラスのインベントリ管理API統合

### 🔧 品質チェック
実装変更後は必ず以下を実行：
```bash
npm run check  # 全品質チェック (Lint + Format + Test)
```

## claudeへの指示
### 作業ログ
タスクが完了する毎にCLAUDE.mdおよびその参照ファイルを更新してください。

### コミュニケーション
コミュニケーションは日本語で行ってください。

### 現在時刻
現在の時刻は`date`コマンドで取得してください。