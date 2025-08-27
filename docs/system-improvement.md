# プロジェクト9後のシステム改善

## claude用メモ
- タイピング結果の簡素化
  - 正確さはPerfect(100%), Good(95%以上), Poor(94%以下)
  - 速さはFast(制限時間の70%以下), Normal(85%以下), Slow(制限時間以内), Miss(制限時間超過)
- バトル中計算式の調整
  - Claudeと対話しながら式を導く
    - ダメージ量とHPの調整
    - 命中率と回避率の調整
    - クリティカル率とクリティカルダメージの調整
- スキルの柔軟性向上
  - スキル自体の成功率に加えて、各効果にも発動条件を設定できるようにする
    - タイピング結果やagilityの影響はスキル自体の成功率のみに影響
  - 潜在効果の追加
    - タイピング速度または正確さ、またはその両方が最高評価のときに追加効果が発動
  - 状況による効果の変化
    - 敵が特定の状態異常にかかっている場合、スキルの効果が強化される
    - 自身が特定のバフを受けている場合、スキルの効果が強化される
    - 自身のHPが一定以上/以下のときにスキルの効果が変化
  - 「Combo Boost」の導入
    - そのスキルの次に使用するスキルを強化する
    - ダメージ+10%やHP回復量+10%、状態付与成功率+10%など
    - コンボブーストの内容とスキル効果があっていない場合は無視されるので、プレイヤーはスキルの順番に気をつける必要がある
    - ブースト効果はスキルとは独立して設定されるので、同じスキルでもブースト効果が異なる場合がある
  - グレードの導入
    - グレードが高いほど、複雑度が増す
    - 潜在効果があるのはグレード3以上
- 新パラメータ「EX Point」の導入
  - バトル開始時0
  - タイピング難易度 x タイピング評価がよいと徐々に上昇
  - EX Pointを消費してEXモードに移行可能
  - EXモードの種類
    - Focus Mode
      - そのターン全てのスキルの行動コストが1, MPコストが0になる
      - 全てのスキルのタイピング難易度は最低になるが、タイプミスor制限時間切れをした時点でターン終了
      - 1ターンで終了
    - Spark Mode
      - スキルを一つだけ選択し、タイピングチャレンジスタート
      - 一文字だけのタイピングチャレンジが続き、制限時間内に入力できた数だけスキルが連続で発動する
      - 1ターンで終了
- 装備システムの刷新
  - これまでは単語を装備し、文として成立させるシステムだった
  - 文の正しさを判定するのが難しいという課題がある
  - そこで、少しシンプルにする
  - 装備するのは「形容詞 + 武器」「形容詞 + アクセサリー」とする(4スロット)
  - 装備アイテムの種別は「武器」「アクセサリー」「形容詞」の3種類
  - 全ての種別に平等のステータス上昇機会がある
    - 武器はstrengthのパラメータが支配的
    - アクセサリーはfortuneのパラメータが支配的
    - 形容詞は偏りがない
    - 装備アイテムにはスキルが最大2個ランダムにつく
    - コンボブーストもランダムにつく
    - 装備品にグレードがあるのは変わらないが、レアリティはなくす
    - プレイヤーレベルはグレードの合計ではなく平均値にする
- 消費アイテムの刷新
  - これまではHPまたはMPを回復するだけのアイテムだった
  - 今後はバフ効果やデバフ効果を持つアイテムも追加する
  - HPを最大値を超えて回復できるアイテムも追加する
- キーアイテムに応じたシステムの解放
  - システムが多いので、最初から全て解放されているとプレイヤーが混乱する
  - そこで、キーアイテムを入手することで新しいシステムが解放される
  - 解放されるシステム
    - Combo Boost
      - 解放されて、はじめてスキルにコンボブーストがつくようになる
    - Focus Mode
      - ここでEX Pointも解放
    - Spark Mode
    - 2個目のアクセサリ
      - これで6スロット分になる
    - 取得できるスキルグレードの最大値上昇
      - 最初は1までだが、2,3,4,5と上昇していく

## 詳細設計

### 1. タイピング結果簡素化

#### 現在の評価システム
- **速度評価**: S/A/B/C/F（5段階）
- **精度評価**: Perfect/Great/Good/Poor（4段階）

#### 新しい評価システム
- **正確さ**: Perfect(100%), Good(95%以上), Poor(94%以下) - 3段階
- **速さ**: Fast(制限時間の70%以下), Normal(85%以下), Slow(制限時間以内), Miss(制限時間超過) - 4段階

#### 実装変更点
1. **AccuracyRating型の変更**
   ```typescript
   // 現在: 'Perfect' | 'Great' | 'Good' | 'Poor'
   // 新仕様: 'Perfect' | 'Good' | 'Poor'
   ```

2. **SpeedRating型の変更**
   ```typescript
   // 現在: 'S' | 'A' | 'B' | 'C' | 'F'
   // 新仕様: 'Fast' | 'Normal' | 'Slow' | 'Miss'
   ```

3. **評価計算ロジックの更新**
   - 精度評価：100%=Perfect, 95%以上=Good, 94%以下=Poor
   - 速度評価：70%以下=Fast, 85%以下=Normal, 100%以下=Slow, 100%超=Miss

