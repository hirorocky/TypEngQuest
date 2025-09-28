# プロジェクト構造

```
TypEngQuest/
├── src/
│   ├── index.ts                    # エントリーポイント [未実装]
│   ├── core/                       # コアシステム [完全実装]
│   │   ├── Game.ts                 # ゲームメインクラス
│   │   ├── Game.test.ts            # Gameクラスのテスト
│   │   ├── Phase.ts                # フェーズ管理システム
│   │   ├── Phase.test.ts           # Phaseのテスト
│   │   ├── CommandParser.ts        # コマンド解析器
│   │   ├── CommandParser.test.ts   # CommandParserのテスト
│   │   └── types.ts                # 共通型定義
│   │
│   ├── phases/                     # 各フェーズの実装 [部分実装 3/6]
│   │   ├── TitlePhase.ts           # タイトルフェーズ
│   │   ├── TitlePhase.test.ts      # TitlePhaseのテスト
│   │   ├── ExplorationPhase.ts     # マップ探索フェーズ
│   │   ├── ExplorationPhase.test.ts # ExplorationPhaseのテスト
│   │   ├── InventoryPhase.ts       # インベントリフェーズ
│   │   └── InventoryPhase.test.ts  # InventoryPhaseのテスト
│   │   # 以下未実装:
│   │   # ├── DialogPhase.ts          # ダイアログフェーズ
│   │   # ├── DialogPhase.test.ts     # DialogPhaseのテスト
│   │   # ├── BattlePhase.ts          # バトルフェーズ
│   │   # ├── BattlePhase.test.ts     # BattlePhaseのテスト
│   │   # ├── TypingPhase.ts          # タイピングチャレンジフェーズ
│   │   # └── TypingPhase.test.ts     # TypingPhaseのテスト
│   │
│   ├── world/                      # ワールド関連 [完全実装]
│   │   ├── FileSystem.ts           # ファイルシステム実装
│   │   ├── FileSystem.test.ts      # FileSystemのテスト
│   │   ├── FileNode.ts             # ファイル・ディレクトリノード
│   │   ├── FileNode.test.ts        # FileNodeのテスト
│   │   ├── World.ts                # ワールドクラス
│   │   ├── World.test.ts           # Worldのテスト
│   │   ├── WorldGenerator.ts       # ワールド生成器
│   │   ├── WorldGenerator.test.ts  # WorldGeneratorのテスト
│   │   ├── domains.ts              # ドメイン定義
│   │   └── domains.test.ts         # domainsのテスト
│   │
│   ├── player/                     # プレイヤーシステム [完全実装 4/4]
│   │   ├── Player.ts               # プレイヤークラス
│   │   ├── Player.test.ts          # Playerのテスト
│   │   ├── BodyStats.ts            # 本体ステータス管理（HP/MP、基本ステータス、一時効果）
│   │   ├── BodyStats.test.ts       # BodyStatsのテスト
│   │   ├── EquipmentStats.ts       # 装備ステータス管理（装備効果の合計値）
│   │   ├── EquipmentStats.test.ts  # EquipmentStatsのテスト
│   │   ├── Stats.ts                # 総合ステータス管理（互換性維持）
│   │   ├── Stats.test.ts           # Statsのテスト
│   │   ├── Inventory.ts            # インベントリ管理
│   │   ├── Inventory.test.ts       # Inventoryのテスト
│   │   ├── TemporaryStatus.ts      # 一時ステータス（バトル限定効果）
│   │   ├── TemporaryStatus.test.ts # TemporaryStatusのテスト
│   │   ├── WorldStatus.ts          # ワールドステータス（ワールド内持続効果）
│   │   └── WorldStatusFactory.ts   # ワールドステータス生成
│   │
│   ├── items/                      # アイテムシステム [部分実装 3/4]
│   │   ├── types.ts               # アイテム共通ユーティリティ・列挙
│   │   ├── Item.test.ts            # Itemのテスト
│   │   ├── Potion.ts       # 消費アイテムクラス
│   │   ├── Potion.test.ts  # Potionのテスト
│   │   ├── AccessoryItem.ts        # アクセサリアイテムクラス
│   │   └── index.ts                # 統合エクスポート
│   │   # 以下未実装:
│   │   # ├── AccessoryItem.test.ts  # AccessoryItemのテスト
│   │   # ├── KeyItem.ts             # だいじなものクラス
│   │   # └── KeyItem.test.ts        # KeyItemのテスト
│   │
│   ├── commands/                   # コマンド実装 [部分実装 19/21]
│   │   ├── BaseCommand.ts          # コマンド基底クラス
│   │   ├── BaseCommand.test.ts     # BaseCommandのテスト
│   │   ├── title/                  # タイトルフェーズ用コマンド [完全実装]
│   │   │   ├── StartCommand.ts     # startコマンド
│   │   │   ├── StartCommand.test.ts # StartCommandのテスト
│   │   │   ├── LoadCommand.ts      # loadコマンド
│   │   │   ├── LoadCommand.test.ts # LoadCommandのテスト
│   │   │   ├── ExitCommand.ts      # exitコマンド
│   │   │   └── ExitCommand.test.ts # ExitCommandのテスト
│   │   ├── exploration/            # 探索フェーズ用コマンド [完全実装]
│   │   │   ├── CdCommand.ts        # cdコマンド（ナビゲーション）
│   │   │   ├── CdCommand.test.ts   # CdCommandのテスト
│   │   │   ├── LsCommand.ts        # lsコマンド（ナビゲーション）
│   │   │   ├── LsCommand.test.ts   # LsCommandのテスト
│   │   │   ├── PwdCommand.ts       # pwdコマンド（ナビゲーション）
│   │   │   ├── PwdCommand.test.ts  # PwdCommandのテスト
│   │   │   ├── TreeCommand.ts      # treeコマンド（ナビゲーション）
│   │   │   ├── TreeCommand.test.ts # TreeCommandのテスト
│   │   │   ├── FileCommand.ts      # fileコマンド（ファイルタイプ検出）
│   │   │   └── FileCommand.test.ts # FileCommandのテスト
│   │   ├── interaction/            # ファイル相互作用コマンド [完全実装]
│   │   │   ├── BattleCommand.ts    # battleコマンド（モンスターとの戦闘）
│   │   │   ├── BattleCommand.test.ts # BattleCommandのテスト
│   │   │   ├── OpenCommand.ts      # openコマンド（宝箱開封）
│   │   │   ├── OpenCommand.test.ts # OpenCommandのテスト
│   │   │   ├── SaveCommand.ts      # saveコマンド（ゲーム保存）
│   │   │   ├── SaveCommand.test.ts # SaveCommandのテスト
│   │   │   ├── RestCommand.ts      # restコマンド（HP/MP回復）
│   │   │   ├── RestCommand.test.ts # RestCommandのテスト
│   │   │   ├── ExecuteCommand.ts   # executeコマンド（イベント実行）
│   │   │   └── ExecuteCommand.test.ts # ExecuteCommandのテスト
│   │   └── game/                   # ゲーム固有コマンド [部分実装 2/3]
│   │       ├── StatusCommand.ts    # statusコマンド
│   │       ├── StatusCommand.test.ts # StatusCommandのテスト
│   │       ├── InventoryCommand.ts # inventoryコマンド
│   │       └── InventoryCommand.test.ts # InventoryCommandのテスト
│   │   # 以下未実装:
│   │   #     ├── RetireCommand.ts    # retireコマンド
│   │   #     └── RetireCommand.test.ts # RetireCommandのテスト
│   │
│   ├── ui/                         # UIコンポーネント [部分実装 4/6]
│   │   ├── Display.ts              # 画面表示管理
│   │   ├── Display.test.ts         # Displayのテスト
│   │   ├── ScrollableList.ts       # スクロール可能リスト
│   │   ├── colors.ts               # 色定義
│   │   └── colors.test.ts          # colorsのテスト
│   │   # 以下未実装:
│   │   # ├── Prompt.ts               # プロンプト表示
│   │   # ├── Prompt.test.ts          # Promptのテスト
│   │   # ├── ProgressBar.ts          # プログレスバー
│   │   # └── ProgressBar.test.ts     # ProgressBarのテスト
│   │
│   └── tests/                      # 統合テスト・テストセットアップ [完全実装]
│       ├── integration/            # 統合テスト
│       │   ├── helpers/            # 統合テスト用ヘルパー
│       │   │   ├── TestGameHelper.ts # ゲーム初期化・実行・状態検証
│       │   │   ├── SimplifiedMockHelper.ts # 簡潔なモック管理（自動クリーンアップ）
│       │   │   └── SimplifiedMockHelper.test.ts # SimplifiedMockHelperのテスト
│       │   ├── phase-transitions.integration.test.ts # フェーズ遷移の統合テスト
│       │   ├── exploration-phase.integration.test.ts # 探索フェーズの統合テスト
│       │   └── title-phase.integration.test.ts # タイトルフェーズの統合テスト
│       └── setup/                  # テストセットアップ
│           └── jest.setup.ts       # Jest設定・カスタムマッチャー・ANSI制御文字抑制
│
│
├── .claude/                        # Claude Code設定
├── .env                            # 環境変数
├── .github/                        # GitHub Actions・Issue template
├── .mcp.json                       # MCP設定
├── coverage/                       # テストカバレッジレポート
├── docs/                           # ドキュメント
│   ├── agile-development-plan.md   # アジャイル開発計画
│   ├── development-commands.md     # 開発コマンド
│   ├── development-guidelines.md   # 開発ガイドライン
│   ├── game-systems.md             # ゲームシステム仕様
│   ├── implementation-status.md    # 実装状況
│   ├── project-overview.md         # プロジェクト概要
│   ├── project-structure.md        # プロジェクト構造（本ファイル）
│   └── testing-guide.md            # テストガイド
│
├── mise.toml                       # Mise設定
├── scripts/                        # 開発・通知スクリプト
│   ├── notificaiton-discord.sh     # Discord通知
│   ├── pr-review-comments.sh       # PRレビューコメント
│   └── stop-discord.sh             # Discord通知停止
│
├── package.json                    # npm設定
├── tsconfig.json                   # TypeScript設定
├── jest.config.js                  # Jest設定
├── eslint.config.js                # ESLint設定
├── .prettierrc                     # Prettier設定
├── .gitignore                      # Git除外設定
├── README.md                       # プロジェクトREADME
└── CLAUDE.md                       # Claude用指示ファイル

├── data/                           # ゲームデータ [部分実装]
│   └── skills/                     # 技データ
│       └── skills.json             # 技定義（20個の技データ）
│
# 未実装のデータファイル（設計のみ）:
# data/
# ├── items/                      # アイテムデータ
# │   ├── potions.json           # ポーション定義
# │   └── equipment.json          # 装備アイテム定義
# ├── enemies/                    # 敵データ
# │   └── enemies.json            # 敵定義
# └── words/                      # タイピング用単語
#     ├── easy.json               # 簡単な単語
#     ├── medium.json             # 中程度の単語
#     └── hard.json               # 難しい単語
```

