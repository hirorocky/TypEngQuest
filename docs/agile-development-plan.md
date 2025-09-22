# アジャイル開発計画

## プロジェクト10D: 開発計画（初版）
本セクションは Issue #57（プロジェクト10D: 開発計画の起票）の合意・進行をトラッキングします。目的とMVP、品質基準、主要マイルストーンをここで管理し、詳細仕様は既存の各章へリンクします。

- 目的: バトルにおける上位プレイ向けメタ「EXポイント」軸を導入し、入力技量が戦略に昇華される体験を提供する。
- MVPスコープ:
  - EXポイント獲得計算のユーティリティ（テスト付き）
  - Playerへの`exPoints`プロパティ導入とバトルUI表示（最小）
  - Focus Mode（行動コスト1/MP0/難易度最低、ミスで終了）の最小実装
  - Spark Mode（1スキル選択・1文字タイピング・成功数分連続発動）の最小実装
  - 既存システムとの後方互換性（未使用時の挙動は従来どおり）
- 品質基準: `npm run check`成功、ESLint/Prettier準拠、Jest カバレッジ94%以上（`src/index.ts`除外）。
- 参照: 本ドキュメント内「⭐ プロジェクト10D: EXポイントシステム」詳細設計、docs/game-systems.md（EX/Focus/Sparkのユーザー体験記述）、docs/implementation-status.md（進捗）

マイルストーン（ドラフト）
- M1: EXポイント計算ユーティリティ+単体テスト完了（関数API凍結）
- M2: Playerへ`exPoints`導入・表示最小統合（UIステータス/バトル表示）
- M3: Focus Mode最小実装（コマンド`focus`・AC=1/MP=0/難易度=1・失敗で終了）
- M4: Spark Mode最小実装（コマンド`spark`・1スキル選択→固定回数実行の骨子）
- M5: 統合テスト・負荷の低いリグレッション追加／ドキュメント同期

注記: 詳細なAPI・擬似コードは下段「⭐ プロジェクト10D: EXポイントシステム」に掲出済み。ここではスコープ・品質・順序を管理する。

## 開発体制
- **プロダクトオーナー（ステークホルダー）**: あなた
- **開発者**: Claude
- **レビューサイクル**: 各サブプロジェクト完了時

## プロジェクト一覧

### 🎯 プロジェクト1: 基礎インフラ構築 ✅
**目標**: CLIゲームの土台を作り、タイトル画面を表示する

**成果物**:
- `npm start`でタイトル画面が表示される
- start/exit コマンドが動作する

**タスク**:
1. プロジェクト初期設定（package.json, tsconfig等）
2. エントリーポイント（index.ts）作成
3. Gameクラスとフェーズシステムの基礎実装
4. CommandParserの基礎実装
5. TitlePhaseの実装
6. 基本的なDisplay/UIユーティリティ

**チェックポイント**: タイトル画面でstart/exitが動作すること

---

### 📁 プロジェクト2: ファイルシステムナビゲーション ✅
**目標**: ゲーム内でディレクトリを移動できるようにする

**成果物**:
- ハードコードされた仮想ファイルシステムを探索できる
- ls, cd, pwd, tree コマンドが動作する

**タスク**:
1. FileNode, FileSystemクラスの実装
2. ExplorationPhaseの基礎実装
3. ナビゲーションコマンド（cd, ls, pwd, tree）の実装
4. 仮のファイルシステム構造を作成
5. コマンド履歴とTab補完機能

**チェックポイント**: ディレクトリ間を自由に移動でき、ファイル一覧が見られること

---

### 🌍 プロジェクト3: ワールド生成システム ✅
**目標**: ランダムなワールドを生成し、探索できるようにする

**成果物**:
- ゲーム開始時にランダムなワールドが生成される
- ドメインに応じた名前のディレクトリ/ファイルが生成される
- コマンド補完システムの実装

**タスク**:
1. Worldクラスの実装
2. WorldGeneratorの実装
3. domainsデータの作成
4. ランダム生成アルゴリズムの実装
5. ボスディレクトリと鍵の配置（アクセスはまだ不可）

**チェックポイント**: 毎回異なるワールドが生成され、探索できること

---

### 📁 プロジェクト2B: ファイルシステムナビゲーション2 ✅
**目標**: ゲーム内でディレクトリを快適に移動できるようにする

**成果物**:
- historyコマンドでコマンド履歴が表示される
- Tab補完機能の実装
- lsコマンドでディレクトリが青色太字で表示される

**タスク**:
- historyコマンドでコマンド履歴が表示される
- Tab補完機能の実装
- lsコマンドでディレクトリが青色太字で表示される

**チェックポイント**: 上記成果物ができていること

---

### 📂 プロジェクト4: ファイル操作コマンド ✅
**目標**: 基本的なファイル操作コマンドを実装する

**成果物**:
- fileコマンドが動作する
- ファイル内容の表示機能

**タスク**:
1. FileCommandの実装
   1. ファイルがどのタイプなのかを判定し、相互作用するためのコマンドを表示
2. ファイルタイプに応じたコマンドの実装（実行後の処理はまだ無くて良い、仮のログだけ出す）
  - MONSTER: battle <ファイル名>
  - TREASURE: open <ファイル名>
  - SAVE_POINT:
    - save <ファイル名> (セーブ)
    - rest <ファイル名> (HP, MP回復)
  - EVENT: execute <ファイル名>

**チェックポイント**: 基本的なファイル操作コマンドが動作すること

---

### 👤 プロジェクト5A: プレイヤー基本システム
**目標**: プレイヤーの基本情報を管理する

**成果物**:
- Playerクラスの実装
- 基本ステータス（レベル、名前）の管理

**タスク**:
1. Playerクラスの実装
2. 基本ステータス管理
3. プレイヤー情報の表示
4. レベルシステムの基礎実装

**チェックポイント**: プレイヤーの基本情報が管理できること

---

### 👤 プロジェクト5B: HP/MPシステム
**目標**: HP/MPシステムを実装する

**成果物**:
- HP/MPの概念が導入される
- statusコマンドでステータス表示

**タスク**:
1. Statsクラスの実装
2. HP/MPシステムの実装
3. statusコマンドの実装
4. ステータス変更機能

**チェックポイント**: HP/MPシステムが動作すること

---

### 📦 プロジェクト6A: アイテム基礎システム
**目標**: アイテムの基本構造を実装する

**成果物**:
- Item基底クラスの実装
- ConsumableItemの実装

**タスク**:
1. Item基底クラスの実装
2. ConsumableItemの実装
3. アイテム効果システム
4. アイテムデータ構造

**チェックポイント**: アイテムの基本構造が動作すること

---

### 📦 プロジェクト6B: インベントリシステム
**目標**: アイテムの管理と表示を実装する

**成果物**:
- インベントリでアイテム確認可能
- 宝箱ファイル（.json/.yaml）を開くとアイテム入手

**タスク**:
1. Inventoryクラスの実装
2. 宝箱の作用実装（openコマンド）
3. InventoryPhaseとinventoryコマンドの実装
4. アイテム使用機能

**チェックポイント**: アイテムの入手と確認ができること

---

### ⚔️ プロジェクト7A: 装備アイテム基礎
**目標**: 装備アイテムの基本構造を実装する

**成果物**:
- EquipmentItemの実装
- 装備スロットシステム

**タスク**:
1. EquipmentItemの実装
2. 装備スロットシステム
3. 装備効果の基礎実装
4. 装備データ構造

**チェックポイント**: 装備アイテムの基本構造が動作すること

---

### ⚔️ プロジェクト7B: 装備システム完成 ✅
**目標**: 装備システムと英文法チェック機能を実装する

**成果物**:
- 装備グレード範囲を1-20に拡張
- グレード = ステータス合計値のバリデーション
- 5単語英文の文法チェック機能
- 装備効果計算システム
- プレイヤーレベルの装備グレード平均値計算

