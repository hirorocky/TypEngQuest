# Design Document

## Overview

**Purpose**: 本機能は、バトルレベル選択システム、敵の二重状態管理、順序実行型の行動パターン、状態別パッシブスキル、確定報酬システムを実装し、プレイヤーに戦略的な緊張感と挑戦する価値を提供します。

**Users**: プレイヤーがバトル前に自分に合った敵を選択し、敵の行動パターンを読みながら戦略的にバトルを進行できます。

**Impact**: 既存のバトル選択画面を敵種類選択に対応させ、敵の行動ロジックを順序実行型に変更、報酬システムを確定ドロップに変更します。

### Goals

- 敵種類とレベルの組み合わせでバトル難易度を選択可能にする
- 敵の行動パターンを予測可能にし、戦略性を向上させる
- 敵ごとの個性をパッシブスキルで表現する
- 挑戦への動機付けとなる確定報酬を実装する

### Non-Goals

- 新しい敵タイプの追加（マスタデータ設計のみ、実データは別途）
- バトル中の敵切り替え
- マルチプレイヤー対応
- 敵AIの学習・適応機能

## Architecture

### Existing Architecture Analysis

**現行アーキテクチャの状況**:

- **敵フェーズ管理**: `domain/enemy.go`に`EnemyPhase`（PhaseNormal/PhaseEnhanced）と50%閾値での遷移ロジックが実装済み
- **バトル選択**: `tui/screens/battle_select.go`でレベル入力のみ対応。敵種類選択なし
- **敵行動**: `usecase/combat/battle.go`の`DetermineNextAction`でランダム行動決定
- **報酬システム**: `usecase/rewarding/reward.go`で確率ドロップ（コア70%、モジュール70%×2）

**維持すべき既存パターン**:

- 5層レイヤードアーキテクチャ（domain → usecase → tui/infra → app）
- EffectTableパターンによる効果管理
- Elm Architectureベースのイベント駆動

### Architecture Pattern & Boundary Map

```mermaid
graph TB
    subgraph TUI Layer
        BattleSelect[BattleSelectScreen]
        Battle[BattleScreen]
    end

    subgraph UseCase Layer
        Combat[combat.BattleEngine]
        Spawning[spawning.EnemyGenerator]
        Rewarding[rewarding.RewardCalculator]
    end

    subgraph Domain Layer
        EnemyModel[EnemyModel]
        EnemyType[EnemyType with ActionPattern]
        EnemyPassive[EnemyPassiveSkill]
    end

    subgraph Infra Layer
        Masterdata[masterdata.Loader]
    end

    BattleSelect --> Spawning
    Battle --> Combat
    Combat --> EnemyModel
    Combat --> Rewarding
    Spawning --> EnemyType
    EnemyModel --> EnemyPassive
    Masterdata --> EnemyType
```

**Architecture Integration**:

- **Selected pattern**: 既存の5層レイヤードアーキテクチャを維持
- **Domain boundaries**: EnemyType拡張（行動パターン、パッシブスキル）はdomain層、行動実行ロジックはusecase/combat層
- **Existing patterns preserved**: EffectTableパターン、ファクトリパターン、マスタデータ駆動
- **New components rationale**: 敵パッシブスキルはEffectTableパターンに統合し、一時ステータス修正として実装
- **Steering compliance**: ドメイン層の独立性維持、マジックナンバーのconfig集約

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Domain | Go structs | EnemyType拡張、EnemyPassive定義 | 既存構造体を拡張 |
| UseCase | Go packages | 行動パターン実行、報酬計算変更 | combat, spawning, rewarding |
| TUI | Bubbletea + Lipgloss | 敵選択UI、行動予告表示 | 既存画面を拡張 |
| Data | JSON (embed.FS) | 敵定義、行動パターン、パッシブ定義 | enemies.json拡張 |

## System Flows

### レベル選択フロー

