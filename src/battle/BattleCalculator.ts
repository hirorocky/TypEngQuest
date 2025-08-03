/**
 * BattleCalculatorクラス - 戦闘に関する計算処理を管理する
 */
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

    // クリティカル時は1.5倍
    if (isCritical) {
      baseDamage *= 1.5;
    }

    // 整数に変換して返す
    return Math.floor(baseDamage);
  }

  /**
   * 命中率計算
   * @param accuracy 精度ステータス
   * @param skillAccuracy 技の基本命中率
   * @returns 最終的な命中率（%）
   */
  static calculateHitRate(accuracy: number, skillAccuracy: number): number {
    // 基本命中率 = 90 + (精度 / 10)%
    let baseHitRate = 90 + accuracy / 10;

    // 最大99%、最小50%
    baseHitRate = Math.max(50, Math.min(99, baseHitRate));

    // 技の命中率を掛ける
    const finalHitRate = baseHitRate * (skillAccuracy / 100);

    return finalHitRate;
  }

  /**
   * 回避率計算
   * @param speed 速度ステータス
   * @returns 回避率（%）
   */
  static calculateEvadeRate(speed: number): number {
    // 基本回避率 = 5 + (速度 / 20)%
    let evadeRate = 5 + speed / 20;

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
   * 速度ボーナス計算（タイピング用）
   * @param speed 速度ステータス
   * @returns 速度ボーナス倍率
   */
  static calculateSpeedBonus(speed: number): number {
    // 速度ボーナス = 1.0 + (速度 / 200)
    return 1.0 + speed / 200;
  }

  /**
   * 精度ボーナス計算（タイピング用）
   * @param accuracy 精度ステータス
   * @returns 精度ボーナス倍率
   */
  static calculateAccuracyBonus(accuracy: number): number {
    // 精度ボーナス = 1.0 + (精度 / 200)
    return 1.0 + accuracy / 200;
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
}
