# プロジェクト構造

```
TypEngQuest/
├── src/
│   ├── index.ts                    # エントリーポイント
│   ├── core/                       # コアシステム
│   │   ├── Game.ts                 # ゲームメインクラス
│   │   ├── Game.test.ts            # Gameクラスのテスト
│   │   ├── Phase.ts                # フェーズ管理システム
│   │   ├── Phase.test.ts           # Phaseのテスト
│   │   ├── CommandParser.ts        # コマンド解析器
│   │   ├── CommandParser.test.ts   # CommandParserのテスト
│   │   └── types.ts                # 共通型定義
│   │
│   ├── phases/                     # 各フェーズの実装
│   │   ├── TitlePhase.ts           # タイトルフェーズ
│   │   ├── TitlePhase.test.ts      # TitlePhaseのテスト
│   │   ├── ExplorationPhase.ts     # マップ探索フェーズ
│   │   ├── ExplorationPhase.test.ts # ExplorationPhaseのテスト
│   │   ├── DialogPhase.ts          # ダイアログフェーズ
│   │   ├── DialogPhase.test.ts     # DialogPhaseのテスト
│   │   ├── InventoryPhase.ts       # インベントリフェーズ
│   │   ├── InventoryPhase.test.ts  # InventoryPhaseのテスト
│   │   ├── BattlePhase.ts          # バトルフェーズ
│   │   ├── BattlePhase.test.ts     # BattlePhaseのテスト
│   │   ├── TypingPhase.ts          # タイピングチャレンジフェーズ
│   │   └── TypingPhase.test.ts     # TypingPhaseのテスト
│   │
│   ├── world/                      # ワールド関連
│   │   ├── World.ts                # ワールドクラス
│   │   ├── World.test.ts           # Worldのテスト
│   │   ├── WorldGenerator.ts       # ワールド生成器
│   │   ├── WorldGenerator.test.ts  # WorldGeneratorのテスト
│   │   ├── FileSystem.ts           # ファイルシステム実装
│   │   ├── FileSystem.test.ts      # FileSystemのテスト
│   │   ├── FileNode.ts             # ファイル・ディレクトリノード
│   │   ├── FileNode.test.ts        # FileNodeのテスト
│   │   └── domains.ts              # ドメイン定義
│   │
│   ├── player/                     # プレイヤー関連
│   │   ├── Player.ts               # プレイヤークラス
│   │   ├── Player.test.ts          # Playerのテスト
│   │   ├── Stats.ts                # ステータス管理
│   │   ├── Stats.test.ts           # Statsのテスト
│   │   ├── Equipment.ts            # 装備管理
│   │   ├── Equipment.test.ts       # Equipmentのテスト
│   │   ├── Inventory.ts            # インベントリ管理
│   │   └── Inventory.test.ts       # Inventoryのテスト
│   │
│   ├── battle/                     # 戦闘システム
│   │   ├── Battle.ts               # 戦闘管理クラス
│   │   ├── Battle.test.ts          # Battleのテスト
│   │   ├── Enemy.ts                # 敵クラス
│   │   ├── Enemy.test.ts           # Enemyのテスト
│   │   ├── Skill.ts                # 技システム
│   │   ├── Skill.test.ts           # Skillのテスト
│   │   ├── BattleCalculator.ts     # ダメージ計算
│   │   └── BattleCalculator.test.ts # BattleCalculatorのテスト
│   │
│   ├── typing/                     # タイピングシステム
│   │   ├── TypingChallenge.ts     # タイピングチャレンジ実装
│   │   ├── TypingChallenge.test.ts # TypingChallengeのテスト
│   │   ├── TypingEvaluator.ts     # タイピング評価器
│   │   ├── TypingEvaluator.test.ts # TypingEvaluatorのテスト
│   │   ├── WordDatabase.ts         # 単語・文章データベース
│   │   └── WordDatabase.test.ts    # WordDatabaseのテスト
│   │
│   ├── items/                      # アイテムシステム
│   │   ├── Item.ts                 # アイテム基底クラス
│   │   ├── Item.test.ts            # Itemのテスト
│   │   ├── ConsumableItem.ts       # 消費アイテム
│   │   ├── ConsumableItem.test.ts  # ConsumableItemのテスト
│   │   ├── EquipmentItem.ts        # 装備アイテム
│   │   ├── EquipmentItem.test.ts   # EquipmentItemのテスト
│   │   ├── KeyItem.ts              # だいじなもの
│   │   └── KeyItem.test.ts         # KeyItemのテスト
│   │
│   ├── events/                     # イベントシステム
│   │   ├── RandomEvent.ts          # ランダムイベント
│   │   ├── RandomEvent.test.ts     # RandomEventのテスト
│   │   ├── GoodEvents.ts           # 良いイベント定義
│   │   ├── GoodEvents.test.ts      # GoodEventsのテスト
│   │   ├── BadEvents.ts            # 悪いイベント定義
│   │   └── BadEvents.test.ts       # BadEventsのテスト
│   │
│   ├── save/                       # セーブシステム
│   │   ├── SaveManager.ts          # セーブ管理
│   │   ├── SaveManager.test.ts     # SaveManagerのテスト
│   │   ├── SaveData.ts             # セーブデータ構造
│   │   ├── SaveData.test.ts        # SaveDataのテスト
│   │   ├── SaveValidator.ts        # セーブデータ検証
│   │   └── SaveValidator.test.ts   # SaveValidatorのテスト
│   │
│   ├── commands/                   # コマンド実装
│   │   ├── BaseCommand.ts          # コマンド基底クラス
│   │   ├── BaseCommand.test.ts     # BaseCommandのテスト
│   │   ├── title/                  # タイトルフェーズ用コマンド
│   │   │   ├── StartCommand.ts     # startコマンド
│   │   │   ├── StartCommand.test.ts # StartCommandのテスト
│   │   │   ├── LoadCommand.ts      # loadコマンド
│   │   │   ├── LoadCommand.test.ts # LoadCommandのテスト
│   │   │   ├── ExitCommand.ts      # exitコマンド
│   │   │   └── ExitCommand.test.ts # ExitCommandのテスト
│   │   ├── exploration/            # 探索フェーズ用コマンド
│   │   │   ├── CdCommand.ts        # cdコマンド（ナビゲーション）
│   │   │   ├── CdCommand.test.ts   # CdCommandのテスト
│   │   │   ├── LsCommand.ts        # lsコマンド（ナビゲーション）
│   │   │   ├── LsCommand.test.ts   # LsCommandのテスト
│   │   │   ├── PwdCommand.ts       # pwdコマンド（ナビゲーション）
│   │   │   ├── PwdCommand.test.ts  # PwdCommandのテスト
│   │   │   ├── TreeCommand.ts      # treeコマンド（ナビゲーション）
│   │   │   └── TreeCommand.test.ts # TreeCommandのテスト
│   │   ├── file/                   # ファイル操作コマンド（未実装）
│   │   │   ├── CatCommand.ts       # catコマンド
│   │   │   ├── CatCommand.test.ts  # CatCommandのテスト
│   │   │   ├── HeadCommand.ts      # headコマンド
│   │   │   ├── HeadCommand.test.ts # HeadCommandのテスト
│   │   │   ├── FileCommand.ts      # fileコマンド
│   │   │   ├── FileCommand.test.ts # FileCommandのテスト
│   │   │   ├── VimCommand.ts       # vimコマンド
│   │   │   ├── VimCommand.test.ts  # VimCommandのテスト
│   │   │   ├── ChmodCommand.ts     # chmodコマンド
│   │   │   └── ChmodCommand.test.ts # ChmodCommandのテスト
│   │   └── game/                   # ゲーム固有コマンド（未実装）
│   │       ├── StatusCommand.ts    # statusコマンド
│   │       ├── StatusCommand.test.ts # StatusCommandのテスト
│   │       ├── InventoryCommand.ts # inventoryコマンド
│   │       ├── InventoryCommand.test.ts # InventoryCommandのテスト
│   │       ├── RetireCommand.ts    # retireコマンド
│   │       └── RetireCommand.test.ts # RetireCommandのテスト
│   │
│   ├── ui/                         # UIコンポーネント
│   │   ├── Display.ts              # 画面表示管理
│   │   ├── Display.test.ts         # Displayのテスト
│   │   ├── Prompt.ts               # プロンプト表示
│   │   ├── Prompt.test.ts          # Promptのテスト
│   │   ├── ProgressBar.ts          # プログレスバー
│   │   ├── ProgressBar.test.ts     # ProgressBarのテスト
│   │   └── colors.ts               # 色定義
│   │
│   └── utils/                      # ユーティリティ
│       ├── Random.ts               # 乱数生成器
│       ├── Random.test.ts          # Randomのテスト
│       ├── FileUtils.ts            # ファイル操作ユーティリティ
│       ├── FileUtils.test.ts       # FileUtilsのテスト
│       ├── StringUtils.ts          # 文字列操作ユーティリティ
│       ├── StringUtils.test.ts     # StringUtilsのテスト
│       ├── Logger.ts               # ログ出力
│       └── Logger.test.ts          # Loggerのテスト
│
├── data/                           # ゲームデータ
│   ├── items/                      # アイテムデータ
│   │   ├── consumables.json        # 消費アイテム定義
│   │   └── equipment.json          # 装備アイテム定義
│   ├── enemies/                    # 敵データ
│   │   └── enemies.json            # 敵定義
│   ├── skills/                     # 技データ
│   │   └── skills.json             # 技定義
│   └── words/                      # タイピング用単語
│       ├── easy.json               # 簡単な単語
│       ├── medium.json             # 中程度の単語
│       └── hard.json               # 難しい単語
│
├── tests/                          # 統合テスト・E2Eテスト
│   ├── integration/                # 統合テスト
│   │   ├── helpers/                # 統合テスト用ヘルパー
│   │   │   ├── TestGameHelper.ts   # ゲーム初期化・実行・状態検証
│   │   │   ├── SimplifiedMockHelper.ts # 簡潔なモック管理（自動クリーンアップ）
│   │   │   └── SimplifiedMockHelper.test.ts # SimplifiedMockHelperのテスト
│   │   ├── phase-transitions.integration.test.ts # フェーズ遷移の統合テスト
│   │   ├── exploration-phase.integration.test.ts # 探索フェーズの統合テスト
│   │   └── title-phase.integration.test.ts # タイトルフェーズの統合テスト
│   ├── setup/                      # テストセットアップ
│   │   └── jest.setup.ts           # Jest設定・カスタムマッチャー
│   └── e2e/                        # E2Eテスト
│
├── docs/                           # ドキュメント
│   ├── game-systems.md             # ゲームシステム仕様
│   ├── development-guidelines.md   # 開発ガイドライン
│   ├── project-overview.md         # プロジェクト概要
│   ├── project-structure.md        # プロジェクト構造（本ファイル）
│   ├── development-commands.md     # 開発コマンド
│   ├── implementation-status.md    # 実装状況
│   └── testing-guide.md            # テストガイド
│
├── scripts/                        # ビルド・開発スクリプト
│   ├── build.js                    # ビルドスクリプト
│   └── dev.js                      # 開発サーバー
│
├── package.json                    # npm設定
├── tsconfig.json                   # TypeScript設定
├── jest.config.js                  # Jest設定
├── .eslintrc.js                    # ESLint設定
├── .prettierrc                     # Prettier設定
├── .gitignore                      # Git除外設定
├── README.md                       # プロジェクトREADME
└── CLAUDE.md                       # Claude用指示ファイル
```

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
- **Player.ts**: プレイヤーの状態管理
- **Stats.ts**: ステータス計算と管理
- **Equipment.ts**: 装備の文法チェックと効果計算

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
- **テストフレームワーク**: Jest
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **パッケージマネージャー**: npm