```mermaid
sequenceDiagram
    participant P as Player
    participant UI as BattleSelectScreen
    participant Gen as EnemyGenerator
    participant State as GameState

    P->>UI: 画面を開く
    UI->>Gen: GetEnemyTypes()
    Gen-->>UI: 敵タイプリスト
    UI->>State: GetDefeatedEnemies()
    State-->>UI: 撃破済み敵マップ
    UI-->>P: 敵リスト表示（レベル付き）

    P->>UI: 左右キーで敵選択
    P->>UI: 上下キーでレベル選択
    P->>UI: Enter確定
    UI->>Gen: GenerateWithType(level, typeID)
    Gen-->>UI: EnemyModel
```

### 敵行動パターンフロー

```mermaid
sequenceDiagram
    participant Battle as BattleEngine
    participant Enemy as EnemyModel
    participant Pattern as ActionPattern
    participant Player as PlayerModel

    Battle->>Enemy: GetCurrentActionIndex()
    Enemy-->>Battle: currentIndex
    Battle->>Pattern: GetAction(currentIndex)
    Pattern-->>Battle: EnemyAction

    alt Action is Attack
        Battle->>Player: TakeDamage()
    else Action is SelfBuff
        Battle->>Enemy: ApplyBuff()
    else Action is PlayerDebuff
        Battle->>Player: ApplyDebuff()
    end

    Battle->>Enemy: AdvanceActionIndex()
    Enemy->>Enemy: index = (index + 1) % len(pattern)
```

### 敵パッシブスキル適用フロー

```mermaid
stateDiagram-v2
    [*] --> NormalPhase: バトル開始
    NormalPhase --> NormalPhase: 通常パッシブ適用中
    NormalPhase --> EnhancedPhase: HP <= 50%
    EnhancedPhase --> EnhancedPhase: 強化パッシブ適用中
    EnhancedPhase --> [*]: 撃破
    NormalPhase --> [*]: 撃破

    note right of NormalPhase: 通常パッシブをEffectTableに登録
    note right of EnhancedPhase: 通常パッシブ無効化\n強化パッシブを登録
```

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | レベルと敵を一対一対応（1〜100） | EnemyType, EnemyGenerator | GenerateWithType() | レベル選択フロー |
| 1.2 | 敵タイプにデフォルトレベル設定 | EnemyType | DefaultLevel | - |
| 1.3 | 敵の特徴を表示 | BattleSelectScreen | RenderEnemyInfo() | レベル選択フロー |
| 1.4 | 未撃破はデフォルトレベルのみ | BattleSelectScreen | GetSelectableLevel() | レベル選択フロー |
| 1.5 | 撃破後のレベル上昇 | GameState, BattleSelectScreen | GetDefeatedEnemies() | レベル選択フロー |
| 1.6 | レベルに応じた報酬品質 | RewardCalculator | CalculateRewards() | - |
| 1.7 | 左右キーで敵種類変更 | BattleSelectScreen | handleKeyMsg() | レベル選択フロー |
| 1.8 | 上下キーでレベル変更 | BattleSelectScreen | handleKeyMsg() | レベル選択フロー |
| 2.1 | 敵に通常/強化状態を定義 | EnemyModel, EnemyType | NewEnemy() | - |
| 2.2 | HP50%以下で強化状態に遷移 | BattleEngine | CheckPhaseTransition() | パッシブスキル適用フロー |
| 2.3 | 強化状態から戻らない | EnemyModel | TransitionToEnhanced() | パッシブスキル適用フロー |
| 3.1 | 通常行動パターンを配列で定義 | EnemyType, ActionPattern | GetNormalPattern() | 敵行動パターンフロー |
| 3.2 | 順序実行とループ | ActionPatternExecutor | ExecuteNextAction() | 敵行動パターンフロー |
| 3.3 | 強化行動パターン定義 | EnemyType, ActionPattern | GetEnhancedPattern() | 敵行動パターンフロー |
| 3.4 | 強化時にパターン切り替え | BattleEngine | OnPhaseTransition() | 敵行動パターンフロー |
| 3.5 | 行動速度で実行間隔設定 | EnemyModel | AttackInterval | - |
| 4.1 | 通常パッシブ定義 | EnemyPassiveSkill | NormalPassive | - |
| 4.2 | 通常パッシブをEffectTableに適用 | BattleEngine | RegisterEnemyPassive() | パッシブスキル適用フロー |
| 4.3 | 強化時に通常パッシブ無効化 | BattleEngine | OnPhaseTransition() | パッシブスキル適用フロー |
| 4.4 | 強化パッシブ定義 | EnemyPassiveSkill | EnhancedPassive | - |
| 4.5 | 強化パッシブ適用 | BattleEngine | RegisterEnemyPassive() | パッシブスキル適用フロー |
| 5.1 | 撃破時に必ず1つアイテムドロップ | RewardCalculator | CalculateRewards() | - |
| 5.2 | 敵ごとにドロップカテゴリとTypeID設定 | EnemyType | DropItemCategory, DropItemTypeID | - |
| 5.3 | コアレベルを敵レベル上限でランダム | RewardCalculator | RollCoreDrop() | - |
| 5.4 | モジュールのチェイン効果を敵レベルで選択 | RewardCalculator | RollModuleDrop() | - |
| 6.1 | 敵の状態遷移ロジック実行 | BattleEngine | CheckPhaseTransition() | - |
| 6.2 | 行動パターンに従って行動実行 | BattleEngine | ProcessEnemyAction() | 敵行動パターンフロー |
| 6.3 | パッシブスキル効果適用 | BattleEngine | UpdateEnemyPassive() | パッシブスキル適用フロー |
| 6.4 | バトル終了時に報酬システム呼び出し | BattleEngine | OnBattleEnd() | - |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|------------------|-----------|
| EnemyType | Domain | 敵タイプ定義を拡張し行動パターンとパッシブを保持 | 1.1, 1.2, 2.1, 3.1, 3.3, 4.1, 4.4, 5.2 | なし | State |
| EnemyModel | Domain | バトル中の敵インスタンスに行動インデックスを追加 | 2.2, 2.3, 3.2, 3.5 | EnemyType | State |
| EnemyPassiveSkill | Domain | 敵用パッシブスキル定義 | 4.1, 4.4 | EffectColumn | State |
| ActionPattern | Domain | 敵行動パターンのデータ構造 | 3.1, 3.3 | なし | State |
| BattleSelectScreen | TUI | 敵種類とレベルの選択UI | 1.1-1.6 | EnemyGenerator, GameState (P0) | Service |
| BattleEngine | UseCase | 行動パターン実行とパッシブ管理 | 6.1-6.4 | EnemyModel, PlayerModel (P0) | Service |
| RewardCalculator | UseCase | 確定ドロップと品質計算 | 5.1-5.4 | EnemyType (P1) | Service |
| EnemyGenerator | UseCase | 敵タイプ指定での敵生成 | 1.1 | EnemyType (P1) | Service |

