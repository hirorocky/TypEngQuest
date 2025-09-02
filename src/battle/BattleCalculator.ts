import { SpeedRating, AccuracyRating } from '../typing/types';
import { Skill, SkillSuccessRate, SkillCriticalRate, StatInfluence, SkillType } from './Skill';

/**
 * BattleCalculatorクラス - 戦闘に関する計算処理を管理する
 */
/**
 * 戦闘でのターゲット（回避率を持つオブジェクト）を表すインターフェース
 */
export interface BattleTarget {
  physicalEvadeRate: number;
  magicalEvadeRate: number;
}

export class BattleCalculator {
  /**
   * ダメージ計算
   * @param attackPower 攻撃力
   * @param defensePower 防御力
   * @param skillPower 技の威力倍率
   * @param isCritical クリティカルヒットかどうか
   * @returns 計算されたダメージ（整数）
   */
  static calculateDamage(
    attackPower: number,
    defensePower: number,
    skillPower: number,
    isCritical: boolean = false
  ): number {
    // 基本ダメージ = (攻撃力 × 技倍率) - (敵防御力 × 0.5)
    let baseDamage = attackPower * skillPower - defensePower * 0.5;

    // 最小ダメージは1
    baseDamage = Math.max(1, baseDamage);

    // クリティカル時は1.2倍
    if (isCritical) {
      baseDamage *= 1.2;
    }

    // 整数に変換して返す
    return Math.floor(baseDamage);
  }

  /**
   * 命中率計算
   * @param skillAccuracy 技の基本命中率
   * @returns 最終的な命中率（%）
   */
  static calculateHitRate(skillAccuracy: number): number {
    // 技の命中率をそのまま使用（agilityは参照しない）
    return skillAccuracy;
  }

  /**
   * 回避率計算
   * @param agility 敏捷性ステータス
   * @returns 回避率（%）
   */
  static calculateEvadeRate(agility: number): number {
    // 基本回避率 = 5 + (敏捷性 / 20)%
    let evadeRate = 5 + agility / 20;

    // 最大30%、最小5%
    evadeRate = Math.max(5, Math.min(30, evadeRate));

    return evadeRate;
  }

  /**
   * クリティカル率計算
   * @param fortune 幸運ステータス
   * @returns クリティカル率（%）
   */
  static calculateCriticalRate(fortune: number): number {
    // 基本クリティカル率 = 5 + (幸運 / 15)%
    let criticalRate = 5 + fortune / 15;

    // 最大25%、最小5%
    criticalRate = Math.max(5, Math.min(25, criticalRate));

    return criticalRate;
  }

  /**
   * 敏捷性ボーナス計算（タイピング用）
   * @param agility 敏捷性ステータス
   * @returns 敏捷性ボーナス倍率
   */
  static calculateAgilityBonus(agility: number): number {
    // 敏捷性ボーナス = 1.0 + (敏捷性 / 200)
    return 1.0 + agility / 200;
  }

  /**
   * アイテムドロップ率計算
   * @param fortune 幸運ステータス
   * @param worldLevel ワールドレベル
   * @returns ドロップ率（%）
   */
  static calculateDropRate(fortune: number, worldLevel: number): number {
    // 基本ドロップ率 = 30 + (幸運 / 10) + (ワールドレベル × 5)%
    let dropRate = 30 + fortune / 10 + worldLevel * 5;

    // 最大80%、最小30%
    dropRate = Math.max(30, Math.min(80, dropRate));

    return dropRate;
  }

  /**
   * 実際の命中判定
   * @param hitRate 命中率（%）
   * @param evadeRate 回避率（%）
   * @returns 命中したかどうか
   */
  static isHit(hitRate: number, evadeRate: number): boolean {
    // 最終的な命中率 = 命中率 - 回避率
    const finalHitRate = Math.max(1, hitRate - evadeRate);

    // ランダム判定
    const random = Math.random() * 100;
    return random < finalHitRate;
  }

  /**
   * クリティカル判定
   * @param criticalRate クリティカル率（%）
   * @returns クリティカルが発生したかどうか
   */
  static isCritical(criticalRate: number): boolean {
    const random = Math.random() * 100;
    return random < criticalRate;
  }

  /**
   * 状態異常付与判定
   * @param baseChance 基本成功率（%）
   * @param fortune 幸運ステータス
   * @returns 状態異常が付与されたかどうか
   */
  static isStatusEffectApplied(baseChance: number, fortune: number): boolean {
    // 成功率 = 基本成功率 + (幸運 / 20)
    const successRate = Math.min(100, baseChance + fortune / 20);

    const random = Math.random() * 100;
    return random < successRate;
  }

