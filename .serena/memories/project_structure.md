# プロジェクト構造

## ディレクトリ構成
```
TypEngQuest/
├── src/                    # ソースコード
│   ├── index.ts           # エントリーポイント
│   ├── core/              # コアシステム
│   │   ├── Game.ts        # ゲーム管理
│   │   ├── CommandParser.ts
│   │   ├── Phase.ts       # フェーズ管理
│   │   ├── types.ts       # 共通型定義
│   │   └── completion/    # タブ補完機能
│   ├── phases/            # ゲームフェーズ
│   │   ├── TitlePhase.ts
│   │   ├── ExplorationPhase.ts
│   │   ├── TypingPhase.ts
│   │   ├── InventoryPhase.ts
│   │   ├── ItemEquipmentPhase.ts
│   │   └── ItemConsumptionPhase.ts
│   ├── commands/          # コマンド実装
│   │   ├── BaseCommand.ts
│   │   ├── title/         # タイトル画面コマンド
│   │   ├── game/          # ゲーム共通コマンド
│   │   ├── exploration/   # 探索コマンド
│   │   └── interaction/   # インタラクションコマンド
│   ├── battle/            # バトルシステム
│   │   ├── Battle.ts
│   │   ├── Enemy.ts
│   │   ├── BattleCalculator.ts
│   │   └── Skill.ts
│   ├── player/            # プレイヤー関連
│   │   ├── Player.ts
│   │   ├── Inventory.ts
│   │   ├── BodyStats.ts
│   │   ├── EquipmentStats.ts
│   │   ├── TemporaryStatus.ts
│   │   └── WorldStatus.ts
│   ├── equipment/         # 装備システム
│   │   ├── EquipmentGrammarChecker.ts
│   │   └── EquipmentEffectCalculator.ts
│   ├── items/             # アイテム
│   │   ├── Item.ts
│   │   ├── ConsumableItem.ts
│   │   └── EquipmentItem.ts
│   ├── world/             # ワールド管理
│   │   ├── World.ts
│   │   ├── FileSystem.ts
│   │   ├── FileNode.ts
│   │   └── domains.ts
│   ├── typing/            # タイピングシステム
│   │   ├── TypingChallenge.ts
│   │   ├── WordDatabase.ts
│   │   └── types.ts
│   ├── ui/                # UI関連
│   │   ├── Display.ts
│   │   ├── ScrollableList.ts
│   │   └── colors.ts
│   └── tests/             # テスト関連
│       ├── integration/   # 統合テスト
│       └── setup/         # テストセットアップ
├── docs/                  # ドキュメント
├── data/                  # ゲームデータ
├── scripts/               # ユーティリティスクリプト
├── dist/                  # ビルド出力
└── node_modules/          # 依存パッケージ
```

## 主要なクラス・モジュール
- **Game**: ゲーム全体の管理
- **Phase**: フェーズベースの状態管理
- **CommandParser**: コマンド解析
- **Player**: プレイヤー情報と装備管理
- **Battle**: バトルシステム
- **FileSystem/World**: 仮想ファイルシステム
- **TypingChallenge**: タイピングチャレンジ管理
- **Display**: ターミナルUI表示

## テストファイル配置
- 各モジュールと同じディレクトリに`.test.ts`ファイルを配置
- 統合テストは`src/tests/integration/`に配置
- テストヘルパーは`src/tests/integration/helpers/`に配置