## 実装状況サマリー

### ✅ 実装済み (55%)
- **Core**: Game、Phase、CommandParser、types（完全実装）
- **UI**: Display、colors、ScrollableList（部分実装）
- **World**: FileNode、FileSystem、World、WorldGenerator、domains（完全実装）
- **Phases**: TitlePhase、ExplorationPhase、InventoryPhase（部分実装）
- **Player**: Player、BodyStats、EquipmentStats、Stats、Inventory、TemporaryStatus、WorldStatus（完全実装）
- **Items**: Item、Potion、AccessoryItem（部分実装）
- **Battle**: Battle、Enemy、BattleCalculator、Skill（完全実装）
- **Commands**: BaseCommand、title/（3つ）、exploration/（5つ）、interaction/（5つ）、game/（2つ）（部分実装）
- **Tests**: 統合テスト、テストヘルパー（完全実装）
- **Data**: skills.json（部分実装）

### ❌ 未実装 (45%)
- **Typing系**: TypingChallenge、TypingEvaluator、WordDatabase（0%）
- **Items系**: KeyItem（0%）
- **Events系**: RandomEvent、GoodEvents、BadEvents（0%）
- **Save系**: SaveManager、SaveData、SaveValidator（0%）
- **Commands**: file/（4つ）、game/（1つ）（0%）
- **Utils**: Random、FileUtils、StringUtils、Logger（0%）
- **Phases**: DialogPhase、BattlePhase、TypingPhase（0%）
- **Data**: その他のJSONファイル（0%）