### Domain Layer

#### EnemyType (Extended)

| Field | Detail |
|-------|--------|
| Intent | 敵タイプ定義を拡張し、行動パターンとパッシブスキルを保持する |
| Requirements | 1.1, 1.2, 2.1, 3.1, 3.3, 4.1, 4.4, 5.2 |

**Responsibilities & Constraints**

- 敵の静的定義（HP、攻撃力、外観）を保持
- デフォルトレベル（1〜100）を保持
- 通常行動パターンと強化行動パターンを保持
- 通常パッシブスキルと強化パッシブスキルを保持
- ドロップアイテムのカテゴリ（"core"または"module"）とTypeIDを保持

**Dependencies**

- Outbound: なし（純粋なドメインモデル）

**Contracts**: State [x]

##### State Management

```go
type EnemyType struct {
    // 既存フィールド（ID, Name, BaseHP, BaseAttackPower, BaseAttackInterval, AttackType, ASCIIArt）

    // デフォルトレベル（1〜100、未撃破時はこのレベルのみ選択可能）
    DefaultLevel int

    // 行動パターン（最低1つの行動を持つ配列）
    NormalActionPattern   []EnemyAction
    EnhancedActionPattern []EnemyAction

    // パッシブスキル
    NormalPassive   *EnemyPassiveSkill
    EnhancedPassive *EnemyPassiveSkill

    // ドロップ設定
    DropItemCategory string // "core" または "module"
    DropItemTypeID   string // コアまたはモジュールのTypeID
}
```

**Implementation Notes**

- 既存の`EnemyType`構造体にフィールドを追加
- JSONマスタデータの形式も拡張が必要
- 行動パターンは最低1つの要素を持つことをバリデーション

