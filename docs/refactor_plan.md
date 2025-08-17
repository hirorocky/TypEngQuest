# バトルシステムリファクタリング計画

## 現状の問題点

### 1. 責務の重複と混在
- **Battle.ts**: ビジネスロジック、ダメージ計算、MP処理、タイピング効果の適用など多くの責務を持っている
- **BattlePhase.ts**: バトルフロー制御、ターン管理、UIとビジネスロジックが混在
- **BattleTypingPhase.ts**: タイピング処理とバトル効果の適用を両方行っている（※これは維持）
- **BattleCalculator.ts**: 純粋な計算ロジックのみ（良好）

### 2. ロジックの重複
- ダメージ計算処理が複数箇所に存在
- HP/MP確認処理が複数箇所に散在
- バトル終了判定が複数の場所で実行されている
- スキル効果の適用ロジックがBattle.tsとBattleTypingPhase.tsに重複

### 3. 時系列フローの複雑さ
```
Game.ts → BattlePhase → SkillSelectionPhase → BattleTypingPhase → BattlePhase
                 ↑__________________________________________________|
```
- フェーズ間でBattleインスタンスを受け渡している
- 各フェーズが直接Battleのメソッドを呼び出している
- タイピング中のリアルタイム効果反映が現在はBattle.playerUseSkillで行われている
- 敵が先攻の場合の処理フローが不明確（BattlePhase.startBattleで判定後、setTimeoutでの実行がコメントアウト）

## リファクタリング方針

### 1. 責務の明確化

#### Battle.ts - 純粋なバトルモデル
- **責務**: バトル状態の管理のみ
- **保持するもの**:
  - プレイヤー/敵の参照
  - ターン数、現在のターンアクター
  - バトル結果
  - アクティブ状態
  - 先攻決定ロジック（敏捷性による判定）
- **削除するもの**:
  - スキル使用の詳細ロジック → BattleActionExecutorへ移動

#### BattleCalculator.ts - 計算エンジン（拡張）
- **責務**: すべての数値計算
- **追加するもの**:
  - 行動ポイント計算
  - MP回復量計算（タイピング評価による倍率込み）

#### BattleActionExecutor.ts（新規）- アクション実行エンジン
- **責務**: スキル/アイテム使用の実行と効果適用の中核ロジック
- **機能**:
  - スキル効果の計算（ダメージ、回復、ステータス変化）
  - MP消費/回復処理
  - 命中/回避判定
  - クリティカル判定
  - タイピング効果倍率の適用
  - プレイヤー/敵へのダメージ適用

#### BattlePhase.ts - バトル全体のフロー制御とUI
- **責務**: バトルの全体的な流れとUIの管理
- **変更点**:
  - ターン管理（先攻/後攻の制御を含む）
  - フェーズ遷移の制御
  - バトル終了判定の統括
  - 敵のターン実行（BattleActionExecutorを使用）
  - **バトル開始時の先攻判定と初回ターン実行**

#### BattleTypingPhase.ts - タイピングUIとリアルタイム効果適用
- **責務**: タイピングUIの管理とスキル効果のリアルタイム適用
- **維持するもの**:
  - タイピングチャレンジの管理
  - **スキル完了ごとの効果即座適用**（BattleActionExecutorを使用）
  - リアルタイムでのHP/MP表示更新
  - バトル終了の検知（ただし実際の終了処理はBattlePhaseに委譲）

### 2. データフローの整理

#### 新しいフロー

**バトル開始時（敏捷性による先攻判定）**
```
1. BattlePhase.startBattle:
   - Battle.start()で先攻判定
   - 敵先攻の場合 → 即座に敵ターン実行
   - プレイヤー先攻の場合 → コマンド入力待機
```

**プレイヤーターン**
```
1. BattlePhase: コマンド受付（skill/item/run）
2. SkillSelectionPhase: スキル選択UI
3. BattleTypingPhase:
   - タイピングUI表示
   - 各スキル完了時にBattleActionExecutorで効果を即座適用
   - すべてのスキル完了後、結果サマリーを返す
4. BattlePhase:
   - バトル終了判定
   - 終了していなければ敵ターンへ
```

**敵ターン**
```
1. BattlePhase.executeEnemyTurn:
   - BattleActionExecutorで敵の行動実行
   - バトル終了判定
   - 終了していなければプレイヤーターンへ
```

#### データ構造の改善
```typescript
// バトルコンテキスト（すべてのフェーズで共有）
interface BattleContext {
  battle: Battle;
  executor: BattleActionExecutor;
}

// スキル実行結果（統一形式）
interface SkillExecutionResult {
  success: boolean;
  damage?: number;
  healing?: number;
  mpRecovered?: number;
  critical?: boolean;
  message: string;
  targetDefeated?: boolean;
}

// タイピング結果（各スキル用）
interface TypingResult {
  isSuccess: boolean;
  accuracy: number;
  accuracyRating: 'Perfect' | 'Great' | 'Good' | 'Poor';
  speedRating: 'S' | 'A' | 'B' | 'C' | 'F';
  totalRating: number;
}
```