## 主要クラス・モジュールの責務

### Core（コアシステム）
- **Game.ts**: ゲーム全体の制御、フェーズ管理、メインループ
- **Phase.ts**: フェーズの基底クラスと遷移管理
- **CommandParser.ts**: 入力されたコマンドの解析と適切なハンドラへの振り分け

### World（ワールドシステム）
- **World.ts**: 現在のワールド状態管理
- **WorldGenerator.ts**: ランダムなワールド生成ロジック
- **FileSystem.ts**: ゲーム内ファイルシステムのツリー構造管理

### Player（プレイヤーシステム）
- **Player.ts**: プレイヤーの基本情報管理（名前、レベル、JSON対応）
- **Stats.ts**: HP/MP管理、ステータス計算、一時的能力値変化、レベルベース自動計算
- **Equipment.ts**: 装備効果計算

### Battle（戦闘システム）
- **Battle.ts**: ターン制バトルの進行管理
- **BattleCalculator.ts**: ダメージや成功率の計算ロジック

### Typing（タイピングシステム）
- **TypingChallenge.ts**: リアルタイムタイピング入力処理
- **TypingEvaluator.ts**: 速度・精度の評価と効果判定

### Save（セーブシステム）
- **SaveManager.ts**: セーブデータの読み書き
- **SaveValidator.ts**: セーブデータの整合性チェック

