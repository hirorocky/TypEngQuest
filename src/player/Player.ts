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
