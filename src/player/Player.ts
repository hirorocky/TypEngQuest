import { BodyStats, BodyStatsData } from './BodyStats';
import { EquipmentStats } from './EquipmentStats';
import { Inventory, InventoryData } from './Inventory';
import {
  AccessoryItem,
  AccessoryItemData,
  ConsumableItem,
  EffectType,
  ItemRarity,
  ItemType,
} from '../items';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { DevelopmentConfigLoader } from '../core/DevelopmentConfigLoader';
import {
  AccessoryCatalog,
  AccessoryEffectSlot,
  AccessorySlotManager,
  AggregateResult,
} from '../equipment/accessory';

export interface PlayerData {
  name: string;
  bodyStats: BodyStatsData;
  inventory: InventoryData;
  accessorySlots: (AccessoryItemData | null)[];
  worldLevel: number;
}

export interface TotalStatsResult {
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
}

export class Player {
  public readonly name: string;
  private bodyStats: BodyStats;
  private inventory: Inventory;
  private accessoryCatalog: AccessoryCatalog;
  private accessoryManager: AccessorySlotManager;
  private worldLevel: number;

  constructor(name: string, isDevMode: boolean = false) {
    this.name = name;
    this.bodyStats = new BodyStats(0);
    this.inventory = new Inventory();
    this.accessoryCatalog = AccessoryCatalog.load();
    this.accessoryManager = new AccessorySlotManager();
    this.worldLevel = 1;
    this.accessoryManager.setWorldLevel(this.worldLevel);

    if (isDevMode) {
      this.loadDevModeConfig();
    }
  }

  private loadDevModeConfig(): void {
    try {
      const configData = DevelopmentConfigLoader.loadPlayerConfigData();
      if (!configData) {
        return;
      }

      this.applyDevModeBodyStats(configData);
      this.applyDevModeWorldLevel(configData);

      if (configData.inventory) {
        this.loadInventoryFromConfig(configData.inventory);
      }

      this.applyDevModeEquippedAccessories(configData.equippedAccessories);
    } catch (error) {
      console.warn('Failed to load dev mode config, using fallback data:', error);
      throw new Error('Failed to load development mode config');
    }
  }

  private applyDevModeBodyStats(config: {
    bodyStats?: { hpDamage?: number; mpConsumption?: number };
  }): void {
    if (config.bodyStats?.hpDamage) {
      this.bodyStats.takeDamage(config.bodyStats.hpDamage);
    }
    if (config.bodyStats?.mpConsumption) {
      this.bodyStats.consumeMP(config.bodyStats.mpConsumption);
    }
  }

  private applyDevModeWorldLevel(config: { worldLevel?: number }): void {
    if (typeof config.worldLevel === 'number') {
      this.setWorldLevel(config.worldLevel);
    }
  }

  private applyDevModeEquippedAccessories(equipped?: (AccessoryItemData | null)[]): void {
    if (!equipped || equipped.length === 0) {
      return;
    }

    equipped.forEach((itemData, slotIndex) => {
      if (!itemData) {
        return;
      }
      if (slotIndex >= this.getAccessorySlotCount()) {
        return;
      }

      const existing = this.inventory.findItemById(itemData.id);
      let accessoryItem: AccessoryItem;

      if (existing instanceof AccessoryItem) {
        accessoryItem = existing;
      } else {
        accessoryItem = AccessoryItem.fromJSON(itemData, this.accessoryCatalog);
        this.inventory.addItem(accessoryItem);
      }

      this.equipToSlot(slotIndex, accessoryItem);
    });
  }