## 技術スタック
- **言語**: TypeScript
- **実行環境**: Node.js
- **テストフレームワーク**: Jest（ts-jestでTypeScript対応、カスタムマッチャー、console出力抑制）
- **リンター**: ESLint（Flat Config形式、TypeScript対応）
- **フォーマッター**: Prettier
- **パッケージマネージャー**: npm

## テスト構成
- **ユニットテスト**: 各ソースファイルと同じディレクトリに `.test.ts` ファイルを配置
- **統合テスト**: `src/tests/integration/` に配置（複数モジュール間の連携テスト）
- **テストセットアップ**: `src/tests/setup/` に配置（Jest設定、ヘルパー）
- **E2Eテスト**: `tests/e2e/` に配置（ゲーム全体のシナリオテスト）
- **テストファイル命名規則**: `[ファイル名].test.ts`
- **テストカバレッジ目標**: 95%以上（現在95%以上を達成）

### テストヘルパー・ユーティリティ
- **TestGameHelper**: ゲーム初期化、コンソール出力キャプチャ、状態検証
- **SimplifiedMockHelper**: 自動クリーンアップ機能付きモック管理
  - タイマーモック（useFakeTimers、advanceTimersByTimeAsync）
  - プロセス終了モック（mockProcessExit）
  - シグナルハンドラー無効化（disableSignalHandlers）
  - ReadLineインターフェースモック（createReadlineMock）
  - withMocksヘルパー関数による自動クリーンアップ
