import { Item, ItemData, ItemType, ItemRarity } from './Item';
import { Player } from '../player/Player';
import { TemporaryStatus, TemporaryStatusName } from '../player/TemporaryStatus';
import { randomUUID } from 'crypto';

/**
 * 効果タイプを定義する列挙型
 */
export enum EffectType {
  HEAL_HP = 'heal_hp',
  HEAL_MP = 'heal_mp',
  BUFF_ATTACK = 'buff_attack',
  BUFF_DEFENSE = 'buff_defense',
  BUFF_SPEED = 'buff_speed',
  BUFF_ACCURACY = 'buff_accuracy',
  BUFF_FORTUNE = 'buff_fortune',
}

/**
 * 効果の対象を定義する列挙型
 */
export enum EffectTarget {
  SELF = 'self',
  ENEMY = 'enemy',
}

/**
 * アイテム効果を定義するインターフェース
 */
export interface ItemEffect {
  type: EffectType;
  target: EffectTarget;
  value: number;
  duration?: number;
}

/**
 * ConsumableItemのデータ構造
 */
export interface ConsumableItemData extends ItemData {
  effects: ItemEffect[];
}

/**
 * 消費アイテムクラス
 * HP/MP回復、バフ効果などを持つ消費可能なアイテム
 */
export class ConsumableItem extends Item {
  private readonly effects: ItemEffect[];

