import { Item, ItemType } from '../items/Item';
import { ConsumableItem } from '../items/ConsumableItem';

/**
 * インベントリのデータ構造
 */
export interface InventoryData {
  items: any[];
}

/**
 * インベントリクラス
 * プレイヤーのアイテム管理を行う
 */
export class Inventory {
  private static readonly MAX_ITEMS: number = 100;
  private items: Item[] = [];

  /**
   * インベントリを初期化する
   * @param items - 初期アイテム配列（オプション）
   */
  constructor(items?: Item[]) {
    if (items) {
      this.items = [...items];
    }
  }

  /**
   * アイテムを追加する
   * @param item - 追加するアイテム
   * @returns 追加に成功した場合true
   * @throws {Error} アイテムがnullの場合
   */
  addItem(item: Item): boolean {
    if (!item) {
      throw new Error('Item cannot be null');
    }

    if (this.items.length >= Inventory.MAX_ITEMS) {
      return false;
    }

    this.items.push(item);
    return true;
  }

  /**
   * アイテムを削除する
   * @param item - 削除するアイテム
   * @returns 削除に成功した場合true
   * @throws {Error} アイテムがnullの場合
   */
  removeItem(item: Item): boolean {
    if (!item) {
      throw new Error('Item cannot be null');
    }

    const index = this.items.findIndex(i => i.equals(item));
    if (index === -1) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }

  /**
   * アイテムを所持しているかチェックする
   * @param item - チェックするアイテム
   * @returns 所持している場合true
   */
  hasItem(item: Item): boolean {
    return this.items.some(i => i.equals(item));
  }

  /**
   * IDでアイテムを検索する
   * @param id - 検索するアイテムのID
   * @returns 見つかったアイテム、見つからない場合undefined
   */
  findItemById(id: string): Item | undefined {
    return this.items.find(item => item.getId() === id);
  }

  /**
   * タイプでアイテムをフィルタリングする
   * @param type - フィルタリングするタイプ
   * @returns 該当するアイテムの配列
   */
  findItemsByType(type: ItemType): Item[] {
    return this.items.filter(item => item.getType() === type);
  }

  /**
   * 全アイテムを削除する
   */
  clear(): void {
    this.items = [];
  }

  /**
   * 全アイテムを取得する
   * @returns アイテムの配列（コピー）
   */
  getItems(): Item[] {
    return [...this.items];
  }

  /**
   * アイテム数を取得する
   * @returns アイテム数
   */
  getItemCount(): number {
    return this.items.length;
  }

  /**
   * インベントリが満杯かチェックする
   * @returns 満杯の場合true
   */
  isFull(): boolean {
    return this.items.length >= Inventory.MAX_ITEMS;
  }

  /**
   * インベントリをJSONデータに変換する
   * @returns JSONデータ
   */
  toJSON(): InventoryData {
    return {
      items: this.items.map(item => item.toJSON()),
    };
  }

  /**
   * JSONデータからインベントリを復元する
   * @param data - JSONデータ
   * @returns インベントリインスタンス
   * @throws {Error} 不正なデータの場合
   */
  static fromJSON(data: any): Inventory {
    if (!Inventory.validateInventoryData(data)) {
      throw new Error('Invalid inventory data');
    }

    const items = data.items.map((itemData: any) => {
      switch (itemData.type) {
        case ItemType.CONSUMABLE:
          return ConsumableItem.fromJSON(itemData);
        default:
          return Item.fromJSON(itemData);
      }
    });

    return new Inventory(items);
  }

  /**
   * インベントリデータの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  private static validateInventoryData(data: any): data is InventoryData {
    return typeof data === 'object' && data !== null && Array.isArray(data.items);
  }
}
