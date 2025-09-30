import { BodyStats, BodyStatsData } from './BodyStats';
import { EquipmentStats } from './EquipmentStats';
import { PotionInventory, AccessoryInventory } from './Inventory';
import { Accessory, Potion, EffectType, ItemType } from '../items';
import {
  AccessoryCatalog,
  AccessorySlotManager,
  AccessorySubEffect,
  AccessorySynthesisService,
  AccessorySnapshot,
  AggregateResult,
} from '../items/accessory';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { DevelopmentConfigLoader } from '../core/DevelopmentConfigLoader';

export interface PlayerData {
  name: string;
  bodyStats: BodyStatsData;
  potionInventory: { items: unknown[] };
  accessoryInventory: { items: unknown[] };
  accessorySlots: (AccessorySnapshot | null)[];
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
  private potionInventory: PotionInventory;
  private accessoryInventory: AccessoryInventory;
  private accessoryManager: AccessorySlotManager;
  private synthesisService: AccessorySynthesisService;
  private worldLevel: number;

  constructor(name: string, isDevMode: boolean = false) {
    this.name = name;
    this.bodyStats = new BodyStats(0);
    this.potionInventory = new PotionInventory();
    this.accessoryInventory = new AccessoryInventory();
    this.accessoryManager = new AccessorySlotManager();
    const catalog = AccessoryCatalog.load();
    this.synthesisService = new AccessorySynthesisService(catalog);
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
        console.info('No dev mode config found, using default initialization');
        return;
      }

      this.applyDevModeBodyStats(configData);
      this.applyDevModeWorldLevel(configData);

      if (configData.inventory) {
        this.loadInventoryFromConfig(configData.inventory);
      }

