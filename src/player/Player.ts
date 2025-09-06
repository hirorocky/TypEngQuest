import { BodyStats, BodyStatsData } from './BodyStats';
import { EquipmentStats, EquipmentStatsData } from './EquipmentStats';
import { Inventory, InventoryData } from './Inventory';
import { ConsumableItem, EffectType, ItemRarity, ItemType } from '../items';
import { EquipmentItem, EquipmentStats as ItemEquipmentStats } from '../items/EquipmentItem';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';
import { DevelopmentConfigLoader } from '../core/DevelopmentConfigLoader';

/**
 * プレイヤーのセーブデータ形式を定義するインターフェース
 */
export interface PlayerData {
  name: string;
  bodyStats: BodyStatsData;
  equipmentStats: EquipmentStatsData;
  inventory: InventoryData;
}

/**
 * 総合ステータス結果の型
 */
export interface TotalStatsResult {
  strength: number;
  willpower: number;
  agility: number;
  fortune: number;
}

/**
 * プレイヤークラス - ゲーム内のプレイヤー情報を管理する
 */
export class Player {
  public readonly name: string;
  private bodyStats: BodyStats;
  private equipmentStats: EquipmentStats;
  private inventory: Inventory;
  private equippedItems: (EquipmentItem | null)[] = [null, null, null, null, null]; // 装備スロット
  private readonly equipmentSlotSize: number = 5; // 最大スロット数
  private equipmentCalculator: EquipmentEffectCalculator;

