# BlitzTypingOperator リファクタリング計画

## 概要

このドキュメントは、BlitzTypingOperatorプロジェクトの包括的なコードレビューに基づくリファクタリング計画をまとめたものです。

**レビュー日**: 2025-12-08
**対象コード量**: 約80+ Goファイル、テストファイル含む
**アーキテクチャ**: Elm Architecture (Bubbletea)

---

## 現状評価

### 良い点

| カテゴリ | 詳細 |
|----------|------|
| アーキテクチャ | Elm Architectureパターン（Model-Update-View）が全体的に適切に適用されている |
| ドメイン駆動設計 | `internal/domain/` が独立しており、UIに依存しない純粋なドメイン層を維持 |
| テストカバレッジ | 各パッケージに `*_test.go` が存在し、基本的なテストが整備されている |
| データ駆動設計 | ゲームコンテンツ（敵、モジュール等）をJSONで定義し、拡張性が高い |
| ドキュメンテーション | 日本語コメントが充実、Requirement番号への参照も明記 |
| ディレクトリ構造 | レイヤードアーキテクチャに基づく明確な構造 |

### 総合評価: B+ (良好だが改善の余地あり)

---

## 課題一覧

### 1. ファイルサイズ・責務過多 (優先度: 高)

#### 問題

| ファイル | 行数 | 問題点 |
|----------|------|--------|
| `internal/app/root_model.go` | 729行 | シーン管理、画面初期化、セーブ/ロード、アダプター定義が混在 |
| `internal/tui/screens/battle.go` | 1324行 | UIレンダリングとゲームロジックが密結合 |
| `internal/app/game_state.go` | 659行 | 状態管理に加え、ヘルパー関数・変換ロジックが多数 |

#### 影響

- 新機能追加時の影響範囲が広い
- テストの複雑化
- コードの可読性低下

#### 解決策

```
internal/app/
  root_model.go          # RootModel構造体とInit/Update/Viewのみ
  scene_router.go        # シーン遷移ロジック
  screen_factory.go      # 画面インスタンス生成
  adapters.go            # inventoryProviderAdapter等
  helpers.go             # createStatsDataFromGameState等
  game_state/
    state.go           # GameState本体
    persistence.go     # ToSaveData, FromSaveData
    defaults.go        # getDefaultCoreTypeData等
```

---

### 2. 型名の不整合 (優先度: 中)

#### 問題

`screens` パッケージ内の型名がテスト用のように見える:

```go
// 現状: テストデータに見える名前
type EncyclopediaTestData struct { ... }
type StatsTestData struct { ... }
```

#### 解決策

```go
// 改善: 本番用の適切な名前
type EncyclopediaData struct { ... }
type StatsData struct { ... }
```

---

### 3. マジックナンバーの散在 (優先度: 中)

#### 問題

ハードコードされた値が各所に散らばっている:

| ファイル | 値 | 用途 |
|----------|------|------|
| `screens/battle.go:22` | `100 * time.Millisecond` | tickInterval |
| `screens/battle.go:161` | `5.0` | デフォルトクールダウン |
| `battle/battle.go:19` | `0.5` | AccuracyPenaltyThreshold |
| `battle/battle.go:254` | `500 * time.Millisecond` | 最小攻撃間隔 |
| 各所 | `10.0`, `8.0` | バフ/デバフ持続時間 |

#### 解決策

`internal/config/constants.go` を作成:

```go
package config

import "time"

// バトル設定
const (
    BattleTickInterval        = 100 * time.Millisecond
    DefaultModuleCooldown     = 5.0
    AccuracyPenaltyThreshold  = 0.5
    MinEnemyAttackInterval    = 500 * time.Millisecond
)

// 効果持続時間
const (
    BuffDuration   = 10.0
    DebuffDuration = 8.0
)

// インベントリ
const (
    MaxAgentEquipSlots  = 3
    ModulesPerAgent     = 4
)
```

---

### 4. コード重複 (優先度: 中)

#### 問題

同一または類似のコードが複数箇所に存在:

##### 4.1 デフォルトデータの重複定義

- `internal/app/game_state.go`: `getDefaultCoreTypeData()`
- `internal/app/root_model.go`: `createDefaultEncyclopediaData()`

##### 4.2 HP/プログレスバーレンダリングの重複

```go
// battle.go内で敵とプレイヤーで類似コードが2回出現
hpBar := s.enemyHPBar.Render(s.styles, 50)
displayHP := s.enemyHPBar.GetCurrentHP()
hpValue := fmt.Sprintf(" %d/%d", displayHP, s.enemy.MaxHP)
// ...

hpBar := s.playerHPBar.Render(s.styles, 50)
displayHP := s.playerHPBar.GetCurrentHP()
hpValue := fmt.Sprintf(" %d/%d", displayHP, s.player.MaxHP)
// ...
```

##### 4.3 モジュールカテゴリアイコン