#### EnemyAction

| Field | Detail |
|-------|--------|
| Intent | 敵の個別行動を定義する値オブジェクト |
| Requirements | 3.1, 3.3 |

**Responsibilities & Constraints**

- 行動タイプ（攻撃、自己バフ、プレイヤーデバフ）を定義
- 攻撃の場合は攻撃属性を保持
- バフ/デバフの場合は効果タイプと値を保持

**Dependencies**

- Outbound: なし（純粋な値オブジェクト）

**Contracts**: State [x]

##### State Management

```go
type EnemyAction struct {
    // 行動タイプ
    ActionType EnemyActionType // Attack, SelfBuff, Debuff

    // 攻撃行動の場合
    AttackType string // "physical" または "magic"

    // バフ/デバフ行動の場合
    EffectType   string  // 効果タイプ（attackUp, defenseUp, etc.）
    EffectValue  float64 // 効果値
    Duration     float64 // 持続時間（秒）
}
```

#### EnemyPassiveSkill

| Field | Detail |
|-------|--------|
| Intent | 敵用パッシブスキルを定義し、EffectTableに登録可能な形式を提供 |
| Requirements | 4.1, 4.2, 4.4, 4.5 |

**Responsibilities & Constraints**

- パッシブスキルの効果を定義
- EffectEntryに変換するメソッドを提供
- 一時ステータス修正として適用される

**Dependencies**

- Outbound: EffectColumn, EffectEntry（domain内参照）

**Contracts**: State [x]

##### State Management

```go
type EnemyPassiveSkill struct {
    ID          string
    Name        string
    Description string

    // 効果値（EffectColumnにマッピング）
    Effects map[EffectColumn]float64
}

// ToEntry はEffectTableに登録可能なEffectEntryに変換する
func (p *EnemyPassiveSkill) ToEntry() EffectEntry
```

**Implementation Notes**

- 既存のプレイヤー用PassiveSkillDefinitionと同様のパターンを採用
- 条件付き発動はサポートせず、状態に紐づく永続効果として実装

#### EnemyModel (Extended)

| Field | Detail |
|-------|--------|
| Intent | バトル中の敵インスタンスに行動インデックスとパッシブ管理を追加 |
| Requirements | 2.2, 2.3, 3.2, 3.5 |

**Responsibilities & Constraints**

- 現在の行動パターンインデックスを保持
- フェーズに応じた行動パターンを返す
- フェーズ遷移時のパッシブ切り替えをサポート

**Dependencies**

- Inbound: BattleEngine — 行動実行とフェーズ管理（P0）

**Contracts**: State [x]

##### State Management

```go
type EnemyModel struct {
    // 既存フィールド（ID, Name, Level, HP, MaxHP, AttackPower, AttackInterval, Type, Phase, EffectTable）

    // 行動パターンの現在インデックス
    ActionIndex int

    // 現在適用中のパッシブスキルID（解除時に使用）
    ActivePassiveID string
}

// GetCurrentAction は現在実行すべき行動を返す
func (e *EnemyModel) GetCurrentAction() EnemyAction

// AdvanceActionIndex は行動インデックスを進める（ループ対応）
func (e *EnemyModel) AdvanceActionIndex()

// ResetActionIndex は行動インデックスをリセットする（フェーズ遷移時）
func (e *EnemyModel) ResetActionIndex()

// GetCurrentPattern は現在のフェーズに対応する行動パターンを返す
func (e *EnemyModel) GetCurrentPattern() []EnemyAction
```

### TUI Layer

#### BattleSelectScreen (Extended)

| Field | Detail |
|-------|--------|
| Intent | 敵種類とレベルを選択するUIを提供 |
| Requirements | 1.1, 1.2, 1.3, 1.5, 1.6 |

**Responsibilities & Constraints**

- 敵タイプリストをカルーセル形式で表示
- 各敵の特徴（名前、HP目安、攻撃属性、パッシブ名）を表示
- 未撃破の敵タイプはデフォルトレベルのみ選択可能
- 撃破済み敵はデフォルトレベル以上を選択可能
- 左右キーで敵種類、上下キーでレベルを変更

**Dependencies**