**タスク**:
1. EquipmentItemのグレードシステム拡張 ✅
2. EquipmentGrammarCheckerの実装 ✅
3. EquipmentEffectCalculatorの実装 ✅
4. Playerクラスの装備システム統合 ✅

**チェックポイント**: 装備グレードシステムと英文法チェックが動作すること ✅

---

### ⚔️ プロジェクト7C: インベントリ装備システム品質向上 ✅
**目標**: 装備システムのPRコメント対応と品質向上

**成果物**:
- HP/MP/一時効果を保持した装備変更システム
- compromiseライブラリによる高度な英文法チェック
- スロット数ベースのレベル計算システム
- グレード100対応による拡張性向上

**タスク**:
1. Player.tsのsetEquippedItemsでstats全体が初期化される問題修正 ✅
2. EquipmentEffectCalculatorのリファクタリング（reduce、map+filter使用） ✅
3. 装備がない場合のグレード平均値を0に変更 ✅
4. グレード平均値を最大スロット数5で計算 ✅
5. compromiseライブラリによる5単語未満の文法チェック対応 ✅
6. グレードの最大値を20から100に変更 ✅
7. Playerレベルを毎回装備から計算するよう修正 ✅

**チェックポイント**: PRコメント対応が完了し、装備システムの品質が向上すること ✅

---

### ⚔️ プロジェクト7D: インベントリ装備UI
**目標**: InventoryPhaseから装備の装着・変更UIを実装する

**成果物**:
- InventoryPhaseから装備アイテムの装着・変更が可能
- 装備スロット表示（5スロット）と現在の装備状況確認
- ScrollableListを活用した使いやすい装備UI
- 装備変更時のリアルタイムレベル計算表示
- 英文法チェックによる装備組み合わせ検証

**タスク**:
1. EquipmentPhase（またはInventoryPhase拡張）の実装
   - `equip` コマンドで装備フェーズに遷移
   - 装備アイテムのScrollableList表示
   - 装備スロット（5つ）の可視化
2. 装備装着UI機能
   - 装備アイテム選択とスロット指定
   - 現在の装備構成表示
   - 装備解除機能
3. リアルタイム情報表示
   - 装備変更時の即座のレベル計算更新
   - ステータス変化のプレビュー表示
   - 英文構成の妥当性チェック結果表示
4. 装備組み合わせ検証
   - 5単語での英文法チェック
   - 不適切な組み合わせ時の警告表示
   - 代替案の提示機能

**チェックポイント**: InventoryPhaseから直感的に装備変更でき、リアルタイムでステータス確認ができること

---

### ⌨️ プロジェクト8A: タイピングUI完成 ✅
**目標**: タイピングのUI機能を完成させる

**成果物**:
- 独立したタイピングテストモード(問題文は固定でOK) ✅
- 速度と精度の評価が表示される ✅
- TitlePhaseからtypeコマンドでTypingPhaseに遷移可能 ✅
- typeコマンド終了後にTitlePhaseに戻る ✅

**タスク**:
1. TypingPhaseの実装 ✅
2. リアルタイム入力処理とプログレス表示 ✅
3. 評価結果の表示機能 ✅
4. タイピングテストモードの実装 ✅
5. TypeCommandの実装 ✅
6. フェーズ統合とGame.ts修正 ✅

**チェックポイント**: タイピングチャレンジが単体で動作すること ✅

---

### ⌨️ プロジェクト8B: タイピング基礎システム ✅
**目標**: タイピングチャレンジの基本機能を実装する

**成果物**:
- TypingChallengeクラスの実装 ✅
- 基本的なタイピング評価機能 ✅（TypingChallengeに統合）
- WordDatabaseクラスの実装 ✅

**タスク**:
1. TypingChallengeクラスの実装 ✅
2. TypingEvaluatorの実装 ✅（TypingChallengeに統合）
3. WordDatabaseの作成 ✅
4. 基本的なタイピング機能 ✅

**チェックポイント**: 基本的なタイピング機能が動作すること ✅

---

### 🗡️ プロジェクト9A: 戦闘基礎システム
**目標**: 戦闘の基本構造を実装する

**成果物**:
- Enemyクラスの実装
- Battleクラスの実装

**タスク**:
1. Enemyクラスの実装
2. Battleクラスの実装
3. BattleCalculatorの実装
4. 基本的な戦闘処理

**チェックポイント**: 基本的な戦闘処理が動作すること

---

### 🗡️ プロジェクト9B: 戦闘システム完成
**目標**: 戦闘システムを完成させる

**成果物**:
- battleコマンドで戦闘開始
- ターン制バトルが機能する
- 技使用時にタイピングチャレンジ発生

**タスク**:
1. BattlePhaseの実装
2. 技システムとタイピング連携
3. 戦闘UI完成
4. 戦闘システム統合

**チェックポイント**: 戦闘が最初から最後まで動作すること

---

### ⌨️ プロジェクト10A: タイピング評価簡素化
**目標**: タイピング評価システムを簡素化し、理解しやすくする

**成果物**:
- 速度評価を4段階に簡素化（Fast/Normal/Slow/Miss）
- 精度評価を3段階に簡素化（Perfect/Good/Poor）
- 新しい評価基準によるスキル成功率計算

**詳細設計**:

#### 現在の評価システム
- **速度評価**: S/A/B/C/F（5段階）
- **精度評価**: Perfect/Great/Good/Poor（4段階）

#### 新しい評価システム
- **正確さ**: Perfect(100%), Good(95%以上), Poor(94%以下) - 3段階
- **速さ**: Fast(制限時間の70%以下), Normal(85%以下), Slow(制限時間以内), Miss(制限時間超過) - 4段階

#### 実装変更点
```typescript
// 現在: 'Perfect' | 'Great' | 'Good' | 'Poor'
// 新仕様: 'Perfect' | 'Good' | 'Poor'
type AccuracyRating = 'Perfect' | 'Good' | 'Poor';

// 現在: 'S' | 'A' | 'B' | 'C' | 'F'
// 新仕様: 'Fast' | 'Normal' | 'Slow' | 'Miss'
type SpeedRating = 'Fast' | 'Normal' | 'Slow' | 'Miss';
```

#### 評価計算ロジック
```typescript
// 精度評価：100%=Perfect, 95%以上=Good, 94%以下=Poor
function calculateAccuracyRating(accuracy: number): AccuracyRating {
  if (accuracy === 100) return 'Perfect';
  if (accuracy >= 95) return 'Good';
  return 'Poor';
}

// 速度評価：70%以下=Fast, 85%以下=Normal, 100%以下=Slow, 100%超=Miss
function calculateSpeedRating(timeUsedRatio: number): SpeedRating {
  if (timeUsedRatio <= 0.70) return 'Fast';
  if (timeUsedRatio <= 0.85) return 'Normal';
  if (timeUsedRatio <= 1.00) return 'Slow';
  return 'Miss';
}
```

#### タイピングボーナス計算
```typescript
function getTypingBonus(typingResult: TypingResult): number {
  const speedBonus = {
    'Fast': 15, 'Normal': 10, 'Slow': 5, 'Miss': 0
  }[typingResult.speedRating];

  const accuracyBonus = {
    'Perfect': 20, 'Good': 10, 'Poor': 0
  }[typingResult.accuracyRating];

  return speedBonus + accuracyBonus;
}
```

**タスク**:
1. SpeedRating型の変更（S/A/B/C/F → Fast/Normal/Slow/Miss）
2. AccuracyRating型の変更（Perfect/Great/Good/Poor → Perfect/Good/Poor）
3. TypingChallengeクラスの評価ロジック更新
   - 精度評価：100%=Perfect, 95%以上=Good, 94%以下=Poor
   - 速度評価：70%以下=Fast, 85%以下=Normal, 100%以下=Slow, 100%超=Miss
4. 既存テストの更新と新しい評価基準のテスト追加
5. UI表示の更新（評価結果の表示変更）