`getModuleIcon()` が battle.go に定義されているが、他画面でも使用される可能性

#### 解決策

```go
// internal/tui/components/hp_display.go
type HPDisplayConfig struct {
    CurrentHP int
    MaxHP     int
    HPBar     *styles.AnimatedHPBar
    BarWidth  int
}

func RenderHP(gs *styles.GameStyles, cfg HPDisplayConfig) string { ... }

// internal/domain/module.go に追加
func (c ModuleCategory) Icon() string {
    switch c {
    case PhysicalAttack: return "sword"
    case MagicAttack:    return "magic"
    case Heal:           return "heart"
    case Buff:           return "up"
    case Debuff:         return "down"
    default:             return "dot"
    }
}
```

---

### 5. エラーハンドリングの不足 (優先度: 高)

#### 問題

`_` でエラーを無視している箇所が多数:

```go
// game_state.go:473
_ = invManager.AddCore(core)

// game_state.go:519
_ = agentMgr.AddAgent(agentModel)

// game_state.go:529
_ = agentMgr.EquipAgent(slot, agentID, player)
```

#### 影響

- デバッグ困難
- 静かな失敗によるデータ不整合の可能性

#### 解決策

1. `log/slog` を導入してログ出力:

```go
import "log/slog"

if err := invManager.AddCore(core); err != nil {
    slog.Warn("コア追加に失敗", "coreID", core.ID, "error", err)
}
```

2. 致命的エラーは早期リターンまたはパニック:

```go
if err := saveDataIO.SaveGame(saveData); err != nil {
    slog.Error("セーブ失敗", "error", err)
    // ユーザーへの通知も検討
}
```

---

### 6. インターフェース設計の改善余地 (優先度: 中)

#### 問題

画面（Screen）が共通インターフェースを実装しているが、明示的なインターフェース定義がない:

```go
// 現状: 各画面が暗黙的にtea.Modelを実装
type HomeScreen struct { ... }
func (s *HomeScreen) Init() tea.Cmd { ... }
func (s *HomeScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) { ... }
func (s *HomeScreen) View() string { ... }
```

#### 解決策

明示的なScreenインターフェースを定義:

```go
// internal/tui/screens/types.go
type Screen interface {
    tea.Model

    // 画面固有のメソッド
    SetSize(width, height int)
    GetTitle() string
}

// 共通の画面ベース構造体
type BaseScreen struct {
    width  int
    height int
    styles *styles.GameStyles
}

func (b *BaseScreen) SetSize(w, h int) {
    b.width = w
    b.height = h
}
```

---

### 7. 循環的複雑度の高いメソッド (優先度: 中)

#### 問題

大きなswitch文を持つメソッドが複数存在:

| ファイル | メソッド | switch分岐数 |
|----------|----------|--------------|
| `root_model.go` | `Update()` | 8 |
| `root_model.go` | `handleScreenSceneChange()` | 9 |
| `root_model.go` | `renderCurrentScene()` | 8 |
| `battle.go` | `handleTick()` | 複数の条件分岐 |

#### 解決策

##### 7.1 メッセージハンドラーのマップ化

```go
type messageHandler func(m *RootModel, msg tea.Msg) (tea.Model, tea.Cmd)

var messageHandlers = map[reflect.Type]messageHandler{
    reflect.TypeOf(tea.WindowSizeMsg{}): handleWindowSize,
    reflect.TypeOf(tea.KeyMsg{}):        handleKeyMsg,
    reflect.TypeOf(ChangeSceneMsg{}):    handleSceneChange,
    // ...
}

func (m *RootModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    if handler, ok := messageHandlers[reflect.TypeOf(msg)]; ok {
        return handler(m, msg)
    }
    return m, nil
}
```

##### 7.2 シーンレンダリングの委譲

```go
func (m *RootModel) renderCurrentScene() string {
    screens := map[Scene]Screen{
        SceneHome:            m.homeScreen,
        SceneBattleSelect:    m.battleSelectScreen,
        SceneBattle:          m.battleScreen,
        // ...
    }

    if screen, ok := screens[m.currentScene]; ok && screen != nil {
        return screen.View()
    }
    return m.renderPlaceholder("不明な画面")
}
```

---

### 8. データ変換層の欠如 (優先度: 低)

#### 問題

ドメインモデルとUI/永続化層の変換ロジックが散在:

- `GameStateFromSaveData()` - 659行のファイル内
- `createStatsDataFromGameState()` - root_model.go内
- `convertBattleStatsToRewardStats()` - root_model.go内

#### 解決策

アダプター/変換層を作成:

```
internal/adapter/
  persistence_adapter.go   # SaveData <-> GameState
  screen_adapter.go        # GameState -> 各種ScreenData
  reward_adapter.go        # BattleStats -> RewardStats
```

---

### 9. テスト改善 (優先度: 低)

#### 問題