- **jest.setup.ts**: カスタムマッチャー（toBeInPhase、toBeSuccessfulCommand）、ANSI制御文字出力抑制

### テストパターン
- **ユニットテスト**: 個別クラス・関数の単体テスト
- **統合テスト**: フェーズ単位での機能テスト（ブラックボックステスト）
- **withMocksパターン**: 簡潔で保守しやすい非同期処理テスト

## データフロー
1. ユーザー入力 → CommandParser → 各Phase
2. Phase → Command実行 → World/Player更新
3. 画面更新 → Display → ターミナル出力

## 状態管理
- Gameクラスがグローバルな状態を保持
- 各Phaseが独自の状態を管理
- World、Playerは永続的な状態を保持

## 依存関係

### レイヤー構造
1. **Utils層** (最下層) - 他に依存しない
   - Random, FileUtils, StringUtils, Logger, colors

2. **Domain層** - Utils層のみに依存
   - Item, Potion, AccessoryItem, KeyItem
   - FileNode, domains
   - Skill, Enemy
   - SaveData

3. **Core層** - Domain層とUtils層に依存
   - types, CommandParser
   - Stats, Equipment, Inventory → Item
   - Player → Stats, Equipment, Inventory
   - FileSystem → FileNode
   - World → FileSystem
   - WorldGenerator → World, FileSystem, domains, Random
   - BattleCalculator → Stats, Skill
   - TypingEvaluator
   - WordDatabase
   - SaveValidator → SaveData

4. **Feature層** - Core層以下に依存
   - Phase (抽象クラス)
   - BaseCommand (抽象クラス)
   - Battle → Player, Enemy, BattleCalculator
   - TypingChallenge → TypingEvaluator, WordDatabase
   - RandomEvent, GoodEvents, BadEvents → Player, Item
   - SaveManager → SaveData, SaveValidator, FileUtils

5. **Command層** - Feature層以下に依存
   - 各種Command → BaseCommand, CommandContext
   - ナビゲーションコマンド → BaseCommand, FileSystem (via CommandContext)
   - TitlePhaseコマンド → BaseCommand, PhaseTypes

6. **UI層** - Feature層以下に依存
   - Display, Prompt, ProgressBar → colors

7. **Phase層** - すべての下位層に依存
   - TitlePhase → CommandParser, TitlePhaseコマンド
   - ExplorationPhase → World, CommandParser, ナビゲーションコマンド, CommandContext
   - DialogPhase → Display
   - InventoryPhase → Player, Inventory
   - BattlePhase → Battle, Player, Enemy
   - TypingPhase → TypingChallenge

8. **Application層** (最上層)
   - Game → すべてのPhase, World, Player, SaveManager

### 主要な依存関係

```
Game
├─→ Phase[] (各種フェーズ)
├─→ World
│   └─→ FileSystem
│       └─→ FileNode
├─→ Player
│   ├─→ Stats
│   ├─→ EquipmentStats
│   ├─→ AccessorySlotManager
│   │   └─→ AccessoryItem
│   └─→ Inventory
│       ├─→ Potion
│       ├─→ AccessoryItem
│       └─→ KeyItem
└─→ SaveManager
    ├─→ SaveData
    └─→ SaveValidator

ExplorationPhase
├─→ CommandParser
├─→ World
├─→ Player
└─→ Command[] (各種コマンド)
    └─→ BaseCommand

BattlePhase
├─→ Battle
│   ├─→ Player
│   ├─→ Enemy
│   └─→ BattleCalculator
└─→ TypingPhase (遷移)

TypingPhase
└─→ TypingChallenge
    ├─→ TypingEvaluator
    └─→ WordDatabase
```

