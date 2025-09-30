import { ItemData, ItemType, isItemData } from './types';
import { Player } from '../player/Player';

/**
 * 効果タイプを定義する列挙型
 */
export enum EffectType {
  HEAL_HP = 'heal_hp',
  HEAL_MP = 'heal_mp',
}

/**
 * アイテム効果を定義するインターフェース
 */
export interface ItemEffect {
  type: EffectType;
  value: number;
}

/**
 * Potionのデータ構造
 */
export interface PotionData extends ItemData {
  effects: ItemEffect[];
}

/**
 * ポーションクラス
 * HP/MP回復効果を持つ消費可能なアイテム
 */
export class Potion {
  private readonly id: string;
  private readonly name: string;
  private readonly description: string;
  private readonly effects: ItemEffect[];

  constructor(data: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    effects: ItemEffect[];
  }) {
    if (data.type !== ItemType.POTION) {
      throw new Error('Potion must have type "potion"');
    }
    this.assertIdentity(data.id, data.name);

    if (!data.effects || data.effects.length === 0) {
      throw new Error('Potion must have at least one effect');
    }

    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.effects = data.effects.map(effect => ({ ...effect }));
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getType(): ItemType {
    return ItemType.POTION;
  }

  getDisplayName(): string {
    return this.name;
  }

  /**
   * 他のアイテムと等しいかチェックする
   * @param other - 比較するアイテム
   * @returns 等しい場合true
   */
  equals(other: Potion): boolean {
    return this.getId() === other.getId();
  }

  getEffects(): ItemEffect[] {
    return this.effects.map(effect => ({ ...effect }));
  }

  canUse(player: Player): boolean {
    return this.effects.some(effect => this.canUseEffect(effect, player));
  }

  private canUseEffect(effect: ItemEffect, player: Player): boolean {
    const bodyStats = player.getBodyStats();

    switch (effect.type) {
      case EffectType.HEAL_HP:
        return bodyStats.getCurrentHP() < bodyStats.getMaxHP();
      case EffectType.HEAL_MP:
        return bodyStats.getCurrentMP() < bodyStats.getMaxMP();
      default:
        return false;
    }
  }

  async use(player: Player): Promise<void> {
    if (!this.canUse(player)) {
      throw new Error('Cannot use this item');
    }

    for (const effect of this.effects) {
      await this.applyEffect(effect, player);
    }
  }

  private async applyEffect(effect: ItemEffect, player: Player): Promise<void> {
    this.applyHealingEffect(effect, player);
  }

  private applyHealingEffect(effect: ItemEffect, player: Player): void {
    const bodyStats = player.getBodyStats();
    if (effect.type === EffectType.HEAL_HP) {
      bodyStats.healHP(effect.value);
    } else if (effect.type === EffectType.HEAL_MP) {
      bodyStats.healMP(effect.value);
    }
  }

  toJSON(): PotionData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: ItemType.POTION,
      effects: this.getEffects(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): Potion {
    if (!Potion.validatePotionData(data)) {
      throw new Error('Invalid potion data');
    }

    return new Potion({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      effects: data.effects,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validatePotionData(data: any): data is PotionData {
    if (!isItemData(data) || data.type !== ItemType.POTION) {
      return false;
    }

    const candidate = data as { effects?: unknown };
    if (!Array.isArray(candidate.effects) || candidate.effects.length === 0) {
      return false;
    }

    return candidate.effects.every(effect => Potion.validateEffect(effect));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateEffect(effect: any): effect is ItemEffect {
    return (
      typeof effect === 'object' &&
      effect !== null &&
      Object.values(EffectType).includes(effect.type) &&
      typeof effect.value === 'number'
    );
  }

  private assertIdentity(id: string, name: string): void {
    if (!id || id.trim() === '') {
      throw new Error('Item ID cannot be empty');
    }
    if (!name || name.trim() === '') {
      throw new Error('Item name cannot be empty');
    }
  }
}
