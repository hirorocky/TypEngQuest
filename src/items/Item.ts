import { Player } from '../player/Player';

/**
 * アイテムのタイプを定義する列挙型
 */
export enum ItemType {
  CONSUMABLE = 'consumable',
  ACCESSORY = 'accessory',
  EQUIPMENT = 'equipment',
  KEY_ITEM = 'key_item',
}

/**
 * アイテムのレアリティを定義する列挙型
 */
export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

/**
 * アイテムデータのインターフェース
 */
export interface ItemData {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
}

/**
 * アイテムの基底クラス
 * 全てのアイテムの共通機能を定義する
 */
export class Item {
  protected readonly id: string;
  protected readonly name: string;
  protected readonly description: string;
  protected readonly type: ItemType;
  protected readonly rarity: ItemRarity;

  /**
   * アイテムを初期化する
   * @param data - アイテムの初期化データ
   * @throws {Error} IDまたは名前が空文字列の場合
   */
  constructor(data: {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    rarity: ItemRarity;
  }) {
    if (!data.id || data.id.trim() === '') {
      throw new Error('Item ID cannot be empty');
    }
    if (!data.name || data.name.trim() === '') {
      throw new Error('Item name cannot be empty');
    }

    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.rarity = data.rarity;
  }

  /**
   * アイテムのIDを取得する
   * @returns アイテムのID
   */
  getId(): string {
    return this.id;
  }

  /**
   * アイテムの名前を取得する
   * @returns アイテムの名前
   */
  getName(): string {
    return this.name;
  }

  /**
   * アイテムの説明を取得する
   * @returns アイテムの説明
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * アイテムのタイプを取得する
   * @returns アイテムのタイプ
   */
  getType(): ItemType {
    return this.type;
  }

  /**
   * アイテムのレアリティを取得する
   * @returns アイテムのレアリティ
   */
  getRarity(): ItemRarity {
    return this.rarity;
  }

  /**
   * レアリティが反映された表示名を取得する
   * @returns 表示名
   */
  getDisplayName(): string {
    if (this.rarity === ItemRarity.COMMON) {
      return this.name;
    }
    const rarityText = this.rarity.charAt(0).toUpperCase() + this.rarity.slice(1);
    return `${this.name} (${rarityText})`;
  }

  /**
   * アイテムを使用する
   * @param _player - 使用するプレイヤー
   * @throws {Error} 基底クラスでは未実装
   */
  async use(_player: Player): Promise<void> {
    throw new Error('use method not implemented');
  }

  /**
   * アイテムが使用可能かチェックする
   * @param _player - チェックするプレイヤー
   * @returns 使用可能な場合true
   * @throws {Error} 基底クラスでは未実装
   */
  canUse(_player: Player): boolean {
    throw new Error('canUse method not implemented');
  }

  /**
   * アイテムが他のアイテムと同じかチェックする
   * @param other - 比較対象のアイテム
   * @returns 同じ場合true
   */
  equals(other: Item): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.description === other.description &&
      this.type === other.type &&
      this.rarity === other.rarity
    );
  }

  /**
   * アイテムをJSONデータに変換する
   * @returns JSONデータ
   */
  toJSON(): ItemData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      rarity: this.rarity,
    };
  }

  /**
   * JSONデータからアイテムを復元する
   * @param data - JSONデータ
   * @returns アイテムインスタンス
   * @throws {Error} 不正なデータの場合
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromJSON(data: any): Item {
    if (!Item.validateItemData(data)) {
      throw new Error('Invalid item data');
    }

    return new Item({
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      rarity: data.rarity,
    });
  }

  /**
   * アイテムデータの形式を検証する
   * @param data - 検証するデータ
   * @returns 有効な場合true
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static validateItemData(data: any): data is ItemData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      Object.values(ItemType).includes(data.type) &&
      Object.values(ItemRarity).includes(data.rarity)
    );
  }
}