- Inbound: app.RootModel — 画面遷移（P0）
- Outbound: EnemyGenerator — 敵タイプ取得（P0）
- Outbound: GameState — 撃破済み敵情報取得（P1）

**Contracts**: Service [x]

##### Service Interface

```go
// 既存のBattleSelectScreenを拡張

type BattleSelectScreen struct {
    // 既存フィールド

    // 敵種類選択用
    enemyTypes      []domain.EnemyType
    selectedTypeIdx int

    // レベル選択用
    selectedLevel    int
    minSelectableLevel int // 敵タイプのデフォルトレベル
    maxSelectableLevel int // 撃破済み最高レベル+1（未撃破ならデフォルトレベル）

    // 撃破済み敵情報プロバイダー
    defeatedProvider DefeatedEnemyProvider
}

// DefeatedEnemyProvider は撃破済み敵情報を提供するインターフェース
type DefeatedEnemyProvider interface {
    // GetDefeatedEnemies は敵タイプIDをキー、撃破最高レベルを値とするマップを返す
    GetDefeatedEnemies() map[string]int
}

// StartBattleMsg にEnemyTypeIDを追加
type StartBattleMsg struct {
    Level       int
    EnemyTypeID string
}
```

**Implementation Notes**

- 既存の入力フィールド方式からカルーセル方式に変更
- 敵情報パネルで特徴を表示
- 未撃破の敵タイプはデフォルトレベルのみ選択可能
- レベル範囲は1〜100、敵タイプは100種類定義

### UseCase Layer

#### BattleEngine (Extended)

| Field | Detail |
|-------|--------|
| Intent | 敵の行動パターン実行とパッシブスキル管理をバトルに統合 |
| Requirements | 6.1, 6.2, 6.3, 6.4 |

**Responsibilities & Constraints**

- 敵の行動パターンに従って順序実行
- フェーズ遷移時にパッシブスキルを切り替え
- 敵パッシブスキルをEffectTableで管理

**Dependencies**

- Inbound: BattleScreen — バトル進行制御（P0）
- Outbound: EnemyModel — 敵状態管理（P0）
- Outbound: RewardCalculator — 報酬計算（P1）

**Contracts**: Service [x]

##### Service Interface

```go
// 既存のBattleEngineを拡張

// ProcessEnemyActionByPattern は行動パターンに従って敵行動を実行する
// 既存のDetermineNextAction + ExecuteNextActionを置き換え
func (e *BattleEngine) ProcessEnemyActionByPattern(state *BattleState) (damage int, message string)

// RegisterEnemyPassive は敵のパッシブスキルをEffectTableに登録する
func (e *BattleEngine) RegisterEnemyPassive(state *BattleState)

// OnPhaseTransition はフェーズ遷移時の処理を実行する
// - 行動インデックスをリセット
// - 通常パッシブを無効化
// - 強化パッシブを登録
func (e *BattleEngine) OnPhaseTransition(state *BattleState)

// CheckPhaseTransitionWithPassive はフェーズ遷移をチェックし、パッシブも切り替える
func (e *BattleEngine) CheckPhaseTransitionWithPassive(state *BattleState) bool
```

**Implementation Notes**

- 既存の`DetermineNextAction`はランダム行動決定だが、新しい`ProcessEnemyActionByPattern`はパターン順序実行
- 後方互換性のため、EnemyTypeに行動パターンがない場合は既存のランダムロジックにフォールバック

#### RewardCalculator (Extended)

| Field | Detail |
|-------|--------|
| Intent | 確定ドロップと敵レベルに応じた報酬品質を計算 |
| Requirements | 5.1, 5.2, 5.3, 5.4 |

**Responsibilities & Constraints**

- 撃破時に必ず1つのアイテムをドロップ
- ドロップアイテムは敵タイプのDropItemCategoryとDropItemTypeID設定に従う
- DropItemCategoryが"core"の場合、指定されたTypeIDのコアをレベル（敵レベル以下でランダム）で生成
- DropItemCategoryが"module"の場合、指定されたTypeIDのモジュールを敵レベルに応じたチェイン効果で生成

**Dependencies**

