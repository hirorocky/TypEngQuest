# プロジェクト構造

```
src/
├── core/                    # ゲームロジック
│   ├── game.ts             # メインゲーム状態
│   ├── player.ts           # プレイヤーステータス/進行
│   ├── combat.ts           # 戦闘システム
│   ├── enemy.ts            # 敵クラス定義
│   ├── loot.ts             # ドロップシステム
│   └── __tests__/          # コアロジックテスト
│       ├── player.test.ts  # プレイヤークラステスト
│       ├── equipment.test.ts # 装備システムテスト
│       ├── combat.test.ts  # 戦闘システムテスト
│       ├── enemy.test.ts   # 敵システムテスト
│       └── loot.test.ts    # ドロップシステムテスト
├── world/                  # ワールド・マップシステム
│   ├── map.ts             # マップ生成・管理
│   ├── location.ts        # 場所クラス定義
│   ├── navigation.ts      # 移動システム
│   ├── elements.ts        # マップ要素（モンスター、宝箱、トラップ等）
│   ├── interaction.ts     # 要素との相互作用システム
│   └── __tests__/         # ワールドシステムテスト
│       ├── map.test.ts    # マップ生成テスト
│       ├── location.test.ts # 場所システムテスト
│       ├── navigation.test.ts # 移動システムテスト
│       ├── elements.test.ts # マップ要素テスト
│       └── interaction.test.ts # 相互作用テスト
├── commands/               # CLIコマンドハンドラー
│   ├── processor.ts        # コマンド処理
│   ├── filesystem.ts      # ファイルシステム風コマンド (cd, ls, pwd等)
│   └── __tests__/          # コマンドテスト
│       ├── processor.test.ts # コマンド処理テスト
│       ├── filesystem.test.ts # ファイルシステムコマンドテスト
│       └── grammar.test.ts  # 文法検証テスト
├── systems/                # ゲームシステム
│   ├── collection.ts       # コレクション管理
│   ├── rarity.ts          # レアリティシステム
│   ├── drops.ts           # ドロップ履歴管理
│   ├── encounter.ts       # エンカウントシステム
│   ├── randomevents.ts    # ランダムイベントシステム
│   ├── typingescape.ts    # タイピング回避システム
│   └── savepoints.ts      # セーブポイントシステム
├── ui/                     # 表示/インターフェース
│   ├── display.ts          # 画面レンダリング
│   ├── battle.ts          # 戦闘画面
│   ├── map.ts            # マップ表示
│   └── input.ts           # 入力処理
└── data/                   # データ管理
    ├── database.ts         # 保存/読み込みシステム
    ├── words.json          # 単語データベース
    ├── enemies.json        # 敵データベース
    ├── drops.json          # ドロップテーブル
    ├── locations.json      # 場所テンプレート
    ├── elements.json       # マップ要素設定
    ├── randomevents.json   # ランダムイベントデータ
    ├── typingchallenges.json # タイピング回避チャレンジデータ
    └── filetypes.json      # ファイルタイプ別設定
```