  /**
   * タイピング速度に基づく命中率ボーナス計算
   * @param baseHitRate 基本命中率
   * @param playerAgility プレイヤーの敏捷性ステータス
   * @param speedRating タイピング速度評価
   * @returns ボーナス適用後の命中率
   */
  static calculateTypingSpeedBonus(
    baseHitRate: number,
    playerAgility: number,
    speedRating: SpeedRating
  ): number {
    // 敏捷性ボーナス = 1.0 + (敏捷性 / 200)
    const agilityBonus = 1.0 + playerAgility / 200;

    // タイピング速度による倍率
    const speedMultiplier = {
      Fast: 1.5, // 150%
      Normal: 1.2, // 120%
      Slow: 1.0, // 100%
      Miss: 0.7, // 70%
    }[speedRating];

    const enhancedHitRate = baseHitRate * agilityBonus * speedMultiplier;
    return Math.min(99, enhancedHitRate); // 最大99%
  }

  /**
   * タイピング精度に基づくクリティカル率ボーナス計算
   * @param baseCriticalRate 基本クリティカル率
   * @param playerAgility プレイヤーの敏捷性ステータス
   * @param accuracyRating タイピング精度評価
   * @returns ボーナス適用後のクリティカル率
   */
  static calculateTypingAccuracyBonus(
    baseCriticalRate: number,
    playerAgility: number,
    accuracyRating: AccuracyRating
  ): number {
    // 敏捷性ボーナス = 1.0 + (敏捷性 / 200)
    const agilityBonus = 1.0 + playerAgility / 200;

    // タイピング精度による倍率
    const accuracyMultiplier = {
      Perfect: 2.0, // 200%
      Good: 1.5, // 150%
      Poor: 0.8, // 80%
    }[accuracyRating];

    const enhancedCriticalRate = baseCriticalRate * agilityBonus * accuracyMultiplier;
    return Math.min(50, enhancedCriticalRate); // 最大50%
  }

  /**
   * タイピング総合評価に基づく効果倍率計算
   * @param totalRating タイピング総合評価（80, 100, 120, 150）
   * @returns 効果倍率（0.8〜1.5）
   */
  static calculateTypingEffectMultiplier(totalRating: number): number {
    return totalRating / 100;
  }

  /**
   * プレイヤーの行動ポイントを計算する
   * @param agility プレイヤーの敏捷性ステータス
   * @returns 行動ポイント
   */
  static calculatePlayerActionPoints(agility: number): number {
    // 基本行動ポイント: 3
    // agilityボーナス: agility / 50（端数切り捨て）
    const BASE_ACTION_POINTS = 3;
    const AGILITY_TO_AP_DIVISOR = 50;

    const basePoints = BASE_ACTION_POINTS;
    const agilityBonus = Math.floor(agility / AGILITY_TO_AP_DIVISOR);
    return Math.max(1, basePoints + agilityBonus);
  }

  /**
   * MP回復量を計算する（タイピング評価による倍率込み）
   * @param baseMpRecovery 基本MP回復量
   * @param accuracyRating タイピング精度評価
   * @returns 計算されたMP回復量
   */
  static calculateMpRecovery(baseMpRecovery: number, accuracyRating?: AccuracyRating): number {
    if (baseMpRecovery <= 0) {
      return 0;
    }

    let mpRecovered = baseMpRecovery;

    if (accuracyRating === 'Perfect') {
      mpRecovered = Math.floor(mpRecovered * 1.5); // 150%
    } else if (accuracyRating === 'Good') {
      mpRecovered = Math.floor(mpRecovered * 1.2); // 120%
    }
    // Poor は倍率なし（100%）

    return mpRecovered;
  }

  // Phase 4: 3層判定システム新メソッド

  /**
   * スキル成功率を計算する
   * @param skillSuccessRate スキルの成功率設定
   * @param playerAgility プレイヤーの敏捷性
   * @param typingScore タイピング評価（%）
   * @returns 最終スキル成功率（%）
   */
  static calculateSkillSuccessRate(
    skillSuccessRate: SkillSuccessRate,
    playerAgility: number,
    speedRating: SpeedRating
  ): number {
    // 基本成功率
    let finalRate = skillSuccessRate.baseRate;

    // 敏捷性影響
    finalRate += playerAgility * skillSuccessRate.agilityInfluence;

    // タイピング影響（速度のみ反映）: SpeedRating をスコア(150/120/100/60)へ変換し線形加算
    const speedScore = { Fast: 150, Normal: 120, Slow: 80, Miss: 60 }[speedRating];
    const typingBonus = (speedScore - 100) * skillSuccessRate.typingInfluence;
    finalRate += typingBonus;

    // 上限100%、下限10%
    return Math.max(10, Math.min(100, finalRate));
  }

