import { Item, ItemData, ItemType, ItemRarity } from './Item';

describe('Item', () => {
  describe('コンストラクタ', () => {
    it('正常な引数で初期化できる', () => {
      const item = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      expect(item.getId()).toBe('hp_potion');
      expect(item.getName()).toBe('HP Potion');
      expect(item.getDescription()).toBe('Restores 50 HP');
      expect(item.getType()).toBe(ItemType.CONSUMABLE);
      expect(item.getRarity()).toBe(ItemRarity.COMMON);
    });

    it('空文字列のIDでエラーを投げる', () => {
      expect(() => {
        new Item({
          id: '',
          name: 'HP Potion',
          description: 'Restores 50 HP',
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.COMMON,
        });
      }).toThrow('Item ID cannot be empty');
    });

    it('空文字列の名前でエラーを投げる', () => {
      expect(() => {
        new Item({
          id: 'hp_potion',
          name: '',
          description: 'Restores 50 HP',
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.COMMON,
        });
      }).toThrow('Item name cannot be empty');
    });
  });

  describe('toJSON', () => {
    it('正しいJSONデータを返す', () => {
      const item = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const jsonData = item.toJSON();

      expect(jsonData).toEqual({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
    });
  });

  describe('fromJSON', () => {
    it('正しいJSONデータからインスタンスを作成できる', () => {
      const jsonData: ItemData = {
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      };

      const item = Item.fromJSON(jsonData);

      expect(item.getId()).toBe('hp_potion');
      expect(item.getName()).toBe('HP Potion');
      expect(item.getDescription()).toBe('Restores 50 HP');
      expect(item.getType()).toBe(ItemType.CONSUMABLE);
      expect(item.getRarity()).toBe(ItemRarity.COMMON);
    });

    it('不正なJSONデータでエラーを投げる', () => {
      const invalidData = {
        id: 'hp_potion',
        name: 'HP Potion',
        // description missing
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      };

      expect(() => {
        Item.fromJSON(invalidData);
      }).toThrow('Invalid item data');
    });

    it('nullやundefinedでエラーを投げる', () => {
      expect(() => {
        Item.fromJSON(null);
      }).toThrow('Invalid item data');

      expect(() => {
        Item.fromJSON(undefined);
      }).toThrow('Invalid item data');
    });
  });

  describe('equals', () => {
    it('同じID、名前、説明、タイプ、レアリティのアイテムで真を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      expect(item1.equals(item2)).toBe(true);
    });

    it('異なるIDのアイテムで偽を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'mp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      expect(item1.equals(item2)).toBe(false);
    });

    it('異なる名前のアイテムで偽を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'hp_potion',
        name: 'MP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      expect(item1.equals(item2)).toBe(false);
    });

    it('異なる説明のアイテムで偽を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 100 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      expect(item1.equals(item2)).toBe(false);
    });

    it('異なるタイプのアイテムで偽を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
      });

      expect(item1.equals(item2)).toBe(false);
    });

    it('異なるレアリティのアイテムで偽を返す', () => {
      const item1 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const item2 = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
      });

      expect(item1.equals(item2)).toBe(false);
    });
  });

  describe('use', () => {
    it('基底クラスのuseメソッドは未実装エラーを投げる', async () => {
      const item = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      // Playerクラスのダミーオブジェクトを作成
      const mockPlayer = {} as any;

      await expect(item.use(mockPlayer)).rejects.toThrow('use method not implemented');
    });
  });

  describe('canUse', () => {
    it('基底クラスのcanUseメソッドは未実装エラーを投げる', () => {
      const item = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });

      // Playerクラスのダミーオブジェクトを作成
      const mockPlayer = {} as any;

      expect(() => item.canUse(mockPlayer)).toThrow('canUse method not implemented');
    });
  });

  describe('getDisplayName', () => {
    it('レアリティが反映された表示名を返す', () => {
      const commonItem = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
      });
      const rareItem = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
      });
      const epicItem = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
      });
      const legendaryItem = new Item({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
      });

      expect(commonItem.getDisplayName()).toBe('HP Potion');
      expect(rareItem.getDisplayName()).toBe('HP Potion (Rare)');
      expect(epicItem.getDisplayName()).toBe('HP Potion (Epic)');
      expect(legendaryItem.getDisplayName()).toBe('HP Potion (Legendary)');
    });
  });

  describe('ItemType enum', () => {
    it('正しい値を持つ', () => {
      expect(ItemType.CONSUMABLE).toBe('consumable');
      expect(ItemType.EQUIPMENT).toBe('equipment');
      expect(ItemType.KEY_ITEM).toBe('key_item');
    });
  });

  describe('ItemRarity enum', () => {
    it('正しい値を持つ', () => {
      expect(ItemRarity.COMMON).toBe('common');
      expect(ItemRarity.RARE).toBe('rare');
      expect(ItemRarity.EPIC).toBe('epic');
      expect(ItemRarity.LEGENDARY).toBe('legendary');
    });
  });
});
