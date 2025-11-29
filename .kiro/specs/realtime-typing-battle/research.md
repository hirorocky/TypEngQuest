# Research & Design Decisions

---
**Purpose**: リアルタイムタイピングバトルゲームの技術設計に必要な調査結果、アーキテクチャ検討、設計判断の根拠を記録する。

**Usage**:
- ディスカバリーフェーズでの調査活動と成果を記録
- design.mdに記載するには詳細すぎる設計判断のトレードオフを文書化
- 将来の監査や再利用のための参照情報と証拠を提供
---

## Summary
- **Feature**: `realtime-typing-battle`
- **Discovery Scope**: New Feature (greenfield)
- **Key Findings**:
  - Bubbletea/Elm Architectureは完全リアルタイムゲームに最適なイベント駆動型TUIフレームワーク
  - tea.Tickを用いた継続的なゲームループパターンで敵の自動攻撃を実現可能
  - JSON + 原子的書き込みパターンでセーブデータの整合性を保証
  - Lipglossの自動色プロファイル検出により環境非依存な視覚表現が実現可能

## Research Log

### Bubbletea Framework Architecture & Real-time Game Suitability

**Context**: ターミナル上でリアルタイムに動作するタイピングバトルゲームに適したTUIフレームワークを評価する必要があった。

**Sources Consulted**:
- https://github.com/charmbracelet/bubbletea
- https://pkg.go.dev/github.com/charmbracelet/bubbletea
- https://leg100.github.io/en/posts/building-bubbletea-programs/
- https://www.inngest.com/blog/interactive-clis-with-bubbletea

**Findings**:
- **Elm Architecture採用**: Model (状態) → Update (イベント処理) → View (描画) の一方向データフロー
- **tea.Msg型**: あらゆる型をメッセージとして扱える柔軟性 (キー入力、タイマー、I/O結果など)
- **tea.Cmd型**: 非同期I/O操作を表現、完了時にMsgを返す
- **Batch/Sequence**: 複数のCmdを並行実行または順次実行
- **重要な制約**: 生のgoroutineの使用を避け、tea.Cmdを通じた並行処理を推奨 (フレームワークの一意のアーキテクチャに適合)
- **中央メッセージチャネル**: バックグラウンドgoroutineが安全にメインイベントループへメッセージを送信可能

**Implications**:
- すべての状態更新をUpdate関数内で実行し、即座に返す設計が必須
- 敵の自動攻撃などのリアルタイム処理はtea.TickまたはEveryコマンドで実装
- UIの応答性を保ちながら並行処理を行うための明確なパターンが確立
- コンポーネント間通信はメッセージパッシングシステムを利用

### Real-time Game Loop Implementation with tea.Tick

**Context**: 敵が一定間隔でプレイヤーを継続攻撃するリアルタイムバトルシステムの実装方法を調査。

**Sources Consulted**:
- https://pkg.go.dev/github.com/charmbracelet/bubbletea (tea.Tick, tea.Every documentation)
- https://github.com/charmbracelet/bubbletea/blob/main/examples/timer/main.go
- https://charm.land/blog/commands-in-bubbletea/

**Findings**:
- **tea.Tick**: 指定期間で単一メッセージを生成、システムクロックから独立
- **ループパターン**: TickMsgを受信したら再度tea.Tickコマンドを返すことで継続的なループを実現
- **tea.Every**: システムクロックと同期したティック、複数のものを同期させる場合に便利
- **実装パターン例**:
  ```go
  func (m model) Init() tea.Cmd {
      return tickEvery()  // 初回ティック開始
  }

  func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
      switch msg := msg.(type) {
      case TickMsg:
          // 敵攻撃処理
          m = m.executeEnemyAttack()
          return m, tickEvery()  // 次回のティックを予約
      }
  }
  ```

**Implications**:
- 敵攻撃システムはバトル開始時にInit()で初回ティックを発行
- Update()内のTickMsg分岐で攻撃処理を実行し、次のティックコマンドを返す
- プレイヤーのタイピング中も敵攻撃は継続 (完全リアルタイム要件を満たす)
- 攻撃間隔は敵の種類ごとに異なるdurationを設定可能

### WPM & Accuracy Calculation Standards

**Context**: タイピングパフォーマンスの計測方法を標準的な手法に基づいて設計する必要があった。

**Sources Consulted**:
- https://monkeytype.com/
- https://www.keyhero.com/free-typing-test/
- https://typetest.io/

**Findings**:
- **WPM計算**: CPM (corrected characters per minute) ÷ 5 (1単語 = 平均5文字と定義)
- **Raw CPM**: ミスを含む実際の入力文字数 / 分
- **Corrected CPM**: 正しく入力された文字数のみカウント
- **Accuracy計算**: (正しい入力文字数 / 総入力文字数) × 100%
- **ペナルティ処理**: エラーを修正しない場合、最終WPMスコアにペナルティ加算
- **リアルタイムグラフ**: 瞬間的なraw WPMとテスト全体のグローバル平均WPMを両方表示

