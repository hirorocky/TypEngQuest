import { ComboBoostManager } from './ComboBoostManager';
import { Skill } from './Skill';

describe('ComboBoostManager', () => {
  it('mp_cost_reduction / typing_difficulty を適用・1回で消費', () => {
    const mgr = new ComboBoostManager();
    mgr.register([
      { boostType: 'mp_cost_reduction', value: 5 },
      { boostType: 'typing_difficulty', value: 2 },
    ]);

    const s: Skill = {
      id: 's',
      name: 's',
      description: 't',
      skillType: 'physical',
      mpCost: 10,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 3,
      skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
      criticalRate: { baseRate: 0, typingInfluence: 0 },
      effects: [{ type: 'damage', target: 'enemy', basePower: 1, successRate: 100 }],
    };

    const { modified } = mgr.applyToSkill(s);
    expect(modified.mpCost).toBe(5);
    expect(modified.typingDifficulty).toBe(1);

    mgr.consumeOnce();
    const { modified: again } = mgr.applyToSkill(s);
    expect(again.mpCost).toBe(10);
    expect(again.typingDifficulty).toBe(3);
  });

  it('skill_success / status_success / damage / heal / potential を反映', () => {
    const mgr = new ComboBoostManager();
    mgr.register([
      { boostType: 'skill_success', value: 20 },
      { boostType: 'status_success', value: 15 },
      { boostType: 'damage', value: 0.5 },
      { boostType: 'heal', value: 0.2 },
      { boostType: 'potential', value: 0 },
    ]);

    const s: Skill = {
      id: 'mix',
      name: 'mix',
      description: 'mix',
      skillType: 'magical',
      mpCost: 1,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 2,
      skillSuccessRate: { baseRate: 50, typingInfluence: 0 },
      criticalRate: { baseRate: 0, typingInfluence: 0 },
      effects: [
        { type: 'damage', target: 'enemy', basePower: 10, successRate: 100 },
        { type: 'hp_heal', target: 'self', basePower: 10, successRate: 100 },
        { type: 'add_status', target: 'enemy', basePower: 0, successRate: 30, statusId: 'poison' },
        {
          type: 'remove_status',
          target: 'self',
          basePower: 0,
          successRate: 30,
          statusId: 'poison',
        },
      ],
    };

    const { modified } = mgr.applyToSkill(s);
    expect(modified.skillSuccessRate.baseRate).toBe(70);
    expect(modified.effects[2].successRate).toBe(45);
    expect(modified.effects[3].successRate).toBe(45);
    expect(modified.effects[0].basePower).toBe(15);
    expect(modified.effects[1].basePower).toBe(12);
  });
});