      this.applyDevModeEquippedAccessories(configData.equippedAccessories);
    } catch (error) {
      console.warn('Failed to load dev mode config, using default initialization:', error);
      // エラーをスローせず、デフォルト初期化を続行
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

  private applyDevModeEquippedAccessories(equipped?: (AccessorySnapshot | null)[]): void {
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

      const accessoryItem = Accessory.fromJSON(itemData);
      this.accessoryInventory.addItem(accessoryItem);
      this.equipToSlot(slotIndex, accessoryItem);
    });
  }

  private loadInventoryFromConfig(inventory: {
    potionItems?: unknown[];
    accessoryItems?: unknown[];
  }): void {
    for (const itemConfig of inventory.potionItems || []) {
      try {
        const config = itemConfig as {
          id: string;
          name: string;
          description: string;
          type: string;
          effects: { type: string; value: number }[];
        };
        const item = new Potion({
          id: config.id,
          name: config.name,
          description: config.description,
          type: this.parseItemType(config.type),
          effects: config.effects.map(effect => ({
            type: this.parseEffectType(effect.type),
            value: effect.value,
          })),
        });
        this.potionInventory.addItem(item);
      } catch (error) {
        console.warn(`Failed to load potion ${(itemConfig as { id: string }).id}:`, error);
        throw new Error(`Invalid potion config: ${(itemConfig as { id: string }).id}`);
      }
    }

    for (const itemConfig of inventory.accessoryItems || []) {
      try {
        const config = itemConfig as {
          type: string;
          accessory: AccessorySnapshot;
        };

        const itemType = this.parseItemType(config.type);
        if (itemType !== ItemType.ACCESSORY) {
          throw new Error(`Expected accessory item, got: ${config.type}`);
        }
        if (!config.accessory) {
          throw new Error('Accessory config requires accessory snapshot');
        }

        const item = Accessory.fromJSON(config.accessory as AccessorySnapshot);
        this.accessoryInventory.addItem(item);
      } catch (error) {
        console.warn(`Failed to load accessory item:`, error);
        throw new Error(`Invalid accessory item config`);
      }
    }
  }

  private parseItemType(type: string): ItemType {
    switch (type.toLowerCase()) {
      case 'potion':
        return ItemType.POTION;
      case 'accessory':
        return ItemType.ACCESSORY;
      default:
        throw new Error(`Unknown item type: ${type}`);
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
    const totalGrade = equipped.reduce((sum, item) => sum + item.getGrade(), 0);
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

  getPotionInventory(): PotionInventory {
    return this.potionInventory;
  }

  /**
   * アクセサリインベントリを取得する
   * @returns アクセサリインベントリ
   */
  getAccessoryInventory(): AccessoryInventory {
    return this.accessoryInventory;
  }

  /**
   * アクセサリ合成の候補となるサブ効果一覧を取得する
   * @param base ベースアクセサリ
   * @param material 素材アクセサリ
   * @returns 合成で選択可能なサブ効果の配列
   */
  getAccessorySynthesisPool(base: Accessory, material: Accessory): AccessorySubEffect[] {
    if (!this.accessoryInventory.hasItem(base) || !this.accessoryInventory.hasItem(material)) {
      throw new Error('Synthesis requires both accessories to be stored in inventory');
    }

    return this.accessoryManager.getSynthesisOptions(base, material);
  }

  /**
   * アクセサリ合成を実行し、結果のアクセサリをインベントリへ追加する
   * @param base ベースアクセサリ
   * @param material 素材アクセサリ
   * @param selectedEffects 固定したいサブ効果一覧
   * @returns 合成後のアクセサリ
   */
  synthesizeAccessories(
    base: Accessory,
    material: Accessory,
    selectedEffects: AccessorySubEffect[]
  ): Accessory {
    if (!this.accessoryInventory.hasItem(base) || !this.accessoryInventory.hasItem(material)) {
      throw new Error('Cannot synthesize accessories that are not present in inventory');
    }

    const effects = selectedEffects.map(effect => ({ ...effect }));
    const result = this.synthesisService.synthesize(base, material, effects);

    if (!this.accessoryInventory.removeItem(base)) {
      throw new Error('Failed to consume base accessory during synthesis');
    }
    if (!this.accessoryInventory.removeItem(material)) {
      throw new Error('Failed to consume material accessory during synthesis');
    }

    this.accessoryInventory.addItem(result);
    return result;
  }

  /**
   * 後方互換性のためのメソッド - 消耗品インベントリを返す
   * @deprecated Use getPotionInventory() instead
   * @returns 消耗品インベントリ
   */
  getInventory(): PotionInventory {
    return this.potionInventory;
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

  getEquipmentSlots(): (Accessory | null)[] {
    return this.accessoryManager.getSlotState().map(item => item ?? null);
  }

  equipToSlot(slotIndex: number, accessoryItem: Accessory | null): void {
    if (slotIndex < 0 || slotIndex >= this.getAccessorySlotCount()) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const current = this.accessoryManager.getSlotState()[slotIndex];
    if (current) {
      this.accessoryManager.unequip(slotIndex);
      this.accessoryInventory.addItem(current);
    }

    if (accessoryItem) {
      this.accessoryManager.equip(slotIndex, accessoryItem);
      this.accessoryInventory.removeItem(accessoryItem);
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
      potionInventory: this.potionInventory.toJSON(),
      accessoryInventory: this.accessoryInventory.toJSON(),
      accessorySlots: this.accessoryManager
        .getSlotState()
        .map(item => (item ? item.toJSON() : null)),
      worldLevel: this.worldLevel,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): Player {
    Player.validatePlayerData(data);

    const player = new Player(data.name);
    player.bodyStats = BodyStats.fromJSON(data.bodyStats);

    player.potionInventory = PotionInventory.fromJSON(data.potionInventory);
    player.accessoryInventory = AccessoryInventory.fromJSON(data.accessoryInventory);

    player.setWorldLevel(data.worldLevel);

    data.accessorySlots.forEach((slotData: AccessorySnapshot | null, index: number) => {
      if (!slotData) {
        return;
      }
      const accessoryItem = Accessory.fromJSON(slotData);
      player.accessoryManager.equip(index, accessoryItem);
      player.accessoryInventory.removeItem(accessoryItem);
    });

    player.bodyStats.updateLevel(player.getLevel());
    return player;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validatePlayerData(data: any): asserts data is PlayerData {
    Player.validateBasicFields(data);
    Player.validateInventoryFields(data);
    Player.validateOtherFields(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateBasicFields(data: any): void {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid player data');
    }
    if (typeof data.name !== 'string') {
      throw new Error('Invalid player data');
    }
    if (typeof data.bodyStats !== 'object' || data.bodyStats === null) {
      throw new Error('Invalid player data');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateInventoryFields(data: any): void {
    if (!data.potionInventory || !data.accessoryInventory) {
      throw new Error('Invalid player data: missing inventory data');
    }

    Player.validateNewInventoryStructure(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateNewInventoryStructure(data: any): void {
    if (typeof data.potionInventory !== 'object' || data.potionInventory === null) {
      throw new Error('Invalid player data: invalid potion inventory');
    }
    if (typeof data.accessoryInventory !== 'object' || data.accessoryInventory === null) {
      throw new Error('Invalid player data: invalid accessory inventory');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateOtherFields(data: any): void {
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
