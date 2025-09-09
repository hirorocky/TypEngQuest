import { Player } from '../player/Player';
import { BodyStats } from '../player/BodyStats';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';
import { TypingResult } from '../typing/types';
import { ComboBoostManager } from './ComboBoostManager';

/**
 * スキル実行結果の統一形式
 */
export interface SkillExecutionResult {
  success: boolean;
  damage: number;
  hpHealing?: number;
  mpCharge?: number;
  isCritical?: boolean;
  targetDefeated?: boolean;
  message: string[];
}

/**
 * BattleActionExecutorクラス - スキル/アイテム使用の実行と効果適用を担当
 *
 * 責務:
 * - スキル効果の計算（ダメージ、回復、ステータス変化）
 * - MP消費/回復処理
 * - 命中/回避判定
 * - クリティカル判定
 * - タイピング効果倍率の適用
 * - プレイヤー/敵へのダメージ適用
 */
export class BattleActionExecutor {
  // 既定の敵ターゲット生成（回避は通常どおり適用）
  private static buildEnemyTarget(enemy: Enemy) {
    return {
      physicalEvadeRate: enemy.physicalEvadeRate,
      magicalEvadeRate: enemy.magicalEvadeRate,
    } as const;
  }
  private static buildConditionContext(
    player: Player,
    enemy: Enemy,
    typingResult: TypingResult | undefined,
    playerStats: { agility: number }
  ) {
    const playerBodyStats = player.getBodyStats();
    const attackerMaxHp =
      typeof (playerBodyStats as unknown as { getMaxHP?: () => number }).getMaxHP === 'function'
        ? (playerBodyStats as unknown as { getMaxHP: () => number }).getMaxHP()
        : 0;

    return BattleCalculator.createConditionContext({
      attackerHP: { current: playerBodyStats.getCurrentHP(), max: attackerMaxHp },
      defenderHP: { current: enemy.currentHp, max: enemy.stats.maxHp },
      attackerAgility: playerStats.agility,
      typing: {
        speed: typingResult?.speedRating,
        accuracy: typingResult?.accuracyRating,
        exMode: false,
      },
      hasSelfBuff: (id: string) => playerBodyStats.getTemporaryStatuses().some(s => s.id === id),
      hasEnemyStatus: (_id: string) => false,
    });
  }

  private static prepareEffectiveSkill(
    baseSkill: Skill,
    context: ReturnType<typeof BattleCalculator.createConditionContext>
  ): Skill {
    const effectsWithPotential = BattleCalculator.mergePotentialEffects(
      baseSkill.effects,
      baseSkill.potentialEffects,
      context
    );

    const skillWithPotential: Skill = { ...baseSkill, effects: effectsWithPotential };
    // ComboBoost の適用は呼び出し元のマネージャで行うため、ここでは未適用
    const modified = skillWithPotential;
    const filteredEffects = modified.effects.filter(e =>
      BattleCalculator.isEffectConditionsMet(e.conditions, context)
    );
    return { ...modified, effects: filteredEffects };
  }
  /**
   * プレイヤーのスキル実行
   * @param skill 使用するスキル
   * @param player プレイヤー
   * @param enemy 敵
   * @param typingResult タイピング結果（オプション）
   * @returns スキル実行結果
   */
  static executePlayerSkill(
    skill: Skill,
    player: Player,
    enemy: Enemy,
    options: { comboBoostManager: ComboBoostManager; typingResult?: TypingResult }
  ): SkillExecutionResult {
    const playerBodyStats = player.getBodyStats();
    const playerStats = player.getTotalStats();
    const typingResult = options?.typingResult;

    const conditionContext = this.buildConditionContext(player, enemy, typingResult, playerStats);
    const skillPrepared = this.prepareEffectiveSkill(skill, conditionContext);
    // コンボブースト適用（MPコストやレート補正）
    const { modified: effectiveSkill } = options.comboBoostManager.applyToSkill(skillPrepared);

    // MPチェックと消費（プレイヤーのみ）
    const mpCheckResult = this.checkAndConsumeMp(playerBodyStats, effectiveSkill);
    if (mpCheckResult) {
      return mpCheckResult;
    }

    // タイピングの速度/精度を判定用に渡す（威力には影響させない）
    const speedRating = typingResult?.speedRating;
    const accuracyRating = typingResult?.accuracyRating;

    // 敵をBattleTargetとして扱う
    const enemyTarget = this.buildEnemyTarget(enemy);

    // 新しい3層判定システムを使用
    const judgmentResult = BattleCalculator.executeThreeLayerJudgment(
      effectiveSkill,
      enemyTarget,
      {
        strength: playerStats.strength,
        willpower: playerStats.willpower,
        agility: playerStats.agility,
        fortune: playerStats.fortune,
      },
      { speedRating, accuracyRating }
    );

    // MP回復処理
    const mpCharge = this.processMpRecovery(playerBodyStats, skill, typingResult);

    // スキル失敗の場合
    if (!judgmentResult.skillSuccess) {
      const message = this.generateSkillMessage(0, mpCharge, false, {
        skillName: effectiveSkill.name,
        messageType: 'skill_failed',
      });
      return {
        success: false,
        damage: 0,
        message,
        isCritical: false,
        mpCharge: mpCharge,
        targetDefeated: false,
      };
    }

    // 回避された場合
    if (judgmentResult.evaded) {
      const message = this.generateSkillMessage(0, mpCharge, false, {
        skillName: effectiveSkill.name,
        messageType: 'evaded',
      });
      return {
        success: true,
        damage: 0,
        message,
        isCritical: false,
        mpCharge: mpCharge,
        targetDefeated: false,
      };
    }

    // ダメージ適用
    if (judgmentResult.finalDamage > 0) {
      enemy.takeDamage(judgmentResult.finalDamage);
    }

    // メッセージ生成
    const messageType = judgmentResult.finalDamage > 0 ? 'success' : 'no_effect';
    const message = this.generateSkillMessage(
      judgmentResult.finalDamage,
      mpCharge,
      judgmentResult.isCritical,
      { skillName: effectiveSkill.name, messageType }
    );

    // コンボ消費 + このスキルが新たに付与するコンボを登録
    options.comboBoostManager.consumeOnce();
    options.comboBoostManager.register(skill.comboBoosts);

    return {
      success: true,
      damage: judgmentResult.finalDamage,
      message,
      isCritical: judgmentResult.isCritical,
      mpCharge: mpCharge,
      targetDefeated: enemy.isDefeated(),
    };
  }

