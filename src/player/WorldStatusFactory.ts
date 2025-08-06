import { WorldStatus, WorldStatusName } from './WorldStatus';
import { randomUUID } from 'crypto';

/**
 * ワールドステータスを生成するファクトリークラス
 * 標準的なワールドステータスのプリセットを提供する
 */
export class WorldStatusFactory {
  /**
   * Strength Blessing（攻撃力祝福）を生成する
   * @param boost - strengthの増加量
   * @returns ワールドステータス
   */
  static createStrengthBlessing(boost: number = 10): WorldStatus {
    return {
      id: `strength-blessing-${randomUUID()}`,
      name: 'Strength Blessing' as WorldStatusName,
      type: 'buff',
      effects: {
        strength: Math.abs(boost),
      },
      description: `このワールドでは戦士の力が祝福されている。strength +${Math.abs(boost)}`,
      stackable: false,
    };
  }

  /**
   * Willpower Blessing（意志力祝福）を生成する
   * @param boost - willpowerの増加量
   * @returns ワールドステータス
   */
  static createWillpowerBlessing(boost: number = 10): WorldStatus {
    return {
      id: `willpower-blessing-${randomUUID()}`,
      name: 'Willpower Blessing' as WorldStatusName,
      type: 'buff',
      effects: {
        willpower: Math.abs(boost),
      },
      description: `このワールドでは精神の力が祝福されている。willpower +${Math.abs(boost)}`,
      stackable: false,
    };
  }

  /**
   * Experience Boost（経験値ブースト）を生成する
   * @param multiplier - 経験値倍率（1.5 = 150%）
   * @returns ワールドステータス
   */
  static createExperienceBoost(multiplier: number = 1.5): WorldStatus {
    const percentage = Math.round((multiplier - 1) * 100);
    return {
      id: `exp-boost-${randomUUID()}`,
      name: 'Experience Boost' as WorldStatusName,
      type: 'buff',
      effects: {
        experienceMultiplier: multiplier,
      },
      description: `このワールドでは学習が加速している。経験値 +${percentage}%`,
      stackable: false,
    };
  }

  /**
   * Strength Curse（攻撃力呪い）を生成する
   * @param penalty - strengthの減少量
   * @returns ワールドステータス
   */
  static createStrengthCurse(penalty: number = 5): WorldStatus {
    return {
      id: `strength-curse-${randomUUID()}`,
      name: 'Strength Curse' as WorldStatusName,
      type: 'debuff',
      effects: {
        strength: -Math.abs(penalty),
      },
      description: `このワールドには力を奪う呪いがかかっている。strength -${Math.abs(penalty)}`,
      stackable: false,
    };
  }

  /**
   * Critical Master（クリティカルマスター）を生成する
   * @param bonus - クリティカル率ボーナス（%）
   * @returns ワールドステータス
   */
  static createCriticalMaster(bonus: number = 15): WorldStatus {
    return {
      id: `critical-master-${randomUUID()}`,
      name: 'Critical Master' as WorldStatusName,
      type: 'special',
      effects: {
        criticalRateBonus: Math.abs(bonus),
      },
      description: `このワールドでは会心の一撃が出やすい。クリティカル率 +${Math.abs(bonus)}%`,
      stackable: false,
    };
  }

  /**
   * MP Efficiency（MP効率化）を生成する
   * @param reduction - MP消費削減率（0.2 = 20%削減）
   * @returns ワールドステータス
   */
  static createMPEfficiency(reduction: number = 0.2): WorldStatus {
    const percentage = Math.round(reduction * 100);
    return {
      id: `mp-efficiency-${randomUUID()}`,
      name: 'MP Efficiency' as WorldStatusName,
      type: 'special',
      effects: {
        mpCostMultiplier: 1 - Math.abs(reduction),
      },
      description: `このワールドでは魔力が効率的に使える。MP消費 -${percentage}%`,
      stackable: false,
    };
  }

  /**
   * ランダムなワールドステータスを生成する
   * @returns ランダムなワールドステータス
   */
  static createRandom(): WorldStatus {
    const statuses = [
      () => this.createStrengthBlessing(),
      () => this.createWillpowerBlessing(),
      () => this.createExperienceBoost(),
      () => this.createStrengthCurse(),
      () => this.createCriticalMaster(),
      () => this.createMPEfficiency(),
    ];

    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex]();
  }
}
