import { BodyStats, BodyStatsData } from './BodyStats';
import { EquipmentStats, EquipmentStatsData } from './EquipmentStats';
import { Inventory, InventoryData } from './Inventory';
import { ConsumableItem, EffectType, ItemRarity, ItemType } from '../items';
import { EquipmentItem, EquipmentStats as ItemEquipmentStats } from '../items/EquipmentItem';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';

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
  private equippedItems: EquipmentItem[] = [];
  private equipmentSlots: (EquipmentItem | null)[] = [null, null, null, null, null]; // 5つのスロット
  private equipmentCalculator: EquipmentEffectCalculator;

  /**
   * プレイヤーを初期化する
   * @param name - プレイヤーの名前
   */
  constructor(name: string, istestMode: boolean = false) {
    this.name = name;
    this.bodyStats = new BodyStats(0); // 初期レベルは0
    this.equipmentStats = new EquipmentStats();
    this.inventory = new Inventory();
    this.equipmentCalculator = new EquipmentEffectCalculator();
    if (istestMode) {
      this.bodyStats.takeDamage(50);
      this.bodyStats.consumeMP(20);
      for (let i = 0; i < 15; i++) {
        this.inventory.addItem(
          new ConsumableItem({
            id: `test-item-${i}`,
            name: `Test Item ${i}`,
            description: `This is a test item for the player.`,
            type: ItemType.CONSUMABLE,
            rarity: ItemRarity.COMMON,
            effects: [{ type: EffectType.HEAL_HP, value: 50 }],
          })
        );
      }

      // テスト用装備アイテムを追加
      const testEquipments = [
        new EquipmentItem({
          id: 'ancient-sword',
          name: 'ancient',
          description: 'An ancient blade with mysterious power',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.LEGENDARY,
          stats: { strength: 5, willpower: 5, agility: 0, fortune: 5 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'magical-shield',
          name: 'magical',
          description: 'A shield imbued with protective magic',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { strength: 0, willpower: 20, agility: -5, fortune: 0 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'swift-boots',
          name: 'swift',
          description: 'Boots that enhance movement speed',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.RARE,
          stats: { strength: 0, willpower: 0, agility: 20, fortune: 0 },
          grade: 20,
        }),
        new EquipmentItem({
          id: 'steel-sword',
          name: 'steel',
          description: 'A well-crafted steel sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 12, willpower: 0, agility: 3, fortune: 0 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'wooden-shield',
          name: 'wooden',
          description: 'A basic wooden shield for protection',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 0, willpower: 8, agility: 0, fortune: 0 },
          grade: 8,
        }),
        new EquipmentItem({
          id: 'powerful-gauntlets',
          name: 'powerful',
          description: 'Gauntlets that boost physical strength',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.RARE,
          stats: { strength: 18, willpower: 3, agility: 0, fortune: 0 },
          grade: 21,
        }),
        new EquipmentItem({
          id: 'blessed-amulet',
          name: 'blessed',
          description: 'An amulet blessed by divine power',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { strength: 0, willpower: 0, agility: 0, fortune: 20 },
          grade: 20,
        }),
        new EquipmentItem({
          id: 'crystal-orb',
          name: 'crystal',
          description: 'A mystical crystal orb',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.LEGENDARY,
          stats: { strength: 30, willpower: 0, agility: 20, fortune: 10 },
          grade: 60,
        }),
        new EquipmentItem({
          id: 'silver-ring',
          name: 'silver',
          description: 'A polished silver ring',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 0, willpower: 0, agility: 7, fortune: 3 },
          grade: 10,
        }),
        new EquipmentItem({
          id: 'enchanted-bow',
          name: 'enchanted',
          description: 'A bow enhanced with magical properties',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { strength: 22, willpower: 0, agility: 28, fortune: 0 },
          grade: 50,
        }),
      ];

      testEquipments.forEach(equipment => this.inventory.addItem(equipment));
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
   * プレイヤーのレベルを取得する（装備アイテムのグレード平均値）
   * @returns プレイヤーのレベル
   */
  getLevel(): number {
    return this.equipmentCalculator.calculateAverageGradeBySlots(this.equippedItems, 5);
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
    return this.equipmentCalculator.calculateTotalStats(this.equippedItems);
  }

  /**
   * 装備中のアイテムから使用可能な技を取得する
   * @returns 使用可能な技のリスト
   */
  getEquippedItemSkills(): Skill[] {
    return this.equipmentCalculator.getAvailableSkills(this.equippedItems);
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
    return [...this.equipmentSlots];
  }

  /**
   * 指定スロットにアイテムを装備する
   * @param slotIndex - スロットのインデックス（0-4）
   * @param equipment - 装備するアイテム（nullで装備解除）
   */
  equipToSlot(slotIndex: number, equipment: EquipmentItem | null): void {
    if (slotIndex < 0 || slotIndex >= 5) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    // 既存の装備を解除してインベントリに戻す
    const currentEquipment = this.equipmentSlots[slotIndex];
    if (currentEquipment) {
      this.inventory.addItem(currentEquipment);
    }

    // 新しい装備をセット
    this.equipmentSlots[slotIndex] = equipment;

    // 装備をインベントリから削除
    if (equipment) {
      this.inventory.removeItem(equipment);
    }

    // equippedItemsを更新
    this.equippedItems = this.equipmentSlots.filter(item => item !== null) as EquipmentItem[];

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
      const itemStats = item.getStats();
      this.equipmentStats.addStrength(itemStats.strength);
      this.equipmentStats.addWillpower(itemStats.willpower);
      this.equipmentStats.addAgility(itemStats.agility);
      this.equipmentStats.addFortune(itemStats.fortune);
    }
  }

  /**
   * 装備中のアイテム名を取得する
   * @returns 装備中のアイテム名の配列
   */
  getEquippedItemNames(): string[] {
    return this.equipmentSlots.map(item => (item ? item.getName() : ''));
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

    const player = new Player(data.name);
    player.bodyStats = BodyStats.fromJSON(data.bodyStats);
    player.equipmentStats = EquipmentStats.fromJSON(data.equipmentStats);
    player.inventory = Inventory.fromJSON(data.inventory);
    player.equipmentCalculator = new EquipmentEffectCalculator();

    return player;
  }

  /**
   * プレイヤーデータのバリデーションを行う
   * @param data - 検証するデータ
   * @throws {Error} データが不正な場合
   */
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

    if (typeof data.equipmentStats !== 'object' || data.equipmentStats === null) {
      throw new Error('Invalid player data');
    }

    if (typeof data.inventory !== 'object' || data.inventory === null) {
      throw new Error('Invalid player data');
    }
  }
}
