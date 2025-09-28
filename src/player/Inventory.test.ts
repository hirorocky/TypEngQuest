import { PotionInventory } from './Inventory';
import { Potion, EffectType } from '../items/Potion';
import { ItemType } from '../items/types';

describe('Inventory', () => {
  let inventory: PotionInventory;
  let testItem: Potion;

  beforeEach(() => {
    inventory = new PotionInventory();
    testItem = new Potion({
      id: 'test-item',
      name: 'Test Item',
      description: 'Test item description',
      type: ItemType.POTION,
      effects: [{ type: EffectType.HEAL_HP, value: 50 }],
    });
  });

  describe('constructor', () => {
    it('空のインベントリを作成する', () => {
      const newInventory = new PotionInventory();
      expect(newInventory.getItems()).toEqual([]);
      expect(newInventory.getItemCount()).toBe(0);
    });

    it('アイテムを指定してインベントリを作成する', () => {
      const newInventory = new PotionInventory([testItem]);
      expect(newInventory.getItems()).toHaveLength(1);
      expect(newInventory.getItems()[0]).toBe(testItem);
    });
  });

  describe('addItem', () => {
    it('アイテムを追加できる', () => {
      const result = inventory.addItem(testItem);
      expect(result).toBe(true);
      expect(inventory.getItems()).toHaveLength(1);
      expect(inventory.getItems()[0]).toBe(testItem);
    });

    it('最大数を超えるアイテムは追加できない', () => {
      // 最大数まで追加
      for (let i = 0; i < 100; i++) {
        const item = new Potion({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: 'Test item',
          type: ItemType.POTION,
          effects: [{ type: EffectType.HEAL_HP, value: 10 }],
        });
        inventory.addItem(item);
      }

      // 101個目は追加できない
      const result = inventory.addItem(testItem);
      expect(result).toBe(false);
      expect(inventory.getItemCount()).toBe(100);
    });

    it('nullのアイテムは追加できない', () => {
      expect(() => inventory.addItem(null as any)).toThrow('Item cannot be null');
    });
  });

  describe('removeItem', () => {
    it('アイテムを削除できる', () => {
      inventory.addItem(testItem);
      const result = inventory.removeItem(testItem);
      expect(result).toBe(true);
      expect(inventory.getItems()).toHaveLength(0);
    });

    it('存在しないアイテムは削除できない', () => {
      const result = inventory.removeItem(testItem);
      expect(result).toBe(false);
    });

    it('nullのアイテムは削除できない', () => {
      expect(() => inventory.removeItem(null as any)).toThrow('Item cannot be null');
    });
  });

  describe('hasItem', () => {
    it('存在するアイテムを正しく検出する', () => {
      inventory.addItem(testItem);
      expect(inventory.hasItem(testItem)).toBe(true);
    });

    it('存在しないアイテムを正しく検出する', () => {
      expect(inventory.hasItem(testItem)).toBe(false);
    });
  });

  describe('findItemById', () => {
    it('IDでアイテムを見つけることができる', () => {
      inventory.addItem(testItem);
      const foundItem = inventory.findItemById('test-item');
      expect(foundItem).toBe(testItem);
    });

    it('存在しないIDの場合undefinedを返す', () => {
      const foundItem = inventory.findItemById('non-existent');
      expect(foundItem).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('全アイテムを削除する', () => {
      inventory.addItem(testItem);
      inventory.clear();
      expect(inventory.getItems()).toEqual([]);
      expect(inventory.getItemCount()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('正確なアイテム数を返す', () => {
      expect(inventory.getItemCount()).toBe(0);
      inventory.addItem(testItem);
      expect(inventory.getItemCount()).toBe(1);
    });
  });

  describe('isFull', () => {
    it('満杯でない場合falseを返す', () => {
      expect(inventory.isFull()).toBe(false);
    });

    it('満杯の場合trueを返す', () => {
      // 最大数まで追加
      for (let i = 0; i < 100; i++) {
        const item = new Potion({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: 'Test item',
          type: ItemType.POTION,
          effects: [{ type: EffectType.HEAL_HP, value: 10 }],
        });
        inventory.addItem(item);
      }
      expect(inventory.isFull()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('JSONデータに変換できる', () => {
      inventory.addItem(testItem);
      const json = inventory.toJSON();
      expect(json).toEqual({
        items: [testItem.toJSON()],
      });
    });
  });

  describe('fromJSON', () => {
    it('JSONデータから復元できる', () => {
      const originalInventory = new PotionInventory([testItem]);
      const json = originalInventory.toJSON();
      const restoredInventory = PotionInventory.fromJSON(json);

      expect(restoredInventory.getItemCount()).toBe(1);
      expect(restoredInventory.getItems()[0].getId()).toBe(testItem.getId());
    });

    it('不正なJSONデータの場合はエラーを投げる', () => {
      expect(() => PotionInventory.fromJSON(null)).toThrow('Invalid potion inventory data');
      expect(() => PotionInventory.fromJSON({})).toThrow('Invalid potion inventory data');
      expect(() => PotionInventory.fromJSON({ items: 'invalid' })).toThrow(
        'Invalid potion inventory data'
      );
    });
  });
});