**Implications**:
- タイピングチャレンジ開始時にタイムスタンプを記録
- 各文字入力時に正誤を記録 (正しい入力数、総入力数、ミス数)
- 完了時の計算式:
  - WPM = (正しい文字数 / 完了時間(秒) * 60) / 5
  - 速度係数 = 基準時間 / 実際完了時間 (上限2.0)
  - 正確性係数 = 正しい文字数 / 総入力文字数
- 正確性が50%未満の場合、効果量を半減させるルール実装

### JSON File Persistence & Save Data Integrity

**Context**: セーブデータの永続化方法とファイル破損を防ぐベストプラクティスを調査。

**Sources Consulted**:
- https://medium.com/@matryer/golang-advent-calendar-day-eleven-persisting-go-objects-to-disk-7caf1ee3d11d
- https://github.com/crawshaw/jsonfile
- https://generalistprogrammer.com/tutorials/game-save-systems-complete-data-persistence-guide-2025

**Findings**:
- **Go標準ライブラリ**: `encoding/json`でMarshal/Unmarshalが基本
- **原子的書き込みパターン**: 一時ファイルに書き込み → 検証 → リネーム (クラッシュ時の破損防止)
- **自動バックアップ**: 直近3世代のセーブを保持
- **ロード時検証**: バージョン互換性チェック、データ整合性確認
- **破損時の回復**: グレースフルに処理、バックアップから復元を試行
- **ファイル配置**: ユーザーディレクトリを使用 (プラットフォーム横断の書き込み権限確保)
- **ファイル操作**: defer file.Close() で適切にクローズ

**Implications**:
- SaveData構造体を定義 (プレイヤー状態、インベントリ、統計、実績など)
- 書き込み処理:
  1. mutex.Lock() (並行書き込み防止)
  2. 一時ファイルへjson.Marshal → ioutil.WriteFile
  3. 検証後、os.Rename() で本番ファイルへ
  4. 旧ファイルをバックアップとして保持 (.bak1, .bak2, .bak3)
- 読み込み処理:
  1. ファイル存在確認
  2. json.Unmarshal
  3. バージョンチェック
  4. 破損時はバックアップから復元試行
- セーブタイミング: バトル終了時 (自動セーブ)、手動セーブ機能提供

### Lipgloss Styling & Terminal Color Handling

**Context**: 多様なターミナル環境で一貫した視覚表現を実現する方法を調査。

**Sources Consulted**:
- https://github.com/charmbracelet/lipgloss
- https://pkg.go.dev/github.com/charmbracelet/lipgloss

**Findings**:
- **自動色プロファイル検出**: TrueColor (24-bit) → ANSI256 (8-bit) → ANSI (4-bit) → ASCII (1-bit) に自動ダウンサンプリング
- **Adaptive Colors**: 背景色 (明/暗) を自動検出し、適切な色を選択
- **CompleteColor**: TrueColor/ANSI256/ANSIの正確な値を指定可能
- **ANSI Text Formatting**: Bold, Italic, Faint, Blink, Strikethrough, Underline, Reverse対応
- **テキスト幅測定**: ANSI sequenceを無視し、全角文字 (日本語、絵文字) を適切に計測
- **TTY検出**: 出力先がTTYでない場合、自動的にカラーコードを削除
- **警告**: SetColorProfileでプロファイルを強制可能だが、柔軟性を制限するため慎重に使用

**Implications**:
- 色定義は AdaptiveColor を使用し、明暗背景に対応
- HPバーなど重要な情報は色で区別 (HP: 緑/黄/赤、ダメージ: 赤、回復: 緑)
- ターミナルサイズや色対応の検出処理を実装
- 文字幅計算は lipgloss.Width() を使用 (len()やrune変換は不正確)
- 非TTY環境でも動作可能な設計 (テスト環境など)

### Bubbles Component Library

**Context**: TUI構築に必要な再利用可能なコンポーネントの調査。

**Sources Consulted**:
- https://github.com/charmbracelet/bubbles
- https://pkg.go.dev/github.com/charmbracelet/bubbles

**Findings**:
- **Progress Bar**: アニメーション付きプログレスメーター (クールダウン表示に利用可能)
- **Text Input**: unicode対応、ペースト対応、水平スクロール、カスタマイズ可能
- **Text Area**: 複数行入力、垂直スクロール対応
- **Table**: 表形式データの表示とナビゲーション
- **Spinner**: 操作中の視覚的インジケーター
- **統合方法**: 各コンポーネントはUpdate/Viewメソッドを持ち、親モデルに組み込み可能

