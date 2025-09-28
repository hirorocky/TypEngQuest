import { Accessory } from './Accessory';
import { AggregatedAccessoryEffects, AccessorySubEffect, AccessoryStat } from './types';

const MAX_SLOTS = 3;
const ACCESSORY_STATS: AccessoryStat[] = ['strength', 'willpower', 'agility', 'fortune'];

interface SlotState {
  accessoryItem: Accessory | null;
  unlocked: boolean;
  unlockKeyItemId?: string;
}

export interface AggregateResult extends AggregatedAccessoryEffects {
  total: Record<AccessoryStat, number>;
}

export class AccessorySlotManager {
  private readonly slots: SlotState[];
  private worldLevel: number = 1;

  constructor(slotUnlockKeys: (string | undefined)[] = [undefined, 'key_accessory_slot_2', 'key_accessory_slot_3']) {
    if (slotUnlockKeys.length !== MAX_SLOTS) {
      throw new Error('Slot unlock configuration must provide exactly three entries');
    }

    this.slots = slotUnlockKeys.map((keyItemId, index) => ({
      accessoryItem: null,
      unlocked: index === 0,
      unlockKeyItemId: keyItemId,
    }));
  }

  setWorldLevel(level: number): void {
    if (level < 1 || level > 100) {
      throw new Error('World level must be between 1 and 100');
    }
    this.worldLevel = level;
  }

  getWorldLevel(): number {
    return this.worldLevel;
  }

  unlockByKeyItem(keyItemId: string): boolean {
    const slot = this.slots.find(candidate => candidate.unlockKeyItemId === keyItemId);
    if (!slot) {
      return false;
    }
    if (slot.unlocked) {
      return false;
    }
    slot.unlocked = true;
    return true;
  }

  equip(slotIndex: number, accessoryItem: Accessory): void {
    this.assertSlotIndex(slotIndex);
    const slot = this.slots[slotIndex];
    if (!slot.unlocked) {
      throw new Error(`Slot ${slotIndex + 1} is not unlocked`);
    }

    slot.accessoryItem = accessoryItem;
  }

  unequip(slotIndex: number): void {
    this.assertSlotIndex(slotIndex);
    this.slots[slotIndex].accessoryItem = null;
  }

  clear(): void {
    this.slots.forEach(slot => {
      slot.accessoryItem = null;
    });
  }

  listEquipped(): Accessory[] {
    return this.slots
      .map(slot => slot.accessoryItem)
      .filter((item): item is Accessory => item !== null);
  }

  getSlotState(): (Accessory | null)[] {
    return this.slots.map(slot => slot.accessoryItem);
  }

  getUnlockedSlotCount(): number {
    return this.slots.filter(slot => slot.unlocked).length;
  }

  isSlotUnlocked(index: number): boolean {
    this.assertSlotIndex(index);
    return this.slots[index].unlocked;
  }

  aggregate(baseStats: Record<AccessoryStat, number>): AggregateResult {
    const aggregate: AggregatedAccessoryEffects = {
      boost: this.createEmptyStatMap(),
      penalty: this.createEmptyStatMap(),
      signatureBonus: 0,
      subEffects: [],
    };

    this.listEquipped().forEach(accessory => {
      const effect = accessory.getAggregatedEffect(baseStats);
      ACCESSORY_STATS.forEach(stat => {
        aggregate.boost[stat] += effect.boost[stat];
        aggregate.penalty[stat] += effect.penalty[stat];
      });
      aggregate.signatureBonus += effect.signatureBonus;
      aggregate.subEffects.push(...effect.subEffects);
    });

    const total = this.createEmptyStatMap();
    ACCESSORY_STATS.forEach(stat => {
      total[stat] = baseStats[stat] + aggregate.boost[stat] - aggregate.penalty[stat];
    });

    return {
      ...aggregate,
      total,
    };
  }

  getSynthesisOptions(baseAccessory: Accessory, materialAccessory: Accessory): AccessorySubEffect[] {
    if (baseAccessory.getDefinitionId() !== materialAccessory.getDefinitionId()) {
      throw new Error('Accessories must originate from the same definition for synthesis');
    }

    const map = new Map<string, AccessorySubEffect>();
    [...baseAccessory.getSubEffects(), ...materialAccessory.getSubEffects()].forEach(effect => {
      map.set(`${effect.effectType}:${effect.name}:${effect.magnitude}`, effect);
    });

    return Array.from(map.values()).map(effect => ({ ...effect }));
  }

  private createEmptyStatMap(): Record<AccessoryStat, number> {
    return {
      strength: 0,
      willpower: 0,
      agility: 0,
      fortune: 0,
    };
  }

  private assertSlotIndex(index: number): void {
    if (index < 0 || index >= MAX_SLOTS) {
      throw new Error(`Slot index out of range: ${index}`);
    }
  }
}
