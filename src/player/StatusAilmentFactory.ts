import { TemporaryStatus, TemporaryStatusName } from './TemporaryStatus';
import { randomUUID } from 'crypto';

/**
 * 状態異常を生成するファクトリークラス
 * 標準的な状態異常のプリセットを提供する
 */
export class StatusAilmentFactory {
  /**
   * 毒状態異常を生成する
   * @param duration - 継続期間（ターン数）
   * @param damage - 毎ターンのダメージ量
   * @returns 毒の一時ステータス
   */
  static createPoison(duration: number = 3, damage: number = 3): TemporaryStatus {
    return {
      id: `poison-${randomUUID()}`,
      name: 'Poison' as TemporaryStatusName,
      type: 'status_ailment',
      effects: {
        hpPerTurn: -Math.abs(damage), // ダメージは負の値
        cannotRun: true, // 毒状態では逃走できない
      },
      duration,
      stackable: false, // 毒は重複しない
    };
  }

  /**
   * 麻痺状態異常を生成する
   * @param duration - 継続期間（ターン数）
   * @returns 麻痺の一時ステータス
   */
  static createParalysis(duration: number = 2): TemporaryStatus {
    return {
      id: `paralysis-${randomUUID()}`,
      name: 'Paralysis' as TemporaryStatusName,
      type: 'status_ailment',
      effects: {
        cannotAct: true, // 行動不能
        speed: -5, // 速度低下
      },
      duration,
      stackable: false, // 麻痺は重複しない
    };
  }

  /**
   * 睡眠状態異常を生成する
   * @param duration - 継続期間（ターン数）
   * @returns 睡眠の一時ステータス
   */
  static createSleep(duration: number = 2): TemporaryStatus {
    return {
      id: `sleep-${randomUUID()}`,
      name: 'Sleep' as TemporaryStatusName,
      type: 'status_ailment',
      effects: {
        cannotAct: true, // 行動不能
        defense: -3, // 防御力低下（無防備）
      },
      duration,
      stackable: false, // 睡眠は重複しない
    };
  }

  /**
   * 攻撃力アップバフを生成する
   * @param duration - 継続期間（ターン数）
   * @param boost - 攻撃力の増加量
   * @returns 攻撃力アップの一時ステータス
   */
  static createAttackBoost(duration: number = 3, boost: number = 5): TemporaryStatus {
    return {
      id: `attack-boost-${randomUUID()}`,
      name: 'Attack Up' as TemporaryStatusName,
      type: 'buff',
      effects: {
        attack: Math.abs(boost), // 正の値にする
      },
      duration,
      stackable: true, // バフは重複可能
    };
  }

  /**
   * 防御力アップバフを生成する
   * @param duration - 継続期間（ターン数）
   * @param boost - 防御力の増加量
   * @returns 防御力アップの一時ステータス
   */
  static createDefenseBoost(duration: number = 3, boost: number = 5): TemporaryStatus {
    return {
      id: `defense-boost-${randomUUID()}`,
      name: 'Defense Up' as TemporaryStatusName,
      type: 'buff',
      effects: {
        defense: Math.abs(boost), // 正の値にする
      },
      duration,
      stackable: true, // バフは重複可能
    };
  }

  /**
   * 全ステータスダウンデバフを生成する
   * @param duration - 継続期間（ターン数）
   * @param penalty - ステータスの減少量
   * @returns 全ステータスダウンの一時ステータス
   */
  static createAllStatsDown(duration: number = 2, penalty: number = 2): TemporaryStatus {
    const abspenalty = Math.abs(penalty);
    return {
      id: `all-stats-down-${randomUUID()}`,
      name: 'All Stats Down' as TemporaryStatusName,
      type: 'debuff',
      effects: {
        attack: -abspenalty,
        defense: -abspenalty,
        speed: -abspenalty,
        accuracy: -abspenalty,
        fortune: -abspenalty,
      },
      duration,
      stackable: false, // デバフは重複しない
    };
  }

  /**
   * 再生効果を生成する
   * @param duration - 継続期間（ターン数）
   * @param healAmount - 毎ターンの回復量
   * @returns 再生の一時ステータス
   */
  static createRegeneration(duration: number = 5, healAmount: number = 5): TemporaryStatus {
    return {
      id: `regeneration-${randomUUID()}`,
      name: 'Regeneration' as TemporaryStatusName,
      type: 'buff',
      effects: {
        hpPerTurn: Math.abs(healAmount), // 正の値にする
      },
      duration,
      stackable: false, // 再生は重複しない
    };
  }
}