**チェックポイント**: 新しい評価システムでタイピングチャレンジが正常に動作すること

---

### ⚔️ プロジェクト10B: バトル計算システム改善
**目標**: 3層成功率システムとスキル種別システムを実装する

**成果物**:
- 物理/魔法スキル種別システム
- 敵の物理/魔法回避率システム
- 3層スキル実行システム（スキル成功→効果成功→威力計算）
- 敵のMP概念削除と行動予告システム

**詳細設計**:

#### スキル効果への3層成功率システム

**第1層: スキル全体の成功率**
- agilityとタイピング評価が影響
- スキル種別（物理/魔法）に応じて敵の回避率が適用される
- タイピング評価の影響はスキル全体の成功率のみ

**第2層: 各効果の成功率**
- 各効果が独自の固定成功率を持つ
- ステータスの影響は受けない

**第3層: 効果の威力計算**
- 各効果が独自の基本威力を持つ
- strength, willpower, agility, fortuneのいずれかが影響可能

#### 新しいSkillインターフェース

```typescript
// スキル種別の定義
export type SkillType = 'physical' | 'magical';

export interface Skill {
  // 既存プロパティ
  id: string;
  name: string;
  description: string;
  grade: number;
  mpCost: number;
  mpCharge: number;
  actionCost: number;
  typingDifficulty: number;
  target: SkillTarget;

  // スキル種別（新規）
  skillType: SkillType;

  // スキル全体の成功率（新規）
  skillSuccessRate: {
    baseRate: number; // 基本成功率（%）
    agilityInfluence: number; // agility影響率
    typingInfluence: number; // タイピング評価影響率
  };

  // クリティカル率（新規）
  criticalRate: {
    baseRate: number; // 基本クリティカル率（%）
    fortuneInfluence: number; // fortune影響率
  };

  // 各効果（拡張）
  effects: SkillEffect[];
}

// パラメータ影響の定義
interface StatInfluence {
  stat: 'strength' | 'willpower' | 'agility' | 'fortune';
  rate: number; // 影響度（パーセント単位）
}

// 拡張されたEffectインターフェース
export type SkillEffect = {
  type: 'damage' | 'hp_heal' | 'add_status' | 'remove_status';
  target: SkillTarget;

  // 効果の威力
  basePower: number;
  powerInfluence?: StatInfluence;

  // 効果の成功率（固定値）
  successRate: number;
};
```

#### Enemyインターフェースの拡張

```typescript
export interface Enemy {
  // 既存プロパティ...
  id: string;
  name: string;
  description: string;
  level: number;

  // ステータス
  hp: number;
  // mp: number; ← 削除：敵にMPは不要
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;

  // 新規: 種別別回避率
  physicalEvadeRate: number; // 物理スキル回避率（%）
  magicalEvadeRate: number;  // 魔法スキル回避率（%）

  // 新規: 次回行動予告システム
  nextSkillId: string | null; // 次に使用するスキルID（事前表示用）

  // その他...
  skills: string[]; // 敵スキルはMP消費なし
  dropItems: ItemDrop[];
}
```

#### スキル実行フロー計算

```typescript
class SkillExecutionSystem {
  /**
   * 3段階判定でスキルを実行
   */
  async executeSkill(
    skill: Skill,
    user: Player,
    target: Player | Enemy,
    typingResult: TypingResult
  ): Promise<SkillExecutionResult> {

    // 第1段階: スキル全体の成功判定
    const skillSuccessRate = this.calculateSkillSuccessRate(
      skill,
      user.getBodyStats().agility,
      target,
      typingResult
    );

    if (!this.rollSuccess(skillSuccessRate)) {
      return { skillSucceeded: false, effectResults: [] };
    }

    // 第2段階: 各効果の個別判定・実行
    const effectResults = [];
    for (const effect of skill.effects) {
      const effectResult = await this.executeEffect(effect, user, target);
      effectResults.push(effectResult);
    }

    return { skillSucceeded: true, effectResults };
  }

  /**
   * スキル成功率計算（タイピング評価影響 + 敵回避率）
   */
  private calculateSkillSuccessRate(
    skill: Skill,
    target: Player | Enemy,
    typingResult: TypingResult
  ): number {
    let finalRate = skill.skillSuccessRate.baseRate;

    // タイピング評価影響
    const typingBonus = this.getTypingBonus(typingResult) * skill.skillSuccessRate.typingInfluence;
    finalRate += typingBonus;

    // 敵の回避率を適用
    const enemyEvadeRate = this.getEnemyEvadeRate(target, skill.skillType);
    finalRate -= enemyEvadeRate;

    return Math.max(0, Math.min(100, finalRate));
  }
}
```

#### 計算例

```typescript
// プレイヤー: agility=60, strength=45, willpower=50
// 敵: physicalEvadeRate=15%, magicalEvadeRate=10%
// タイピング結果: Fast + Perfect（ボーナス=35）

// precisionStrike実行（物理スキル）:
// 1. スキル成功率: 75 + (60×1.0/100) + (35×1.5) - 15 = 75 + 0.6 + 52.5 - 15 = 113.1% → 100%
// 2. ダメージ威力: 80 × (1 + 45×2.0/100) = 80 × 1.9 = 152ダメージ
// 3. ダメージ成功率: 100%（確定）

// focusedHeal実行（魔法スキル、自分対象）:
// 1. スキル成功率: 85 + (60×0.2/100) + (35×2.0) - 0 = 85 + 0.12 + 70 = 155.12% → 100%
// 2. 回復量: 40 × (1 + 50×1.8/100) = 40 × 1.9 = 76回復
// 3. 回復成功率: 95%（固定値）
```

#### 基本計算式

**スキル成功率計算式**
```typescript
最終成功率 = 基本成功率 + タイピングボーナス
// 成功率は0%〜200%の範囲で補正
// 回避判定は別レイヤーで実施
```

**クリティカル率計算式**
```typescript
最終クリティカル率 = スキルの基本クリティカル率
// 最大100%、最小0%
```

**ダメージ計算式**
```typescript
影響後威力 = 技の基本威力 × (1 + (影響パラメータ値 × 影響率) / 100)
クリティカル判定 = ランダム値 < 最終クリティカル率
最終ダメージ = 影響後威力 × (クリティカル判定 ? 1.5 : 1.0)
```

**タスク**:
1. SkillType型の追加（'physical' | 'magical'）
2. Skillインターフェースの拡張
   - skillType: SkillType追加
   - skillSuccessRate: { baseRate, typingInfluence }追加
   - criticalRate: { baseRate, fortuneInfluence }追加
3. SkillEffect型の拡張
   - basePower, powerInfluence, successRate追加
4. Enemyインターフェースの修正
   - mpプロパティ削除
   - physicalEvadeRate, magicalEvadeRate追加
   - nextSkillIdプロパティ追加
5. BattleCalculatorの3層システム実装
   - calculateSkillSuccessRate関数
   - executeEffect関数
   - getEnemyEvadeRate関数
6. 既存スキルデータの新形式への変換
7. テストケースの更新

**チェックポイント**: 新しいバトル計算システムで戦闘が正常に動作すること

---

### 🎯 プロジェクト10C: スキル柔軟性向上システム
**目標**: スキルの発動条件、潜在効果、コンボブーストシステムを実装する

**成果物**:
- スキル効果の発動条件システム
- スキルの潜在効果システム
- コンボブーストシステム（次スキル強化）
- スキルグレードシステム

**詳細設計**:

#### 効果レベルでの発動条件
```typescript
interface SkillEffect {
  // 新規追加
  conditions?: SkillCondition[];
  // 以下、前章で定義済み
}

interface SkillCondition {
  type: 'typing_speed' | 'typing_accuracy' | 'hp_threshold' | 'enemy_status' | 'self_buff' | 'agility_check';
  value: number | string;
  operator: '>=' | '<=' | '==' | 'has' | 'not_has';
}
```

