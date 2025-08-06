import { BodyStats, BodyStatsData } from './BodyStats';

describe('BodyStats', () => {
  describe('コンストラクタ', () => {
    test('デフォルト値で初期化される', () => {
      const bodyStats = new BodyStats();

      expect(bodyStats.getLevel()).toBe(0);
      expect(bodyStats.getCurrentHP()).toBe(100); // BASE_HP
      expect(bodyStats.getCurrentMP()).toBe(100); // BASE_MP
      expect(bodyStats.getMaxHP()).toBe(100);
      expect(bodyStats.getMaxMP()).toBe(100);
      expect(bodyStats.getBaseStrength()).toBe(10);
      expect(bodyStats.getBaseWillpower()).toBe(10);
      expect(bodyStats.getBaseAgility()).toBe(10);
      expect(bodyStats.getBaseFortune()).toBe(10);
    });

    test('指定レベルで初期化される', () => {
      const bodyStats = new BodyStats(5);

      expect(bodyStats.getLevel()).toBe(5);
      expect(bodyStats.getMaxHP()).toBe(150); // 100 + (5 * 10)
      expect(bodyStats.getMaxMP()).toBe(110); // 100 + (5 * 2)
      expect(bodyStats.getCurrentHP()).toBe(150);
      expect(bodyStats.getCurrentMP()).toBe(110);
    });

    test('負のレベルは0にクランプされる', () => {
      const bodyStats = new BodyStats(-5);

      expect(bodyStats.getLevel()).toBe(0);
    });
  });

  describe('HP管理', () => {
    let bodyStats: BodyStats;

    beforeEach(() => {
      bodyStats = new BodyStats(1); // レベル1: HP 110, MP 102
    });

    test('ダメージを受ける', () => {
      bodyStats.takeDamage(30);
      expect(bodyStats.getCurrentHP()).toBe(80);
    });

    test('HPが0を下回らない', () => {
      bodyStats.takeDamage(200);
      expect(bodyStats.getCurrentHP()).toBe(0);
    });

    test('HPを回復する', () => {
      bodyStats.takeDamage(50);
      bodyStats.healHP(20);
      expect(bodyStats.getCurrentHP()).toBe(80); // 110 - 50 + 20
    });

    test('HP回復は最大値を超えない', () => {
      bodyStats.healHP(50);
      expect(bodyStats.getCurrentHP()).toBe(110); // 最大値維持
    });

    test('HP全回復', () => {
      bodyStats.takeDamage(50);
      bodyStats.fullHealHP();
      expect(bodyStats.getCurrentHP()).toBe(110);
    });

    test('死亡判定', () => {
      expect(bodyStats.isDead()).toBe(false);
      bodyStats.takeDamage(200);
      expect(bodyStats.isDead()).toBe(true);
    });
  });

  describe('MP管理', () => {
    let bodyStats: BodyStats;

    beforeEach(() => {
      bodyStats = new BodyStats(2); // レベル2: HP 120, MP 104
    });

    test('MPを消費する', () => {
      bodyStats.consumeMP(20);
      expect(bodyStats.getCurrentMP()).toBe(84);
    });

    test('MPが0を下回らない', () => {
      bodyStats.consumeMP(150);
      expect(bodyStats.getCurrentMP()).toBe(0);
    });

    test('MPを回復する', () => {
      bodyStats.consumeMP(30);
      bodyStats.healMP(10);
      expect(bodyStats.getCurrentMP()).toBe(84); // 104 - 30 + 10
    });

    test('MP回復は最大値を超えない', () => {
      bodyStats.healMP(20);
      expect(bodyStats.getCurrentMP()).toBe(104); // 最大値維持
    });

    test('MP全回復', () => {
      bodyStats.consumeMP(30);
      bodyStats.fullHealMP();
      expect(bodyStats.getCurrentMP()).toBe(104);
    });

    test('MP充足性チェック', () => {
      expect(bodyStats.hasEnoughMP(50)).toBe(true);
      expect(bodyStats.hasEnoughMP(120)).toBe(false);
    });
  });

  describe('レベル更新', () => {
    test('レベル更新時にHP/MP比率が保持される', () => {
      const bodyStats = new BodyStats(1); // レベル1: HP 110, MP 102
      bodyStats.takeDamage(55); // HP 55 (50%の状態)
      bodyStats.consumeMP(51); // MP 51 (50%の状態)

      bodyStats.updateLevel(3); // レベル3: HP 130, MP 106

      expect(bodyStats.getLevel()).toBe(3);
      expect(bodyStats.getCurrentHP()).toBe(65); // 130 * 50% = 65
      expect(bodyStats.getCurrentMP()).toBe(53); // 106 * 50% = 53
    });

    test('レベルが変わらない場合は何もしない', () => {
      const bodyStats = new BodyStats(2);
      const originalHP = bodyStats.getCurrentHP();
      const originalMP = bodyStats.getCurrentMP();

      bodyStats.updateLevel(2);

      expect(bodyStats.getCurrentHP()).toBe(originalHP);
      expect(bodyStats.getCurrentMP()).toBe(originalMP);
    });
  });

  describe('JSON シリアライゼーション', () => {
    test('toJSON で正しくシリアライズされる', () => {
      const bodyStats = new BodyStats(3);
      bodyStats.takeDamage(20);
      bodyStats.consumeMP(10);

      const json = bodyStats.toJSON();

      expect(json).toEqual({
        level: 3,
        currentHP: 110, // 130 - 20
        currentMP: 96, // 106 - 10
        baseStrength: 10,
        baseWillpower: 10,
        baseAgility: 10,
        baseFortune: 10,
        temporaryBoosts: {
          strength: 0,
          willpower: 0,
          agility: 0,
          fortune: 0,
        },
        worldBoosts: {
          strength: 0,
          willpower: 0,
          agility: 0,
          fortune: 0,
        },
        temporaryStatuses: [],
        worldStatuses: [],
      });
    });

    test('fromJSON で正しく復元される', () => {
      const data: BodyStatsData = {
        level: 2,
        currentHP: 100,
        currentMP: 40,
        baseStrength: 15,
        baseWillpower: 12,
        baseAgility: 19,
        baseFortune: 9,
        temporaryBoosts: {
          strength: 0,
          willpower: 0,
          agility: 0,
          fortune: 0,
        },
        temporaryStatuses: [],
      };

      const bodyStats = BodyStats.fromJSON(data);

      expect(bodyStats.getLevel()).toBe(2);
      expect(bodyStats.getCurrentHP()).toBe(100);
      expect(bodyStats.getCurrentMP()).toBe(40);
      expect(bodyStats.getBaseStrength()).toBe(15);
      expect(bodyStats.getBaseWillpower()).toBe(12);
      expect(bodyStats.getBaseAgility()).toBe(19);
      expect(bodyStats.getBaseFortune()).toBe(9);
    });

    test('不正なJSONデータでエラーが投げられる', () => {
      expect(() => BodyStats.fromJSON(null)).toThrow('Invalid body stats data format');
      expect(() => BodyStats.fromJSON({})).toThrow('Invalid body stats data format');
      expect(() => BodyStats.fromJSON({ level: -1 })).toThrow('Invalid body stats data format');
    });
  });
});