- Inbound: BattleEngine — 報酬計算呼び出し（P0）
- Outbound: EnemyType — ドロップカテゴリ・TypeID参照（P1）
- Outbound: ChainEffectPool — チェイン効果選択（P1）

**Contracts**: Service [x]

##### Service Interface

```go
// 既存のRewardCalculatorを拡張

// CalculateGuaranteedReward は確定ドロップを計算する（既存のCalculateRewardsを拡張）
func (c *RewardCalculator) CalculateGuaranteedReward(
    stats *BattleStatistics,
    enemyLevel int,
    enemyType domain.EnemyType,
) *RewardResult

// RollCoreDropWithLevelCap は指定されたTypeIDでコアを敵レベル以下でランダム生成する
func (c *RewardCalculator) RollCoreDropWithLevelCap(typeID string, maxLevel int) *domain.CoreModel

// RollModuleDropWithLevelEffect は指定されたTypeIDで敵レベルに応じたチェイン効果付きモジュールを生成する
func (c *RewardCalculator) RollModuleDropWithLevelEffect(typeID string, enemyLevel int) *domain.ModuleModel
```

**Implementation Notes**

- 既存の確率ドロップロジックを維持しつつ、確定ドロップモードを追加
- 敵タイプにDropItemCategoryまたはDropItemTypeIDがない場合は既存の確率ドロップにフォールバック
- チェイン効果の選択は敵レベルが高いほど高品質な効果が出やすくなる

#### EnemyGenerator (Extended)

| Field | Detail |
|-------|--------|
| Intent | 敵タイプを指定した敵生成をサポート |
| Requirements | 1.1 |

**Responsibilities & Constraints**

- 既存の`GenerateWithType`メソッドを活用
- 行動パターン初期化をサポート

**Dependencies**

- Inbound: BattleSelectScreen — 敵生成要求（P0）
- Outbound: EnemyType — 敵定義参照（P1）

**Contracts**: Service [x]

##### Service Interface

```go
// 既存のEnemyGeneratorを使用（GenerateWithTypeメソッドが既に存在）

// GetEnemyTypes は全ての敵タイプを返す（既存メソッド）
func (g *EnemyGenerator) GetEnemyTypes() []domain.EnemyType
```

**Implementation Notes**

- 新しいフィールド（行動パターン、パッシブ）を持つEnemyTypeからの生成をサポート
- NewEnemy関数でActionIndexを0に初期化

## Data Models

### Domain Model

**EnemyType拡張**:

```go
type EnemyType struct {
    // 既存
    ID                 string
    Name               string
    BaseHP             int
    BaseAttackPower    int
    BaseAttackInterval time.Duration
    AttackType         string
    ASCIIArt           string

    // 新規追加
    DefaultLevel          int    // デフォルトレベル（1〜100）
    NormalActionPattern   []EnemyAction
    EnhancedActionPattern []EnemyAction
    NormalPassive         *EnemyPassiveSkill
    EnhancedPassive       *EnemyPassiveSkill
    DropItemCategory      string // "core" または "module"
    DropItemTypeID        string // コアまたはモジュールのTypeID
}
```

**EnemyAction**:

```go
type EnemyActionType int

const (
    EnemyActionAttack EnemyActionType = iota
    EnemyActionSelfBuff
    EnemyActionDebuff
)

type EnemyAction struct {
    ActionType   EnemyActionType
    AttackType   string  // Attack時のみ: "physical" | "magic"
    EffectType   string  // Buff/Debuff時: "attackUp", "defenseUp", etc.
    EffectValue  float64
    Duration     float64 // 秒
}
```

**EnemyPassiveSkill**:

```go
type EnemyPassiveSkill struct {
    ID          string
    Name        string
    Description string
    Effects     map[EffectColumn]float64
}
```

**ビジネスルール/不変条件**:

- `DefaultLevel`は1〜100の範囲
- 敵タイプは100種類定義（レベルと一対一対応）
- `NormalActionPattern`は最低1つの行動を含む
- `EnhancedActionPattern`が空の場合は`NormalActionPattern`を継続
- `DropItemCategory`は"core"または"module"のいずれか
- `DropItemTypeID`は`DropItemCategory`に対応する有効なTypeIDであること

### Logical Data Model