#### 潜在効果システム
```typescript
interface SkillPotentialEffect {
  triggerCondition: {
    typingPerfect: 'speed' | 'accuracy' | 'both' | null,
    exMode: 'spark' | 'focus' | null
  };
  effect: SkillEffect;
}

// スキルに潜在効果を追加
interface Skill {
  // 既存プロパティ...
  potentialEffects?: SkillPotentialEffect[];
}
```

#### Combo Boost システム
```typescript
interface ComboBoost {
  id: string;
  name: string;
  description: string;
  boostType: 'damage' | 'heal' | 'skill_success' | 'status_success' | 'mp_cost_reduction' | 'typing_difficulty' | 'potential';
  value: number; // +10%なら10
  duration: 1; // 次のスキル使用まで
}

// 使用例のスキル
const comboPowerStrike: Skill = {
  id: 'combo_power_strike',
  name: 'Power Strike',
  // ... 他のプロパティ

  // コンボブースト付き
  comboBoosts: [{
    id: 'damage_boost',
    name: 'Damage Boost',
    description: '次のダメージスキルを10%強化',
    boostType: 'damage',
    value: 10,
    duration: 1
  }],

  effects: [{
    type: 'damage',
    basePower: 40,
    powerInfluence: { stat: 'strength', rate: 1.5 },
    successRate: 95,

    // 発動条件例
    conditions: [{
      type: 'hp_threshold',
      value: 50,
      operator: '>='
    }]
  }]
};
```

#### スキル柔軟性の実装例

```typescript
// 例1: タイピング結果に応じた効果変化
const adaptiveStrike: Skill = {
  id: 'adaptive_strike',
  // ...基本プロパティ

  effects: [{
    type: 'damage',
    basePower: 30,
    successRate: 100,
    conditions: [{
      type: 'typing_accuracy',
      value: 'Perfect',
      operator: '=='
    }]
  }],

  // 潜在効果：Perfect入力時に追加ダメージ
  potentialEffects: [{
    triggerCondition: {
      typingPerfect: 'accuracy',
      exMode: null
    },
    effect: {
      type: 'damage',
      basePower: 20, // 追加ダメージ
      successRate: 100
    }
  }]
};

// 例2: 敵の状態に応じた効果強化
const opportunisticStrike: Skill = {
  id: 'opportunistic_strike',

  effects: [{
    type: 'damage',
    basePower: 35,
    successRate: 90,

    // 敵が毒状態の時に威力2倍
    conditions: [{
      type: 'enemy_status',
      value: 'poisoned',
      operator: 'has'
    }]
  }]
};
```

#### コンボブーストシステムの実装

```typescript
class ComboBoostManager {
  private activeBoosts: Map<string, ComboBoost[]> = new Map();

  /**
   * スキル使用時にコンボブーストを適用
   */
  applyComboBoosts(skill: Skill, effectPower: number): number {
    const applicableBoosts = this.getApplicableBoosts(skill);
    let modifiedPower = effectPower;

    for (const boost of applicableBoosts) {
      if (boost.boostType === 'damage' && skill.effects[0].type === 'damage') {
        modifiedPower *= (1 + boost.value / 100);
      }
      // 他のブーストタイプも同様に処理
    }

    // ブーストを消費
    this.consumeBoosts(applicableBoosts);

    return modifiedPower;
  }

  /**
   * スキル実行後にコンボブーストを登録
   */
  registerComboBoosts(skill: Skill): void {
    if (skill.comboBoosts) {
      for (const boost of skill.comboBoosts) {
        this.activeBoosts.set(boost.id, [boost]);
      }
    }
  }
}
```

#### 状況による効果の変化例

```typescript
// HP閾値による効果変化
const desperateStrike: Skill = {
  effects: [{
    type: 'damage',
    basePower: 20,
    successRate: 100
  }, {
    type: 'damage',
    basePower: 40, // HP30%以下で追加ダメージ
    successRate: 100,
    conditions: [{
      type: 'hp_threshold',
      value: 30,
      operator: '<='
    }]
  }]
};

// 自身バフ状態による強化
const empoweredHeal: Skill = {
  effects: [{
    type: 'hp_heal',
    basePower: 25,
    successRate: 100
  }, {
    type: 'hp_heal',
    basePower: 15, // strength buffがある時追加回復
    successRate: 100,
    conditions: [{
      type: 'self_buff',
      value: 'strength_buff',
      operator: 'has'
    }]
  }]
};
```

**タスク**:
1. SkillConditionインターフェース実装
   - type: 'typing_speed' | 'typing_accuracy' | 'hp_threshold' | 'enemy_status' | 'self_buff' | 'agility_check'
   - value, operator プロパティ
2. SkillPotentialEffectインターフェース実装
   - triggerCondition（タイピング最高評価時の追加効果）
3. ComboBoostシステム実装
   - ComboBoostインターフェース
   - 次スキル強化効果の管理
4. スキル実行時の条件チェック機能
5. 潜在効果発動ロジック
6. コンボブースト適用・管理システム
7. テストケース作成

**チェックポイント**: 条件付きスキル効果とコンボブーストが正常に動作すること

---

### ⭐ プロジェクト10D: EXポイントシステム
**目標**: EXポイント獲得とFocus Mode/Spark Mode を実装する

**成果物**:
- タイピング結果に基づくEXポイント獲得システム
- Focus Mode（全スキルコスト1、MP0、難易度最低、1ミスで終了）
- Spark Mode（1スキル選択、1文字タイピング、成功数分連続発動）

**詳細設計**:

#### EXポイント獲得計算
```typescript
function calculateExPointGain(
  typingDifficulty: number, // 1-5
  speedRating: 'Fast' | 'Normal' | 'Slow' | 'Miss',
  accuracyRating: 'Perfect' | 'Good' | 'Poor'
): number {
  let basePoints = typingDifficulty;

  const speedMultiplier = {
    'Fast': 2.0, 'Normal': 1.5, 'Slow': 1.0, 'Miss': 0.0
  }[speedRating];

  const accuracyMultiplier = {
    'Perfect': 2.0, 'Good': 1.0, 'Poor': 0.5
  }[accuracyRating];

  return Math.floor(basePoints * speedMultiplier * accuracyMultiplier);
}

// 使用例:
// 難易度5, Fast + Perfect = 5 × 2.0 × 2.0 = 20EXP
// 難易度3, Normal + Good = 3 × 1.5 × 1.0 = 4EXP
```

#### Focus Mode実装
```typescript
class FocusMode {
  /**
   * Focus Mode：全スキル行動コスト1、MPコスト0、タイピング難易度最低
   * 1度でもミス・時間切れでターン終了
   */
  async executeFocusMode(player: Player, availableSkills: Skill[]): Promise<FocusModeResult> {
    const modifiedSkills = availableSkills.map(skill => ({
      ...skill,
      actionCost: 1,
      mpCost: 0,
      typingDifficulty: 1 // 最低難易度
    }));

    const results: SkillExecutionResult[] = [];
    let turnEnded = false;

    while (!turnEnded) {
      // スキル選択UI
      const selectedSkill = await this.selectSkill(modifiedSkills);

      // タイピングチャレンジ
      const typingResult = await this.performTypingChallenge(selectedSkill);

      // ミス・時間切れチェック
      if (typingResult.speedRating === 'Miss' || typingResult.accuracyRating === 'Poor') {
        turnEnded = true;
        break;
      }

      // スキル実行
      const skillResult = await this.executeSkill(selectedSkill, typingResult);
      results.push(skillResult);

      // 継続確認
      const continueTurn = await this.askContinue();
      if (!continueTurn) {
        turnEnded = true;
      }
    }

    return { results, reason: turnEnded ? 'mistake_or_timeout' : 'voluntary_end' };
  }
}
```

