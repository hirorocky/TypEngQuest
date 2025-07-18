import { Stats, StatsData } from './Stats';
import { Inventory, InventoryData } from './Inventory';
import { ConsumableItem, EffectType, ItemRarity, ItemType } from '../items';

/**
 * プレイヤーのセーブデータ形式を定義するインターフェース
 */
export interface PlayerData {
  name: string;
  level: number;
  stats: StatsData;
  inventory: InventoryData;
}

/**
 * プレイヤークラス - ゲーム内のプレイヤー情報を管理する
 */
export class Player {
  private static readonly DEFAULT_LEVEL = 1;

  public readonly name: string;
  private level: number;
  private stats: Stats;
  private inventory: Inventory;

  /**
   * プレイヤーを初期化する
   * @param name - プレイヤーの名前
   */
  constructor(name: string, istestMode: boolean = false) {
    this.name = name;
    this.level = Player.DEFAULT_LEVEL;
    this.stats = new Stats(this.level);
    this.inventory = new Inventory();
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
   * プレイヤーのレベルを取得する
   * @returns プレイヤーのレベル
   */
  getLevel(): number {
    return this.level;
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
   * プレイヤーデータをJSON形式で出力する
   * @returns プレイヤーデータのJSONオブジェクト
   */
  toJSON(): PlayerData {
    return {
      name: this.name,
      level: this.level,
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
    player.level = data.level;
    player.stats = Stats.fromJSON(data.stats);
    player.inventory = Inventory.fromJSON(data.inventory);

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

    if (typeof data.level !== 'number' || !Number.isInteger(data.level)) {
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
