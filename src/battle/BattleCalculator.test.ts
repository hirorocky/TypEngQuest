import { BattleCalculator } from './BattleCalculator';

describe('BattleCalculator', () => {
  describe('ダメージ計算', () => {
    it('基本的なダメージ計算ができる', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // 基本ダメージ = (攻撃力 × 技倍率) - (敵防御力 × 0.5)
      // = (50 × 1.0) - (20 × 0.5) = 50 - 10 = 40
      expect(damage).toBe(40);
    });

    it('技倍率が適用される', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.5;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (50 × 1.5) - (20 × 0.5) = 75 - 10 = 65
      expect(damage).toBe(65);
    });

    it('最小ダメージは1', () => {
      const attackPower = 10;
      const defensePower = 50;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (10 × 1.0) - (50 × 0.5) = 10 - 25 = -15 → 1
      expect(damage).toBe(1);
    });

    it('防御力が0の場合', () => {
      const attackPower = 50;
      const defensePower = 0;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower);

      // (50 × 1.0) - (0 × 0.5) = 50 - 0 = 50
      expect(damage).toBe(50);
    });

    it('クリティカル時はダメージが1.5倍', () => {
      const attackPower = 50;
      const defensePower = 20;
      const skillPower = 1.0;

      const damage = BattleCalculator.calculateDamage(attackPower, defensePower, skillPower, true);

      // 基本ダメージ40 × 1.5 = 60
      expect(damage).toBe(60);
    });
  });

  describe('命中率計算', () => {
    it('基本的な命中率計算ができる', () => {
      const accuracy = 100;
      const skillAccuracy = 90;

      const hitRate = BattleCalculator.calculateHitRate(accuracy, skillAccuracy);

      // 基本命中率 = 90 + (精度 / 10) = 90 + (100 / 10) = 100
      // 最大値の制限により99にする
      // 技命中率を掛ける: 99 × (90 / 100) = 89.1
      expect(hitRate).toBeCloseTo(89.1, 5);
    });

    it('精度が高いと命中率が上がる', () => {
      const accuracy = 200;
      const skillAccuracy = 90;

      const hitRate = BattleCalculator.calculateHitRate(accuracy, skillAccuracy);

      // 90 + (200 / 10) = 110 → 99（最大値）
      // 99 × (90 / 100) = 89.1
      expect(hitRate).toBeCloseTo(89.1, 5);
    });

    it('精度が低いと命中率が下がる', () => {
      const accuracy = 0;
      const skillAccuracy = 90;

      const hitRate = BattleCalculator.calculateHitRate(accuracy, skillAccuracy);

      // 90 + (0 / 10) = 90
      // 90 × (90 / 100) = 81
      expect(hitRate).toBe(81);
    });

    it('最大命中率は99%', () => {
      const accuracy = 500;
      const skillAccuracy = 100;

      const hitRate = BattleCalculator.calculateHitRate(accuracy, skillAccuracy);

      // 基本命中率が99%を超えても99%に制限
      expect(hitRate).toBe(99);
    });

    it('最小命中率は50%', () => {
      const accuracy = -1000;
      const skillAccuracy = 50;

      const hitRate = BattleCalculator.calculateHitRate(accuracy, skillAccuracy);

      // 基本命中率が50%未満でも50%に制限
      // 50 × (50 / 100) = 25
      expect(hitRate).toBe(25);
    });
  });

  describe('回避率計算', () => {
    it('基本的な回避率計算ができる', () => {
      const speed = 100;

      const evadeRate = BattleCalculator.calculateEvadeRate(speed);

      // 基本回避率 = 5 + (速度 / 20) = 5 + (100 / 20) = 10
      expect(evadeRate).toBe(10);
    });

    it('速度が高いと回避率が上がる', () => {
      const speed = 200;

      const evadeRate = BattleCalculator.calculateEvadeRate(speed);

      // 5 + (200 / 20) = 5 + 10 = 15
      expect(evadeRate).toBe(15);
    });

    it('最大回避率は30%', () => {
      const speed = 1000;

      const evadeRate = BattleCalculator.calculateEvadeRate(speed);

      // 5 + (1000 / 20) = 55 → 30（最大値）
      expect(evadeRate).toBe(30);
    });

    it('最小回避率は5%', () => {
      const speed = 0;

      const evadeRate = BattleCalculator.calculateEvadeRate(speed);

      // 5 + (0 / 20) = 5
      expect(evadeRate).toBe(5);
    });

    it('速度が負の値でも最小回避率は5%', () => {
      const speed = -100;

      const evadeRate = BattleCalculator.calculateEvadeRate(speed);

      expect(evadeRate).toBe(5);
    });
  });

  describe('クリティカル率計算', () => {
    it('基本的なクリティカル率計算ができる', () => {
      const fortune = 150;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 基本クリティカル率 = 5 + (幸運 / 15) = 5 + (150 / 15) = 15
      expect(criticalRate).toBe(15);
    });

    it('幸運が高いとクリティカル率が上がる', () => {
      const fortune = 300;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (300 / 15) = 5 + 20 = 25（最大値）
      expect(criticalRate).toBe(25);
    });

    it('最大クリティカル率は25%', () => {
      const fortune = 1000;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (1000 / 15) = 71.7 → 25（最大値）
      expect(criticalRate).toBe(25);
    });

    it('最小クリティカル率は5%', () => {
      const fortune = 0;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      // 5 + (0 / 15) = 5
      expect(criticalRate).toBe(5);
    });

    it('幸運が負の値でも最小クリティカル率は5%', () => {
      const fortune = -100;

      const criticalRate = BattleCalculator.calculateCriticalRate(fortune);

      expect(criticalRate).toBe(5);
    });
  });

  describe('タイピングボーナス計算', () => {
    it('速度ボーナスを計算できる', () => {
      const speed = 100;

      const speedBonus = BattleCalculator.calculateSpeedBonus(speed);

      // 速度ボーナス = 1.0 + (速度 / 200) = 1.0 + (100 / 200) = 1.5
      expect(speedBonus).toBe(1.5);
    });

    it('速度が高いとボーナスが増える', () => {
      const speed = 200;

      const speedBonus = BattleCalculator.calculateSpeedBonus(speed);

      // 1.0 + (200 / 200) = 2.0
      expect(speedBonus).toBe(2.0);
    });

    it('精度ボーナスを計算できる', () => {
      const accuracy = 100;

      const accuracyBonus = BattleCalculator.calculateAccuracyBonus(accuracy);

      // 精度ボーナス = 1.0 + (精度 / 200) = 1.0 + (100 / 200) = 1.5
      expect(accuracyBonus).toBe(1.5);
    });

    it('精度が高いとボーナスが増える', () => {
      const accuracy = 200;

      const accuracyBonus = BattleCalculator.calculateAccuracyBonus(accuracy);

      // 1.0 + (200 / 200) = 2.0
      expect(accuracyBonus).toBe(2.0);
    });
  });

  describe('アイテムドロップ率計算', () => {
    it('基本的なドロップ率計算ができる', () => {
      const fortune = 100;
      const worldLevel = 5;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 基本ドロップ率 = 30 + (幸運 / 10) + (ワールドレベル × 5)
      // = 30 + (100 / 10) + (5 × 5) = 30 + 10 + 25 = 65
      expect(dropRate).toBe(65);
    });

    it('幸運とワールドレベルが高いとドロップ率が上がる', () => {
      const fortune = 200;
      const worldLevel = 10;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 30 + (200 / 10) + (10 × 5) = 30 + 20 + 50 = 100 → 80（最大値）
      expect(dropRate).toBe(80);
    });

    it('最大ドロップ率は80%', () => {
      const fortune = 1000;
      const worldLevel = 20;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      expect(dropRate).toBe(80);
    });

    it('最小ドロップ率は30%', () => {
      const fortune = 0;
      const worldLevel = 0;

      const dropRate = BattleCalculator.calculateDropRate(fortune, worldLevel);

      // 30 + (0 / 10) + (0 × 5) = 30
      expect(dropRate).toBe(30);
    });
  });

  describe('実際のエンティティとの統合', () => {
    // プレイヤーとエネミーのステータスを直接使用するテスト
    const playerStats = {
      attack: 50,
      defense: 30,
      speed: 40,
      accuracy: 60,
      fortune: 80,
    };

    const enemyStats = {
      attack: 40,
      defense: 25,
      speed: 35,
      accuracy: 70,
      fortune: 50,
    };

    it('プレイヤーから敵へのダメージを計算できる', () => {
      const damage = BattleCalculator.calculateDamage(playerStats.attack, enemyStats.defense, 1.2);

      // 攻撃力50、防御力25、技倍率1.2
      // (50 × 1.2) - (25 × 0.5) = 60 - 12.5 = 47.5 → 47（整数）
      expect(damage).toBe(47);
    });

    it('敵からプレイヤーへのダメージを計算できる', () => {
      const damage = BattleCalculator.calculateDamage(enemyStats.attack, playerStats.defense, 1.0);

      // 攻撃力40、防御力30、技倍率1.0
      // (40 × 1.0) - (30 × 0.5) = 40 - 15 = 25
      expect(damage).toBe(25);
    });

    it('プレイヤーの命中率を計算できる', () => {
      const hitRate = BattleCalculator.calculateHitRate(playerStats.accuracy, 85);

      // 精度60で基本命中率 = 90 + (60 / 10) = 96
      // 96 × (85 / 100) = 81.6
      expect(hitRate).toBe(81.6);
    });

    it('敵の回避率を計算できる', () => {
      const evadeRate = BattleCalculator.calculateEvadeRate(enemyStats.speed);

      // 速度35で回避率 = 5 + (35 / 20) = 5 + 1.75 = 6.75
      expect(evadeRate).toBe(6.75);
    });
  });
});