#### Spark Mode実装
```typescript
class SparkMode {
  /**
   * Spark Mode：1スキル選択、1文字ずつタイピング、成功数分連続発動
   */
  async executeSparkMode(player: Player, availableSkills: Skill[]): Promise<SparkModeResult> {
    // スキル選択
    const selectedSkill = await this.selectSkill(availableSkills);

    // 1文字ずつタイピングチャレンジ
    const singleCharChallenges = this.generateSingleCharChallenges();
    let successCount = 0;

    for (let i = 0; i < singleCharChallenges.length; i++) {
      const char = singleCharChallenges[i];
      const result = await this.singleCharTyping(char, 2000); // 2秒制限

      if (result.success) {
        successCount++;
      } else {
        break; // 失敗時点で終了
      }
    }

    // 成功数分だけスキルを連続実行
    const executionResults: SkillExecutionResult[] = [];
    for (let i = 0; i < successCount; i++) {
      const result = await this.executeSkillWithoutTyping(selectedSkill);
      executionResults.push(result);
    }

    return {
      selectedSkill,
      successCount,
      totalChallenges: singleCharChallenges.length,
      executionResults
    };
  }

  private generateSingleCharChallenges(): string[] {
    // a-z, A-Z, 0-9からランダムに10文字選択
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const challenges: string[] = [];

    for (let i = 0; i < 10; i++) {
      const randomChar = chars[Math.floor(Math.random() * chars.length)];
      challenges.push(randomChar);
    }

    return challenges;
  }
}
```

#### バトルフェーズでのEXモード統合
```typescript
class BattlePhase {
  async processPlayerTurn(player: Player): Promise<void> {
    const availableActions = [
      'skill', 'item', 'run'
    ];

    // EXポイントが十分にある場合、EXモード選択肢追加
    if (player.exPoints >= 10) {
      availableActions.push('focus_mode');
    }
    if (player.exPoints >= 15) {
      availableActions.push('spark_mode');
    }

    const action = await this.selectAction(availableActions);

    switch (action) {
      case 'focus_mode':
        await this.executeFocusMode(player);
        player.exPoints -= 10;
        break;

      case 'spark_mode':
        await this.executeSparkMode(player);
        player.exPoints -= 15;
        break;

      // 通常のスキル使用等...
    }
  }
}
```

#### EXポイント表示・管理
```typescript
interface PlayerStats {
  // 既存ステータス...
  exPoints: number; // EXポイント追加
}

// バトル画面での表示
class BattleDisplay {
  displayPlayerStatus(player: Player): string {
    return `
      HP: ${player.hp}/${player.maxHp}
      MP: ${player.mp}/${player.maxMp}
      EX: ${player.exPoints} ${this.getExModeStatus(player.exPoints)}
    `;
  }

  private getExModeStatus(exPoints: number): string {
    const modes = [];
    if (exPoints >= 10) modes.push('Focus');
    if (exPoints >= 15) modes.push('Spark');
    return modes.length > 0 ? `(${modes.join(', ')} Available)` : '';
  }
}
```

**タスク**:
1. EXポイント計算システム実装
   - calculateExPointGain関数
   - タイピング難易度 × 速度倍率 × 精度倍率
2. Player/BattleにEXポイント管理機能追加
3. Focus Mode実装
   - 全スキルの行動コスト1、MPコスト0化
   - タイピング難易度最低化
   - 1ミス・時間切れでターン即終了
4. Spark Mode実装
   - スキル選択UI
   - 1文字ずつタイピングチャレンジ
   - 成功回数分のスキル連続発動
5. バトルフェーズでのEXモード選択UI
6. EXポイント消費システム
7. テストケース作成

**チェックポイント**: EXポイントシステムとFocus/Sparkモードが正常に動作すること

---

### ⚔️ プロジェクト10E: アクセサリ装備システム刷新
**目標**: docs/game-systems.md 2.5章に定義されたアクセサリ装備システムを実装し、シンプルかつ戦略的なビルド構築体験を提供する。

**成果物**:
- 最大3スロットのアクセサリ装備枠（初期1枠、キーアイテムで順次解放）と装備データモデル
- アクセサリタイプごとのメイン効果（ステータス偏向）とサブ効果（特殊効果スロット3枠）を持つデータ設計
- グレード1〜100とワールドレベル同期による解放ロジック、倍率・ペナルティカーブの実装
- docs/game-systems.md §2.5に定義された命名規則（タイプ由来＋特殊効果ハイライト＋グレード表記）に従うアクセサリ名称生成と表示
- 同名アクセサリ2個を消費する合成処理（グレード継承とサブ効果選択UI）
- アクセサリ装備管理UI/ログの更新とテスト

**詳細設計**:

#### 装備スロット構成
- アクセサリスロット1: 初期解放、主要なビルド軸
- アクセサリスロット2: 「だいじなもの」入手で解放
- アクセサリスロット3: 最終キーアイテムで解放
- 各スロットは同時装備最大3個、スロット数に応じて装備効果を集約する

#### アクセサリデータモデル
```typescript
interface Accessory {
  id: string;
  name: string;
  type: AccessoryArchetype; // 攻撃特化/支援特化/機動特化など
  grade: number; // 1-100、ワールドレベル上限に同期

  mainEffect: {
    boost: 'strength' | 'willpower' | 'agility' | 'fortune';
    penalty: 'strength' | 'willpower' | 'agility' | 'fortune';
  };

  subEffects: AccessoryEffectSlot[]; // 常時3枠、各枠に特殊効果1件
}

interface AccessoryEffectSlot {
  id: string;
  effectType: 'crit_mp_refund' | 'typing_window_bonus' | 'status_resist'; // これは例、他にも考えること
  magnitude: number;
}
```

#### グレードとワールドレベル同期
- ワールドレベルは1〜100、5刻みで上昇
- ワールドレベル到達値以下のグレード帯がドロップ・合成対象として解禁
- メイン効果倍率とペナルティは段階的に推移
  - Grade 1: +10% / -10%
  - Grade 25: +18% / -9%
  - Grade 50: +24% / -8%
  - Grade 75: +30% / -7%
  - Grade 100: +35% / -5%

#### 合成フロー
1. 同名アクセサリ2個投入（ベース+素材）
2. 合成後グレードは高い方を引き継ぐ
3. 両アクセサリのサブ効果プールから任意の3枠を選択して固定

#### 成長サイクルとUI要件
- Grade1〜25帯でビルド方向性を把握、Grade50帯で主力確定、Grade75+で高難度向け最適化
- 装備画面ではスロット状態、メイン効果倍率、選択中サブ効果を一覧表示
- 合成UIはサブ効果のプレビューと選択確認モーダルを提供

**タスク**:
1. アクセサリスロット管理の実装（解放状態、装備上限、効果集約）
2. アクセサリデータ構造を mainEffect/subEffects 二層構造へ再定義し、既存データを移行
3. グレード計算ロジックとワールドレベル連動解禁処理の実装（倍率・ペナルティテーブル含む）
4. 合成処理とUIフロー（素材選択、サブ効果選択、結果プレビュー）の実装
5. 装備UI/ログ更新（3スロット表示、メイン効果とサブ効果の可視化）
6. 既存装備関連テストの更新と新規テスト追加（グレード境界値・合成・解放条件）
7. アクセサリ命名ロジックの実装と検証（タイプ名＋主要サブ効果タグ＋グレード数値の形式を自動適用）

**チェックポイント**: 3スロットのアクセサリ装備と合成を通じて、メイン効果倍率・サブ効果選択・解放条件が仕様どおりに機能し、UI/ログでプレイヤーに正しく提示されること

**進捗メモ（2025-09-22）**
- アクセサリデータモデルとグレードテーブル、合成基盤を `src/equipment/accessory/**` として実装済み。
- プレイヤー／インベントリ／装備フェーズをアクセサリ仕様へ移行し、ワールドレベル制御・スロットUI・命名ロジックを反映。
- 既存の装備コマンドとQAテストはアクセサリ前提へ更新、Jestカバレッジのベースラインを維持。

---

### 📦 プロジェクト10F: 消費アイテム拡張
**目標**: 消費アイテムの種類を大幅に拡張する