  /**
   * 物理・魔法スキルの回避判定
   * @param skillType スキルの種別
   * @param enemy 敵
   * @returns 回避されたかどうか
   */
  static isSkillEvaded(skillType: SkillType, target: BattleTarget): boolean {
    const evadeRate = skillType === 'physical' ? target.physicalEvadeRate : target.magicalEvadeRate;

    const random = Math.random() * 100;
    return random < evadeRate;
  }

  /**
   * 効果の成功判定
   * @param successRate 効果の成功率（%）
   * @returns 成功したかどうか
   */
  static isEffectSuccess(successRate: number): boolean {
    const random = Math.random() * 100;
    return random < successRate;
  }

  /**
   * 効果の威力を計算する（ステータス影響込み）
   * @param basePower 基本威力
   * @param playerStats プレイヤーのステータス
   * @param statInfluence ステータス影響設定（省略可能）
   * @returns 最終威力
   */
  static calculateEffectPower(
    basePower: number,
    playerStats: { strength: number; willpower: number; agility: number; fortune: number },
    statInfluence?: StatInfluence
  ): number {
    if (!statInfluence) {
      // ステータス影響なし = 固定威力
      return basePower;
    }

    const statValue = playerStats[statInfluence.stat];
    const statBonus = statValue * statInfluence.rate;

    return Math.floor(basePower + statBonus);
  }

  /**
   * スキルのクリティカル率を計算する
   * @param criticalRate クリティカル率設定
   * @param playerFortune プレイヤーの幸運
   * @returns 最終クリティカル率（%）
   */
  static calculateSkillCriticalRate(
    criticalRate: SkillCriticalRate,
    playerFortune: number
  ): number {
    const finalRate = criticalRate.baseRate + playerFortune * criticalRate.fortuneInfluence;

    // 上限95%、下限0%
    return Math.max(0, Math.min(95, finalRate));
  }

  /**
   * 3層判定システム全体を実行する
   * @param skill 使用するスキル
   * @param enemy 対象の敵
   * @param playerStats プレイヤーのステータス
   * @param typingScore タイピング評価（%）
   * @returns 判定結果
   */
  static executeThreeLayerJudgment(
    skill: Skill,
    target: BattleTarget,
    attackerStats: { strength: number; willpower: number; agility: number; fortune: number },
    options?: { speedRating?: SpeedRating; accuracyRating?: AccuracyRating }
  ): {
    skillSuccess: boolean;
    evaded: boolean;
    effectResults: Array<{
      effectIndex: number;
      success: boolean;
      power: number;
      isCritical: boolean;
    }>;
    finalDamage: number;
    isCritical: boolean;
  } {
    const result = {
      skillSuccess: false,
      evaded: false,
      effectResults: [] as Array<{
        effectIndex: number;
        success: boolean;
        power: number;
        isCritical: boolean;
      }>,
      finalDamage: 0,
      isCritical: false,
    };

    // Layer 1: スキル成功率判定
    const speedRating: SpeedRating = options?.speedRating ?? 'Normal';
    const accuracyRating: AccuracyRating | undefined = options?.accuracyRating;

    const skillSuccessRate = this.calculateSkillSuccessRate(
      skill.skillSuccessRate,
      attackerStats.agility,
      speedRating
    );

    result.skillSuccess = this.isEffectSuccess(skillSuccessRate);

    if (!result.skillSuccess) {
      return result;
    }

    // Layer 2: 回避判定
    result.evaded = this.isSkillEvaded(skill.skillType, target);

    if (result.evaded) {
      return result;
    }

    // Layer 3: 効果処理
    let totalDamage = 0;
    let anyEffectCritical = false;

    skill.effects.forEach((effect, index) => {
      const effectSuccess = this.isEffectSuccess(effect.successRate);

      if (effectSuccess) {
        const power = this.calculateEffectPower(
          effect.basePower,
          attackerStats,
          effect.powerInfluence
        );

        // クリティカル判定
        // クリティカル率: スキル設定+幸運 を基礎に、タイピング精度のボーナスを適用
        let criticalRate = this.calculateSkillCriticalRate(
          skill.criticalRate,
          attackerStats.fortune
        );
        if (accuracyRating) {
          criticalRate = this.calculateTypingAccuracyBonus(
            criticalRate,
            attackerStats.agility,
            accuracyRating
          );
        }
        const isCritical = this.isCritical(criticalRate);

        const finalPower = isCritical ? Math.floor(power * 1.5) : power;

        result.effectResults.push({
          effectIndex: index,
          success: true,
          power: finalPower,
          isCritical,
        });

        if (effect.type === 'damage') {
          totalDamage += finalPower;
        }

        if (isCritical) {
          anyEffectCritical = true;
        }
      } else {
        result.effectResults.push({
          effectIndex: index,
          success: false,
          power: 0,
          isCritical: false,
        });
      }
    });

    result.finalDamage = totalDamage;
    result.isCritical = anyEffectCritical;

    return result;
  }
}
