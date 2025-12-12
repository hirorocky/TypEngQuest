# プロジェクト構造

## 組織哲学

5層レイヤードアーキテクチャを採用し、ドメインロジックとUIを明確に分離。
Elm Architectureパターンに基づくイベント駆動型設計で、状態管理を一元化。

## レイヤー構造

```
app層        ← 全ての層に依存可能（オーケストレーション）
    ↓
tui層        ← domain, usecase, config に依存
    ↓
usecase層    ← domain, domain/service, config に依存
    ↓
infra層      ← domain, config に依存
    ↓
domain層     ← 外部依存なし
    ↓
config       ← 横断的関心事（全層から参照可能）
```

### レイヤー間の依存ルール

| 層 | 許可された依存先 | 禁止されている依存先 |
|----|------------------|---------------------|
| domain（VO・エンティティ） | なし | domain/service, usecase, infra, tui, app |
| domain/service | domain | usecase, infra, tui, app |
| usecase | domain, domain/service, config | infra, tui, app |
| infra | domain, config | domain/service, usecase, tui, app |
| tui | domain, usecase, config | infra, app |
| app | 全ての層 | なし |

## ディレクトリパターン

### app層 - オーケストレーション
**場所**: `/internal/app/`
**目的**: Bubbleteaのtea.Model実装とシーン管理。他の全ての層をオーケストレーション
**含まれるファイル**:
- `root_model.go`: BubbleteaのModel実装
- `scene.go`: シーン列挙型とChangeSceneMsg
- `scene_router.go`: シーン名からSceneへの変換
- `screen_factory.go`: 画面インスタンスの生成
- `screen_map.go`: シーンと画面のマッピング
- `message_handlers.go`: Bubbleteaメッセージハンドリング

**サブパッケージ**: `/internal/app/game_state/` - GameState構造体、永続化

### domain層 - ドメインモデル
**場所**: `/internal/domain/`
**目的**: VO、エンティティ。UIやインフラに依存しない純粋なドメイン層
**例**: `core.go`（コア特性）、`module.go`（モジュールスキル）、`agent.go`（エージェント）、`enemy.go`（敵）

**サブパッケージ**: `/internal/domain/service/` - ドメインサービス
- `stats_service.go`: ステータス計算（CoreType×Level→Stats）
- `hp_service.go`: MaxHP計算（[]Agent→int）
- `effect_service.go`: エフェクト計算・更新

### usecase層 - ユースケース
**場所**: `/internal/usecase/`
**目的**: ドメインオブジェクト + ドメインサービスを組み合わせたアプリケーション固有の処理フロー
**サブパッケージ**: `battle`, `typing`, `agent`, `enemy`, `inventory`, `reward`, `achievement`, `balance`, `game_state`

### infra層 - インフラストラクチャ
**場所**: `/internal/infra/`
**目的**: 外部リソース（ファイル、ターミナル等）とのやり取り
**サブパッケージ**:
- `infra/savedata/`: セーブ/ロード永続化
- `infra/masterdata/`: JSONマスタデータローダー
- `infra/embedded/`: 埋め込みデータ（Go embed.FS）
- `infra/errorhandler/`: エラーハンドリング
- `infra/startup/`: 起動処理
- `infra/terminal/`: ターミナル環境検証

### tui層 - UI
**場所**: `/internal/tui/`
**目的**: 各シーンの画面実装、コンポーネント、スタイル、プレゼンター
**サブディレクトリ**:
- `screens/`: 各シーンの画面実装（Bubbleteaの`tea.Model`実装）
- `components/`: 再利用可能なUIコンポーネント
- `styles/`: lipglossスタイル定義（カラーパレット含む）
- `presenter/`: UI向けデータ変換（GameState→ViewModel）
- `ascii/`: ASCIIアート

### config - 横断的関心事
**場所**: `/internal/config/`
**目的**: マジックナンバーを一元管理。バトル設定、効果持続時間、インベントリ設定等
**例**: `constants.go`（`BattleTickInterval`, `DefaultModuleCooldown`, `MaxAgentEquipSlots` など）

### embedded - 埋め込みデータ
**場所**: `/internal/infra/embedded/`
**目的**: ビルド時にバイナリに埋め込むデータファイル（Go embed.FS使用）
**例**: `embedded.go`（埋め込み定義）、`data/`（JSONデータファイル）

### integration_test - 統合テスト
**場所**: `/internal/integration_test/`
**目的**: 複数層にまたがる統合テスト

### cmd - エントリーポイント
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
2. **ドメインサービスの分離**: 複数ドメインオブジェクトの組み合わせロジックは`domain/service/`に配置
3. **画面の自己完結性**: 各画面は独立して動作可能。RootModelがルーティングを担当
4. **外部データ駆動**: ゲームコンテンツ（コア、モジュール、敵）はJSONファイルで定義
5. **テストの同居**: テストファイルは実装と同じディレクトリに配置
6. **プレゼンター層の活用**: UI向けデータ変換は`tui/presenter/`で実装
7. **定数の一元管理**: マジックナンバーはconfigパッケージに集約
8. **ハンドラーマップパターン**: シーン遷移・メッセージ処理はマップ駆動で分岐

## 改善タスク

### masterdata型のdomain層への移動

usecase層がinfra層（masterdata）に依存している問題を解消する。

**対象パッケージと依存:**
| パッケージ | 依存しているmasterdata型 |
|-----------|-------------------------|
| enemy | `masterdata.EnemyTypeData` |
| reward | `masterdata.CoreTypeData`, `masterdata.ModuleDefinitionData` |
| game_state | `masterdata.ExternalData` |

**実施手順:**
1. `masterdata.EnemyTypeData` → `domain.EnemyType`に統合（既存の`domain.EnemyType`を拡張）
2. `masterdata.CoreTypeData` → `domain.CoreType`に統合
3. `masterdata.ModuleDefinitionData` → `domain.ModuleType`として新設
4. `masterdata.ExternalData` → masterdataはdomain型を返すよう変更
5. enemy, reward, game_stateパッケージをdomain型のみ使用するよう修正
6. 旧API（`EnemyGenerator`, `RewardCalculator`）を削除し、ドメイン型API（`DomainEnemyGenerator`, `DomainRewardCalculator`）に統一

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
_updated_at: 2025-12-13_
