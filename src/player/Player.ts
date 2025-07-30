import { Stats, StatsData } from './Stats';
import { Inventory, InventoryData } from './Inventory';
import { ConsumableItem, EffectType, ItemRarity, ItemType } from '../items';
import { EquipmentItem, EquipmentStats, Skill } from '../items/EquipmentItem';
import { EquipmentEffectCalculator } from '../equipment/EquipmentEffectCalculator';

/**
 * プレイヤーのセーブデータ形式を定義するインターフェース
 */
export interface PlayerData {
  name: string;
  stats: StatsData;
  inventory: InventoryData;
}

/**
 * プレイヤークラス - ゲーム内のプレイヤー情報を管理する
 */
export class Player {
  public readonly name: string;
  private stats: Stats;
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
    this.stats = new Stats(0); // 初期レベルは0（装備なし）
    this.inventory = new Inventory();
    this.equipmentCalculator = new EquipmentEffectCalculator();
    if (istestMode) {
      this.stats.takeDamage(50);
      this.stats.consumeMP(20);
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
          stats: { attack: 5, defense: 5, speed: 0, accuracy: 0, fortune: 5 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'magical-shield',
          name: 'magical',
          description: 'A shield imbued with protective magic',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { attack: 0, defense: 20, speed: -5, accuracy: 0, fortune: 0 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'swift-boots',
          name: 'swift',
          description: 'Boots that enhance movement speed',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.RARE,
          stats: { attack: 0, defense: 0, speed: 15, accuracy: 5, fortune: 0 },
          grade: 20,
        }),
        new EquipmentItem({
          id: 'steel-sword',
          name: 'steel',
          description: 'A well-crafted steel sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 12, defense: 0, speed: 0, accuracy: 3, fortune: 0 },
          grade: 15,
        }),
        new EquipmentItem({
          id: 'wooden-shield',
          name: 'wooden',
          description: 'A basic wooden shield for protection',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 8, speed: 0, accuracy: 0, fortune: 0 },
          grade: 8,
        }),
        new EquipmentItem({
          id: 'powerful-gauntlets',
          name: 'powerful',
          description: 'Gauntlets that boost physical strength',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.RARE,
          stats: { attack: 18, defense: 3, speed: 0, accuracy: 0, fortune: 0 },
          grade: 21,
        }),
        new EquipmentItem({
          id: 'blessed-amulet',
          name: 'blessed',
          description: 'An amulet blessed by divine power',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { attack: 0, defense: 0, speed: 0, accuracy: 0, fortune: 20 },
          grade: 20,
        }),
        new EquipmentItem({
          id: 'crystal-orb',
          name: 'crystal',
          description: 'A mystical crystal orb',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.LEGENDARY,
          stats: { attack: 30, defense: 0, speed: 5, accuracy: 15, fortune: 10 },
          grade: 60,
        }),
        new EquipmentItem({
          id: 'silver-ring',
          name: 'silver',
          description: 'A polished silver ring',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 0, speed: 2, accuracy: 5, fortune: 3 },
          grade: 10,
        }),
        new EquipmentItem({
          id: 'enchanted-bow',
          name: 'enchanted',
          description: 'A bow enhanced with magical properties',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.EPIC,
          stats: { attack: 22, defense: 0, speed: 8, accuracy: 20, fortune: 0 },
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
   * プレイヤーのステータスを取得する
   * @returns Statsインスタンス
   */
  getStats(): Stats {
    return this.stats;
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
    this.stats.updateLevel(newLevel);
  }

  /**
   * 装備中のアイテムのステータス合計を取得する
   * @returns 装備ステータスの合計
   */
  getEquippedItemStats(): EquipmentStats {
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

    // レベル更新
    const newLevel = this.getLevel();
    this.stats.updateLevel(newLevel);
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
      stats: this.stats.toJSON(),
      inventory: this.inventory.toJSON(),
    };
  }

  /**
   * JSONデータからプレイヤーを復元する
   * @param data - JSONデータ
   * @returns 復元されたプレイヤーインスタンス
   * @throws {Error} データが不正な場合
   */
  static fromJSON(data: any): Player {
    Player.validatePlayerData(data);

    const player = new Player(data.name);
    player.stats = Stats.fromJSON(data.stats);
    player.inventory = Inventory.fromJSON(data.inventory);
    player.equipmentCalculator = new EquipmentEffectCalculator();

    return player;
  }

  /**
   * プレイヤーデータのバリデーションを行う
   * @param data - 検証するデータ
   * @throws {Error} データが不正な場合
   */
  private static validatePlayerData(data: any): asserts data is PlayerData {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid player data');
    }

    if (typeof data.name !== 'string') {
      throw new Error('Invalid player data');
    }

    if (typeof data.stats !== 'object' || data.stats === null) {
      throw new Error('Invalid player data');
    }

    if (typeof data.inventory !== 'object' || data.inventory === null) {
      throw new Error('Invalid player data');
    }
  }
}
