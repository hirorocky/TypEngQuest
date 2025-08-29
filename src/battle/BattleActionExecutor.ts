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

    // MPチェックと消費（プレイヤーのみ）
    const mpCheckResult = this.checkAndConsumeMp(playerBodyStats, skill);
    if (mpCheckResult) {
      return mpCheckResult;
    }

    // タイピング評価を%に変換（100 = 100%）
    const typingScore = typingResult ? this.convertTypingResultToScore(typingResult) : 100;

    // 新しい3層判定システムを使用
    const judgmentResult = BattleCalculator.executeThreeLayerJudgment(
      skill,
      enemy,
      {
        strength: playerStats.strength,
        willpower: playerStats.willpower,
        agility: playerStats.agility,
        fortune: playerStats.fortune,
      },
      typingScore
    );

    // MP回復処理
    const mpCharge = this.processMpRecovery(playerBodyStats, skill, typingResult);

    // スキル失敗の場合
    if (!judgmentResult.skillSuccess) {
      const message = this.generateSkillMessage(0, mpCharge, false, {
        skillName: skill.name,
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
        skillName: skill.name,
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
      { skillName: skill.name, messageType }
    );

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

    // 敵はMP制約なし（新仕様）- MP関連処理を除去

    // 新しい3層判定システムを使用（敵視点）
    const judgmentResult = BattleCalculator.executeThreeLayerJudgment(
      skill,
      // 敵が攻撃する場合、プレイヤーを「敵」として扱う必要があるが、
      // 現在のシステムではプレイヤーに回避率がないため、簡素化した判定を使用
      enemy, // ダミー（実際には使用されない）
      {
        strength: enemy.stats.strength,
        willpower: enemy.stats.willpower,
        agility: enemy.stats.agility,
        fortune: enemy.stats.fortune,
      },
      100 // 敵はタイピング評価なし（基準値）
    );

    // プレイヤーへの回避判定は別途実装（プレイヤーには固定回避率を使用）
    const playerEvadeRate = 5 + playerStats.agility / 20; // 従来の計算式
    const isEvaded = Math.random() * 100 < playerEvadeRate;

    // スキル失敗の場合
    if (!judgmentResult.skillSuccess) {
      return {
        success: false,
        damage: 0,
        message: [`${enemy.name}のスキルが失敗しました`],
        isCritical: false,
        targetDefeated: false,
      };
    }

    // 回避された場合
    if (isEvaded) {
      return {
        success: true,
        damage: 0,
        message: [`${enemy.name}の攻撃を回避しました`],
        isCritical: false,
        targetDefeated: false,
      };
    }

    // ダメージ適用
    if (judgmentResult.finalDamage > 0) {
      player.getBodyStats().takeDamage(judgmentResult.finalDamage);
    }

    const message = this.generateSkillMessage(
      judgmentResult.finalDamage,
      0, // 敵はMP回復なし
      judgmentResult.isCritical,
      {
        skillName: enemy.name,
        messageType: judgmentResult.finalDamage > 0 ? 'success' : 'no_effect',
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
    let hitRate = BattleCalculator.calculateHitRate(skill.skillSuccessRate.baseRate);

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
        message.push('スキルが失敗しました');
        break;
      case 'evaded':
        message.push('攻撃が回避されました');
        break;
      case 'no_effect':
        message.push('効果がありませんでした');
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

  /**
   * タイピング結果を%スコアに変換する
   * @private
   */
  private static convertTypingResultToScore(typingResult: TypingResult): number {
    // accuracyRatingとspeedRatingから総合評価を計算
    const accuracyScore = {
      Perfect: 150,
      Good: 120,
      Poor: 80,
    }[typingResult.accuracyRating];

    const speedScore = {
      Fast: 150,
      Normal: 120,
      Slow: 80,
      Miss: 60,
    }[typingResult.speedRating];

    // 平均を取って最終スコア
    return Math.floor((accuracyScore + speedScore) / 2);
  }
}