## テスト構成
- **ユニットテスト**: 各ソースファイルと同じディレクトリに `.test.ts` ファイルを配置
- **統合テスト**: `tests/integration/` に配置（複数モジュール間の連携テスト）
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
- **jest.setup.ts**: カスタムマッチャー（toBeInPhase、toBeSuccessfulCommand）

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
   - Item, ConsumableItem, EquipmentItem, KeyItem
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
│   ├─→ Equipment
│   │   └─→ EquipmentItem
│   └─→ Inventory
│       ├─→ ConsumableItem
│       ├─→ EquipmentItem
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
- 装備の変更と文法チェック
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
- プレイヤー状態の統合管理
- HP/MPの管理
- レベル計算
- 状態異常の管理

#### Stats.ts
- 基本ステータスの管理
- ステータス計算式の実装
- バフ/デバフの適用
- 一時的効果の管理

#### Equipment.ts
- 装備スロット管理（最大5個）
- 英文法チェック機能
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

#### BattleCalculator.ts
- ダメージ計算式の実装
- 命中/回避判定
- クリティカル判定
- 状態異常の付与判定

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

#### Item.ts
- アイテム基底クラス
- 共通プロパティの定義
- アイテム使用インターフェース
- アイテム説明文の管理

#### ConsumableItem.ts
- 消費アイテムの効果実装
- HP/MP回復処理
- バフ/デバフ付与
- 状態異常の回復/付与

#### EquipmentItem.ts
- 装備アイテムのステータス
- グレードシステムの実装
- 技の保持と管理
- 装備可能判定

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

#### file/ (ファイル操作コマンド)
- **CatCommand.ts**: ファイル内容表示、ファイル作用の実行
- **HeadCommand.ts**: ファイル先頭確認、プレビュー表示
- **FileCommand.ts**: ファイルタイプ判定、情報表示
- **VimCommand.ts**: エディタ起動演出、特定ファイルへの作用
- **ChmodCommand.ts**: 実行権限付与、イベント準備処理

#### game/ (ゲーム固有コマンド)
- **StatusCommand.ts**: プレイヤーステータス表示、装備効果表示
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