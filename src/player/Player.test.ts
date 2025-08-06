import { Player } from './Player';
import { BodyStats } from './BodyStats';
import { EquipmentStats } from './EquipmentStats';
import { EquipmentItem, EquipmentItemData } from '../items/EquipmentItem';
import { ItemType, ItemRarity } from '../items/Item';

describe('Player', () => {
  describe('constructor', () => {
    test('プレイヤー名を指定して初期化できる', () => {
      const player = new Player('Hero');

      expect(player.name).toBe('Hero');
    });

    test('空文字の名前でも初期化できる', () => {
      const player = new Player('');

      expect(player.name).toBe('');
    });
  });

  describe('getLevel', () => {
    test('初期レベル（装備なし）は0を返す', () => {
      const player = new Player('Hero');

      expect(player.getLevel()).toBe(0);
    });
  });

  describe('getName', () => {
    test('プレイヤー名を取得できる', () => {
      const player = new Player('Hero');

      expect(player.getName()).toBe('Hero');
    });
  });

  describe('getStats', () => {
    test('プレイヤーのステータスを取得できる', () => {
      const player = new Player('Hero');
      const stats = player.getStats();

      expect(stats).toBeDefined();
      expect(stats.getMaxHP()).toBe(100); // レベル0: 100 + (0 × 20)
      expect(stats.getMaxMP()).toBe(50); // レベル0: 50 + (0 × 10)
    });
  });

  describe('toJSON', () => {
    test('プレイヤーデータをJSON形式で出力できる', () => {
      const player = new Player('Hero');
      const json = player.toJSON();

      expect(json).toEqual({
        name: 'Hero',
        bodyStats: expect.objectContaining({
          level: 0,
          currentHP: 100,
          currentMP: 50,
          baseAttack: 10,
          baseDefense: 10,
          baseAgility: 10,
          baseFortune: 10,
          temporaryBoosts: {
            attack: 0,
            defense: 0,
            agility: 0,
            fortune: 0,
          },
        }),
        equipmentStats: expect.objectContaining({
          attack: 0,
          defense: 0,
          agility: 0,
          fortune: 0,
        }),
        inventory: expect.objectContaining({
          items: [],
        }),
      });
    });
  });

  describe('fromJSON', () => {
    test('JSONデータからプレイヤーを復元できる', () => {
      const jsonData = {
        name: 'SavedHero',
        bodyStats: {
          level: 5,
          currentHP: 180,
          currentMP: 90,
          baseAttack: 15,
          baseDefense: 12,
          baseAgility: 10,
          baseFortune: 10,
          temporaryBoosts: {
            attack: 0,
            defense: 0,
            agility: 0,
            fortune: 0,
          },
          temporaryStatuses: [],
        },
        equipmentStats: {
          attack: 0,
          defense: 0,
          agility: 0,
          fortune: 0,
        },
        inventory: {
          items: [],
        },
      };

      const player = Player.fromJSON(jsonData);

      expect(player.name).toBe('SavedHero');
      expect(player.getLevel()).toBe(0); // 装備がない場合レベルは0
      expect(player.getStats().getCurrentHP()).toBe(180);
      expect(player.getStats().getCurrentMP()).toBe(90);
    });

    test('不正なJSONデータでエラーを投げる', () => {
      const invalidData = {
        name: 123, // 文字列でない
        bodyStats: {},
        equipmentStats: {},
        inventory: {},
      };

      expect(() => Player.fromJSON(invalidData)).toThrow('Invalid player data');
    });

    test('必須フィールドが欠けている場合エラーを投げる', () => {
      const incompleteData = {
        name: 'Hero',
        // bodyStats が欠けている
      };

      expect(() => Player.fromJSON(incompleteData)).toThrow('Invalid player data');
    });

    test('bodyStatsフィールドが欠けている場合エラーを投げる', () => {
      const dataWithoutBodyStats = {
        name: 'Hero',
        equipmentStats: {},
        inventory: {},
        // bodyStats が欠けている
      };

      expect(() => Player.fromJSON(dataWithoutBodyStats)).toThrow('Invalid player data');
    });
  });

  describe('name property', () => {
    test('プレイヤー名を取得できる', () => {
      const player = new Player('TestPlayer');

      expect(player.name).toBe('TestPlayer');
    });
  });

  describe('data validation', () => {
    test('プレイヤー名に日本語が含まれていても正常に動作する', () => {
      const player = new Player('勇者');

      expect(player.name).toBe('勇者');
      expect(player.getLevel()).toBe(0); // 装備なしの場合レベル0
    });

    test('プレイヤー名に特殊文字が含まれていても正常に動作する', () => {
      const player = new Player('Player@123!');

      expect(player.name).toBe('Player@123!');
      expect(player.getLevel()).toBe(0); // 装備なしの場合レベル0
    });
  });

  describe('setEquippedItems', () => {
    test('装備アイテムが設定されていない場合、レベルは0を返す', () => {
      const player = new Player('Hero');

      expect(player.getLevel()).toBe(0);
    });

    test('装備アイテムが設定されている場合、グレード平均値をレベルとして返す', () => {
      const player = new Player('Hero');

      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
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
          attack: 0,
          defense: 8,
          agility: 3,
          fortune: 1,
        },
        grade: 12, // 0+8+3+1=12
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      player.setEquippedItems([equipment1, equipment2]);

      expect(player.getLevel()).toBe(5); // (15+12)/5スロット = 27/5 = 5.4 → 5（小数点切り捨て）
    });

    test('複数の装備アイテムの場合、正しいレベルが計算される', () => {
      const player = new Player('Hero');

      const equipmentDataList: EquipmentItemData[] = [
        {
          id: 'item1',
          name: 'Item 1',
          description: 'Item 1',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 0, agility: 0, fortune: 0 },
          grade: 1,
        },
        {
          id: 'item2',
          name: 'Item 2',
          description: 'Item 2',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, agility: 0, fortune: 0 },
          grade: 2,
        },
        {
          id: 'item3',
          name: 'Item 3',
          description: 'Item 3',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 1, defense: 1, agility: 1, fortune: 0 },
          grade: 3,
        },
      ];

      const equipments = equipmentDataList.map(data => new EquipmentItem(data));
      player.setEquippedItems(equipments);

      expect(player.getLevel()).toBe(1); // (1+2+3)/5スロット = 6/5 = 1.2 → 1（小数点切り捨て）
    });

    test('単一の装備アイテムの場合、そのグレードがレベルになる', () => {
      const player = new Player('Hero');

      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
      };

      const equipment = new EquipmentItem(equipmentData);
      player.setEquippedItems([equipment]);

      expect(player.getLevel()).toBe(3); // 15/5スロット = 3.0
    });
  });

  describe('getEquippedItemStats', () => {
    test('装備アイテムが設定されていない場合、全てのステータスが0を返す', () => {
      const player = new Player('Hero');

      const stats = player.getEquippedItemStats();

      expect(stats.attack).toBe(0);
      expect(stats.defense).toBe(0);
      expect(stats.agility).toBe(0);
      expect(stats.fortune).toBe(0);
    });

    test('装備アイテムが設定されている場合、ステータスの合計を返す', () => {
      const player = new Player('Hero');

      const equipment1Data: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
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
          attack: 0,
          defense: 8,
          agility: 3,
          fortune: 1,
        },
        grade: 12,
      };

      const equipment1 = new EquipmentItem(equipment1Data);
      const equipment2 = new EquipmentItem(equipment2Data);

      player.setEquippedItems([equipment1, equipment2]);

      const stats = player.getEquippedItemStats();

      expect(stats.attack).toBe(10); // 10+0
      expect(stats.defense).toBe(10); // 2+8
      expect(stats.agility).toBe(6); // 3+3
      expect(stats.fortune).toBe(1); // 0+1
    });
  });

  describe('getEquippedItemSkills', () => {
    test('装備アイテムが設定されていない場合、空の配列を返す', () => {
      const player = new Player('Hero');

      const skills = player.getEquippedItemSkills();

      expect(skills).toEqual([]);
    });

    test('技を持つ装備アイテムが設定されている場合、その技を返す', () => {
      const player = new Player('Hero');

      const equipmentData: EquipmentItemData = {
        id: 'sword',
        name: 'Iron Sword',
        description: 'A basic sword',
        type: ItemType.EQUIPMENT,
        rarity: ItemRarity.COMMON,
        stats: {
          attack: 10,
          defense: 2,
          agility: 3,
          fortune: 0,
        },
        grade: 15,
        skill: {
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
        },
      };

      const equipment = new EquipmentItem(equipmentData);
      player.setEquippedItems([equipment]);

      const skills = player.getEquippedItemSkills();

      expect(skills).toHaveLength(1);
      expect(skills[0].id).toBe('slash');
      expect(skills[0].name).toBe('Slash');
    });
  });

  describe('Stats Refactoring (BodyStats + EquipmentStats)', () => {
    describe('BodyStats + EquipmentStats = Stats', () => {
      test('Playerは本来のステータス（BodyStats）を持つ', () => {
        const player = new Player('TestPlayer');
        const bodyStats = player.getBodyStats();

        expect(bodyStats).toBeInstanceOf(BodyStats);
        expect(bodyStats.getLevel()).toBe(0);
        expect(bodyStats.getBaseStrength()).toBe(10);
        expect(bodyStats.getBaseWillpower()).toBe(10);
      });

      test('Playerは装備ステータス（EquipmentStats）を持つ', () => {
        const player = new Player('TestPlayer');
        const equipmentStats = player.getEquipmentStats();

        expect(equipmentStats).toBeInstanceOf(EquipmentStats);
        expect(equipmentStats.getAttack()).toBe(0);
        expect(equipmentStats.getDefense()).toBe(0);
        expect(equipmentStats.isEmpty()).toBe(true);
      });

      test('総合ステータスはBodyStats + EquipmentStatsの合計になる', () => {
        const player = new Player('TestPlayer');

        // 装備アイテムを追加してスロットに装備
        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        player.getInventory().addItem(sword);
        player.equipToSlot(0, sword);

        const totalStats = player.getTotalStats();
        const bodyStats = player.getBodyStats();
        const equipmentStats = player.getEquipmentStats();

        // Body(10) + Equipment(15) = Total(25)
        expect(totalStats.strength).toBe(bodyStats.getBaseStrength() + equipmentStats.getAttack());
        expect(totalStats.willpower).toBe(
          bodyStats.getBaseWillpower() + equipmentStats.getDefense()
        );
        expect(totalStats.agility).toBe(bodyStats.getBaseAgility() + equipmentStats.getAgility());
        expect(totalStats.fortune).toBe(bodyStats.getBaseFortune() + equipmentStats.getFortune());
      });

      test('装備変更時にEquipmentStatsが更新される', () => {
        const player = new Player('TestPlayer');

        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        const shield = new EquipmentItem({
          id: 'test-shield',
          name: 'Test Shield',
          description: 'A test shield',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 0, defense: 12, agility: -1, fortune: 2 },
          grade: 13, // 0 + 12 + (-2) + 1 + 2 = 13
        });

        player.getInventory().addItem(sword);
        player.getInventory().addItem(shield);

        // 剣を装備
        player.equipToSlot(0, sword);
        expect(player.getEquipmentStats().getAttack()).toBe(15);
        expect(player.getEquipmentStats().getDefense()).toBe(2);

        // 盾も装備
        player.equipToSlot(1, shield);
        expect(player.getEquipmentStats().getAttack()).toBe(15); // 剣のまま
        expect(player.getEquipmentStats().getDefense()).toBe(14); // 2 + 12
        expect(player.getEquipmentStats().getAgility()).toBe(3); // 4 + (-1)
      });

      test('装備解除時にEquipmentStatsが更新される', () => {
        const player = new Player('TestPlayer');

        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        player.getInventory().addItem(sword);
        player.equipToSlot(0, sword);

        expect(player.getEquipmentStats().getAttack()).toBe(15);

        // 装備解除
        player.equipToSlot(0, null);

        expect(player.getEquipmentStats().getAttack()).toBe(0);
        expect(player.getEquipmentStats().isEmpty()).toBe(true);
      });

      test('レベルアップでBodyStatsが更新される', () => {
        const player = new Player('TestPlayer');
        const initialHP = player.getBodyStats().getMaxHP();
        const initialMP = player.getBodyStats().getMaxMP();

        // レベル3相当の装備でレベルアップ
        player.getBodyStats().updateLevel(3);

        expect(player.getBodyStats().getLevel()).toBe(3);
        expect(player.getBodyStats().getMaxHP()).toBe(initialHP + 60); // 20 * 3
        expect(player.getBodyStats().getMaxMP()).toBe(initialMP + 30); // 10 * 3
      });

      test('従来のgetStats()は総合ステータスを返す', () => {
        const player = new Player('TestPlayer');

        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        player.getInventory().addItem(sword);
        player.equipToSlot(0, sword);

        const stats = player.getStats();
        const totalStats = player.getTotalStats();

        // 従来のgetStats()は総合ステータスと同じ値を返すべき
        expect(stats.getStrength()).toBe(totalStats.strength);
        expect(stats.getWillpower()).toBe(totalStats.willpower);
        expect(stats.getAgility()).toBe(totalStats.agility);
        expect(stats.getFortune()).toBe(totalStats.fortune);

        // HP/MPはBodyStatsから取得
        expect(stats.getCurrentHP()).toBe(player.getBodyStats().getCurrentHP());
        expect(stats.getCurrentMP()).toBe(player.getBodyStats().getCurrentMP());
        expect(stats.getMaxHP()).toBe(player.getBodyStats().getMaxHP());
        expect(stats.getMaxMP()).toBe(player.getBodyStats().getMaxMP());
      });
    });

    describe('一時ステータスとの統合', () => {
      test('従来のStats一時ブーストは総合ステータスに加算される', () => {
        const player = new Player('TestPlayer');

        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        player.getInventory().addItem(sword);
        player.equipToSlot(0, sword);

        // 一時ブーストを適用
        player.getBodyStats().applyTemporaryBoost('strength', 5);

        const stats = player.getStats();
        // BodyStats(10) + EquipmentStats(15) + TemporaryBoost(5) = 30
        expect(stats.getStrength()).toBe(30);
      });
    });

    describe('JSON シリアライゼーション', () => {
      test('PlayerデータにBodyStatsとEquipmentStatsが含まれる', () => {
        const player = new Player('TestPlayer');

        const sword = new EquipmentItem({
          id: 'test-sword',
          name: 'Test Sword',
          description: 'A test sword',
          type: ItemType.EQUIPMENT,
          rarity: ItemRarity.COMMON,
          stats: { attack: 15, defense: 2, agility: 4, fortune: 0 },
          grade: 21, // 15 + 2 + 1 + 3 + 0 = 21
        });

        player.getInventory().addItem(sword);
        player.equipToSlot(0, sword);

        const json = player.toJSON();

        expect(json.bodyStats).toBeDefined();
        expect(json.equipmentStats).toBeDefined();
        expect(json.bodyStats.level).toBe(4); // 装備により平均レベル4 (21 / 5 = 4.2 -> 4)
        expect(json.equipmentStats.attack).toBe(15);
      });

      test('JSONから復元時にBodyStatsとEquipmentStatsが正しく復元される', () => {
        const playerData = {
          name: 'TestPlayer',
          bodyStats: {
            level: 2,
            currentHP: 120,
            currentMP: 60,
            baseAttack: 12,
            baseDefense: 8,
            baseAgility: 21,
            baseFortune: 9,
            temporaryBoosts: {
              attack: 0,
              defense: 0,
              agility: 0,
              fortune: 0,
            },
            temporaryStatuses: [],
          },
          equipmentStats: {
            attack: 20,
            defense: 5,
            agility: 11,
            fortune: 2,
          },
          inventory: {
            items: [],
            maxSlots: 100,
          },
        };

        const player = Player.fromJSON(playerData);

        expect(player.getBodyStats().getLevel()).toBe(2);
        expect(player.getBodyStats().getBaseStrength()).toBe(12);
        expect(player.getEquipmentStats().getAttack()).toBe(20);
        expect(player.getEquipmentStats().getDefense()).toBe(5);

        // 総合ステータス確認
        const totalStats = player.getTotalStats();
        expect(totalStats.strength).toBe(32); // 12 + 20
        expect(totalStats.willpower).toBe(13); // 8 + 5
      });
    });
  });
});