### 2. バトル中計算式調整

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

#### スキル実行フローの計算

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
   * スキル成功率計算（agility + タイピング評価影響 + 敵回避率）
   */
  private calculateSkillSuccessRate(
    skill: Skill,
    userAgility: number,
    target: Player | Enemy,
    typingResult: TypingResult
  ): number {
    let finalRate = skill.skillSuccessRate.baseRate;

    // agility影響
    const agilityBonus = (userAgility * skill.skillSuccessRate.agilityInfluence) / 100;
    finalRate += agilityBonus;

    // タイピング評価影響
    const typingBonus = this.getTypingBonus(typingResult) * skill.skillSuccessRate.typingInfluence;
    finalRate += typingBonus;

    // 敵の回避率を適用
    const enemyEvadeRate = this.getEnemyEvadeRate(target, skill.skillType);
    finalRate -= enemyEvadeRate;

    return Math.max(5, Math.min(100, finalRate)); // 最低5%は保証
  }

  /**
   * 敵の回避率を取得（スキル種別に応じて）
   */
  private getEnemyEvadeRate(target: Player | Enemy, skillType: SkillType): number {
    if (!('physicalEvadeRate' in target)) {
      return 0; // プレイヤー対象の場合は回避率なし
    }

    return skillType === 'physical'
      ? target.physicalEvadeRate
      : target.magicalEvadeRate;
  }

  /**
   * タイピング評価からボーナス値を取得
   */
  private getTypingBonus(typingResult: TypingResult): number {
    const speedBonus = {
      'Fast': 15, 'Normal': 10, 'Slow': 5, 'Miss': 0
    }[typingResult.speedRating];

    const accuracyBonus = {
      'Perfect': 20, 'Good': 10, 'Poor': 0
    }[typingResult.accuracyRating];

    return speedBonus + accuracyBonus;
  }
}
```

#### 具体的なスキル例

```typescript
// 例1: 物理系の高agility要求スキル
const precisionStrike: Skill = {
  id: 'precision_strike',
  name: 'Precision Strike',
  description: 'Physical attack requiring agility and precise typing',
  mpCost: 8,
  typingDifficulty: 4,
  skillType: 'physical', // 物理スキル
  grade: 3,

  // スキル成功率（agility重視）
  skillSuccessRate: {
    baseRate: 75, // 基本75%
    agilityInfluence: 1.0, // agility値の1%がボーナス
    typingInfluence: 1.5 // タイピングボーナス×1.5倍
  },

  effects: [{
    type: 'damage',
    target: 'enemy',
    basePower: 80, // 高威力
    powerInfluence: {
      stat: 'strength',
      rate: 2.0
    },
    successRate: 100, // スキル成功なら確定ダメージ
  }]
};

// 例2: 魔法系のタイピング重視回復スキル
const focusedHeal: Skill = {
  id: 'focused_heal',
  name: 'Focused Heal',
  description: 'Magical healing spell requiring concentration',
  mpCost: 12,
  typingDifficulty: 3,
  skillType: 'magical', // 魔法スキル

  // スキル成功率（タイピング重視）
  skillSuccessRate: {
    baseRate: 85, // 魔法は基本成功率高め
    agilityInfluence: 0.2,
    typingInfluence: 2.0 // タイピング評価が最重要
  },

  effects: [{
    type: 'hp_heal',
    target: 'self',
    basePower: 40,
    powerInfluence: {
      stat: 'willpower',
      rate: 1.8
    },
    successRate: 95, // ほぼ確実に回復
  }]
};
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

#### 敵の行動予告システム

```typescript
class EnemyAI {
  /**
   * 敵の次回行動を決定し、事前表示用に設定
   */
  determineNextAction(enemy: Enemy): void {
    // 敵のAIロジックに基づいてスキルを選択
    const selectedSkillId = this.selectSkillByAI(enemy);

    // 次回使用スキルを設定（プレイヤーに事前表示される）
    enemy.nextSkillId = selectedSkillId;
  }

  /**
   * 敵の実際の行動実行
   */
  executeEnemyTurn(enemy: Enemy, player: Player): SkillExecutionResult {
    if (!enemy.nextSkillId) {
      throw new Error('Next skill not determined');
    }

    const skillToUse = this.getSkillById(enemy.nextSkillId);

    // スキル実行
    const result = this.executeSkill(skillToUse, enemy, player);

    // 実行後、次回行動を再決定
    this.determineNextAction(enemy);

    return result;
  }
}

// バトル画面での表示例
class BattleDisplay {
  displayEnemyStatus(enemy: Enemy): string {
    const nextSkill = enemy.nextSkillId ? this.getSkillById(enemy.nextSkillId) : null;

    return `
      ${enemy.name} (HP: ${enemy.hp})
      Next Action: ${nextSkill ? `${nextSkill.name} (${nextSkill.skillType})` : 'Unknown'}
      Physical Evade: ${enemy.physicalEvadeRate}%
      Magical Evade: ${enemy.magicalEvadeRate}%
    `;
  }
}
```