  /**
   * 敵のスキル実行
   * @param skill 使用するスキル
   * @param enemy 敵
   * @param player プレイヤー
   * @returns スキル実行結果
   */
  static executeEnemySkill(skill: Skill, enemy: Enemy, player: Player): SkillExecutionResult {
    const playerStats = player.getTotalStats();

    // プレイヤーをターゲットとして扱うための一時オブジェクトを作成
    // BattleCalculator.executeThreeLayerJudgmentが汎用的なターゲットを受け取るように修正
    const playerTarget = {
      physicalEvadeRate: 5 + playerStats.agility / 20,
      magicalEvadeRate: 5 + playerStats.agility / 20, // 物理・魔法で同じ回避率
    };

    // 新しい3層判定システムを使用（敵視点）
    const judgmentResult = BattleCalculator.executeThreeLayerJudgment(
      skill,
      playerTarget, // プレイヤーをターゲットとして渡す
      {
        strength: enemy.stats.strength,
        willpower: enemy.stats.willpower,
        agility: enemy.stats.agility,
        fortune: enemy.stats.fortune,
      },
      { speedRating: 'Normal' } // 敵はタイピング評価なし（基準値）
    );

    // スキル失敗の場合
    if (!judgmentResult.skillSuccess) {
      const message = this.generateSkillMessage(0, 0, false, {
        skillName: enemy.name,
        messageType: 'skill_failed',
      });
      return {
        success: false,
        damage: 0,
        message,
        isCritical: false,
        targetDefeated: false,
      };
    }

    // 回避された場合
    if (judgmentResult.evaded) {
      const message = this.generateSkillMessage(0, 0, false, {
        skillName: enemy.name,
        messageType: 'evaded',
      });
      return {
        success: true,
        damage: 0,
        message,
        isCritical: false,
        targetDefeated: false,
      };
    }

    // ダメージ適用
    if (judgmentResult.finalDamage > 0) {
      player.getBodyStats().takeDamage(judgmentResult.finalDamage);
    }

    const messageType = judgmentResult.finalDamage > 0 ? 'success' : 'no_effect';
    const message = this.generateSkillMessage(
      judgmentResult.finalDamage,
      0, // 敵はMP回復なし
      judgmentResult.isCritical,
      {
        skillName: enemy.name,
        messageType,
      }
    );

    return {
      success: true,
      damage: judgmentResult.finalDamage,
      message,
      isCritical: judgmentResult.isCritical,
      targetDefeated: player.getBodyStats().getCurrentHP() <= 0,
    };
  }

  /**
   * MPチェックと消費を行う
   */
  private static checkAndConsumeMp(
    playerBodyStats: BodyStats,
    skill: Skill
  ): SkillExecutionResult | null {
    if (playerBodyStats.getCurrentMP() < skill.mpCost) {
      return {
        success: false,
        damage: 0,
        hpHealing: 0,
        mpCharge: 0,
        isCritical: false,
        targetDefeated: false,
        message: [
          `Not enough MP! Need ${skill.mpCost} MP but only have ${playerBodyStats.getCurrentMP()} MP.`,
        ],
      };
    }
    playerBodyStats.consumeMP(skill.mpCost);
    return null;
  }

  /**
   * MP回復処理を行う
   */
  private static processMpRecovery(
    playerBodyStats: BodyStats,
    skill: Skill,
    typingResult?: TypingResult
  ): number {
    const mpRecovered = BattleCalculator.calculateMpRecovery(
      skill.mpCharge,
      typingResult?.accuracyRating
    );

    if (mpRecovered > 0) {
      playerBodyStats.healMP(mpRecovered);
    }
    return mpRecovered;
  }

  /**
   * スキル使用メッセージを生成する
   */
  private static generateSkillMessage(
    damage: number,
    mpCharge: number,
    isCritical: boolean,
    options: {
      skillName?: string;
      messageType?: 'success' | 'skill_failed' | 'evaded' | 'no_effect';
    } = {}
  ): string[] {
    const { skillName, messageType = 'success' } = options;
    const message = [];

    if (skillName) {
      message.push(skillName);
    }

    switch (messageType) {
      case 'skill_failed':
        message.push('Skill failed.');
        break;
      case 'evaded':
        message.push('Attack was evaded.');
        break;
      case 'no_effect':
        message.push('No effect.');
        break;
      case 'success':
      default:
        if (isCritical) {
          message.push('Critical hit!');
        }
        message.push(`${damage} damage!`);
        break;
    }

    if (mpCharge > 0) {
      message.push(`Charged ${mpCharge} MP.`);
    }
    return message;
  }

  // 旧システムの補助メソッドは廃止（速度・精度の扱いはBattleCalculator側で集約）
}
