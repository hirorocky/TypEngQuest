import { Player, TotalStatsResult } from '../player/Player';
import { BodyStats } from '../player/BodyStats';
import { Enemy, EnemyStats } from './Enemy';
import { Skill } from './Skill';
import { BattleCalculator } from './BattleCalculator';
import { TypingResult } from '../typing/types';

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
    typingResult?: TypingResult
  ): SkillExecutionResult {
    const playerBodyStats = player.getBodyStats();
    const playerStats = player.getTotalStats();
    const enemyStats = enemy.stats;

    // MPチェックと消費
    const mpCheckResult = this.checkAndConsumeMp(playerBodyStats, skill);
    if (mpCheckResult) {
      return mpCheckResult;
    }

    // 命中判定
    const hitResult = this.checkHit(playerStats, enemyStats, skill, typingResult);
    if (hitResult) {
      // ミス時でもMP回復処理を行う
      const mpCharged = this.processMpRecovery(playerBodyStats, skill, typingResult);
      hitResult.mpCharge = mpCharged;
      if (mpCharged > 0) {
        hitResult.message.push(`Charged ${mpCharged} MP.`);
      }
      return hitResult;
    }

    // ダメージ計算と適用
    const { damage, isCritical } = this.calculateAndApplyDamage(
      {
        playerStats,
        enemyStats,
        skill,
        enemy,
      },
      typingResult
    );

    // MP回復処理
    const mpCharge = this.processMpRecovery(playerBodyStats, skill, typingResult);

    // メッセージ生成
    const message = this.generateSkillMessage(damage, mpCharge, isCritical);

    return {
      success: true,
      damage,
      message,
      isCritical: isCritical,
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
    const enemyStats = enemy.stats;

    // 命中判定
    const hitRate = BattleCalculator.calculateHitRate(skill.successRate);
    const evadeRate = BattleCalculator.calculateEvadeRate(playerStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        success: false,
        damage: 0,
        message: [`missed!`],
      };
    }

    // クリティカル判定
    const criticalRate = BattleCalculator.calculateCriticalRate(enemyStats.fortune);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    // ダメージ効果を検索
    const damageEffect = skill.effects.find(effect => effect.type === 'damage') as
      | { power: number }
      | undefined;
    const power = damageEffect?.power || 1.0;

    // ダメージ計算
    const damage = BattleCalculator.calculateDamage(
      enemyStats.strength,
      0, // プレイヤーへの攻撃では防御力を考慮しない
      power,
      isCritical
    );

    // ダメージを与える
    player.getBodyStats().takeDamage(damage);

    const message = [];
    isCritical && message.push('Critical hit!');
    damage > 0 && message.push(`${damage} damage!`);

    return {
      success: true,
      damage,
      message,
      isCritical: isCritical,
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
   * 命中判定を行う
   */
  private static checkHit(
    playerStats: TotalStatsResult,
    enemyStats: EnemyStats,
    skill: Skill,
    typingResult?: TypingResult
  ): SkillExecutionResult | null {
    const hitRate = this.calculateEnhancedHitRate(playerStats, skill, typingResult);
    const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.agility);

    if (!BattleCalculator.isHit(hitRate, evadeRate)) {
      return {
        success: false,
        damage: 0,
        hpHealing: 0,
        mpCharge: 0,
        isCritical: false,
        targetDefeated: false,
        message: [`missed!`],
      };
    }
    return null;
  }

  /**
   * ダメージ計算と適用を行う
   */
  private static calculateAndApplyDamage(
    context: {
      playerStats: TotalStatsResult;
      enemyStats: EnemyStats;
      skill: Skill;
      enemy: Enemy;
    },
    typingResult?: TypingResult
  ): { damage: number; isCritical: boolean } {
    const { playerStats, enemyStats, skill, enemy } = context;
    const criticalRate = this.calculateEnhancedCriticalRate(playerStats, typingResult);
    const isCritical = BattleCalculator.isCritical(criticalRate);

    // ダメージ効果を検索
    const damageEffect = skill.effects.find(effect => effect.type === 'damage') as
      | { power: number }
      | undefined;
    const power = damageEffect?.power || 1.0;

    let damage = BattleCalculator.calculateDamage(
      playerStats.strength,
      enemyStats.willpower,
      power,
      isCritical
    );

    damage = this.applyTypingEffectMultiplier(damage, typingResult);
    enemy.takeDamage(damage);

    return { damage, isCritical };
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
   * タイピング結果を考慮した命中率を計算する
   */
  private static calculateEnhancedHitRate(
    playerStats: TotalStatsResult,
    skill: Skill,
    typingResult?: TypingResult
  ): number {
    let hitRate = BattleCalculator.calculateHitRate(skill.successRate);

    if (typingResult?.isSuccess) {
      hitRate = BattleCalculator.calculateTypingSpeedBonus(
        hitRate,
        playerStats.agility,
        typingResult.speedRating
      );
    }

    return hitRate;
  }

  /**
   * タイピング結果を考慮したクリティカル率を計算する
   */
  private static calculateEnhancedCriticalRate(
    playerStats: TotalStatsResult,
    typingResult?: TypingResult
  ): number {
    let criticalRate = BattleCalculator.calculateCriticalRate(playerStats.fortune);

    if (typingResult?.isSuccess) {
      criticalRate = BattleCalculator.calculateTypingAccuracyBonus(
        criticalRate,
        playerStats.agility,
        typingResult.accuracyRating
      );
    }

    return criticalRate;
  }

  /**
   * タイピング効果倍率をダメージに適用する
   */
  private static applyTypingEffectMultiplier(damage: number, typingResult?: TypingResult): number {
    if (typingResult?.isSuccess) {
      const effectMultiplier = BattleCalculator.calculateTypingEffectMultiplier(
        typingResult.totalRating
      );
      return Math.floor(damage * effectMultiplier);
    }
    return damage;
  }

  /**
   * スキル使用メッセージを生成する
   */
  private static generateSkillMessage(
    damage: number,
    mpCharge: number,
    isCritical: boolean
  ): string[] {
    let message = [];
    if (isCritical) {
      message.push('Critical hit!');
    }
    message.push(`${damage} damage!`);
    if (mpCharge > 0) {
      message.push(`Charged ${mpCharge} MP.`);
    }
    return message;
  }
}