  private loadInventoryFromConfig(inventory: {
    consumableItems?: unknown[];
    accessoryItems?: unknown[];
  }): void {
    for (const itemConfig of inventory.consumableItems || []) {
      try {
        const config = itemConfig as {
          id: string;
          name: string;
          description: string;
          type: string;
          rarity: string;
          effects: { type: string; value: number }[];
        };
        const item = new ConsumableItem({
          id: config.id,
          name: config.name,
          description: config.description,
          type: this.parseItemType(config.type),
          rarity: this.parseItemRarity(config.rarity),
          effects: config.effects.map(effect => ({
            type: this.parseEffectType(effect.type),
            value: effect.value,
          })),
        });
        this.inventory.addItem(item);
      } catch (error) {
        console.warn(`Failed to load consumable item ${(itemConfig as { id: string }).id}:`, error);
        throw new Error(`Invalid consumable item config: ${(itemConfig as { id: string }).id}`);
      }
    }

    for (const itemConfig of inventory.accessoryItems || []) {
      try {
        const config = itemConfig as {
          id: string;
          name: string;
          description: string;
          type: string;
          rarity: string;
          definitionId: string;
          grade: number;
          subEffects?: AccessoryEffectSlot[];
        };

        const data: AccessoryItemData = {
          id: config.id,
          name: config.name,
          description: config.description,
          type: this.parseItemType(config.type),
          rarity: this.parseItemRarity(config.rarity),
          definitionId: config.definitionId,
          grade: config.grade,
          subEffects: config.subEffects,
        };

        const item = AccessoryItem.fromJSON(data, this.accessoryCatalog);
        this.inventory.addItem(item);
      } catch (error) {
        console.warn(`Failed to load accessory item ${(itemConfig as { id: string }).id}:`, error);
        throw new Error(`Invalid accessory item config: ${(itemConfig as { id: string }).id}`);
      }
    }
  }