**成果物**:
- オーバーヒール系アイテム（HP最大値超過回復）
- バフ系アイテム（各ステータス一時アップ）
- 状態回復系アイテム（状態異常回復、一時無敵）
- 特殊系アイテム（EXポイント回復）

**詳細設計**:

#### 新しい効果タイプ
```typescript
enum EffectType {
  // 既存
  HEAL_HP, HEAL_MP,

  // 新規
  OVERHEAL_HP,              // HPを最大値を超えて回復
  BUFF_STRENGTH,            // 攻撃力アップ
  BUFF_WILLPOWER,           // 意志力アップ
  BUFF_AGILITY,             // 敏捷性アップ
  BUFF_FORTUNE,             // 幸運アップ
  DEBUFF_STRENGTH,          // デバフ効果
  APPLY_POISON,             // 状態異常付与
  CURE_ALL_STATUS,          // 全状態異常回復
  RESTORE_EX_POINTS,        // EX Point回復
  TEMPORARY_INVINCIBILITY   // 一時的無敵
}
```

#### 使用条件の拡張
```typescript
interface ItemEffect {
  // ... 既存プロパティ
  duration?: number;        // 持続時間（ターン数）
  target?: 'self' | 'enemy' | 'all';
  conditions?: {
    usableInBattle?: boolean;
    usableOutBattle?: boolean;
  };
}
```

#### 新アイテムの実装例

```typescript
// オーバーヒール系
const overHealPotion: ConsumableItem = {
  id: 'overheal_potion',
  name: 'Over Heal Potion',
  description: 'HP最大値を超えて回復するポーション',
  grade: 3,

  effects: [{
    type: EffectType.OVERHEAL_HP,
    power: 50, // 最大HP + 50まで回復
    target: 'self',
    conditions: {
      usableInBattle: true,
      usableOutBattle: true
    }
  }]
};

// バフ系
const strengthElixir: ConsumableItem = {
  id: 'strength_elixir',
  name: 'Strength Elixir',
  description: '5ターンの間攻撃力を20アップ',
  grade: 2,

  effects: [{
    type: EffectType.BUFF_STRENGTH,
    power: 20,
    duration: 5, // 5ターン持続
    target: 'self',
    conditions: {
      usableInBattle: true,
      usableOutBattle: false // バトル中のみ使用可能
    }
  }]
};

// 状態回復系
const panacea: ConsumableItem = {
  id: 'panacea',
  name: 'Panacea',
  description: '全ての状態異常を回復する万能薬',
  grade: 4,

  effects: [{
    type: EffectType.CURE_ALL_STATUS,
    power: 0, // powerは使用しない
    target: 'self',
    conditions: {
      usableInBattle: true,
      usableOutBattle: true
    }
  }]
};

// 特殊系
const focusStone: ConsumableItem = {
  id: 'focus_stone',
  name: 'Focus Stone',
  description: 'EXポイントを10回復する石',
  grade: 3,

  effects: [{
    type: EffectType.RESTORE_EX_POINTS,
    power: 10,
    target: 'self',
    conditions: {
      usableInBattle: false,
      usableOutBattle: true // バトル外でのみ使用可能
    }
  }]
};
```

#### アイテム効果システムの実装

```typescript
class ItemEffectSystem {
  /**
   * アイテム効果を実行
   */
  async executeItemEffect(
    item: ConsumableItem,
    user: Player,
    target?: Player | Enemy
  ): Promise<ItemEffectResult> {
    const results: EffectResult[] = [];

    for (const effect of item.effects) {
      // 使用条件チェック
      if (!this.checkUsageConditions(effect, user)) {
        continue;
      }

      const result = await this.applyEffect(effect, user, target);
      results.push(result);
    }

    return { item, results, success: results.length > 0 };
  }

  private checkUsageConditions(effect: ItemEffect, user: Player): boolean {
    const inBattle = user.isInBattle();

    if (inBattle && effect.conditions?.usableInBattle === false) {
      return false;
    }

    if (!inBattle && effect.conditions?.usableOutBattle === false) {
      return false;
    }

    return true;
  }

  private async applyEffect(
    effect: ItemEffect,
    user: Player,
    target?: Player | Enemy
  ): Promise<EffectResult> {
    switch (effect.type) {
      case EffectType.OVERHEAL_HP:
        return this.applyOverHeal(effect, user);

      case EffectType.BUFF_STRENGTH:
        return this.applyStatBuff(effect, user, 'strength');

      case EffectType.CURE_ALL_STATUS:
        return this.cureAllStatus(user);

      case EffectType.RESTORE_EX_POINTS:
        return this.restoreExPoints(effect, user);

      case EffectType.TEMPORARY_INVINCIBILITY:
        return this.applyInvincibility(effect, user);

      // 他の効果タイプ...
    }
  }

  private applyOverHeal(effect: ItemEffect, user: Player): EffectResult {
    const currentHp = user.hp;
    const maxHp = user.maxHp;
    const healAmount = effect.power;

    // 最大HP + healAmountまで回復可能
    const newHp = Math.min(currentHp + healAmount, maxHp + healAmount);
    user.hp = newHp;

    return {
      type: 'overheal',
      amount: newHp - currentHp,
      message: `HP over-healed by ${newHp - currentHp} (${newHp}/${maxHp})`
    };
  }

  private applyStatBuff(
    effect: ItemEffect,
    user: Player,
    stat: 'strength' | 'willpower' | 'agility' | 'fortune'
  ): EffectResult {
    const buff: TemporaryStatusEffect = {
      id: `buff_${stat}`,
      name: `${stat} Buff`,
      type: 'buff',
      stat: stat,
      value: effect.power,
      duration: effect.duration || 3
    };

    user.addTemporaryStatus(buff);

    return {
      type: 'buff',
      stat: stat,
      value: effect.power,
      duration: buff.duration,
      message: `${stat} increased by ${effect.power} for ${buff.duration} turns`
    };
  }

  private cureAllStatus(user: Player): EffectResult {
    const curedStatuses = user.getAllStatusAilments();
    user.clearAllStatusAilments();

    return {
      type: 'cure_all',
      curedCount: curedStatuses.length,
      message: `All status ailments cured (${curedStatuses.length} effects)`
    };
  }

  private restoreExPoints(effect: ItemEffect, user: Player): EffectResult {
    const restored = effect.power;
    user.exPoints = Math.min(user.exPoints + restored, user.maxExPoints || 100);

    return {
      type: 'ex_restore',
      amount: restored,
      message: `EX Points restored by ${restored}`
    };
  }
}
```

#### バトル中/バトル外での使用制限

```typescript
class ItemUsageManager {
  canUseItem(item: ConsumableItem, player: Player): boolean {
    const inBattle = player.isInBattle();

    for (const effect of item.effects) {
      if (inBattle && effect.conditions?.usableInBattle === false) {
        return false;
      }

      if (!inBattle && effect.conditions?.usableOutBattle === false) {
        return false;
      }
    }

    return true;
  }

  getUsageRestrictionMessage(item: ConsumableItem, player: Player): string {
    const inBattle = player.isInBattle();

    if (inBattle) {
      return "このアイテムは戦闘中には使用できません";
    } else {
      return "このアイテムは戦闘外では使用できません";
    }
  }
}
```

**タスク**:
1. EffectType enum拡張
   - OVERHEAL_HP, BUFF_STRENGTH, BUFF_WILLPOWER, BUFF_AGILITY, BUFF_FORTUNE追加
   - DEBUFF_STRENGTH, APPLY_POISON, CURE_ALL_STATUS追加
   - RESTORE_EX_POINTS, TEMPORARY_INVINCIBILITY追加
2. ItemEffectインターフェース拡張
   - duration, target, conditionsプロパティ追加
3. 新しい効果タイプの実装
   - オーバーヒール処理
   - バフ効果の適用・管理
   - 状態異常回復処理
   - EXポイント回復処理
