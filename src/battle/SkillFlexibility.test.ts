import { BattleActionExecutor } from './BattleActionExecutor';
import { Enemy } from './Enemy';
import { Skill } from './Skill';
import { Player } from '../player/Player';
import { BattleCalculator } from './BattleCalculator';

describe('Skill Flexibility System (10C)', () => {
  let player: Player;
  let enemy: Enemy;

  beforeEach(() => {
    player = new Player('Tester');
    enemy = new Enemy({
      id: 'slime',
      name: 'Slime',
      description: 'Test enemy',
      level: 1,
      stats: { maxHp: 100, strength: 5, willpower: 5, agility: 5, fortune: 5 },
      physicalEvadeRate: 0,
      magicalEvadeRate: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // コンボは毎回クリア
    BattleActionExecutor.getComboBoostManager().clear();
  });

  it('条件: typing_speed=Fast のときのみ効果が発動する', () => {
    const skill: Skill = {
      id: 'adaptive_strike',
      name: 'Adaptive Strike',
      description: '速度に反応して発動',
      skillType: 'physical',
      mpCost: 5,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 1,
      skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
      criticalRate: { baseRate: 0, typingInfluence: 0 },
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          basePower: 10,
          successRate: 100,
          conditions: [{ type: 'typing_speed', value: 'Fast' }],
        },
      ],
    };

    jest.spyOn(BattleCalculator, 'isEffectSuccess').mockReturnValue(true);
    jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(false);

    const r1 = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Normal',
      accuracyRating: 'Good',
      totalRating: 100,
      timeTaken: 1000,
      accuracy: 95,
      isSuccess: true,
    });
    expect(r1.damage).toBe(0);

    const r2 = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Fast',
      accuracyRating: 'Good',
      totalRating: 120,
      timeTaken: 800,
      accuracy: 96,
      isSuccess: true,
    });
    expect(r2.damage).toBeGreaterThan(0);
  });

  it('潜在効果: Perfect時に追加効果がマージされる', () => {
    const skill: Skill = {
      id: 'opportunistic_strike',
      name: 'Opportunistic Strike',
      description: 'Perfectで追加ダメージ',
      skillType: 'physical',
      mpCost: 3,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 1,
      skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
      criticalRate: { baseRate: 0, typingInfluence: 0 },
      effects: [
        { type: 'damage', target: 'enemy', basePower: 5, successRate: 100 },
      ],
      potentialEffects: [
        {
          triggerCondition: { typingPerfect: true },
          effect: { type: 'damage', target: 'enemy', basePower: 7, successRate: 100 },
        },
      ],
    };

    jest.spyOn(BattleCalculator, 'isEffectSuccess').mockReturnValue(true);
    jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(false);

    const normal = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Normal',
      accuracyRating: 'Good',
      totalRating: 120,
      timeTaken: 1200,
      accuracy: 96,
      isSuccess: true,
    });
    const perfect = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Normal',
      accuracyRating: 'Perfect',
      totalRating: 150,
      timeTaken: 900,
      accuracy: 100,
      isSuccess: true,
    });
    expect(perfect.damage).toBeGreaterThan(normal.damage);
  });

  it('コンボ: damageブーストは1回のみ適用され消費される', () => {
    const skill: Skill = {
      id: 'combo_power_strike',
      name: 'Combo Power Strike',
      description: '次の一撃を強化',
      skillType: 'physical',
      mpCost: 5,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 1,
      skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
      criticalRate: { baseRate: 0, typingInfluence: 0 },
      effects: [
        { type: 'damage', target: 'enemy', basePower: 10, successRate: 100 },
      ],
    };

    jest.spyOn(BattleCalculator, 'isEffectSuccess').mockReturnValue(true);
    jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(false);

    // 次の1回、ダメージ+50%
    BattleActionExecutor.getComboBoostManager().register([
      { boostType: 'damage', value: 0.5 },
    ]);

    const first = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Normal',
      accuracyRating: 'Good',
      totalRating: 100,
      timeTaken: 1000,
      accuracy: 95,
      isSuccess: true,
    });

    const second = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      speedRating: 'Normal',
      accuracyRating: 'Good',
      totalRating: 100,
      timeTaken: 1000,
      accuracy: 95,
      isSuccess: true,
    });

    expect(first.damage).toBeGreaterThan(second.damage);
  });
});