  private parseItemType(type: string): ItemType {
    switch (type.toLowerCase()) {
      case 'consumable':
        return ItemType.CONSUMABLE;
      case 'accessory':
        return ItemType.ACCESSORY;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  private parseItemRarity(rarity: string): ItemRarity {
    switch (rarity.toLowerCase()) {
      case 'common':
        return ItemRarity.COMMON;
      case 'rare':
        return ItemRarity.RARE;
      case 'epic':
        return ItemRarity.EPIC;
      case 'legendary':
        return ItemRarity.LEGENDARY;
      default:
        throw new Error(`Unknown item rarity: ${rarity}`);
    }
  }

  private parseEffectType(effect: string): EffectType {
    switch (effect.toLowerCase()) {
      case 'heal_hp':
        return EffectType.HEAL_HP;
      case 'heal_mp':
        return EffectType.HEAL_MP;
      default:
        throw new Error(`Unknown effect type: ${effect}`);
    }
  }

  getName(): string {
    return this.name;
  }

  getExPoints(): number {
    return this.bodyStats.getCurrentEX();
  }

  addExPoints(amount: number): void {
    this.bodyStats.addEX(amount);
  }

  consumeExPoints(amount: number): boolean {
    return this.bodyStats.consumeEX(amount);
  }

  getLevel(): number {
    const equipped = this.accessoryManager.listEquipped();
    if (equipped.length === 0) {
      return 0;
    }
    const divisor = Math.max(1, this.accessoryManager.getUnlockedSlotCount());
    const totalGrade = equipped.reduce((sum, item) => sum + item.getAccessory().getGrade(), 0);
    return Math.floor(totalGrade / divisor);
  }

  getStats(): BodyStats {
    const aggregate = this.aggregateAccessoryEffects();
    const bodyStatsData = this.bodyStats.toJSON();
    const combined = BodyStats.fromJSON(bodyStatsData);
    const contribution = this.buildEquipmentStats(aggregate);

    combined.applyTemporaryBoost('strength', contribution.getStrength());
    combined.applyTemporaryBoost('willpower', contribution.getWillpower());
    combined.applyTemporaryBoost('agility', contribution.getAgility());
    combined.applyTemporaryBoost('fortune', contribution.getFortune());

    return combined;
  }

  getBodyStats(): BodyStats {
    return this.bodyStats;
  }

  getEquipmentStats(): EquipmentStats {
    const aggregate = this.aggregateAccessoryEffects();
    return this.buildEquipmentStats(aggregate);
  }

  getTotalStats(): TotalStatsResult {
    const aggregate = this.aggregateAccessoryEffects();
    return aggregate.total;
  }

  getInventory(): Inventory {
    return this.inventory;
  }

  setWorldLevel(level: number): void {
    this.worldLevel = Math.max(1, Math.min(level, 100));
    this.accessoryManager.setWorldLevel(this.worldLevel);
  }

  getWorldLevel(): number {
    return this.worldLevel;
  }

  unlockAccessorySlot(keyItemId: string): boolean {
    return this.accessoryManager.unlockByKeyItem(keyItemId);
  }

  getAccessorySlotCount(): number {
    return this.accessoryManager.getSlotState().length;
  }

  isAccessorySlotUnlocked(index: number): boolean {
    return this.accessoryManager.isSlotUnlocked(index);
  }

  getEquipmentSlots(): (AccessoryItem | null)[] {
    return this.accessoryManager.getSlotState().map(item => item ?? null);
  }

  equipToSlot(slotIndex: number, accessoryItem: AccessoryItem | null): void {
    if (slotIndex < 0 || slotIndex >= this.getAccessorySlotCount()) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const current = this.accessoryManager.getSlotState()[slotIndex];
    if (current) {
      this.accessoryManager.unequip(slotIndex);
      this.inventory.addItem(current);
    }

    if (accessoryItem) {
      this.accessoryManager.equip(slotIndex, accessoryItem);
      this.inventory.removeItem(accessoryItem);
    }

    this.bodyStats.updateLevel(this.getLevel());
  }

  getEquippedItemNames(): string[] {
    return this.getEquipmentSlots().map(item => (item ? item.getDisplayName() : ''));
  }

  getEquippedItemStats(): EquipmentStats {
    return this.getEquipmentStats();
  }

  getEquippedItemSkills(): Skill[] {
    return [];
  }

  getAllAvailableSkills(): Skill[] {
    const basicAttack = Battle.getNormalAttackSkill();
    return [basicAttack, ...this.getEquippedItemSkills()];
  }

  toJSON(): PlayerData {
    return {
      name: this.name,
      bodyStats: this.bodyStats.toJSON(),
      inventory: this.inventory.toJSON(),
      accessorySlots: this.accessoryManager
        .getSlotState()
        .map(item => (item ? (item.toJSON() as AccessoryItemData) : null)),
      worldLevel: this.worldLevel,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): Player {
    Player.validatePlayerData(data);

    const player = new Player(data.name);
    player.bodyStats = BodyStats.fromJSON(data.bodyStats);
    player.inventory = Inventory.fromJSON(data.inventory);
    player.setWorldLevel(data.worldLevel);

    data.accessorySlots.forEach((slotData: AccessoryItemData | null, index: number) => {
      if (!slotData) {
        return;
      }
      const accessoryItem = AccessoryItem.fromJSON(slotData, player.accessoryCatalog);
      player.accessoryManager.equip(index, accessoryItem);
      player.inventory.removeItem(accessoryItem);
    });

    player.bodyStats.updateLevel(player.getLevel());
    return player;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validatePlayerData(data: any): asserts data is PlayerData {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid player data');
    }
    if (typeof data.name !== 'string') {
      throw new Error('Invalid player data');
    }
    if (typeof data.bodyStats !== 'object' || data.bodyStats === null) {
      throw new Error('Invalid player data');
    }
    if (typeof data.inventory !== 'object' || data.inventory === null) {
      throw new Error('Invalid player data');
    }
    if (!Array.isArray(data.accessorySlots)) {
      throw new Error('Invalid player data');
    }
    if (typeof data.worldLevel !== 'number') {
      throw new Error('Invalid player data');
    }
  }

  private aggregateAccessoryEffects(): AggregateResult {
    return this.accessoryManager.aggregate({
      strength: this.bodyStats.getStrength(),
      willpower: this.bodyStats.getWillpower(),
      agility: this.bodyStats.getAgility(),
      fortune: this.bodyStats.getFortune(),
    });
  }

  private buildEquipmentStats(aggregate: AggregateResult): EquipmentStats {
    return new EquipmentStats({
      strength: aggregate.boost.strength - aggregate.penalty.strength,
      willpower: aggregate.boost.willpower - aggregate.penalty.willpower,
      agility: aggregate.boost.agility - aggregate.penalty.agility,
      fortune: aggregate.boost.fortune - aggregate.penalty.fortune,
    });
  }
}
