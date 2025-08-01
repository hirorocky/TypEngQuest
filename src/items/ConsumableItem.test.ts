import { ConsumableItem, ConsumableItemData, EffectType } from './ConsumableItem';
import { ItemType, ItemRarity } from './Item';
import { Player } from '../player/Player';

describe('ConsumableItem', () => {
  let mockPlayer: Player;

  beforeEach(() => {
    mockPlayer = new Player('TestPlayer');
  });

  describe('コンストラクタ', () => {
    it('正常な引数で初期化できる', () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      expect(item.getId()).toBe('hp_potion');
      expect(item.getName()).toBe('HP Potion');
      expect(item.getDescription()).toBe('Restores 50 HP');
      expect(item.getType()).toBe(ItemType.CONSUMABLE);
      expect(item.getRarity()).toBe(ItemRarity.COMMON);
      expect(item.getEffects()).toHaveLength(1);
      expect(item.getEffects()[0].type).toBe(EffectType.HEAL_HP);
      expect(item.getEffects()[0].value).toBe(50);
    });

    it('複数の効果を持つアイテムで初期化できる', () => {
      const item = new ConsumableItem({
        id: 'super_potion',
        name: 'Super Potion',
        description: 'Restores 100 HP and 50 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 100,
          },
          {
            type: EffectType.HEAL_MP,
            value: 50,
          },
        ],
      });

      expect(item.getEffects()).toHaveLength(2);
      expect(item.getEffects()[0].type).toBe(EffectType.HEAL_HP);
      expect(item.getEffects()[1].type).toBe(EffectType.HEAL_MP);
    });

    it('効果配列が空の場合にエラーを投げる', () => {
      expect(() => {
        new ConsumableItem({
          id: 'invalid_item',
          name: 'Invalid Item',
          description: 'Invalid item',
          type: ItemType.CONSUMABLE,
          rarity: ItemRarity.COMMON,
          effects: [],
        });
      }).toThrow('ConsumableItem must have at least one effect');
    });
  });

  describe('canUse', () => {
    it('HP回復アイテムはHPが満タンでない場合に使用可能', () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      // HPを少し減らす
      mockPlayer.getBodyStats().takeDamage(10);

      expect(item.canUse(mockPlayer)).toBe(true);
    });

    it('HP回復アイテムはHPが満タンの場合に使用不可', () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      // HPは満タンのまま
      expect(item.canUse(mockPlayer)).toBe(false);
    });

    it('MP回復アイテムはMPが満タンでない場合に使用可能', () => {
      const item = new ConsumableItem({
        id: 'mp_potion',
        name: 'MP Potion',
        description: 'Restores 30 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_MP,
            value: 30,
          },
        ],
      });

      // MPを少し減らす
      mockPlayer.getBodyStats().consumeMP(10);

      expect(item.canUse(mockPlayer)).toBe(true);
    });

    it('MP回復アイテムはMPが満タンの場合に使用不可', () => {
      const item = new ConsumableItem({
        id: 'mp_potion',
        name: 'MP Potion',
        description: 'Restores 30 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_MP,
            value: 30,
          },
        ],
      });

      // MPは満タンのまま
      expect(item.canUse(mockPlayer)).toBe(false);
    });

    it('複数効果のアイテムは最低1つの効果が使用可能なら使用可能', () => {
      const item = new ConsumableItem({
        id: 'mixed_potion',
        name: 'Mixed Potion',
        description: 'Restores HP and MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
          {
            type: EffectType.HEAL_MP,
            value: 30,
          },
        ],
      });

      // HPは満タンだがMPを減らす
      mockPlayer.getBodyStats().consumeMP(10);

      expect(item.canUse(mockPlayer)).toBe(true);
    });

    it('複数効果のアイテムは全ての効果が使用不可なら使用不可', () => {
      const item = new ConsumableItem({
        id: 'mixed_potion',
        name: 'Mixed Potion',
        description: 'Restores HP and MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
          {
            type: EffectType.HEAL_MP,
            value: 30,
          },
        ],
      });

      // HPもMPも満タンのまま
      expect(item.canUse(mockPlayer)).toBe(false);
    });
  });

  describe('use', () => {
    it('HP回復効果を正しく適用する', async () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      const _initialHP = mockPlayer.getBodyStats().getCurrentHP();
      mockPlayer.getBodyStats().takeDamage(30);
      const damagedHP = mockPlayer.getBodyStats().getCurrentHP();

      await item.use(mockPlayer);

      expect(mockPlayer.getBodyStats().getCurrentHP()).toBe(
        Math.min(mockPlayer.getBodyStats().getMaxHP(), damagedHP + 50)
      );
    });

    it('MP回復効果を正しく適用する', async () => {
      const item = new ConsumableItem({
        id: 'mp_potion',
        name: 'MP Potion',
        description: 'Restores 30 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_MP,
            value: 30,
          },
        ],
      });

      const _initialMP = mockPlayer.getBodyStats().getCurrentMP();
      mockPlayer.getBodyStats().consumeMP(20);
      const consumedMP = mockPlayer.getBodyStats().getCurrentMP();

      await item.use(mockPlayer);

      expect(mockPlayer.getBodyStats().getCurrentMP()).toBe(
        Math.min(mockPlayer.getBodyStats().getMaxMP(), consumedMP + 30)
      );
    });

    it('複数効果を正しく適用する', async () => {
      const item = new ConsumableItem({
        id: 'super_potion',
        name: 'Super Potion',
        description: 'Restores 100 HP and 50 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 100,
          },
          {
            type: EffectType.HEAL_MP,
            value: 50,
          },
        ],
      });

      const _initialHP = mockPlayer.getBodyStats().getCurrentHP();
      const _initialMP = mockPlayer.getBodyStats().getCurrentMP();
      mockPlayer.getBodyStats().takeDamage(50);
      mockPlayer.getBodyStats().consumeMP(30);

      await item.use(mockPlayer);

      expect(mockPlayer.getBodyStats().getCurrentHP()).toBe(
        Math.min(mockPlayer.getBodyStats().getMaxHP(), _initialHP - 50 + 100)
      );
      expect(mockPlayer.getBodyStats().getCurrentMP()).toBe(
        Math.min(mockPlayer.getBodyStats().getMaxMP(), _initialMP - 30 + 50)
      );
    });

    it('使用不可能なアイテムを使用するとエラーを投げる', async () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      // HPが満タンの状態で使用を試みる
      await expect(item.use(mockPlayer)).rejects.toThrow('Cannot use this item');
    });
  });

  describe('toJSON', () => {
    it('正しいJSONデータを返す', () => {
      const item = new ConsumableItem({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });

      const jsonData = item.toJSON();

      expect(jsonData).toEqual({
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      });
    });
  });

  describe('fromJSON', () => {
    it('正しいJSONデータからインスタンスを作成できる', () => {
      const jsonData: ConsumableItemData = {
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            value: 50,
          },
        ],
      };

      const item = ConsumableItem.fromJSON(jsonData);

      expect(item.getId()).toBe('hp_potion');
      expect(item.getName()).toBe('HP Potion');
      expect(item.getDescription()).toBe('Restores 50 HP');
      expect(item.getType()).toBe(ItemType.CONSUMABLE);
      expect(item.getRarity()).toBe(ItemRarity.COMMON);
      expect(item.getEffects()).toHaveLength(1);
      expect(item.getEffects()[0].type).toBe(EffectType.HEAL_HP);
    });

    it('不正なJSONデータでエラーを投げる', () => {
      const invalidData = {
        id: 'hp_potion',
        name: 'HP Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        // effects missing
      };

      expect(() => {
        ConsumableItem.fromJSON(invalidData);
      }).toThrow('Invalid consumable item data');
    });
  });

  describe('EffectType enum', () => {
    it('正しい値を持つ', () => {
      expect(EffectType.HEAL_HP).toBe('heal_hp');
      expect(EffectType.HEAL_MP).toBe('heal_mp');
    });
  });
});