### 循環依存の確認
- ✅ 循環依存なし - 各層は下位層のみに依存
- ✅ Phase間の直接依存なし - Game経由で遷移
- ✅ Command間の依存なし - 独立して実装

### インターフェース分離の推奨
以下のインターフェースを定義して依存を緩和：

1. **IPhase** - Phase共通インターフェース
2. **ICommand** - Command共通インターフェース
3. **IItem** - Item共通インターフェース
4. **IFileNode** - ファイルノードインターフェース
5. **ISaveData** - セーブデータインターフェース

### 注意点
1. **Game→Phase→Game**の循環を避けるため、PhaseからGameへはイベント通知で連携
2. **Command実行結果**はPhaseに返し、Phaseが状態更新を管理
3. **UI更新**は各層から直接行わず、Display経由で統一

## 各ファイルの詳細な責務

### コアシステム (src/core/)

#### Game.ts
- ゲームのメインループ実行
- 現在のフェーズ管理と遷移
- グローバル状態（プレイヤー、ワールド）の保持
- セーブ/ロード機能の呼び出し
- ゲーム終了処理

#### Phase.ts
- フェーズインターフェースの定義
- フェーズ間の遷移ロジック
- 各フェーズ共通の機能（help、clear等）
- 入力待機と処理の抽象化

#### CommandParser.ts
- 入力文字列の解析（コマンド名と引数の分離）
- コマンドエイリアスの解決
- フェーズに応じた利用可能コマンドの管理
- コマンド履歴の管理

#### types.ts
- ゲーム全体で使用する共通型定義
- PhaseType型とPhaseTypes定数（continue含む）
- PhaseResult、CommandResult、CommandContext、GameStateインターフェース
- エラー型の定義

### フェーズ実装 (src/phases/)

#### TitlePhase.ts
- タイトル画面の表示
- start/load/exitコマンドの処理
- セーブデータ一覧表示
- ゲーム開始時の初期化

#### ExplorationPhase.ts
- マップ探索時のコマンド処理
- ファイルシステムナビゲーション
- ファイルへの作用判定と実行
- 他フェーズへの遷移判定

#### DialogPhase.ts
- yes/no選択の処理
- ダイアログ表示とコールバック管理
- 選択後の処理実行

#### InventoryPhase.ts
- アイテム一覧表示
- 消費アイテムの使用処理
- 装備の変更と効果反映
- 装備効果の計算と反映

#### BattlePhase.ts
- 戦闘の進行管理
- ターン制の実装
- 技・アイテム選択メニュー
- 勝敗判定とリザルト表示

#### TypingPhase.ts
- リアルタイム文字入力処理
- タイピング進捗の表示
- 時間計測と精度計算
- 評価結果の返却

### ワールドシステム (src/world/)

#### World.ts
- 現在のワールド状態保持
- プレイヤー位置の管理
- 探索済みファイルの記録
- 鍵の所持状態管理

#### WorldGenerator.ts
- ランダムなディレクトリ構造生成
- ファイル配置アルゴリズム
- ボス・鍵の確実な配置
- ドメインに応じた名前生成

#### FileSystem.ts
- ディレクトリツリー構造の管理
- パス解決とナビゲーション
- ファイル検索機能
- ls、tree等の表示用データ生成

#### FileNode.ts
- ファイル/ディレクトリのデータ構造
- ファイルタイプ（モンスター、宝箱等）の判定
- 隠しファイル属性の管理
- 作用済みフラグの管理

#### domains.ts
- ドメイン定義（tech-startup等）
- ドメイン別のディレクトリ名リスト
- ドメイン別のファイル名リスト
- ドメイン選択ロジック

### プレイヤーシステム (src/player/)

#### Player.ts
- プレイヤー基本情報の統合管理（名前、レベル）
- BodyStats、EquipmentStats、Inventoryインスタンスの管理
- 総合ステータス計算（BodyStats + EquipmentStats）
- JSON シリアライゼーション対応
- 装備システムとの統合

