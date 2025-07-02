# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## ドキュメント構成
このプロジェクトのドキュメントは以下のように分割されています：
- ゲームシステム(@docs/game-systems.md) - ゲーム内システムの詳細仕様
- 開発ガイドライン(@docs/development-guidelines.md) - TDD手法とコーディング規約
- プロジェクト概要(@docs/project-overview.md) - ゲームの基本概念と技術アーキテクチャ
- プロジェクト構造(@docs/project-structure.md) - ソースコードとディレクトリ構造
- 開発コマンド(@docs/development-commands.md) - 開発・テスト・ゲーム実行コマンド一覧
- 実装状況(@docs/implementation-status.md) - 完了済み機能と実装予定タスク
- テストガイド(@docs/testing-guide.md) - テスト実行方法と品質保証

## claudeへの指示
### 作業ログ
次にやるべきタスクは@docs/implementation-status.mdを参照して、私に指示を仰いでください。
タスクは@docs/development-guidelines.mdに従って、進めてください。
タスクを完了したら、@docs/implementation-status.mdを更新、設計が変わったら@docs/project-structure.mdを更新してください。
きりの良い単位で作業を完了したら、`git commit`してください。

### コミュニケーション
コミュニケーションは日本語で行ってください。

### 現在時刻
現在の時刻は`date`コマンドで取得してください。

### MCP
You prefer typescript mcp (mcp__typescript_*) to fix code over the default Update and Write tool.