**enemies.json拡張例**:

```json
{
  "enemies": [
    {
      "id": "slime",
      "name": "スライム",
      "baseHP": 50,
      "baseAttackPower": 5,
      "baseAttackInterval": 3000,
      "attackType": "physical",
      "asciiArt": "...",
      "defaultLevel": 1,
      "normalActionPattern": [
        {"actionType": "attack", "attackType": "physical"}
      ],
      "enhancedActionPattern": [
        {"actionType": "attack", "attackType": "physical"},
        {"actionType": "selfBuff", "effectType": "attackUp", "effectValue": 0.3, "duration": 10}
      ],
      "normalPassive": {
        "id": "slime_normal",
        "name": "ぷるぷるボディ",
        "description": "物理ダメージを10%軽減",
        "effects": {"damageCut": 0.1}
      },
      "enhancedPassive": {
        "id": "slime_enhanced",
        "name": "怒りのスライム",
        "description": "攻撃力20%上昇",
        "effects": {"damageMultiplier": 1.2}
      },
      "dropItemCategory": "core",
      "dropItemTypeID": "fire"
    }
  ]
}
```

**GameState拡張（撃破済み敵管理）**:

```go
type DefeatedEnemy struct {
    EnemyTypeID string
    MaxLevel    int // 撃破した最高レベル
}
```

## Error Handling

### Error Strategy

- **敵タイプ未設定**: 既存のランダム敵生成にフォールバック
- **行動パターン空**: 通常攻撃のみの1要素パターンをデフォルト適用
- **パッシブスキル未設定**: パッシブなしとして処理（EffectTableへの登録をスキップ）
- **DropItemCategory/DropItemTypeID未設定**: 既存の確率ドロップにフォールバック

### Error Categories and Responses

**User Errors**:
- 未撃破敵のLv.2以上選択 → UI上で選択不可にする

**System Errors**:
- JSONパース失敗 → 起動時エラーログ出力、該当敵タイプをスキップ

**Business Logic Errors**:
- 撃破済み敵情報の不整合 → 撃破記録をリセット

## Testing Strategy

### Unit Tests

- `domain/enemy_test.go`: EnemyAction, EnemyPassiveSkillの値オブジェクトテスト
- `domain/enemy_test.go`: EnemyModel.GetCurrentAction, AdvanceActionIndexのテスト
- `usecase/combat/battle_action_pattern_test.go`: 行動パターン実行のテスト
- `usecase/rewarding/reward_guaranteed_test.go`: 確定ドロップのテスト

### Integration Tests

- `integration_test/enemy_level_design_test.go`: レベル選択→バトル→報酬の一連フロー
- `integration_test/enemy_passive_test.go`: フェーズ遷移とパッシブ切り替え
- `integration_test/defeated_enemy_test.go`: 撃破記録の永続化

### E2E Tests

- バトル選択画面での敵種類変更操作
- バトル中の敵行動パターン順序確認
- 撃破後の報酬確認と次回選択可能レベルの確認

## Optional Sections

### Performance & Scalability

**懸念点**:

- 敵タイプ数の増加によるメモリ使用量
- 行動パターン配列のサイズ

**対策**:

- 敵タイプはアプリ起動時に一度だけロード（既存パターン維持）
- 行動パターンは最大20要素程度を想定（現時点では制限なし）

### Migration Strategy

**Phase 1: データモデル拡張**

1. EnemyType構造体に新フィールド追加
2. enemies.jsonの既存敵に最小限の行動パターンを追加
3. 新フィールドが空の場合のフォールバックロジック実装

**Phase 2: UI変更**

1. BattleSelectScreenをカルーセル方式に変更
2. DefeatedEnemyProviderインターフェース実装
3. 撃破済み敵情報のセーブ/ロード対応

**Phase 3: バトルロジック変更**

1. 行動パターン実行ロジック追加
2. 敵パッシブスキル登録ロジック追加
3. 確定ドロップロジック追加

**Rollback Triggers**:

- 行動パターンのバグによるバトル進行不能
- パッシブスキルによるバランス崩壊

**Validation Checkpoints**:

- 各Phase完了時に既存テストがすべてパス
- 新規テストの追加と実行