#### BodyStats.ts
- プレイヤー本体のステータス管理
- HP/MP自動計算（HP=100+レベル×20、MP=50+レベル×10）
- 現在HP/MP管理（ダメージ・回復処理）
- 基本ステータス（strength・willpower・agility・fortune）
- 一時的能力値変化システム（バフ/デバフ）
- ワールドステータス管理（ワールド内持続効果）
- バトル終了時のHP/MP自動管理

#### EquipmentStats.ts
- 装備アイテムから得られるステータス効果の合計
- 装備変更時の自動再計算
- 装備による追加ステータス管理

#### Stats.ts（互換性維持）
- BodyStats + EquipmentStats の総合ステータス表示
- 既存コードとの互換性を維持する統合インターフェース

#### Equipment.ts
- 装備スロット管理（最大5個）
- （廃止済み）英文法チェック機能
- 装備効果の集計
- 使用可能技の取得

#### Inventory.ts
- アイテムの保管と管理
- アイテムカテゴリ分け
- 所持数上限チェック
- アイテム使用可否判定

### 戦闘システム (src/battle/)

#### Battle.ts
- 戦闘フローの制御
- ターン管理
- 行動順序の決定
- 戦闘終了判定

#### Enemy.ts
- 敵データの管理
- 敵AIの実装
- ドロップアイテムの決定
- 敵ステータスの計算

#### Skill.ts
- 技データの管理
- MP消費チェック
- 技効果の定義
- タイピング難易度の設定
 - 10C拡張: SkillCondition/SkillPotentialEffect/ComboBoost 型を追加

#### BattleCalculator.ts
- ダメージ計算式の実装
- 命中/回避判定
- クリティカル判定
- 状態異常の付与判定
 - 10C拡張: 効果条件評価・潜在効果マージのヘルパー

#### ComboBoostManager.ts
- コンボブーストの登録/適用/消費を管理
- 対応種別: damage, heal, skill_success, status_success, mp_cost_reduction, typing_difficulty, potential

### タイピングシステム (src/typing/)

#### TypingChallenge.ts
- タイピングフェーズの制御
- キー入力のリアルタイム処理
- 制限時間の管理
- 進捗表示の更新

#### TypingEvaluator.ts
- 入力速度の計測
- 入力精度の計算
- 総合評価の決定
- 効果倍率の計算

#### WordDatabase.ts
- 難易度別単語リストの管理
- ランダム単語選択
- カスタム文章の管理
- 単語の重複チェック

### アイテムシステム (src/items/)

#### types.ts
- アイテム列挙・共通データ型の定義
- インベントリアイテム用インターフェース提供
- 表示名生成やID/名前バリデーションのユーティリティ

#### Potion.ts
- 消費アイテムの効果実装
- HP/MP回復処理
- バフ/デバフ付与
- 状態異常の回復/付与

#### AccessoryItem.ts
- アクセサリ定義ID・グレード・サブ効果の一元管理
- AccessoryCatalogとAccessoryNameGeneratorによるインスタンス生成／名称決定
- JSONシリアライズ／デシリアライズ時にサブ効果（最大3件）を保持
- アイテム種別`accessory`のバリデーションと定義整合性チェック

#### KeyItem.ts
- だいじなものの管理
- 鍵の使用判定
- ボスドロップの記録
- 特殊効果の実装

### イベントシステム (src/events/)

#### RandomEvent.ts
- イベント発生判定
- イベントタイプの選択
- イベント実行の制御
- タイピングチャレンジ連携

#### GoodEvents.ts
- アイテム発見イベント
- ステータスアップイベント
- 情報入手イベント
- 効果値の計算

#### BadEvents.ts
- ダメージイベント
- デバフイベント
- 迷子イベント
- ウイルス感染イベント

### セーブシステム (src/save/)

#### SaveManager.ts
- セーブファイルの読み書き
- セーブスロット管理
- オートセーブ機能
- セーブデータ一覧取得

