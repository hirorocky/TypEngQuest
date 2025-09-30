import { Accessory } from '../items/accessory';

/**
 * アクセサリアイテム専用インベントリ
 */
export class AccessoryInventory {
  private static readonly MAX_ITEMS: number = 100;
  private items: Accessory[] = [];

  /**
   * インベントリを初期化する
   * @param items - 初期アイテム配列（オプション）
   */
  constructor(items?: Accessory[]) {
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
  addItem(item: Accessory): boolean {
    if (!item) {
      throw new Error('Item cannot be null');
    }

    if (this.items.length >= AccessoryInventory.MAX_ITEMS) {
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
  removeItem(item: Accessory): boolean {
    if (!item) {
      throw new Error('Item cannot be null');
    }

    const index = this.items.indexOf(item);
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
  hasItem(item: Accessory): boolean {
    return this.items.includes(item);
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
  getItems(): Accessory[] {
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
    return this.items.length >= AccessoryInventory.MAX_ITEMS;
  }

  /**
   * インベントリをJSONデータに変換する
   * @returns JSONデータ
   */
  toJSON(): { items: unknown[] } {
    return {
      items: this.items.map(item => item.toJSON()),
    };
  }

  /**
   * JSONデータからAccessoryInventoryを復元する
   * @param data - JSONデータ
   * @returns AccessoryInventoryインスタンス
   * @throws {Error} 不正なデータの場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): AccessoryInventory {
    if (!AccessoryInventory.validateInventoryData(data)) {
      throw new Error('Invalid accessory inventory data');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = data.items.map((itemData: any) => {
      return Accessory.fromJSON(itemData);
    });

    return new AccessoryInventory(items);
  }

  /**
   * インベントリデータの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateInventoryData(data: any): data is { items: unknown[] } {
    return typeof data === 'object' && data !== null && Array.isArray(data.items);
  }
}
