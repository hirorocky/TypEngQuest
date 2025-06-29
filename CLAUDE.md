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
- **テスト数**: 345個 (329個成功、16個統合調整中) 🚧
- **カバレッジ**: 95%+
- **実装フェーズ**: TDD Green段階 - 次期実装準備中

### 🎯 最新の成果 (2025-06-29)
**✅ ランダムイベントシステム実装完了**:
- RandomEventManagerクラス: 包括的なランダムイベント管理システム
- タイピング回避システム: 悪いイベントのタイピング回避機能
- バフ・デバフシステム: 一時的なステータス効果管理
- イベント統計: イベント履歴と成功率追跡
- ファイルタイプ連動: ファイル拡張子に応じたイベント生成
- InteractionCommands統合: avoid/skip/eventsコマンド
- Game統合: ランダムイベントシステム完全統合
- 19個の新規テスト (🔴Red → 🟢Green移行成功)

**実装されたコンポーネント**:
- `src/events/randomEventManager.ts` - ランダムイベント管理システム
- `src/events/__tests__/randomEventManager.test.ts` - 包括的テスト (19テスト)
- `src/commands/interaction.ts` - RandomEventManager統合
- `src/commands/processor.ts` - avoid/skip/eventsコマンド追加
- `src/core/game.ts` - InteractionCommands統合

**機能詳細**:
- 良いイベント: 経験値・装備・ステータスバフ
- 悪いイベント: ダメージ・デバフ（タイピング回避可能）
- 5段階難易度: ワールドレベル・イベント深刻度連動
- イベント履歴: 成功率・統計・ログ機能

**コマンド使用例**: `interact event.tmp` → `avoid function 2.5` / `skip` / `events`

**注意点**: タイピング精度が回避成功率に直結、ワールドレベル連動難易度調整

### 🔄 前回の成果 (2025-06-28)
**✅ 戦闘システム実装完了**:
- TypingChallengeクラス: プログラミング用語タイピングシステム
- BattleCommandsクラス: ターン制戦闘・ダメージ計算
- 5段階難易度: 基本→中級→上級→プログラミング→専門用語
- WPM計算・精度評価・完璧ボーナス・最小ダメージ保証
- CommandProcessor統合: battle/attack/fleeコマンド
- Game統合: マップ・ワールド・戦闘システム完全統合
- 21個の新規テスト (🔴Red → 🟢Green移行成功)

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

### Git
きりの良いfeature毎に`git commit`してください。