4. アイテム使用条件の実装
   - 戦闘中/戦闘外使用制限
5. 新アイテムデータ作成
6. アイテム効果のテスト作成

**チェックポイント**: 新しい消費アイテムが正常に動作すること

---

### 🔓 プロジェクト10G: キーアイテム解放システム
**目標**: 段階的システム解放機能を実装する

**成果物**:
- 8つのシステム段階的解放機能
- キーアイテムによる解放トリガー
- 解放状態の管理と保存

**詳細設計**:

#### 段階的システム解放
```typescript
enum UnlockableSystem {
  COMBO_BOOST,              // コンボブーストシステム
  FOCUS_MODE,               // フォーカスモード + EX Point
  SPARK_MODE,               // スパークモード
  THIRD_ACCESSORY,          // 3個目のアクセサリ
  SKILL_GRADE_2,            // スキルグレード2解放
  SKILL_GRADE_3,            // スキルグレード3解放（潜在効果付き）
  SKILL_GRADE_4,            // スキルグレード4解放
  SKILL_GRADE_5             // スキルグレード5解放
}
```

#### キーアイテム定義
```typescript
interface KeyItem {
  id: string;
  name: string;
  description: string;
  unlocks: UnlockableSystem;
}

// キーアイテムの定義
const keyItems: KeyItem[] = [
  {
    id: 'combat_manual',
    name: 'Combat Manual',
    description: 'コンボブーストシステムを解放する戦闘マニュアル',
    unlocks: UnlockableSystem.COMBO_BOOST
  },
  {
    id: 'focus_meditation_scroll',
    name: 'Focus Meditation Scroll',
    description: 'フォーカスモードとEXポイントシステムを解放する瞑想の書',
    unlocks: UnlockableSystem.FOCUS_MODE
  },
  {
    id: 'spark_technique_manual',
    name: 'Spark Technique Manual',
    description: 'スパークモードを解放する技術書',
    unlocks: UnlockableSystem.SPARK_MODE
  },
  {
    id: 'accessory_mastery_ring',
    name: 'Accessory Mastery Ring',
    description: '3個目のアクセサリスロットを解放するリング',
    unlocks: UnlockableSystem.THIRD_ACCESSORY
  },
  {
    id: 'skill_mastery_tome_2',
    name: 'Skill Mastery Tome II',
    description: 'グレード2スキルを解放する技能書',
    unlocks: UnlockableSystem.SKILL_GRADE_2
  },
  {
    id: 'skill_mastery_tome_3',
    name: 'Skill Mastery Tome III',
    description: 'グレード3スキルと潜在効果を解放する技能書',
    unlocks: UnlockableSystem.SKILL_GRADE_3
  },
  {
    id: 'skill_mastery_tome_4',
    name: 'Skill Mastery Tome IV',
    description: 'グレード4スキルを解放する技能書',
    unlocks: UnlockableSystem.SKILL_GRADE_4
  },
  {
    id: 'skill_mastery_tome_5',
    name: 'Skill Mastery Tome V',
    description: 'グレード5スキルを解放する技能書',
    unlocks: UnlockableSystem.SKILL_GRADE_5
  }
];
```

#### SystemUnlockManagerクラス実装
```typescript
interface SystemUnlockState {
  unlockedSystems: Set<UnlockableSystem>;
}

class SystemUnlockManager {
  private unlockState: SystemUnlockState;

  constructor() {
    this.unlockState = {
      unlockedSystems: new Set([
        // 初期から利用可能なシステム
      ])
    };
  }

  /**
   * キーアイテム取得時の解放処理
   */
  onKeyItemObtained(keyItemId: string): UnlockResult {
    const keyItem = this.findKeyItem(keyItemId);
    if (!keyItem) {
      return { success: false, error: 'Unknown key item' };
    }

    if (this.isSystemUnlocked(keyItem.unlocks)) {
      return { success: false, error: 'System already unlocked' };
    }

    // システム解放
    this.unlockState.unlockedSystems.add(keyItem.unlocks);

    return {
      success: true,
      unlockedSystem: keyItem.unlocks,
      message: `${keyItem.name}により${this.getSystemName(keyItem.unlocks)}が解放されました！`
    };
  }

  /**
   * システムが解放済みかチェック
   */
  isSystemUnlocked(systemId: UnlockableSystem): boolean {
    return this.unlockState.unlockedSystems.has(systemId);
  }

  /**
   * 取得可能な最大スキルグレードを返す
   */
  getMaxAllowedSkillGrade(): number {
    if (this.isSystemUnlocked(UnlockableSystem.SKILL_GRADE_5)) return 5;
    if (this.isSystemUnlocked(UnlockableSystem.SKILL_GRADE_4)) return 4;
    if (this.isSystemUnlocked(UnlockableSystem.SKILL_GRADE_3)) return 3;
    if (this.isSystemUnlocked(UnlockableSystem.SKILL_GRADE_2)) return 2;
    return 1; // 初期は1まで
  }

  /**
   * 装備可能スロット数を返す
   */
  getEquipmentSlotCount(): number {
    return this.isSystemUnlocked(UnlockableSystem.SECOND_ACCESSORY) ? 8 : 6;
  }

  /**
   * EXポイントシステムが利用可能か
   */
  isExPointSystemAvailable(): boolean {
    return this.isSystemUnlocked(UnlockableSystem.FOCUS_MODE);
  }

  /**
   * コンボブーストシステムが利用可能か
   */
  isComboBoostSystemAvailable(): boolean {
    return this.isSystemUnlocked(UnlockableSystem.COMBO_BOOST);
  }

  private findKeyItem(keyItemId: string): KeyItem | undefined {
    return keyItems.find(item => item.id === keyItemId);
  }

  private getSystemName(system: UnlockableSystem): string {
    const systemNames = {
      [UnlockableSystem.COMBO_BOOST]: 'コンボブーストシステム',
      [UnlockableSystem.FOCUS_MODE]: 'フォーカスモード・EXポイントシステム',
      [UnlockableSystem.SPARK_MODE]: 'スパークモード',
      [UnlockableSystem.SECOND_ACCESSORY]: '2個目のアクセサリスロット',
      [UnlockableSystem.SKILL_GRADE_2]: 'グレード2スキル',
      [UnlockableSystem.SKILL_GRADE_3]: 'グレード3スキル（潜在効果）',
      [UnlockableSystem.SKILL_GRADE_4]: 'グレード4スキル',
      [UnlockableSystem.SKILL_GRADE_5]: 'グレード5スキル'
    };
    return systemNames[system] || 'Unknown System';
  }
}
```

#### 解放状態に応じたシステム制限
```typescript
class GameSystemRestrictions {
  private unlockManager: SystemUnlockManager;

  constructor(unlockManager: SystemUnlockManager) {
    this.unlockManager = unlockManager;
  }

  /**
   * スキル生成時のグレード制限
   */
  filterSkillsByGrade(skills: Skill[]): Skill[] {
    const maxGrade = this.unlockManager.getMaxAllowedSkillGrade();
    return skills.filter(skill => skill.grade <= maxGrade);
  }

  /**
   * 装備生成時のスロット数制限
   */
  getAvailableEquipmentSlots(): EquipmentSlot[] {
    const maxSlots = this.unlockManager.getEquipmentSlotCount();
    const allSlots = Object.values(EquipmentSlot);
    return allSlots.slice(0, maxSlots);
  }

  /**
   * バトル時のEXモード利用可能性チェック
   */
  getAvailableExModes(): string[] {
    const modes: string[] = [];

    if (this.unlockManager.isSystemUnlocked(UnlockableSystem.FOCUS_MODE)) {
      modes.push('focus_mode');
    }

    if (this.unlockManager.isSystemUnlocked(UnlockableSystem.SPARK_MODE)) {
      modes.push('spark_mode');
    }

    return modes;
  }

  /**
   * スキル効果にコンボブースト適用可能かチェック
   */
  canApplyComboBoost(): boolean {
    return this.unlockManager.isSystemUnlocked(UnlockableSystem.COMBO_BOOST);
  }
}
```