- 一部のテストが実装依存（ホワイトボックステスト）
- モック/スタブの不足
- 統合テストとユニットテストの境界が曖昧

#### 解決策

1. インターフェースベースの設計でモック可能に
2. テストヘルパーの共通化
3. テストファイルの命名規則統一

---

### 10. デッドコード (優先度: 高)

#### 問題

実運用で使用されておらず、テストのみで参照されているコードが複数存在。
コードベースの複雑性を増加させ、保守コストを上げている。

#### 確実に削除可能なコード

##### 10.1 `internal/app/app.go` - ファイル全体

| 要素 | 理由 |
|------|------|
| `Model` 構造体 | `RootModel` に完全に置き換え済み |
| `New()` 関数 | テストのみで使用 |
| `Init()`, `Update()`, `View()` | テストのみで使用 |

**対応**: `app.go` と `app_test.go` の該当テストを削除

##### 10.2 `internal/domain/agent.go` - 未使用メソッド

| メソッド | 理由 |
|----------|------|
| `GetModule(index int)` | テストのみ。実運用では `.Modules[index]` で直接アクセス |
| `GetModuleCount()` | テストのみ。実運用では `len(.Modules)` を使用 |
| `GetCoreName()` | テストのみ。実運用では未使用 |

**注意**: `GetCoreTypeName()` は複数画面で使用中のため削除不可

##### 10.3 `internal/domain/module.go` - 未使用ヘルパー

| メソッド | 理由 |
|----------|------|
| `IsAttack()` | テストのみ。実運用では `Category` を直接switch |
| `IsSupport()` | テストのみ |
| `TargetsEnemy()` | テストのみ |
| `TargetsPlayer()` | テストのみ |
| `GetCategoryTag()` | テストのみ |
| `DefaultStatRef()` | テストのみ。`StatRef` フィールドで直接値保持 |

##### 10.4 `internal/domain/effect_table.go` - 未使用メソッド

| メソッド | 理由 |
|----------|------|
| `IsPermanent()` | テストのみ |
| `IsExpired()` | テストのみ。内部では `filterExpired()` を使用 |
| `FindByID(id string)` | テストのみ |
| `Clear()` | テストのみ |

**注意**: `GetRowsBySource()` は `battle.go` で使用中のため削除不可

##### 10.5 `internal/domain/core.go` - 検討対象

| メソッド | 理由 |
|----------|------|
| `Stats.Total()` | テストのみ。ビジネスロジック検証用だが実運用では不要 |

#### 解決策

1. **即時削除**: `app.go` ファイル全体と対応テスト
2. **段階的削除**: domain パッケージの未使用メソッド群
3. **テスト修正**: 削除するメソッドを使用しているテストの書き換え

```bash
# 削除対象ファイル
rm internal/app/app.go

# app_test.go から該当テストを削除
# - TestNewApp
# - TestAppImplementsTeaModel
# - TestAppInit
# - TestAppUpdate
# - TestAppView
# - TestAppViewContainsGameTitle
```

---

## リファクタリング優先順位

| 優先度 | 課題 | 推定工数 | 理由 |
|--------|------|----------|------|
| 1 | デッドコード削除 | 小 | 即効性あり、コードベース簡素化 |
| 2 | エラーハンドリング改善 | 小 | バグ発見・デバッグに直結 |
| 3 | マジックナンバーの定数化 | 小 | 変更容易性向上、バグ防止 |
| 4 | ファイル分割（root_model.go） | 中 | 保守性向上、責務明確化 |
| 5 | ファイル分割（battle.go） | 中 | 同上 |
| 6 | コード重複の解消 | 中 | DRY原則、一貫性確保 |
| 7 | 型名の整理 | 小 | 可読性向上 |
| 8 | インターフェース設計 | 中 | 拡張性向上 |
| 9 | データ変換層作成 | 大 | アーキテクチャ改善 |

---

## 実装ロードマップ

### Phase 1: 基盤整備

1. デッドコード削除（`app.go` 等）
2. `internal/config/constants.go` 作成
3. エラーハンドリング改善（slog導入）
4. 型名の修正

### Phase 2: 構造改善

1. `root_model.go` の分割
2. `game_state.go` の分割
3. `battle.go` の分割

### Phase 3: 設計改善

1. Screenインターフェースの導入
2. データ変換層の作成
3. コンポーネントの再利用化

### Phase 4: 品質向上 (継続的)

1. テストカバレッジ向上
2. パフォーマンス最適化
3. ドキュメント整備

---

## 注意事項

1. **後方互換性**: セーブデータの互換性を維持すること
2. **段階的リファクタリング**: 一度に大きく変更せず、小さな変更を積み重ねる
3. **テスト駆動**: リファクタリング前にテストを追加し、動作を保証
4. **コミット粒度**: 各変更は独立したコミットとして管理

---

## 参考資料

- [Bubbletea Documentation](https://github.com/charmbracelet/bubbletea)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- [Clean Architecture in Go](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