#### SaveData.ts
- セーブデータ構造の定義
- JSONシリアライズ/デシリアライズ
- バージョン管理
- データ圧縮（オプション）

#### SaveValidator.ts
- セーブデータの整合性チェック
- 破損データの検出
- バージョン互換性チェック
- 修復可能なデータの自動修正

### コマンド実装 (src/commands/)

#### BaseCommand.ts
- 全フェーズ対応の汎用コマンド基底クラス
- CommandContextによる統一的な実行環境
- フェーズ遷移をサポートするsuccessWithPhaseメソッド
- オプション解析機能（parseOptions）
- 共通バリデーション、エラーハンドリング、ヘルプテキスト管理

#### title/ (タイトルフェーズコマンド)
- **StartCommand.ts**: 新規ゲーム開始、ExplorationPhaseへの遷移
- **LoadCommand.ts**: セーブデータロード機能（現在は未実装表示）
- **ExitCommand.ts**: ゲーム終了処理

#### exploration/ (探索フェーズコマンド）
- **CdCommand.ts**: ディレクトリ移動、パス解決、移動可否判定
- **LsCommand.ts**: ファイル一覧表示、オプション処理（-a, -l）
- **PwdCommand.ts**: 現在位置表示、パスフォーマット
- **TreeCommand.ts**: ツリー表示、深さ制限、ASCII art生成
- **FileCommand.ts**: ファイルタイプ判定、利用可能なアクション表示

#### interaction/ (ファイル相互作用コマンド)
- **BattleCommand.ts**: モンスターファイルとの戦闘開始（プログラミング言語ファイル）
- **OpenCommand.ts**: 宝箱ファイルの開封処理（設定ファイル）
- **SaveCommand.ts**: セーブポイントでのゲーム保存（ドキュメントファイル）
- **RestCommand.ts**: セーブポイントでのHP/MP回復（ドキュメントファイル）
- **ExecuteCommand.ts**: イベントファイルの実行（実行可能ファイル）

#### file/ (ファイル操作コマンド)
- **CatCommand.ts**: ファイル内容表示、ファイル作用の実行
- **HeadCommand.ts**: ファイル先頭確認、プレビュー表示
- **FileCommand.ts**: ファイルタイプ判定、情報表示
- **VimCommand.ts**: エディタ起動演出、特定ファイルへの作用
- **ChmodCommand.ts**: 実行権限付与、イベント準備処理

#### game/ (ゲーム固有コマンド)
- **StatusCommand.ts**: プレイヤーステータス表示、HP/MPバー表示、全ステータス値表示
- **InventoryCommand.ts**: インベントリフェーズへの遷移
- **RetireCommand.ts**: ワールドリタイア確認、新ワールド生成

### UI (src/ui/)

#### Display.ts
- 画面クリア機能
- テキスト装飾（色、太字等）
- アニメーション効果
- レイアウト管理

#### Prompt.ts
- プロンプト表示
- 現在位置の表示
- フェーズ別プロンプト
- 入力待機表示

#### ProgressBar.ts
- プログレスバー描画
- パーセンテージ表示
- アニメーション更新
- カスタマイズ可能な外観

#### colors.ts
- ANSI カラーコード定義
- テーマカラー管理
- 色付きテキスト生成
- 端末互換性チェック

### ユーティリティ (src/utils/)

#### Random.ts
- シード付き乱数生成
- 範囲指定乱数
- 配列シャッフル
- 重み付き選択

#### FileUtils.ts
- ファイルパス操作
- 拡張子判定
- ファイル名生成
- パス正規化

#### StringUtils.ts
- 文字列フォーマット
- パディング処理
- 文字列分割
- エスケープ処理

#### Logger.ts
- デバッグログ出力
- ログレベル管理
- ファイル出力（オプション）
- タイムスタンプ付与