## 実装手順

### Phase 1: BattleActionExecutorの作成
1. `BattleActionExecutor.ts`を新規作成
2. Battle.tsから以下のメソッドのロジックを移動：
   - `playerUseSkill` → `executePlayerSkill`
   - `enemyAction` → `executeEnemyAction`
   - ダメージ計算、命中判定、MP処理など
3. 単体テストを作成

### Phase 2: BattleCalculatorの拡張
1. 行動ポイント計算メソッドを追加
2. MP回復量計算（タイピング評価込み）を追加
3. 既存の計算メソッドの整理

### Phase 3: Battleクラスのリファクタリング
1. スキル実行ロジックをBattleActionExecutorに委譲
2. 状態管理に特化したメソッドのみ残す：
   - `start()`, `end()`, `nextTurn()`
   - `getCurrentTurnActor()`, `checkBattleEnd()`
3. テストを更新

### Phase 4: BattleTypingPhaseの調整
1. BattleActionExecutorを使用するように変更
2. `applySkillEffect`メソッドを改善：
   - BattleActionExecutorを呼び出す
   - リアルタイムでHP/MPを更新
   - バトル終了を検知（ただし処理はBattlePhaseに委譲）

### Phase 5: BattlePhaseの整理
1. 敵ターン実行をBattleActionExecutorを使用するように変更
2. バトル終了処理の一元化
3. UIとフロー制御に専念
4. **バトル開始時の先攻判定処理を整理**：
   - Battle.getCurrentTurnActor()の結果に基づいて初回ターンを実行
   - 敵先攻の場合は即座にexecuteEnemyTurn()を呼び出し
   - setTimeoutのコメントアウトを削除し、適切な非同期処理に変更

### Phase 6: 統合テストとデバッグ
1. エンドツーエンドのバトルフローをテスト
2. 各フェーズ間の遷移を確認
3. タイピング中のリアルタイム効果反映を確認
4. **先攻/後攻のパターンをテスト**：
   - プレイヤー先攻のケース
   - 敵先攻のケース
   - 敏捷性が同じ場合のランダム判定

## メリット

1. **保守性の向上**: 各クラスの責務が明確になり、変更が容易に
2. **テスタビリティの向上**: ビジネスロジックとUIが分離され、単体テストが書きやすく
3. **重複の削除**: 同じロジックが複数箇所に存在しない
4. **拡張性の向上**: 新しいスキル効果やバトルルールの追加が容易に
5. **リアルタイム性の維持**: タイピング完了ごとの即座の効果反映を保持

## リスクと対策

1. **リスク**: 大規模な変更により新たなバグが発生する可能性
   **対策**: 段階的に実装し、各段階でテストを実施

2. **リスク**: 既存のゲームフローが壊れる可能性
   **対策**: 統合テストを充実させ、エンドツーエンドのシナリオをテスト

## タイムライン

- Phase 1 (BattleActionExecutor作成): 1日
- Phase 2 (BattleCalculator拡張): 0.5日
- Phase 3 (Battleリファクタリング): 1日
- Phase 4 (BattleTypingPhase調整): 0.5日
- Phase 5 (BattlePhase整理): 1日
- Phase 6 (統合テスト): 2日

**合計**: 約6日

## 重要な設計決定

### BattleTypingPhaseでのリアルタイム効果適用を維持する理由
1. **ユーザー体験**: タイピング完了後すぐに効果が見えることで、プレイヤーの達成感とゲームへの没入感が向上
2. **戦略性**: 敵のHPを見ながら次のスキルの選択を調整できる
3. **フィードバック**: タイピングの成功/失敗が即座に結果として反映される

### BattleActionExecutorの役割
- スキル効果の計算と適用を一元化
- Battle.tsとBattleTypingPhase.tsの両方から呼び出される
- 純粋な関数として実装し、副作用を最小限に抑える

### 先攻/後攻システムの設計
1. **先攻判定**: Battle.tsのdecideFirstTurnActor()で敏捷性を比較
2. **初回ターン処理**: BattlePhase.startBattle()で判定結果に基づいて処理
3. **ターン制御**: 
   - 敵先攻: startBattle → executeEnemyTurn → プレイヤー入力待機
   - プレイヤー先攻: startBattle → プレイヤー入力待機
4. **非同期処理**: 敵ターンは適切な遅延を入れてUIの視認性を確保

