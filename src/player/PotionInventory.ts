import { ItemType } from '../items/types';
import { Potion } from '../items/Potion';

/**
 * ポーション専用インベントリ
 */
export class PotionInventory {
  private static readonly MAX_ITEMS: number = 100;
  private items: Potion[] = [];

  /**
   * インベントリを初期化する
   * @param items - 初期アイテム配列（オプション）
   */
  constructor(items?: Potion[]) {
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
  addItem(item: Potion): boolean {
    if (!item) {
      throw new Error('Item cannot be null');
    }

    if (this.items.length >= PotionInventory.MAX_ITEMS) {
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
  removeItem(item: Potion): boolean {
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
  hasItem(item: Potion): boolean {
    return this.items.includes(item);
  }

  /**
   * IDでアイテムを検索する
   * @param id - 検索するアイテムのID
   * @returns 見つかったアイテム、見つからない場合undefined
   */
  findItemById(id: string): Potion | undefined {
    return this.items.find(item => item.getId() === id);
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
  getItems(): Potion[] {
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
    return this.items.length >= PotionInventory.MAX_ITEMS;
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
   * 効果タイプでアイテムをフィルタリングする
   * @param effectType - フィルタリングする効果タイプ
   * @returns 該当するアイテムの配列
   */
  findItemsByEffectType(effectType: string): Potion[] {
    return this.items.filter(item => item.getEffects().some(effect => effect.type === effectType));
  }

  /**
   * JSONデータからPotionInventoryを復元する
   * @param data - JSONデータ
   * @returns PotionInventoryインスタンス
   * @throws {Error} 不正なデータの場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): PotionInventory {
    if (!PotionInventory.validateInventoryData(data)) {
      throw new Error('Invalid potion inventory data');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = data.items.map((itemData: any) => {
      if (itemData.type !== ItemType.POTION) {
        throw new Error(`Expected potion item, got: ${itemData.type}`);
      }
      return Potion.fromJSON(itemData);
    });

    return new PotionInventory(items);
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
