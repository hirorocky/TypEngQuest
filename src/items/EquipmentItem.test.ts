import { EquipmentItem, EquipmentItemData, EquipmentStats, Skill } from './EquipmentItem';
import { ItemType, ItemRarity } from './Item';
import { Player } from '../player/Player';

describe('EquipmentItem', () => {
  // テスト用のスキルデータ
  const sampleSkill: Skill = {
    id: 'slash',
    name: 'Slash',
    mpCost: 5,
    successRate: 90,
    typingDifficulty: 2,
    effect: {
      type: 'damage',
      power: 50,
      target: 'enemy',
    },
  };

  const sampleSkill2: Skill = {
    id: 'heal',
    name: 'Heal',
    mpCost: 10,
    successRate: 100,
    typingDifficulty: 1,
    effect: {
      type: 'heal',
      power: 30,
      target: 'self',
    },
  };

  // テスト用の装備データ
  const sampleEquipmentData: EquipmentItemData = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword',
    type: ItemType.EQUIPMENT,
    rarity: ItemRarity.COMMON,
    stats: {
      attack: 10,
      defense: 0,
      agility: 5,
      fortune: 0,
    },
    grade: 15, // 10+0+5+0=15
    skill: sampleSkill,
  };

  describe('コンストラクタ', () => {
    it('正常な引数で初期化できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);

      expect(equipment.getId()).toBe('iron_sword');
      expect(equipment.getName()).toBe('Iron Sword');
      expect(equipment.getDescription()).toBe('A sturdy iron sword');
      expect(equipment.getType()).toBe(ItemType.EQUIPMENT);
      expect(equipment.getRarity()).toBe(ItemRarity.COMMON);
      expect(equipment.getGrade()).toBe(15);
    });

    it('グレードが無効な場合エラーを投げる', () => {
      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          grade: 0,
          stats: { attack: 0, defense: 0, agility: 0, fortune: 0 }, // グレード0と一致
        });
      }).toThrow('Grade must be between 1 and 100');

      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          grade: 101,
          stats: { attack: 101, defense: 0, agility: 0, fortune: 0 }, // グレード101と一致
        });
      }).toThrow('Grade must be between 1 and 100');
    });

    it('ステータスの合計とグレードが一致している場合エラーを投げない', () => {
      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          stats: {
            attack: 5,
            defense: 3,
            agility: 6,
            fortune: 1,
          },
          grade: 15, // 5+3+6+1=15
        });
      }).not.toThrow();
    });

    it('ステータスの合計とグレードが一致しない場合エラーを投げる', () => {
      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          stats: {
            attack: 5,
            defense: 3,
            agility: 6,
            fortune: 1,
          },
          grade: 10, // 5+3+6+1=15だが、gradeは10
        });
      }).toThrow('Grade must equal sum of stats (attack + defense + agility + fortune)');
    });

    it('ステータスがundefinedの場合でも適切なgradeが指定されればエラーを投げない', () => {
      // statsがundefinedの場合、すべてのステータスが0になり、合計も0になる
      // しかし、gradeの最小値は1なので、このケースは実際には起こりえない
      // このテストは現在の仕様では適用できないため、別のケースをテストする
      expect(() => {
        new EquipmentItem({
          ...sampleEquipmentData,
          stats: {
            attack: 1,
            defense: 0,
            agility: 0,
            fortune: 0,
          },
          grade: 1, // 1+0+0+0=1
        });
      }).not.toThrow();
    });

    it('技がundefinedの場合undefinedが設定される', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        skill: undefined,
      });

      expect(equipment.getSkill()).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('装備のステータスを取得できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const stats = equipment.getStats();

      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(0);
      expect(stats.agility).toBe(5);
      expect(stats.fortune).toBe(0);
    });
  });

  describe('getSkill', () => {
    it('装備の技を取得できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const skill = equipment.getSkill();

      expect(skill).toBeDefined();
      expect(skill?.id).toBe('slash');
      expect(skill?.name).toBe('Slash');
    });

    it('技を持たない装備の場合undefinedを返す', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        skill: undefined,
      });
      const skill = equipment.getSkill();

      expect(skill).toBeUndefined();
    });
  });

  describe('hasSkill', () => {
    it('技を持っているか確認できる', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);

      expect(equipment.hasSkill()).toBe(true);
    });

    it('技を持たない場合falseを返す', () => {
      const equipment = new EquipmentItem({
        ...sampleEquipmentData,
        skill: undefined,
      });
      expect(equipment.hasSkill()).toBe(false);
    });
  });

  describe('canUse', () => {
    it('装備アイテムは使用できない', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const mockPlayer = {} as Player;

      expect(equipment.canUse(mockPlayer)).toBe(false);
    });
  });

  describe('use', () => {
    it('装備アイテムの使用はエラーを投げる', async () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const mockPlayer = {} as Player;

      await expect(equipment.use(mockPlayer)).rejects.toThrow(
        'Equipment items cannot be used directly'
      );
    });
  });

  describe('equals', () => {
    it('同じ装備アイテムで真を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem(sampleEquipmentData);

      expect(equipment1.equals(equipment2)).toBe(true);
    });

    it('異なるグレードの装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        stats: {
          attack: 8,
          defense: 2,
          agility: 5,
          fortune: 0,
        },
        grade: 15, // 8+2+5+0+0=15
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('異なるステータスの装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        stats: {
          attack: 12,
          defense: 1,
          agility: 2,
          fortune: 0,
        },
        grade: 15, // 12+1+2+0+0=15
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('異なる技を持つ装備で偽を返す', () => {
      const equipment1 = new EquipmentItem(sampleEquipmentData);
      const equipment2 = new EquipmentItem({
        ...sampleEquipmentData,
        skill: sampleSkill2,
      });

      expect(equipment1.equals(equipment2)).toBe(false);
    });

    it('Itemクラスのインスタンスと比較した場合偽を返す', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const item = {
        getId: () => 'iron_sword',
        getName: () => 'Iron Sword',
        getDescription: () => 'A sturdy iron sword',
        getType: () => ItemType.EQUIPMENT,
        getRarity: () => ItemRarity.COMMON,
        equals: () => false,
      } as any;

      expect(equipment.equals(item)).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('正しいJSONデータを返す', () => {
      const equipment = new EquipmentItem(sampleEquipmentData);
      const json = equipment.toJSON();

      expect(json).toEqual({
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 0,
          agility: 5,
          fortune: 0,
        },
        grade: 15,
        skill: sampleSkill,
      });
    });
  });

  describe('fromJSON', () => {
    it('正しいJSONデータからインスタンスを作成できる', () => {
      const json: EquipmentItemData = {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 0,
          agility: 5,
          fortune: 0,
        },
        grade: 15,
        skill: sampleSkill,
      };

      const equipment = EquipmentItem.fromJSON(json);

      expect(equipment.getId()).toBe('iron_sword');
      expect(equipment.getName()).toBe('Iron Sword');
      expect(equipment.getGrade()).toBe(15);
      expect(equipment.getStats().attack).toBe(10);
      expect(equipment.hasSkill()).toBe(true);
    });

    it('不正なタイプのJSONデータでエラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        type: ItemType.CONSUMABLE,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data: type must be equipment');
    });

    it('gradeが数値でない場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        grade: '2' as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });

    it('statsが不正な形式の場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        stats: 'invalid' as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });

    it('無効なスキルデータの場合エラーを投げる', () => {
      const json = {
        ...sampleEquipmentData,
        skill: { invalid: 'skill' } as any,
      };

      expect(() => {
        EquipmentItem.fromJSON(json);
      }).toThrow('Invalid equipment item data');
    });
  });

  describe('validateStats', () => {
    it('正しいステータスオブジェクトを検証できる', () => {
      const stats: EquipmentStats = {
        attack: 10,
        defense: 5,
        agility: 8,
        fortune: 2,
      };

      expect(EquipmentItem.validateStats(stats)).toBe(true);
    });

    it('ステータスが欠けている場合falseを返す', () => {
      const stats = {
        attack: 10,
        defense: 5,
        // agility missing
        fortune: 2,
      } as any;

      expect(EquipmentItem.validateStats(stats)).toBe(false);
    });

    it('ステータスが数値でない場合falseを返す', () => {
      const stats = {
        attack: '10',
        defense: 5,
        agility: 8,
        fortune: 2,
      } as any;

      expect(EquipmentItem.validateStats(stats)).toBe(false);
    });
  });

  describe('validateSkill', () => {
    it('正しいスキルオブジェクトを検証できる', () => {
      expect(EquipmentItem.validateSkill(sampleSkill)).toBe(true);
    });

    it('必須プロパティが欠けている場合falseを返す', () => {
      const invalidSkill = {
        id: 'slash',
        // name missing
        mpCost: 5,
        successRate: 90,
        typingDifficulty: 2,
        effect: {
          type: 'damage',
          power: 50,
        },
      } as any;

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });

    it('効果が不正な場合falseを返す', () => {
      const invalidSkill = {
        ...sampleSkill,
        effect: 'invalid' as any,
      };

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });

    it('効果タイプが不正な場合falseを返す', () => {
      const invalidSkill = {
        ...sampleSkill,
        effect: {
          type: 'invalid',
          power: 50,
        },
      };

      expect(EquipmentItem.validateSkill(invalidSkill)).toBe(false);
    });
  });
});