  /**
   * 消費アイテムを初期化する
   * @param data - 消費アイテムの初期化データ
   * @throws {Error} 効果配列が空の場合
   */
  constructor(data: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    rarity: ItemRarity;
    effects: ItemEffect[];
  }) {
    super({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      rarity: data.rarity,
    });

    if (!data.effects || data.effects.length === 0) {
      throw new Error('ConsumableItem must have at least one effect');
    }

    this.effects = [...data.effects];
  }

  /**
   * アイテムの効果一覧を取得する
   * @returns 効果の配列
   */
  getEffects(): ItemEffect[] {
    return [...this.effects];
  }

  /**
   * アイテムが使用可能かチェックする
   * @param player - チェックするプレイヤー
   * @returns 使用可能な場合true
   */
  canUse(player: Player): boolean {
    // 効果のうち最低1つが使用可能なら使用可能
    return this.effects.some(effect => this.canUseEffect(effect, player));
  }

  /**
   * 個別の効果が使用可能かチェックする
   * @param effect - チェックする効果
   * @param player - チェックするプレイヤー
   * @returns 使用可能な場合true
   */
  private canUseEffect(effect: ItemEffect, player: Player): boolean {
    const stats = player.getStats();

    switch (effect.type) {
      case EffectType.HEAL_HP:
        return stats.getCurrentHP() < stats.getMaxHP();
      case EffectType.HEAL_MP:
        return stats.getCurrentMP() < stats.getMaxMP();
      case EffectType.BUFF_ATTACK:
      case EffectType.BUFF_DEFENSE:
      case EffectType.BUFF_SPEED:
      case EffectType.BUFF_ACCURACY:
      case EffectType.BUFF_FORTUNE:
        return true; // バフ効果は常に使用可能
      default:
        return false;
    }
  }

  /**
   * アイテムを使用する
   * @param player - 使用するプレイヤー
   * @throws {Error} 使用不可能な場合
   */
  async use(player: Player): Promise<void> {
    if (!this.canUse(player)) {
      throw new Error('Cannot use this item');
    }

    // 全ての効果を適用
    for (const effect of this.effects) {
      await this.applyEffect(effect, player);
    }
  }

  /**
   * 個別の効果を適用する
   * @param effect - 適用する効果
   * @param player - 適用先のプレイヤー
   */
  private async applyEffect(effect: ItemEffect, player: Player): Promise<void> {
    if (this.isHealingEffect(effect)) {
      this.applyHealingEffect(effect, player);
    } else if (this.isBuffEffect(effect)) {
      this.applyBuffEffectByType(effect, player);
    }
  }

  /**
   * 回復効果かどうかを判定する
   * @param effect - 効果
   * @returns 回復効果の場合true
   */
  private isHealingEffect(effect: ItemEffect): boolean {
    return effect.type === EffectType.HEAL_HP || effect.type === EffectType.HEAL_MP;
  }

  /**
   * バフ効果かどうかを判定する
   * @param effect - 効果
   * @returns バフ効果の場合true
   */
  private isBuffEffect(effect: ItemEffect): boolean {
    return [
      EffectType.BUFF_ATTACK,
      EffectType.BUFF_DEFENSE,
      EffectType.BUFF_SPEED,
      EffectType.BUFF_ACCURACY,
      EffectType.BUFF_FORTUNE,
    ].includes(effect.type);
  }

  /**
   * 回復効果を適用する
   * @param effect - 効果
   * @param player - プレイヤー
   */
  private applyHealingEffect(effect: ItemEffect, player: Player): void {
    const stats = player.getStats();
    if (effect.type === EffectType.HEAL_HP) {
      stats.healHP(effect.value);
    } else if (effect.type === EffectType.HEAL_MP) {
      stats.healMP(effect.value);
    }
  }

  /**
   * 効果タイプに応じてバフ効果を適用する
   * @param effect - 効果
   * @param player - プレイヤー
   */
  private applyBuffEffectByType(effect: ItemEffect, player: Player): void {
    const duration = effect.duration || 5;

    switch (effect.type) {
      case EffectType.BUFF_ATTACK:
        this.applyBuffEffect('attack', effect.value, duration, player);
        break;
      case EffectType.BUFF_DEFENSE:
        this.applyBuffEffect('defense', effect.value, duration, player);
        break;
      case EffectType.BUFF_SPEED:
        this.applyBuffEffect('speed', effect.value, duration, player);
        break;
      case EffectType.BUFF_ACCURACY:
        this.applyBuffEffect('accuracy', effect.value, duration, player);
        break;
      case EffectType.BUFF_FORTUNE:
        this.applyBuffEffect('fortune', effect.value, duration, player);
        break;
    }
  }

  /**
   * バフ効果を適用する
   * @param statType - ステータスタイプ
   * @param value - 効果値
   * @param duration - 継続時間
   * @param player - 適用先のプレイヤー
   */
  private applyBuffEffect(
    statType: 'attack' | 'defense' | 'speed' | 'accuracy' | 'fortune',
    value: number,
    duration: number,
    player: Player
  ): void {
    const buffStatus: TemporaryStatus = {
      id: `${statType}-buff-${randomUUID()}`,
      name: `${statType.charAt(0).toUpperCase() + statType.slice(1)} Up` as TemporaryStatusName,
      type: 'buff',
      effects: {
        [statType]: Math.abs(value),
      },
      duration,
      stackable: true,
    };
    player.getStats().addTemporaryStatus(buffStatus);
  }

  /**
   * アイテムをJSONデータに変換する
   * @returns JSONデータ
   */
  toJSON(): ConsumableItemData {
    return {
      id: this.getId(),
      name: this.getName(),
      description: this.getDescription(),
      type: this.getType(),
      rarity: this.getRarity(),
      effects: [...this.effects],
    };
  }

  /**
   * JSONデータから消費アイテムを復元する
   * @param data - JSONデータ
   * @returns 消費アイテムインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): ConsumableItem {
    if (!ConsumableItem.validateConsumableItemData(data)) {
      throw new Error('Invalid consumable item data');
    }

    return new ConsumableItem({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      rarity: data.rarity,
      effects: data.effects,
    });
  }

  /**
   * 消費アイテムデータの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateConsumableItemData(data: any): data is ConsumableItemData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      Object.values(ItemType).includes(data.type) &&
      Object.values(ItemRarity).includes(data.rarity) &&
      Array.isArray(data.effects) &&
      data.effects.length > 0 &&
      data.effects.every((effect: any) => ConsumableItem.validateEffect(effect))
    );
  }

  /**
   * 効果データの形式を検証する
   * @param effect - 検証する効果
   * @returns 有効な場合true
   */
  private static validateEffect(effect: any): effect is ItemEffect {
    return (
      typeof effect === 'object' &&
      effect !== null &&
      Object.values(EffectType).includes(effect.type) &&
      Object.values(EffectTarget).includes(effect.target) &&
      typeof effect.value === 'number' &&
      (effect.duration === undefined || typeof effect.duration === 'number')
    );
  }
}