**Implications**:
- Progress Barをモジュールのクールダウン表示に利用
- カスタムコンポーネント (HPバー、ステータス表示) を実装する際のパターンとして参照
- 表形式のインベントリ表示にTableコンポーネントを検討 (ただし要件に応じてカスタム実装も可)

## Architecture Pattern Evaluation

### Considered Patterns

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Model-View-Update (Elm Architecture) | Bubbletea標準パターン: 単一方向データフロー、イベント駆動 | 状態管理が明確、テスト容易、並行処理の安全性 | 複雑な状態遷移で肥大化の可能性 | **選択** - フレームワーク標準、リアルタイムゲームに最適 |
| Component-Based Architecture | 各画面を独立したコンポーネントに分割 | 再利用性、関心の分離 | メッセージ伝播の複雑化 | Elm Architectureと組み合わせて採用 |
| Scene/State Machine Pattern | 各画面を独立した状態として管理 | 画面遷移が明確 | 状態間のデータ共有が複雑化 | 画面遷移管理に部分採用 |

### Selected Architecture

**Elm Architecture (Model-View-Update) + Component-Based Design**

**Rationale**:
- Bubbletea標準パターンとの親和性が最高
- リアルタイムゲームループとのイベント駆動型の相性が良い
- 各画面をComponentとして実装し、親Modelが統括する構造
- メッセージパッシングによる疎結合なコンポーネント間通信

**Domain Boundaries**:
- **Presentation Layer**: TUIコンポーネント (画面、ウィジェット)
- **Game Logic Layer**: バトルシステム、エージェント管理、報酬計算
- **Domain Model Layer**: コア、モジュール、エージェント、敵のドメインモデル
- **Persistence Layer**: セーブデータ、外部データファイルのI/O

## Design Decisions

### Decision: Real-time Enemy Attack Implementation

**Context**: プレイヤーの入力状態に関係なく、敵が一定間隔で継続的に攻撃する仕様を実現する必要があった。

**Alternatives Considered**:
1. **tea.Tick継続ループパターン** - TickMsg受信時に次のtea.Tickコマンドを返す
2. **tea.Every使用** - システムクロックと同期したティック
3. **独立goroutine** - 生のgoroutineで攻撃タイマーを管理

**Selected Approach**: tea.Tick継続ループパターン

**Rationale**:
- Bubbletea推奨のパターン (生goroutine使用は非推奨)
- 敵ごとに異なる攻撃間隔を柔軟に設定可能
- バトル開始/終了のライフサイクル管理が容易
- tea.Everyはシステムクロック同期が不要なため、tea.Tickで十分

**Trade-offs**:
- **Benefits**: フレームワーク標準パターン、メインイベントループと統合、安全な並行処理
- **Compromises**: ループの継続管理を明示的に実装する必要 (ただし数行で済む)

**Follow-up**: 実装時に敵のフェーズ変化 (HP50%以下で攻撃パターン変更) の状態管理を確認

### Decision: Save Data Format & Integrity Strategy

**Context**: ゲーム進行状況を永続化し、ファイル破損を防ぐ必要があった。

**Alternatives Considered**:
1. **JSON + Atomic Write** - 一時ファイル → リネーム
2. **Binary Serialization (Gob)** - Go標準のバイナリ形式
3. **SQLite** - 組み込みデータベース

**Selected Approach**: JSON + Atomic Write

**Rationale**:
- 可読性が高く、デバッグが容易
- Go標準ライブラリ (encoding/json) で完結
- 外部データファイル (コア/モジュール/敵定義) との一貫性
- オフラインゲームでファイルサイズは問題にならない

**Trade-offs**:
- **Benefits**: 可読性、デバッグ性、プラットフォーム非依存
- **Compromises**: バイナリ形式よりファイルサイズが大きい (無視可能)、パフォーマンスは十分

**Follow-up**: バージョン互換性の管理方法を実装時に明確化 (SaveDataVersion フィールド)

### Decision: Component Hierarchy & Message Routing

**Context**: 複数の画面 (ホーム、バトル、エージェント管理、図鑑など) を管理し、メッセージをルーティングする必要があった。

**Alternatives Considered**:
1. **Single Root Model with Scene State** - 単一Modelが現在のシーンを保持し分岐
2. **Sub-Component with Delegation** - 各画面を独立コンポーネントとし、親がメッセージを委譲
3. **Router Pattern** - 明示的なルーターを実装

**Selected Approach**: Single Root Model with Scene State + Sub-Component Delegation

**Rationale**:
- Bubbletea標準パターン
- シーン間のデータ共有 (GameState, PlayerState) が容易
- メッセージルーティングがシンプル
- 各画面コンポーネントは独立してテスト可能