#### 基本計算式の簡略化

**スキル成功率計算式**
```typescript
// 新しい計算式（物理/魔法回避率考慮）
最終成功率 = 基本成功率 + agilityボーナス + タイピングボーナス - 敵回避率
// 物理スキル: 敵physicalEvadeRate を減算
// 魔法スキル: 敵magicalEvadeRate を減算
// 自分対象: 回避率減算なし
```

**クリティカル率計算式**
```typescript
// スキル別クリティカル率計算
最終クリティカル率 = スキルの基本クリティカル率 + (fortune値 × fortuneInfluence) / 100
// 最大50%、最小0%に制限

// 例: クリティカル率設定（fortune=40, fortuneInfluence=1.5, baseRate=10）
// 最終クリティカル率 = 10 + (40 × 1.5) / 100 = 10 + 0.6 = 10.6%
```

**ダメージ計算式**
```typescript
// パラメータ影響を考慮した計算式
影響後威力 = 技の基本威力 × (1 + (影響パラメータ値 × 影響率) / 100)
クリティカル判定 = ランダム値 < 最終クリティカル率
最終ダメージ = 影響後威力 × (クリティカル判定 ? 1.5 : 1.0)

// 例1: strength影響のスキル（strength=50, rate=2.0, basePower=40）
// 影響後威力 = 40 × (1 + (50 × 2.0) / 100) = 40 × 2.0 = 80
// 最終ダメージ = 80 × 1.5 = 120（クリティカル時）or 80（通常時）

// 例2: willpower影響の回復スキル（willpower=60, rate=1.5, basePower=30）
// 回復量 = 30 × (1 + (60 × 1.5) / 100) = 30 × 1.9 = 57
// クリティカル回復量 = 57 × 1.5 = 85.5 → 85

// 例3: パラメータ影響なしのスキル
// ダメージ = basePower × クリティカル倍率のみ
```

**HP/MP成長式**
```typescript
HP = 100 + レベル × 15
MP = 50 + レベル × 8
```

### 3. スキル柔軟性向上システム

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

#### 潜在効果システム（グレード3以上）
```typescript
interface SkillPotentialEffect {
  triggerCondition: {
    typingPerfect: 'speed' | 'accuracy' | 'both' | null,
    exMode: 'spark' | 'focus' | null
  };
  effect: SkillEffect;
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
```

### 4. EX Pointシステム

#### EX Point獲得計算
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
```

#### Focus Mode
- 全スキルの行動コストが1、MPコストが0になる
- 全スキルのタイピング難易度が最低になる
- 1度でもミス・時間切れでターン終了
- 1ターン限定

#### Spark Mode
- 1つのスキルを選択
- 1文字ずつのタイピングチャレンジ
- 成功した数だけスキルが連続発動
- 1ターン限定

### 5. 装備システム刷新

#### 新しい装備スロット構成（最大8スロット）
- 形容詞 + 武器1（2スロット）
- 形容詞 + 武器2（2スロット）
- 形容詞 + アクセサリー1（2スロット）
- 形容詞 + アクセサリー2（2スロット）

#### アイテム種別の再定義
```typescript
enum EquipmentType {
  WEAPON = 'weapon',        // strength, willpower寄り
  ACCESSORY = 'accessory',  // agility, fortune寄り
  ADJECTIVE = 'adjective'   // バランス型
}
```

#### 新機能
- レアリティ廃止、グレードのみ（1-100）
- 装備アイテムに最大2個のスキルがランダム付与
- コンボブーストもランダム付与
- プレイヤーレベル = 装備グレードの平均値

### 6. 消費アイテム刷新

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

### 7. キーアイテム解放システム

#### 段階的システム解放
```typescript
enum UnlockableSystem {
  COMBO_BOOST,              // コンボブーストシステム
  FOCUS_MODE,               // フォーカスモード + EX Point
  SPARK_MODE,               // スパークモード
  SECOND_ACCESSORY,         // 2個目のアクセサリ
  SKILL_GRADE_2,            // スキルグレード2解放
  SKILL_GRADE_3,            // スキルグレード3解放（潜在効果付き）
  SKILL_GRADE_4,            // スキルグレード4解放
  SKILL_GRADE_5             // スキルグレード5解放
}
```

#### 解放トリガー
- **Combat Manual**: Combo Boost解放
- **Focus Meditation Scroll**: Focus Mode + EX Point解放
- **Spark Technique Manual**: Spark Mode解放
- **Accessory Mastery Ring**: 2個目のアクセサリスロット解放
- **Skill Mastery Tomes 1~4**: 各グレードのスキル解放

#### 解放管理システム
```typescript
class SystemUnlockManager {
  private unlockState: SystemUnlockState;

  onKeyItemObtained(keyItemId: string): UnlockResult;
  isSystemUnlocked(systemId: UnlockableSystem): boolean;
  getMaxAllowedSkillGrade(): number;
  getEquipmentSlotCount(): number;
}
```

この設計により、プレイヤーは徐々に複雑な機能に慣れながら、各システム解放時に新鮮な体験を得ることができます。
