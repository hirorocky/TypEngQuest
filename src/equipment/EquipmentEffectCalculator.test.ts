import { EquipmentEffectCalculator } from './EquipmentEffectCalculator';
import { EquipmentItem, EquipmentItemData } from '../items/EquipmentItem';
import { ItemType, ItemRarity } from '../items/Item';

describe('EquipmentEffectCalculator', () => {
  let calculator: EquipmentEffectCalculator;

  beforeEach(() => {
    calculator = new EquipmentEffectCalculator();
  });

  describe('calculateTotalStats', () => {
    it('単一の装備アイテムの場合、そのステータスを返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15, // 10+2+3+0=15
      };
      const equipment = new EquipmentItem(equipmentData);

      const totalStats = calculator.calculateTotalStats([equipment]);

      expect(totalStats.strength).toBe(10);
      expect(totalStats.willpower).toBe(2);
      expect(totalStats.agility).toBe(3);
      expect(totalStats.fortune).toBe(0);
    });

    it('複数の装備アイテムの場合、ステータスの合計を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15, // 10+2+3+0=15
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 0,
          willpower: 8,
          agility: 3,
          fortune: 1,
        },
        grade: 12, // 0+8+3+1=12
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const totalStats = calculator.calculateTotalStats([equipment1, equipment2]);

      expect(totalStats.strength).toBe(10); // 10+0
      expect(totalStats.willpower).toBe(10); // 2+8
      expect(totalStats.agility).toBe(6); // 3+3
      expect(totalStats.fortune).toBe(1); // 0+1
    });

    it('空の配列の場合、全てのステータスが0を返す', () => {
      const totalStats = calculator.calculateTotalStats([]);

      expect(totalStats.strength).toBe(0);
      expect(totalStats.willpower).toBe(0);
      expect(totalStats.agility).toBe(0);
      expect(totalStats.fortune).toBe(0);
    });

    it('5つの装備アイテムの場合、正しく合計される', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 2, willpower: 1, agility: 0, fortune: 0 },
          grade: 3,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 2, agility: 1, fortune: 0 },
          grade: 4,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 0, willpower: 0, agility: 3, fortune: 0 },
          grade: 3,
        },
        {
          id: 'item4',
          name: 'Item 4',
          description: 'Item 4',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 0, willpower: 0, agility: 2, fortune: 1 },
          grade: 3,
        },
        {
          id: 'item5',
          name: 'Item 5',
          description: 'Item 5',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 1, agility: 2, fortune: 1 },
          grade: 5,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const totalStats = calculator.calculateTotalStats(equipments);

      expect(totalStats.strength).toBe(4); // 2+1+0+0+1
      expect(totalStats.willpower).toBe(4); // 1+2+0+0+1
      expect(totalStats.agility).toBe(8); // 0+1+3+2+2
      expect(totalStats.fortune).toBe(2); // 0+0+0+1+1
    });
  });

  describe('calculateAverageGrade', () => {
    it('単一の装備アイテムの場合、固定分母5でグレードを計算する', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
      };
      const equipment = new EquipmentItem(equipmentData);

      const averageGrade = calculator.calculateAverageGrade([equipment]);

      expect(averageGrade).toBe(3); // 15/5 = 3.0
    });

    it('複数の装備アイテムの場合、固定分母5でグレード（小数点切り捨て）を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 0,
          willpower: 8,
          agility: 1,
          fortune: 1,
        },
        grade: 10,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const averageGrade = calculator.calculateAverageGrade([equipment1, equipment2]);

      expect(averageGrade).toBe(5); // (15+10)/5 = 25/5 = 5
    });

    it('空の配列の場合、0を返す', () => {
      const averageGrade = calculator.calculateAverageGrade([]);

      expect(averageGrade).toBe(0);
    });

    it('小数点以下がある場合、切り捨てされる', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 0, agility: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 1, agility: 0, fortune: 0 },
          grade: 2,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 1, agility: 1, fortune: 0 },
          grade: 3,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const averageGrade = calculator.calculateAverageGrade(equipments);

      expect(averageGrade).toBe(1); // (1+2+3)/5 = 6/5 = 1.2 → 1（小数点切り捨て）
    });

    it('より複雑な小数点切り捨てのケース', () => {
      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 0, agility: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { strength: 1, willpower: 1, agility: 0, fortune: 0 },
          grade: 2,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      const averageGrade = calculator.calculateAverageGrade(equipments);

      expect(averageGrade).toBe(0); // (1+2)/5 = 3/5 = 0.6 → 0（小数点切り捨て）
    });
  });

  describe('getAvailableSkills', () => {
    it('技を持つ装備がない場合、空の配列を返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
        skill: undefined,
      };
      const equipment = new EquipmentItem(equipmentData);

      const skills = calculator.getAvailableSkills([equipment]);

      expect(skills).toEqual([]);
    });

    it('技を持つ装備がある場合、その技を返す', () => {
      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          description: 'A slashing attack',
          skillType: 'physical',
          mpCost: 5,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 2,
          skillSuccessRate: {
            baseRate: 90,
            agilityInfluence: 1.0,
            typingInfluence: 1.5,
          },
          criticalRate: {
            baseRate: 10,
            fortuneInfluence: 0.8,
          },
          effects: [
            {
              type: 'damage',
              target: 'enemy',
              basePower: 50,
              powerInfluence: {
                stat: 'strength',
                rate: 1.2,
              },
              successRate: 100,
            },
          ],
        },
      };
      const equipment = new EquipmentItem(equipmentData);

      const skills = calculator.getAvailableSkills([equipment]);

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
      expect(skills[0].name).toBe('Slash');
    });

    it('複数の技を持つ装備がある場合、全ての技を返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          description: 'A slashing attack',
          skillType: 'physical',
          mpCost: 5,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 2,
          skillSuccessRate: {
            baseRate: 90,
            agilityInfluence: 1.0,
            typingInfluence: 1.5,
          },
          criticalRate: {
            baseRate: 10,
            fortuneInfluence: 0.8,
          },
          effects: [
            {
              type: 'damage',
              target: 'enemy',
              basePower: 50,
              powerInfluence: {
                stat: 'strength',
                rate: 1.2,
              },
              successRate: 100,
            },
          ],
        },
      };

      const equipment2Data: EquipmentItemData = {
        id: 'staff',
        name: 'Magic Staff',
        description: 'A magic staff',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 0,
          willpower: 8,
          agility: 1,
          fortune: 1,
        },
        grade: 10,
        skill: {
          id: 'heal',
          name: 'Heal',
          description: 'A healing spell',
          skillType: 'magical',
          mpCost: 10,
          mpCharge: 0,
          actionCost: 1,
          target: 'self',
          typingDifficulty: 1,
          skillSuccessRate: {
            baseRate: 100,
            agilityInfluence: 1.0,
            typingInfluence: 1.5,
          },
          criticalRate: {
            baseRate: 5,
            fortuneInfluence: 0.8,
          },
          effects: [
            {
              type: 'hp_heal',
              target: 'self',
              basePower: 30,
              powerInfluence: {
                stat: 'willpower',
                rate: 1.5,
              },
              successRate: 100,
            },
          ],
        },
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const skills = calculator.getAvailableSkills([equipment1, equipment2]);

      expect(skills).toHaveLength(2);
      expect(skills[0].id).toBe('slash');
      expect(skills[1].id).toBe('heal');
    });

    it('技を持つ装備と持たない装備が混在する場合、技を持つ装備の技のみ返す', () => {
      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 10,
          willpower: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
        skill: {
          id: 'slash',
          name: 'Slash',
          description: 'A slashing attack',
          skillType: 'physical',
          mpCost: 5,
          mpCharge: 0,
          actionCost: 1,
          target: 'enemy',
          typingDifficulty: 2,
          skillSuccessRate: {
            baseRate: 90,
            agilityInfluence: 1.0,
            typingInfluence: 1.5,
          },
          criticalRate: {
            baseRate: 10,
            fortuneInfluence: 0.8,
          },
          effects: [
            {
              type: 'damage',
              target: 'enemy',
              basePower: 50,
              powerInfluence: {
                stat: 'strength',
                rate: 1.2,
              },
              successRate: 100,
            },
          ],
        },
      };

      const equipment2Data: EquipmentItemData = {
        id: 'shield',
        name: 'Wooden Shield',
        description: 'A basic shield',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          strength: 0,
          willpower: 8,
          agility: 1,
          fortune: 1,
        },
        grade: 10,
        skill: undefined,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      const skills = calculator.getAvailableSkills([equipment1, equipment2]);

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
    });
  });
});