**Implementation Pattern**:
```go
type GameModel struct {
    currentScene Scene
    gameState    *GameState
    homeScreen   *HomeScreen
    battleScreen *BattleScreen
    // ...
}

func (m GameModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch m.currentScene {
    case SceneBattle:
        updatedBattle, cmd := m.battleScreen.Update(msg)
        m.battleScreen = updatedBattle.(*BattleScreen)
        return m, cmd
    // ...
    }
}
```

**Trade-offs**:
- **Benefits**: シンプル、データ共有容易、Bubbletea標準
- **Compromises**: Root Modelが全画面を認識 (ただし委譲により関心を分離)

**Follow-up**: 画面間遷移メッセージ (ChangeSceneMsg) の設計

### Decision: External Data File Format (Core/Module/Enemy Definitions)

**Context**: コア特性、モジュールタイプ、敵タイプを外部ファイルで定義し、拡張可能にする必要があった。

**Alternatives Considered**:
1. **JSON** - 可読性高、Go標準ライブラリ対応
2. **YAML** - より人間フレンドリー、外部ライブラリ必要
3. **TOML** - 設定ファイル向け、外部ライブラリ必要

**Selected Approach**: JSON

**Rationale**:
- セーブデータと一貫したフォーマット
- Go標準ライブラリのみで完結
- 構造化データの表現に十分
- 拡張時にスキーマ検証が容易

**File Structure Example**:
```json
{
  "core_types": [
    {
      "id": "attack_balance",
      "name": "攻撃バランス",
      "allowed_module_tags": ["physical_low", "magic_low"],
      "stat_weights": {"STR": 1.2, "WIL": 1.0, "SPD": 0.8, "LUK": 1.0},
      "passive_skill": "balanced_stance"
    }
  ],
  "modules": [
    {
      "id": "fireball_lv1",
      "name": "ファイアボール",
      "category": "magic_attack",
      "level": 1,
      "tags": ["magic_low"],
      "base_effect": 10,
      "stat_reference": "WIL"
    }
  ]
}
```

**Trade-offs**:
- **Benefits**: 一貫性、標準ライブラリ、可読性
- **Compromises**: YAMLほど人間フレンドリーではない (許容範囲)

**Follow-up**: データファイルのスキーマ定義とバリデーション処理

## Risks & Mitigations

### Risk 1: Real-time Performance Degradation with Multiple Active Agents

**Mitigation**:
- 最大3体のエージェント制限により計算量を制御
- モジュールのクールダウン処理で同時実行数を制限
- Bubbleteaの効率的な描画更新を活用 (差分更新)

### Risk 2: Save Data Corruption During Unexpected Termination

**Mitigation**:
- 原子的書き込みパターン (一時ファイル → リネーム)
- 自動バックアップ (直近3世代保持)
- ロード時の検証とバックアップからの復元処理

### Risk 3: Terminal Size Compatibility Issues

**Mitigation**:
- 最小要件 (120x40) のチェックと警告表示
- ターミナルサイズ変更時の再調整または警告
- 動的レイアウト調整 (可能な範囲で)

### Risk 4: Complex State Management in Battle Screen

**Mitigation**:
- BattleStateを明確に定義 (敵状態、プレイヤー状態、バフ/デバフ、タイピングチャレンジ)
- イベント駆動型の更新処理で状態遷移を明確化
- 単体テストで状態遷移をカバー

### Risk 5: External Data File Schema Changes Breaking Saves

**Mitigation**:
- バージョン管理フィールド追加
- 下位互換性を保つマイグレーション処理
- デフォルト値の設定

## References

- [Bubbletea GitHub Repository](https://github.com/charmbracelet/bubbletea) - 公式リポジトリ、サンプル実装
- [Bubbletea Go Packages Documentation](https://pkg.go.dev/github.com/charmbracelet/bubbletea) - API仕様、tea.Cmd/Msg詳細
- [Tips for building Bubble Tea programs](https://leg100.github.io/en/posts/building-bubbletea-programs/) - ベストプラクティス
- [Commands in Bubble Tea](https://charm.land/blog/commands-in-bubbletea/) - Cmdパターン詳細解説
- [Lipgloss GitHub Repository](https://github.com/charmbracelet/lipgloss) - スタイリングライブラリ、色管理
- [Bubbles GitHub Repository](https://github.com/charmbracelet/bubbles) - TUIコンポーネントライブラリ
- [Game Save Systems Guide 2025](https://generalistprogrammer.com/tutorials/game-save-systems-complete-data-persistence-guide-2025) - ゲームセーブシステムのベストプラクティス
- [Monkeytype](https://monkeytype.com/) - タイピングWPM/Accuracy計算の参考実装
