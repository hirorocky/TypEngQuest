import { StatusAilmentFactory } from './StatusAilmentFactory';
import { TemporaryStatus } from './TemporaryStatus';

describe('StatusAilmentFactory', () => {
  describe('状態異常の生成', () => {
    describe('createPoison', () => {
      test('デフォルト値で毒状態異常を生成する', () => {
        const poison = StatusAilmentFactory.createPoison();

        expect(poison.name).toBe('Poison');
        expect(poison.type).toBe('status_ailment');
        expect(poison.effects.hpPerTurn).toBe(-3); // デフォルトダメージ
        expect(poison.effects.cannotRun).toBe(true);
        expect(poison.duration).toBe(3); // デフォルト継続期間
        expect(poison.stackable).toBe(false);
        expect(poison.id).toContain('poison-');
      });

      test('カスタム値で毒状態異常を生成する', () => {
        const poison = StatusAilmentFactory.createPoison(5, 7);

        expect(poison.effects.hpPerTurn).toBe(-7); // カスタムダメージ
        expect(poison.duration).toBe(5); // カスタム継続期間
      });

      test('正の値を渡してもダメージは負の値になる', () => {
        const poison = StatusAilmentFactory.createPoison(3, 5);

        expect(poison.effects.hpPerTurn).toBe(-5); // 正の値を渡しても負になる
      });
    });

    describe('createParalysis', () => {
      test('デフォルト値で麻痺状態異常を生成する', () => {
        const paralysis = StatusAilmentFactory.createParalysis();

        expect(paralysis.name).toBe('Paralysis');
        expect(paralysis.type).toBe('status_ailment');
        expect(paralysis.effects.cannotAct).toBe(true);
        expect(paralysis.effects.agility).toBe(-5);
        expect(paralysis.duration).toBe(2); // デフォルト継続期間
        expect(paralysis.stackable).toBe(false);
        expect(paralysis.id).toContain('paralysis-');
      });

      test('カスタム継続期間で麻痺状態異常を生成する', () => {
        const paralysis = StatusAilmentFactory.createParalysis(4);

        expect(paralysis.duration).toBe(4);
      });
    });

    describe('createSleep', () => {
      test('デフォルト値で睡眠状態異常を生成する', () => {
        const sleep = StatusAilmentFactory.createSleep();

        expect(sleep.name).toBe('Sleep');
        expect(sleep.type).toBe('status_ailment');
        expect(sleep.effects.cannotAct).toBe(true);
        expect(sleep.effects.willpower).toBe(-3);
        expect(sleep.duration).toBe(2); // デフォルト継続期間
        expect(sleep.stackable).toBe(false);
        expect(sleep.id).toContain('sleep-');
      });

      test('カスタム継続期間で睡眠状態異常を生成する', () => {
        const sleep = StatusAilmentFactory.createSleep(3);

        expect(sleep.duration).toBe(3);
      });
    });
  });

  describe('バフの生成', () => {
    describe('createStrengthBoost', () => {
      test('デフォルト値でstrengthアップバフを生成する', () => {
        const buff = StatusAilmentFactory.createStrengthBoost();

        expect(buff.name).toBe('Strength Up');
        expect(buff.type).toBe('buff');
        expect(buff.effects.strength).toBe(5); // デフォルトブースト
        expect(buff.duration).toBe(3); // デフォルト継続期間
        expect(buff.stackable).toBe(true);
        expect(buff.id).toContain('strength-boost-');
      });

      test('カスタム値でstrengthアップバフを生成する', () => {
        const buff = StatusAilmentFactory.createStrengthBoost(4, 8);

        expect(buff.effects.strength).toBe(8);
        expect(buff.duration).toBe(4);
      });

      test('負の値を渡しても効果は正の値になる', () => {
        const buff = StatusAilmentFactory.createStrengthBoost(3, -10);

        expect(buff.effects.strength).toBe(10); // 負の値を渡しても正になる
      });
    });

    describe('createWillpowerBoost', () => {
      test('デフォルト値でwillpowerアップバフを生成する', () => {
        const buff = StatusAilmentFactory.createWillpowerBoost();

        expect(buff.name).toBe('Willpower Up');
        expect(buff.type).toBe('buff');
        expect(buff.effects.willpower).toBe(5);
        expect(buff.duration).toBe(3);
        expect(buff.stackable).toBe(true);
        expect(buff.id).toContain('willpower-boost-');
      });
    });

    describe('createRegeneration', () => {
      test('デフォルト値で再生効果を生成する', () => {
        const regen = StatusAilmentFactory.createRegeneration();

        expect(regen.name).toBe('Regeneration');
        expect(regen.type).toBe('buff');
        expect(regen.effects.hpPerTurn).toBe(5); // デフォルト回復量
        expect(regen.duration).toBe(5); // デフォルト継続期間
        expect(regen.stackable).toBe(false);
        expect(regen.id).toContain('regeneration-');
      });

      test('カスタム値で再生効果を生成する', () => {
        const regen = StatusAilmentFactory.createRegeneration(3, 8);

        expect(regen.effects.hpPerTurn).toBe(8);
        expect(regen.duration).toBe(3);
      });

      test('負の値を渡しても回復量は正の値になる', () => {
        const regen = StatusAilmentFactory.createRegeneration(3, -7);

        expect(regen.effects.hpPerTurn).toBe(7); // 負の値を渡しても正になる
      });
    });
  });

  describe('デバフの生成', () => {
    describe('createAllStatsDown', () => {
      test('デフォルト値で全ステータスダウンデバフを生成する', () => {
        const debuff = StatusAilmentFactory.createAllStatsDown();

        expect(debuff.name).toBe('All Stats Down');
        expect(debuff.type).toBe('debuff');
        expect(debuff.effects.strength).toBe(-2);
        expect(debuff.effects.willpower).toBe(-2);
        expect(debuff.effects.agility).toBe(-2);
        expect(debuff.effects.fortune).toBe(-2);
        expect(debuff.duration).toBe(2);
        expect(debuff.stackable).toBe(false);
        expect(debuff.id).toContain('all-stats-down-');
      });

      test('カスタム値で全ステータスダウンデバフを生成する', () => {
        const debuff = StatusAilmentFactory.createAllStatsDown(3, 4);

        expect(debuff.effects.strength).toBe(-4);
        expect(debuff.duration).toBe(3);
      });

      test('負の値を渡してもペナルティは負の値になる', () => {
        const debuff = StatusAilmentFactory.createAllStatsDown(2, -3);

        expect(debuff.effects.strength).toBe(-3); // 絶対値を取って負にする
      });
    });
  });

  describe('ID の一意性', () => {
    test('同じファクトリーメソッドを複数回呼び出すと異なるIDが生成される', () => {
      const poison1 = StatusAilmentFactory.createPoison();
      const poison2 = StatusAilmentFactory.createPoison();

      expect(poison1.id).not.toBe(poison2.id);
    });

    test('異なるファクトリーメソッドで異なるIDプレフィックスが使用される', () => {
      const poison = StatusAilmentFactory.createPoison();
      const paralysis = StatusAilmentFactory.createParalysis();
      const buff = StatusAilmentFactory.createStrengthBoost();

      expect(poison.id).toContain('poison-');
      expect(paralysis.id).toContain('paralysis-');
      expect(buff.id).toContain('strength-boost-');
    });
  });

  describe('TemporaryStatus型の適合性', () => {
    test('生成されたすべてのステータスはTemporaryStatus型に適合する', () => {
      const statuses: TemporaryStatus[] = [
        StatusAilmentFactory.createPoison(),
        StatusAilmentFactory.createParalysis(),
        StatusAilmentFactory.createSleep(),
        StatusAilmentFactory.createStrengthBoost(),
        StatusAilmentFactory.createWillpowerBoost(),
        StatusAilmentFactory.createAllStatsDown(),
        StatusAilmentFactory.createRegeneration(),
      ];

      statuses.forEach(status => {
        expect(typeof status.id).toBe('string');
        expect(typeof status.name).toBe('string');
        expect(['buff', 'debuff', 'status_ailment']).toContain(status.type);
        expect(typeof status.effects).toBe('object');
        expect(typeof status.duration).toBe('number');
        expect(typeof status.stackable).toBe('boolean');
      });
    });
  });
});