  /**
   * プレイヤーを初期化する
   * @param name - プレイヤーの名前
   */
  constructor(name: string, isDevMode: boolean = false) {
    this.name = name;
    this.bodyStats = new BodyStats(0); // 初期レベルは0
    this.equipmentStats = new EquipmentStats();
    this.inventory = new Inventory();
    this.equipmentCalculator = new EquipmentEffectCalculator();

    if (isDevMode) {
      // 開発モードの場合、JSONファイルから設定を読み込む
      this.loadDevModeConfig();
    }
  }
  /**
   * 開発モード用の設定をJSONから読み込む
   */
  private loadDevModeConfig(): void {
    try {
      // DevelopmentConfigLoaderを動的importで使用
      const configData = DevelopmentConfigLoader.loadPlayerConfigData();

      if (configData) {
        // Body Statsの調整
        if (configData.bodyStats?.hpDamage) {
          this.bodyStats.takeDamage(configData.bodyStats.hpDamage);
        }
        if (configData.bodyStats?.mpConsumption) {
          this.bodyStats.consumeMP(configData.bodyStats.mpConsumption);
        }

        // インベントリアイテムの追加
        if (configData.inventory) {
          this.loadInventoryFromConfig(configData.inventory);
        }

        // デフォルト装備品の設定
        if (configData.equippedItems && Array.isArray(configData.equippedItems)) {
          configData.equippedItems.forEach((itemData, slotIndex) => {
            if (itemData && slotIndex < this.equipmentSlotSize) {
              // JSONデータからEquipmentItemインスタンスを作成
              const item = new EquipmentItem(itemData);
              this.equipToSlot(slotIndex, item);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load dev mode config, using fallback data:', error);
      throw new Error('Failed to load development mode config');
    }
  }

  /**
   * JSON設定からインベントリアイテムを読み込む
   */
  private loadInventoryFromConfig(inventory: {
    consumableItems?: unknown[];
    equipmentItems?: unknown[];
  }): void {
    // 消費アイテムの追加
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
          effects: config.effects.map((effect: { type: string; value: number }) => ({
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

    // 装備アイテムの追加
    for (const itemConfig of inventory.equipmentItems || []) {
      try {
        const config = itemConfig as {
          id: string;
          name: string;
          description: string;
          type: string;
          rarity: string;
          stats: ItemEquipmentStats;
          grade: number;
        };
        const item = new EquipmentItem({
          id: config.id,
          name: config.name,
          description: config.description,
          type: this.parseItemType(config.type),
          rarity: this.parseItemRarity(config.rarity),
          stats: config.stats,
          grade: config.grade,
        });
        this.inventory.addItem(item);
      } catch (error) {
        console.warn(`Failed to load equipment item ${(itemConfig as { id: string }).id}:`, error);
        throw new Error(`Invalid equipment item config: ${(itemConfig as { id: string }).id}`);
      }
    }
  }

  /**
   * 文字列をItemTypeに変換する
   */
  private parseItemType(type: string): ItemType {
    switch (type.toLowerCase()) {
      case 'consumable':
        return ItemType.CONSUMABLE;
      case 'equipment':
        return ItemType.EQUIPMENT;
      default:
        throw new Error(`Unknown item type: ${type}`);
    }
  }

  /**
   * 文字列をItemRarityに変換する
   */
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

  /**
   * 文字列をEffectTypeに変換する
   */
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

  /**
   * プレイヤー名を取得する
   * @returns プレイヤー名
   */
  getName(): string {
    return this.name;
  }

  /**
   * EXポイントを取得する
   * @returns 現在のEXポイント
   */
  getExPoints(): number {
    return this.bodyStats.getCurrentEX();
  }

  /**
   * EXポイントを加算する（0未満にならない）
   * @param amount 加算量（負数で減算）
   */
  addExPoints(amount: number): void {
    this.bodyStats.addEX(amount);
  }

  /**
   * 指定量のEXポイントを消費する（不足時は何もしないでfalse）
   * @param amount 消費量
   * @returns 成功したらtrue
   */
  consumeExPoints(amount: number): boolean {
    return this.bodyStats.consumeEX(amount);
  }

  /**
   * プレイヤーのレベルを取得する（装備アイテムのグレード平均値）
   * @returns プレイヤーのレベル
   */
  getLevel(): number {
    const actualEquippedItems = this.equippedItems.filter(
      (item): item is EquipmentItem => item !== null
    );
    return this.equipmentCalculator.calculateAverageGradeBySlots(
      actualEquippedItems,
      this.equipmentSlotSize
    );
  }

  /**
   * プレイヤーの総合ステータスを取得する（BodyStats + EquipmentStats）
   * @returns BodyStatsインスタンス（装備ステータスが加算された状態）
   */
  getStats(): BodyStats {
    // BodyStatsの完全なクローンを作成
    const bodyStatsData = this.bodyStats.toJSON();
    const combinedStats = BodyStats.fromJSON(bodyStatsData);

    // 装備ステータスを一時的なブーストとして適用
    combinedStats.applyTemporaryBoost('strength', this.equipmentStats.getStrength());
    combinedStats.applyTemporaryBoost('willpower', this.equipmentStats.getWillpower());
    combinedStats.applyTemporaryBoost('agility', this.equipmentStats.getAgility());
    combinedStats.applyTemporaryBoost('fortune', this.equipmentStats.getFortune());

    return combinedStats;
  }

  /**
   * プレイヤーの身体ステータスを取得する
   * @returns BodyStatsインスタンス
   */
  getBodyStats(): BodyStats {
    return this.bodyStats;
  }

  /**
   * プレイヤーの装備ステータスを取得する
   * @returns EquipmentStatsインスタンス
   */
  getEquipmentStats(): EquipmentStats {
    return this.equipmentStats;
  }

  /**
   * BodyStats + EquipmentStatsの総合ステータスを取得する
   * @returns 総合ステータス
   */
  getTotalStats(): TotalStatsResult {
    return {
      strength: this.bodyStats.getStrength() + this.equipmentStats.getStrength(),
      willpower: this.bodyStats.getWillpower() + this.equipmentStats.getWillpower(),
      agility: this.bodyStats.getAgility() + this.equipmentStats.getAgility(),
      fortune: this.bodyStats.getFortune() + this.equipmentStats.getFortune(),
    };
  }

  /**
   * プレイヤーのインベントリを取得する
   * @returns Inventoryインスタンス
   */
  getInventory(): Inventory {
    return this.inventory;
  }

  /**
   * 装備アイテムを設定する
   * @param equipments - 装備するアイテムのリスト
   */
  setEquippedItems(equipments: EquipmentItem[]): void {
    this.equippedItems = [...equipments];
    // レベルが変わる可能性があるため、ステータスを更新（HP/MP/一時効果は保持）
    const newLevel = this.getLevel();
    this.bodyStats.updateLevel(newLevel);
  }

  /**
   * 装備中のアイテムのステータス合計を取得する
   * @returns 装備ステータスの合計
   */
  getEquippedItemStats(): ItemEquipmentStats {
    const actualEquippedItems = this.equippedItems.filter(
      (item): item is EquipmentItem => item !== null
    );
    return this.equipmentCalculator.calculateTotalStats(actualEquippedItems);
  }

  /**
   * 装備中のアイテムから使用可能な技を取得する
   * @returns 使用可能な技のリスト
   */
  getEquippedItemSkills(): Skill[] {
    const actualEquippedItems = this.equippedItems.filter(
      (item): item is EquipmentItem => item !== null
    );
    return this.equipmentCalculator.getAvailableSkills(actualEquippedItems);
  }

  /**
   * プレイヤーが使用可能なすべての技を取得する
   * @returns 使用可能なすべての技のリスト
   */
  getAllAvailableSkills(): Skill[] {
    // 基本攻撃スキルを追加
    const basicAttackSkill = Battle.getNormalAttackSkill();

    // 現在は装備から取得できる技のみと基本攻撃
    // 後でレベルに応じた技を追加する予定
    return [basicAttackSkill, ...this.getEquippedItemSkills()];
  }

  /**
   * 装備スロットの状態を取得する
   * @returns 装備スロットの配列
   */
  getEquipmentSlots(): (EquipmentItem | null)[] {
    return [...this.equippedItems];
  }

  /**
   * 指定スロットにアイテムを装備する
   * @param slotIndex - スロットのインデックス（0-4）
   * @param equipment - 装備するアイテム（nullで装備解除）
   */
  equipToSlot(slotIndex: number, equipment: EquipmentItem | null): void {
    if (slotIndex < 0 || slotIndex >= this.equipmentSlotSize) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    // 既存の装備を解除してインベントリに戻す
    const currentEquipment = this.equippedItems[slotIndex];
    if (currentEquipment) {
      this.inventory.addItem(currentEquipment);
    }

    // 新しい装備をセット
    this.equippedItems[slotIndex] = equipment;

    // 装備をインベントリから削除
    if (equipment) {
      this.inventory.removeItem(equipment);
    }

    // EquipmentStatsを更新
    this.updateEquipmentStats();

    // レベル更新
    const newLevel = this.getLevel();
    this.bodyStats.updateLevel(newLevel);
  }

  /**
   * 装備アイテムからEquipmentStatsを再計算する
   */
  private updateEquipmentStats(): void {
    this.equipmentStats.clear();

    for (const item of this.equippedItems) {
      if (item) {
        const itemStats = item.getStats();
        this.equipmentStats.addStrength(itemStats.strength);
        this.equipmentStats.addWillpower(itemStats.willpower);
        this.equipmentStats.addAgility(itemStats.agility);
        this.equipmentStats.addFortune(itemStats.fortune);
      }
    }
  }

  /**
   * 装備中のアイテム名を取得する
   * @returns 装備中のアイテム名の配列
   */
  getEquippedItemNames(): string[] {
    return this.equippedItems.map((item: EquipmentItem | null) => (item ? item.getName() : ''));
  }

  /**
   * プレイヤーデータをJSON形式で出力する
   * @returns プレイヤーデータのJSONオブジェクト
   */
  toJSON(): PlayerData {
    return {
      name: this.name,
      bodyStats: this.bodyStats.toJSON(),
      equipmentStats: this.equipmentStats.toJSON(),
      inventory: this.inventory.toJSON(),
    };
  }

  /**
   * JSONデータからプレイヤーを復元する
   * @param data - JSONデータ
   * @returns 復元されたプレイヤーインスタンス
   * @throws {Error} データが不正な場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): Player {
    Player.validatePlayerData(data);

    const legacyEx: unknown = (data as { exPoints?: unknown }).exPoints;

    const player = new Player(data.name);
    player.bodyStats = BodyStats.fromJSON(data.bodyStats);
    player.equipmentStats = EquipmentStats.fromJSON(data.equipmentStats);
    player.inventory = Inventory.fromJSON(data.inventory);
    player.equipmentCalculator = new EquipmentEffectCalculator();
    // 互換性: 旧形式のexPointsがあればBodyStatsに反映
    if (typeof legacyEx === 'number' && legacyEx >= 0) {
      player.bodyStats.addEX(Math.floor(legacyEx));
    }

    return player;
  }

  /**
   * プレイヤーデータのバリデーションを行う
   * @param data - 検証するデータ
   * @throws {Error} データが不正な場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
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

    if (typeof data.equipmentStats !== 'object' || data.equipmentStats === null) {
      throw new Error('Invalid player data');
    }

    if (typeof data.inventory !== 'object' || data.inventory === null) {
      throw new Error('Invalid player data');
    }
    // exPointsは旧形式の互換フィールドとして許容（型検証のみ）
    if (typeof data.exPoints !== 'undefined' && typeof data.exPoints !== 'number') {
      throw new Error('Invalid player data');
    }
  }
}
