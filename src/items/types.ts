/**
 * アイテム共通の列挙やユーティリティ定義。
 * 具象アイテムクラスはここで定義されたインターフェースを実装する。
 */

export enum ItemType {
  POTION = 'potion',
  ACCESSORY = 'accessory',
  KEY_ITEM = 'key_item',
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: ItemType;
}

export function validateItemIdentity(data: Pick<ItemData, 'id' | 'name'>): void {
  if (!data.id || data.id.trim() === '') {
    throw new Error('Item ID cannot be empty');
  }
  if (!data.name || data.name.trim() === '') {
    throw new Error('Item name cannot be empty');
  }
}

export function isItemData(value: unknown): value is ItemData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const data = value as Partial<ItemData>;
  return (
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.description === 'string' &&
    Object.values(ItemType).includes(data.type as ItemType)
  );
}
