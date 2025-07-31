import { BodyStats, BodyStatsData } from './BodyStats';

describe('BodyStats', () => {
  describe('コンストラクタ', () => {
    test('デフォルト値で初期化される', () => {
      const bodyStats = new BodyStats();

      expect(bodyStats.getLevel()).toBe(0);
      expect(bodyStats.getCurrentHP()).toBe(100); // BASE_HP
      expect(bodyStats.getCurrentMP()).toBe(50); // BASE_MP
      expect(bodyStats.getMaxHP()).toBe(100);
      expect(bodyStats.getMaxMP()).toBe(50);
      expect(bodyStats.getBaseAttack()).toBe(10);
      expect(bodyStats.getBaseDefense()).toBe(10);
      expect(bodyStats.getBaseSpeed()).toBe(10);
      expect(bodyStats.getBaseAccuracy()).toBe(10);
      expect(bodyStats.getBaseFortune()).toBe(10);
    });

    test('指定レベルで初期化される', () => {
      const bodyStats = new BodyStats(5);

      expect(bodyStats.getLevel()).toBe(5);
      expect(bodyStats.getMaxHP()).toBe(200); // 100 + (5 * 20)
      expect(bodyStats.getMaxMP()).toBe(100); // 50 + (5 * 10)
      expect(bodyStats.getCurrentHP()).toBe(200);
      expect(bodyStats.getCurrentMP()).toBe(100);
    });

    test('負のレベルは0にクランプされる', () => {
      const bodyStats = new BodyStats(-5);

      expect(bodyStats.getLevel()).toBe(0);
    });
  });

  describe('HP管理', () => {
    let bodyStats: BodyStats;

    beforeEach(() => {
      bodyStats = new BodyStats(1); // レベル1: HP 120, MP 60
    });

    test('ダメージを受ける', () => {
      bodyStats.takeDamage(30);
      expect(bodyStats.getCurrentHP()).toBe(90);
    });

    test('HPが0を下回らない', () => {
      bodyStats.takeDamage(200);
      expect(bodyStats.getCurrentHP()).toBe(0);
    });

    test('HPを回復する', () => {
      bodyStats.takeDamage(50);
      bodyStats.healHP(20);
      expect(bodyStats.getCurrentHP()).toBe(90); // 120 - 50 + 20
    });

    test('HP回復は最大値を超えない', () => {
      bodyStats.healHP(50);
      expect(bodyStats.getCurrentHP()).toBe(120); // 最大値維持
    });

    test('HP全回復', () => {
      bodyStats.takeDamage(50);
      bodyStats.fullHealHP();
      expect(bodyStats.getCurrentHP()).toBe(120);
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
      bodyStats = new BodyStats(2); // レベル2: HP 140, MP 70
    });

    test('MPを消費する', () => {
      bodyStats.consumeMP(20);
      expect(bodyStats.getCurrentMP()).toBe(50);
    });

    test('MPが0を下回らない', () => {
      bodyStats.consumeMP(100);
      expect(bodyStats.getCurrentMP()).toBe(0);
    });

    test('MPを回復する', () => {
      bodyStats.consumeMP(30);
      bodyStats.healMP(10);
      expect(bodyStats.getCurrentMP()).toBe(50); // 70 - 30 + 10
    });

    test('MP回復は最大値を超えない', () => {
      bodyStats.healMP(20);
      expect(bodyStats.getCurrentMP()).toBe(70); // 最大値維持
    });

    test('MP全回復', () => {
      bodyStats.consumeMP(30);
      bodyStats.fullHealMP();
      expect(bodyStats.getCurrentMP()).toBe(70);
    });

    test('MP充足性チェック', () => {
      expect(bodyStats.hasEnoughMP(50)).toBe(true);
      expect(bodyStats.hasEnoughMP(80)).toBe(false);
    });
  });

  describe('レベル更新', () => {
    test('レベル更新時にHP/MP比率が保持される', () => {
      const bodyStats = new BodyStats(1); // レベル1: HP 120, MP 60
      bodyStats.takeDamage(60); // HP 60 (50%の状態)
      bodyStats.consumeMP(30); // MP 30 (50%の状態)

      bodyStats.updateLevel(3); // レベル3: HP 160, MP 80

      expect(bodyStats.getLevel()).toBe(3);
      expect(bodyStats.getCurrentHP()).toBe(80); // 160 * 50% = 80
      expect(bodyStats.getCurrentMP()).toBe(40); // 80 * 50% = 40
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
        currentHP: 140, // 160 - 20
        currentMP: 70, // 80 - 10
        baseAttack: 10,
        baseDefense: 10,
        baseSpeed: 10,
        baseAccuracy: 10,
        baseFortune: 10,
        temporaryBoosts: {
          attack: 0,
          defense: 0,
          speed: 0,
          accuracy: 0,
          fortune: 0,
        },
        temporaryStatuses: [],
      });
    });

    test('fromJSON で正しく復元される', () => {
      const data: BodyStatsData = {
        level: 2,
        currentHP: 100,
        currentMP: 40,
        baseAttack: 15,
        baseDefense: 12,
        baseSpeed: 8,
        baseAccuracy: 11,
        baseFortune: 9,
        temporaryBoosts: {
          attack: 0,
          defense: 0,
          speed: 0,
          accuracy: 0,
          fortune: 0,
        },
        temporaryStatuses: [],
      };

      const bodyStats = BodyStats.fromJSON(data);

      expect(bodyStats.getLevel()).toBe(2);
      expect(bodyStats.getCurrentHP()).toBe(100);
      expect(bodyStats.getCurrentMP()).toBe(40);
      expect(bodyStats.getBaseAttack()).toBe(15);
      expect(bodyStats.getBaseDefense()).toBe(12);
      expect(bodyStats.getBaseSpeed()).toBe(8);
      expect(bodyStats.getBaseAccuracy()).toBe(11);
      expect(bodyStats.getBaseFortune()).toBe(9);
    });

    test('不正なJSONデータでエラーが投げられる', () => {
      expect(() => BodyStats.fromJSON(null)).toThrow('Invalid body stats data format');
      expect(() => BodyStats.fromJSON({})).toThrow('Invalid body stats data format');
      expect(() => BodyStats.fromJSON({ level: -1 })).toThrow('Invalid body stats data format');
    });
  });
});
