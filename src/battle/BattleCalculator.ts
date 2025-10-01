import { SpeedRating, AccuracyRating } from '../typing/types';
import {
  Skill,
  SkillSuccessRate,
  SkillCriticalRate,
  StatInfluence,
  SkillType,
  SkillCondition,
  SkillPotentialEffect,
  SkillEffect,
} from './Skill';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';

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
  private static evaluatePotentialTrigger(
    cond: SkillPotentialEffect['triggerCondition'],
    context: ReturnType<typeof BattleCalculator.createConditionContext>
  ): boolean {
    const typingPerfectOk = cond.typingPerfect
      ? context.attacker.typingAccuracy === 'Perfect'
      : true;

    let exModeOk = true;
    if (cond.exMode !== undefined) {
      exModeOk =
        cond.exMode === 'each'
          ? context.attacker.exMode === true
          : context.attacker.exModeType === cond.exMode;
    }

    const exThresholdOk =
      typeof cond.exThreshold === 'number'
        ? context.attacker.exPoints >= Math.floor(cond.exThreshold)
        : true;

    return typingPerfectOk && exModeOk && exThresholdOk;
  }
  // 条件評価用の文脈
  static createConditionContext(args: {
    attackerHP: { current: number; max: number };
    defenderHP: { current: number; max: number };
    attackerAgility: number;
    /**
     * タイピング/EX関連の文脈
     * exModeはtrue/false、exModeTypeは具体的なモード種別
     */
    typing?: {
      speed?: SpeedRating;
      accuracy?: AccuracyRating;
      exMode?: boolean;
      exModeType?: 'focus' | 'spark';
    };
    hasSelfBuff?: (id: string) => boolean;
    hasEnemyStatus?: (id: string) => boolean;
    /** 攻撃側の現在EX（0-100） */
    attackerEX?: number;
  }) {
    const hpPct = (c: number, m: number) => (m <= 0 ? 0 : Math.floor((c / m) * 100));
    return {
      attacker: {
        hpPercent: hpPct(args.attackerHP.current, args.attackerHP.max),
        agility: args.attackerAgility,
        typingSpeed: args.typing?.speed,
        typingAccuracy: args.typing?.accuracy,
        exMode: args.typing?.exMode ?? false,
        exModeType: args.typing?.exModeType,
        exPoints: Math.max(0, Math.min(100, Math.floor(args.attackerEX ?? 0))),
        hasBuff: (id: string) => !!args.hasSelfBuff?.(id),
      },
      defender: {
        hpPercent: hpPct(args.defenderHP.current, args.defenderHP.max),
        hasStatus: (id: string) => !!args.hasEnemyStatus?.(id),
      },
    } as const;
  }

  /**
   * 条件配列の評価（全条件を満たす必要あり）
   */
  static isEffectConditionsMet(
    conditions: SkillCondition[] | undefined,
    context: ReturnType<typeof BattleCalculator.createConditionContext>
  ): boolean {
    if (!conditions || conditions.length === 0) return true;

    const handlers = {
      typing_speed: (cond: Extract<SkillCondition, { type: 'typing_speed' }>) => {
        const op = cond.operator ?? 'eq';
        const val = context.attacker.typingSpeed;
        return op === 'eq' ? val === cond.value : val !== cond.value;
      },
      typing_accuracy: (cond: Extract<SkillCondition, { type: 'typing_accuracy' }>) => {
        const op = cond.operator ?? 'eq';
        const val = context.attacker.typingAccuracy;
        return op === 'eq' ? val === cond.value : val !== cond.value;
      },
      hp_threshold: (cond: Extract<SkillCondition, { type: 'hp_threshold' }>) => {
        const pct =
          cond.target === 'self' ? context.attacker.hpPercent : context.defender.hpPercent;
        return cond.operator === 'gte' ? pct >= cond.value : pct <= cond.value;
      },
      enemy_status: (cond: Extract<SkillCondition, { type: 'enemy_status' }>) => {
        return context.defender.hasStatus(cond.statusId);
      },
      self_buff: (cond: Extract<SkillCondition, { type: 'self_buff' }>) => {
        return context.attacker.hasBuff(cond.buffId);
      },
      agility_check: (cond: Extract<SkillCondition, { type: 'agility_check' }>) => {
        return cond.operator === 'gte'
          ? context.attacker.agility >= cond.value
          : context.attacker.agility <= cond.value;
      },
    } as const;

    return conditions.every(c => handlers[c.type](c as never));
  }

  /**
   * 潜在効果を条件に応じてマージ
   */
  static mergePotentialEffects(
    baseEffects: SkillEffect[],
    potentials: SkillPotentialEffect[] | undefined,
    context: ReturnType<typeof BattleCalculator.createConditionContext>
  ): SkillEffect[] {
    if (!potentials || potentials.length === 0) return baseEffects;
    const extra: SkillEffect[] = [];
    for (const p of potentials) {
      if (this.evaluatePotentialTrigger(p.triggerCondition, context)) {
        extra.push({ ...p.effect });
      }
    }
    return [...baseEffects, ...extra];
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
   * クリティカル判定
   * @param criticalRate クリティカル率（%）
   * @returns クリティカルが発生したかどうか
   */
  static isCritical(criticalRate: number): boolean {
    const random = Math.random() * 100;
    return random < criticalRate;
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
    _playerAgility: number,
    speedRating: SpeedRating
  ): number {
    // 基本成功率
    let finalRate = skillSuccessRate.baseRate;
    // レビュー対応: 敏捷性の影響を廃止（skillSuccessRate.agilityInfluenceは無視）

    // タイピング影響（速度のみ反映）: SpeedRating をスコア(150/120/100/60)へ変換し線形加算
    const speedScore = { Fast: 150, Normal: 120, Slow: 80, Miss: 60 }[speedRating];
    const typingBonus = (speedScore - 100) * skillSuccessRate.typingInfluence;
    finalRate += typingBonus;

    // レビュー対応: 下限0%、上限200%
    return Math.max(0, Math.min(200, finalRate));
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
   * 効果の成功判定（ステータス影響込み）
   * @param effect スキル効果
   * @param attackerStats 攻撃者のステータス
   * @param defenderStats 防御者のステータス（オプション）
   * @returns 成功したかどうか
   */
  static isEffectSuccess(
    effect: SkillEffect,
    attackerStats?: { strength: number; willpower: number; agility: number; fortune: number },
    defenderStats?: { strength: number; willpower: number; agility: number; fortune: number }
  ): boolean {
    let finalSuccessRate = effect.successRate;

    // ステータス影響を計算
    if (effect.successRateInfluence && attackerStats && defenderStats) {
      const attackerStat = attackerStats[effect.successRateInfluence.stat];
      const defenderStat = defenderStats[effect.successRateInfluence.stat];
      const statDiff = attackerStat - defenderStat;
      const statBonus = statDiff * effect.successRateInfluence.rate;
      finalSuccessRate += statBonus;
    }

    // 0-100%にクランプ
    finalSuccessRate = Math.max(0, Math.min(100, finalSuccessRate));

    const random = Math.random() * 100;
    return random < finalSuccessRate;
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
    accuracyRating?: AccuracyRating
  ): number {
    // 基本率
    let finalRate = criticalRate.baseRate;

    // タイピング精度の影響を反映（影響度は criticalRate.typingInfluence で調整）
    if (accuracyRating) {
      const accuracyMultiplier = {
        Perfect: 2.0,
        Good: 1.5,
        Poor: 0.8,
      }[accuracyRating];

      const delta = accuracyMultiplier - 1.0; // -0.2, +0.5, +1.0
      const influence = criticalRate.typingInfluence ?? 1.0;
      // factor が負にならないように下限を0にクリップ
      const factor = Math.max(0, 1.0 + delta * influence);
      finalRate = finalRate * factor;
    }

    // クリティカル率の下限/上限（0〜100%）
    return Math.max(0, Math.min(100, finalRate));
  }

  /**
   * 3層判定システム全体を実行する
   * @param params パラメータオブジェクト
   * @returns 判定結果
   */
  static executeThreeLayerJudgment(params: {
    skill: Skill;
    target: BattleTarget;
    attackerStats: { strength: number; willpower: number; agility: number; fortune: number };
    defenderStats: { strength: number; willpower: number; agility: number; fortune: number };
    options?: { speedRating?: SpeedRating; accuracyRating?: AccuracyRating };
  }): {
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
    const { skill, target, attackerStats, defenderStats, options } = params;

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

    // スキル成功率判定（固定値なので旧方式）
    const skillSuccessRandom = Math.random() * 100;
    result.skillSuccess = skillSuccessRandom < skillSuccessRate;

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
      // 効果成功判定（ステータス影響込み）
      const effectSuccess = this.isEffectSuccess(effect, attackerStats, defenderStats);

      if (effectSuccess) {
        const power = this.calculateEffectPower(
          effect.basePower,
          attackerStats,
          effect.powerInfluence
        );

        // クリティカル判定
        // クリティカル率: スキル設定+幸運 を基礎に、タイピング精度のボーナスを適用
        const criticalRate = this.calculateSkillCriticalRate(skill.criticalRate, accuracyRating);
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

  /**
   * Player/Enemyからステータスを抽出する（内部ヘルパー）
   * @param target プレイヤーまたは敵
   * @returns ステータスオブジェクト
   */
  private static extractStats(
    target:
      | Player
      | Enemy
      | { bodyStats?: { stats?: Record<string, number> }; stats?: Record<string, number> }
  ): { strength: number; willpower: number; agility: number; fortune: number } {
    // Playerインスタンスの場合
    if (target instanceof Player) {
      const stats = target.getStats();
      return {
        strength: stats.getStrength(),
        willpower: stats.getWillpower(),
        agility: stats.getAgility(),
        fortune: stats.getFortune(),
      };
    }

    // Enemyインスタンスの場合
    if (target instanceof Enemy) {
      return {
        strength: target.stats.strength,
        willpower: target.stats.willpower,
        agility: target.stats.agility,
        fortune: target.stats.fortune,
      };
    }

    // モックオブジェクトの場合（テスト用）
    // bodyStats.stats または stats プロパティから取得
    if (target.bodyStats?.stats) {
      return {
        strength: target.bodyStats.stats.strength,
        willpower: target.bodyStats.stats.willpower,
        agility: target.bodyStats.stats.agility,
        fortune: target.bodyStats.stats.fortune,
      };
    }

    if (target.stats) {
      return {
        strength: target.stats.strength,
        willpower: target.stats.willpower,
        agility: target.stats.agility,
        fortune: target.stats.fortune,
      };
    }

    // デフォルト値（エラー回避用）
    return { strength: 0, willpower: 0, agility: 0, fortune: 0 };
  }

  /**
   * 効果のダメージ・回復範囲を計算する(敵の次回行動予告用)
   * effectPowerベースのシンプルな計算に統一
   * @param effect スキル効果
   * @param attacker 攻撃者
   * @returns ダメージ・回復の最小値と最大値
   */
  static calculateEffectDamageRange(
    effect: SkillEffect,
    attacker: Player | Enemy,
    _defender: Player | Enemy,
    _skill: Skill
  ): { min: number; max: number } {
    // 攻撃者のステータスを取得
    const attackerStats = this.extractStats(attacker);

    // 効果の威力を計算
    const effectPower = this.calculateEffectPower(
      effect.basePower,
      attackerStats,
      effect.powerInfluence
    );

    // 通常ダメージ(クリティカルなし)
    const minDamage = effectPower;

    // クリティカルダメージ(1.5倍)
    const maxDamage = Math.floor(effectPower * 1.5);

    return { min: minDamage, max: maxDamage };
  }

  /**
   * 効果の成功率を計算する（ステータス影響込み）
   * @param effect スキル効果
   * @param attackerStats 攻撃者のステータス
   * @param defenderStats 防御者のステータス
   * @returns 成功率（%）
   */
  static calculateEffectSuccessRate(
    effect: SkillEffect,
    attackerStats?: { strength: number; willpower: number; agility: number; fortune: number },
    defenderStats?: { strength: number; willpower: number; agility: number; fortune: number }
  ): number {
    let finalSuccessRate = effect.successRate;

    // ステータス影響を計算
    if (effect.successRateInfluence && attackerStats && defenderStats) {
      const attackerStat = attackerStats[effect.successRateInfluence.stat];
      const defenderStat = defenderStats[effect.successRateInfluence.stat];
      const statDiff = attackerStat - defenderStat;
      const statBonus = statDiff * effect.successRateInfluence.rate;
      finalSuccessRate += statBonus;
    }

    // 0-100%にクランプ
    return Math.max(0, Math.min(100, finalSuccessRate));
  }

  /**
   * スキルの属性タイプを取得する
   * @param skill スキル情報
   * @returns 物理または魔法
   */
  static getEffectType(skill: Skill): 'physical' | 'magical' {
    return skill.skillType;
  }
}
