# プロジェクト構造

## 組織哲学

レイヤードアーキテクチャを採用し、ドメインロジックとUIを明確に分離。
Elm Architectureパターンに基づくイベント駆動型設計で、状態管理を一元化。

## ディレクトリパターン

### アプリケーションコア
**場所**: `/internal/app/`
**目的**: ゲーム全体の状態管理、シーンルーティング、アプリケーション設定
**例**: `root_model.go`（メインモデル）、`scene.go`（シーン定義）、`scene_router.go`（シーン遷移）、`screen_factory.go`（画面生成）
**サブパッケージ**: `/internal/app/game_state/` - GameState構造体、永続化、デフォルト値を分離

### ドメインモデル
**場所**: `/internal/domain/`
**目的**: ビジネスロジックとゲームエンティティ。UIに依存しない純粋なドメイン層
**例**: `core.go`（コア特性）、`module.go`（モジュールスキル）、`agent.go`（エージェント）、`enemy.go`（敵）

### TUI画面
**場所**: `/internal/tui/screens/`
**目的**: 各シーンの画面実装。Bubbleteaの`tea.Model`インターフェースを実装
**例**: `home.go`（ホーム）、`battle.go`（バトル）、`agent_management.go`（エージェント管理）

### TUIコンポーネント・スタイル
**場所**: `/internal/tui/components/`, `/internal/tui/styles/`
**目的**: 再利用可能なUIコンポーネントとlipglossスタイル定義

### 専門ドメイン
**場所**: `/internal/battle/`, `/internal/typing/`, `/internal/achievement/` など
**目的**: 特定機能のロジックをカプセル化。バトルエンジン、タイピング評価、実績システム等

### アダプター層
**場所**: `/internal/adapter/`
**目的**: データ変換ロジックを集約。ドメインモデルとUI/永続化層の境界を明確化
**例**: `persistence_adapter.go`（SaveData <-> GameState変換）、`screen_adapter.go`（GameState -> 各種ScreenData変換）、`reward_adapter.go`（BattleStats -> RewardStats変換）
**パターン**: 変換ロジックの一元化により重複防止、テスト容易性向上

### 設定定数
**場所**: `/internal/config/`
**目的**: マジックナンバーを一元管理。バトル設定、効果持続時間、インベントリ設定等
**例**: `constants.go`（`BattleTickInterval`, `DefaultModuleCooldown`, `MaxAgentEquipSlots` など）

### 埋め込みデータ
**場所**: `/internal/embedded/`
**目的**: ビルド時にバイナリに埋め込むデータファイル（Go embed.FS使用）
**例**: `embedded.go`（埋め込み定義）、`data/`（JSONデータファイル: コア、モジュール、敵、単語辞書）
**パターン**: デフォルトデータは埋め込み、外部ディレクトリ指定で上書き可能

### エントリーポイント
**場所**: `/cmd/BlitzTypingOperator/`
**目的**: `main.go`のみ。アプリケーション起動のみを担当

## 命名規則

- **ファイル**: snake_case（例: `game_state.go`, `battle_select.go`）
- **構造体**: PascalCase（例: `CoreModel`, `BattleScreen`）
- **関数**: PascalCase（エクスポート）/ camelCase（非エクスポート）
- **テスト**: `*_test.go`で同一ディレクトリに配置

## インポート組織

```go
import (
    // 標準ライブラリ
    "fmt"
    "time"

    // 外部パッケージ
    tea "github.com/charmbracelet/bubbletea"
    "github.com/charmbracelet/lipgloss"

    // プロジェクト内パッケージ
    "hirorocky/type-battle/internal/domain"
    "hirorocky/type-battle/internal/tui/screens"
)
```

**パスエイリアス**: なし（Go標準のモジュールパスを使用）

## コード組織原則

1. **ドメイン層の独立性**: `/internal/domain/`は他の内部パッケージに依存しない
2. **画面の自己完結性**: 各画面は独立して動作可能。RootModelがルーティングを担当
3. **外部データ駆動**: ゲームコンテンツ（コア、モジュール、敵）はJSONファイルで定義
4. **テストの同居**: テストファイルは実装と同じディレクトリに配置
5. **変換ロジックの集約**: 層をまたぐデータ変換はadapterパッケージに集約
6. **定数の一元管理**: マジックナンバーはconfigパッケージに集約
7. **ハンドラーマップパターン**: シーン遷移・メッセージ処理はマップ駆動で分岐

## ドメイン別仕様

各ドメインの詳細な要件・仕様は `.kiro/steering/specifications/` 配下を参照:

- `battle.md`: バトルシステム
- `gameloop.md`: ゲームループ・状態遷移
- `agent.md`: エージェント・合成システム
- `typing.md`: タイピング評価・入力処理
- `enemy.md`: 敵・ステージシステム
- `collection.md`: 図鑑・実績システム

---
_パターンを記述。新規ファイルがパターンに従えばsteeringの更新は不要_
_updated_at: 2025-12-10_