#### 解放通知UI
```typescript
class UnlockNotificationUI {
  /**
   * システム解放通知の表示
   */
  displayUnlockNotification(result: UnlockResult): void {
    if (!result.success) return;

    const systemName = this.getSystemDisplayName(result.unlockedSystem!);

    console.log(`
    ╔════════════════════════════════════╗
    ║        🎉 SYSTEM UNLOCKED! 🎉       ║
    ╠════════════════════════════════════╣
    ║                                    ║
    ║  ${systemName.padEnd(32)} ║
    ║                                    ║
    ║  新しい機能が利用可能になりました！  ║
    ║                                    ║
    ╚════════════════════════════════════╝
    `);
  }

  /**
   * 利用可能なシステム一覧表示
   */
  displaySystemStatus(unlockManager: SystemUnlockManager): void {
    const systems = Object.values(UnlockableSystem);

    console.log('\n=== SYSTEM STATUS ===');
    for (const system of systems) {
      const isUnlocked = unlockManager.isSystemUnlocked(system);
      const status = isUnlocked ? '✅' : '🔒';
      const name = this.getSystemDisplayName(system);
      console.log(`${status} ${name}`);
    }
  }

  private getSystemDisplayName(system: UnlockableSystem): string {
    // SystemUnlockManager.getSystemNameと同じロジック
    // 表示用の名前を返す
  }
}
```

#### セーブデータへの解放状態保存
```typescript
interface SaveData {
  // ... 既存データ
  unlockState: {
    unlockedSystems: UnlockableSystem[];
  };
}

class SaveManager {
  saveUnlockState(unlockManager: SystemUnlockManager): void {
    const saveData = this.loadSaveData();
    saveData.unlockState = {
      unlockedSystems: Array.from(unlockManager.getUnlockedSystems())
    };
    this.writeSaveData(saveData);
  }

  loadUnlockState(): SystemUnlockState {
    const saveData = this.loadSaveData();
    return {
      unlockedSystems: new Set(saveData.unlockState?.unlockedSystems || [])
    };
  }
}
```

**タスク**:
1. UnlockableSystem enum実装
   - COMBO_BOOST, FOCUS_MODE, SPARK_MODE, SECOND_ACCESSORY追加
   - SKILL_GRADE_2, SKILL_GRADE_3, SKILL_GRADE_4, SKILL_GRADE_5追加
2. SystemUnlockManagerクラス実装
   - unlockState管理
   - onKeyItemObtained, isSystemUnlocked関数
   - getMaxAllowedSkillGrade, getEquipmentSlotCount関数
3. キーアイテム定義
   - Combat Manual, Focus Meditation Scroll, Spark Technique Manual等
4. 解放状態に応じたシステム制限
   - スキルグレード制限
   - 装備スロット数制限
   - EXモード利用制限
   - コンボブースト機能制限
5. 解放通知UI
6. セーブデータへの解放状態保存
7. テストケース作成

**チェックポイント**: キーアイテムによる段階的システム解放が正常に動作すること

---

### 🩸 プロジェクト11: 状態異常システム
**目標**: 状態異常の管理と効果を実装する

**成果物**:
- StatusAilmentクラスの実装
- 状態異常の管理システム
- 戦闘・イベントでの状態異常適用

**タスク**:
1. StatusAilmentクラスの実装
2. 状態異常管理システム
3. 状態異常効果の実装
4. 状態異常UI表示

**チェックポイント**: 状態異常システムが動作すること

---

### 🎲 プロジェクト12A: イベント基礎システム
**目標**: イベントの基本構造を実装する

**成果物**:
- RandomEventクラスの実装
- GoodEvents/BadEventsの実装

**タスク**:
1. RandomEventクラスの実装
2. GoodEvents/BadEventsの実装
3. イベント効果の実装
4. 基本的なイベント処理

**チェックポイント**: 基本的なイベント処理が動作すること

---

### 🎲 プロジェクト12B: イベントシステム完成
**目標**: イベントシステムを完成させる

**成果物**:
- executeでイベント発生
- 良い/悪いイベントがランダムに発生
- タイピングで悪いイベントを回避可能

**タスク**:
1. イベントファイルの作用実装
2. DialogPhaseの実装
3. タイピングによるイベント回避機能
4. イベントシステム統合
5. docs/game-systems.md §2.6準拠のスキル習得チャレンジイベント追加（正規表現デバッガーの導線と報酬連携）

**チェックポイント**: 各種イベントが正常に動作すること

---

### 👑 プロジェクト13A: 鍵システム
**目標**: 鍵とアクセス制御を実装する

**成果物**:
- KeyItemの実装
- ボスディレクトリのアクセス制御

**タスク**:
1. KeyItemの実装
2. ボスディレクトリのアクセス制御
3. 鍵の入手・使用機能
4. アクセス制御システム

**チェックポイント**: 鍵システムが動作すること

---

### 👑 プロジェクト13B: ボス・クリアシステム
**目標**: ボス戦とワールドクリアを実装する

**成果物**:
- ボスを倒すとワールドクリア
- 新ワールドへの移行が可能

**タスク**:
1. ボス戦の特別な演出
2. ワールドクリア処理
3. retireコマンドの実装
4. 新ワールドへの移行機能

**チェックポイント**: ワールドを最初から最後までプレイできること

---


### 💾 プロジェクト14A: セーブデータ構造
**目標**: セーブデータの基本構造を実装する

**成果物**:
- SaveData構造の定義
- SaveManagerの実装

**タスク**:
1. SaveData構造の定義
2. SaveManagerの実装
3. 基本的なセーブ機能
4. セーブデータの検証

**チェックポイント**: セーブデータの保存が動作すること

---

### 💾 プロジェクト14B: ロードシステム完成
**目標**: ロード機能を完成させる

**成果物**:
- セーブポイント（.mdファイル）でセーブ可能
- タイトル画面からロード可能
- ゲーム状態の完全な保存・復元

**タスク**:
1. SaveValidatorの実装
2. セーブポイントの作用実装
3. load コマンドの実装
4. 完全なセーブ/ロードシステム

**チェックポイント**: セーブ/ロードが正常に動作すること

---

### ✨ プロジェクト15: ポリッシュ・最終調整
**目標**: ゲーム体験を向上させる

**成果物**:
- カラフルなUI
- アニメーション効果
- バランス調整済みのゲーム

**タスク**:
1. 色付きテキスト表示の実装
2. プログレスバーアニメーション
3. ゲームバランスの調整
4. エラーハンドリングの強化
5. パフォーマンス最適化

**チェックポイント**: 完成度の高いゲーム体験

---

## 各プロジェクトのワークフロー

1. **プランニング**
   - タスクの詳細分解
   - 技術的な課題の洗い出し
   - テスト計画の作成

2. **実装**
   - TDDでの開発
   - 段階的な機能追加
   - 継続的な動作確認

3. **テスト**
   - ユニットテスト作成
   - 統合テスト（必要に応じて）
   - 手動テスト

4. **デモ・レビュー**
   - 動作デモの実施
   - フィードバック収集
   - 次のプロジェクトへの要望確認

5. **改善**
   - フィードバックの反映
   - バグ修正
   - ドキュメント更新

## 成功指標

- 各プロジェクトで動作する成果物が提供される
- テストカバレッジ80%以上を維持
- プロジェクトごとにプレイ可能な状態を保つ
- フィードバックが次のプロジェクトに反映される

## リスク管理

- **技術的課題**: 早期に検証し、必要に応じて設計変更
- **スコープクリープ**: 各プロジェクトの目標を明確に維持
- **依存関係**: 順序を守り、基礎から着実に構築

## 次のアクション

プロジェクト1「基礎インフラ構築」から開始します。
タスクの詳細分解を行い、実装を開始してよろしいでしょうか？
