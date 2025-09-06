import { BattleCalculator } from './BattleCalculator';
import { ComboBoostManager } from './ComboBoostManager';
import { Enemy } from './Enemy';
import { Player } from '../player/Player';
import { Skill, SkillEffect, SkillPotentialEffect } from './Skill';

describe('Skill Flexibility - 追加テスト', () => {
  describe('条件評価（BattleCalculator.isEffectConditionsMet）', () => {
    it('typing_accuracy eq/ne と hp_threshold self/enemy を評価できる', () => {
      const ctx1 = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 50, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Good' },
      });

      // accuracy eq Good → true
      expect(
        BattleCalculator.isEffectConditionsMet([{ type: 'typing_accuracy', value: 'Good' }], ctx1)
      ).toBe(true);

      // accuracy eq Perfect → false
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'typing_accuracy', value: 'Perfect' }],
          ctx1
        )
      ).toBe(false);

      // accuracy ne Perfect → true
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'typing_accuracy', value: 'Perfect', operator: 'ne' }],
          ctx1
        )
      ).toBe(true);

      // self hp gte 80% → true, lte 50% → false
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'self', operator: 'gte', value: 80 }],
          ctx1
        )
      ).toBe(true);
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'self', operator: 'lte', value: 50 }],
          ctx1
        )
      ).toBe(false);

      // defender hp lte 50% → true
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'enemy', operator: 'lte', value: 50 }],
          ctx1
        )
      ).toBe(true);

      // defender hp gte 60% → false
      expect(
        BattleCalculator.isEffectConditionsMet(
          [{ type: 'hp_threshold', target: 'enemy', operator: 'gte', value: 60 }],
          ctx1
        )
      ).toBe(false);
    });
  });

  describe('潜在効果マージ（typingPerfect/exMode）', () => {
    it('typingPerfect もしくは exMode 条件で効果が追加される', () => {
      const base: SkillEffect[] = [
        { type: 'damage', target: 'enemy', basePower: 5, successRate: 100 },
      ];
      const potentials: SkillPotentialEffect[] = [
        {
          triggerCondition: { typingPerfect: true },
          effect: { type: 'damage', target: 'enemy', basePower: 7, successRate: 100 },
        },
        {
          triggerCondition: { exMode: true },
          effect: { type: 'damage', target: 'enemy', basePower: 9, successRate: 100 },
        },
      ];

      const ctxPerfect = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Perfect', exMode: false },
      });
      const ctxEx = BattleCalculator.createConditionContext({
        attackerHP: { current: 100, max: 100 },
        defenderHP: { current: 100, max: 100 },
        attackerAgility: 50,
        typing: { accuracy: 'Good', exMode: true },
      });

      const rPerfect = BattleCalculator.mergePotentialEffects(base, potentials, ctxPerfect);
      const rEx = BattleCalculator.mergePotentialEffects(base, potentials, ctxEx);

      expect(rPerfect.length).toBe(2); // base + Perfect潜在
      expect(rEx.length).toBe(2); // base + exMode潜在
    });
  });

  describe('ComboBoostManager（各種ブーストの適用）', () => {
    it('mp_cost_reduction / typing_difficulty を適用・消費できる', () => {
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
      expect(modified.typingDifficulty).toBe(1); // 下限1にクランプ

      mgr.consumeOnce();
      const { modified: again } = mgr.applyToSkill(s);
      expect(again.mpCost).toBe(10);
      expect(again.typingDifficulty).toBe(3);
    });

    it('skill_success / status_success / damage / heal / potential の反映', () => {
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
          {
            type: 'add_status',
            target: 'enemy',
            basePower: 0,
            successRate: 30,
            statusId: 'poison',
          },
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
      // skill_success → baseRate 加算
      expect(modified.skillSuccessRate.baseRate).toBe(70);
      // status_success → add/remove_status の successRate 増加
      const add = modified.effects[2];
      const rem = modified.effects[3];
      expect(add.successRate).toBe(45);
      expect(rem.successRate).toBe(45);
      // damage/heal は倍率で増加
      const dmg = modified.effects[0];
      const heal = modified.effects[1];
      expect(dmg.basePower).toBe(15);
      expect(heal.basePower).toBe(12);
    });
  });

  describe('BattleActionExecutor: スキル実行後に comboBoosts を登録→次スキルで消費', () => {
    it('スキルAがコンボ付与、スキルBが強化され1回で消費される', () => {
      const player = new Player('p');
      player.getBodyStats().healMP(100);
      const enemy = new Enemy({
        id: 'e',
        name: 'e',
        description: 'e',
        level: 1,
        stats: { maxHp: 9999, strength: 1, willpower: 1, agility: 1, fortune: 1 },
        physicalEvadeRate: 0,
        magicalEvadeRate: 0,
      });

      const skillA: Skill = {
        id: 'combo_seed',
        name: 'Seed',
        description: 'register combo',
        skillType: 'physical',
        mpCost: 0,
        mpCharge: 0,
        actionCost: 1,
        target: 'enemy',
        typingDifficulty: 1,
        skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
        criticalRate: { baseRate: 0, typingInfluence: 0 },
        effects: [{ type: 'damage', target: 'enemy', basePower: 1, successRate: 100 }],
        comboBoosts: [{ boostType: 'damage', value: 1.0, duration: 1 }], // 次の1回ダメージ2倍
      };

      const skillB: Skill = {
        id: 'finisher',
        name: 'Finisher',
        description: 'deal damage',
        skillType: 'physical',
        mpCost: 0,
        mpCharge: 0,
        actionCost: 1,
        target: 'enemy',
        typingDifficulty: 1,
        skillSuccessRate: { baseRate: 100, typingInfluence: 0 },
        criticalRate: { baseRate: 0, typingInfluence: 0 },
        effects: [{ type: 'damage', target: 'enemy', basePower: 10, successRate: 100 }],
      };

      // ランダム要素を排除
      jest.spyOn(BattleCalculator, 'isEffectSuccess').mockReturnValue(true);
      jest.spyOn(BattleCalculator, 'isSkillEvaded').mockReturnValue(false);

      // A実行: コンボ登録
      const { BattleActionExecutor } = require('./BattleActionExecutor');
      BattleActionExecutor.executePlayerSkill(skillA, player, enemy);

      // B実行: 強化が乗る
      const first = BattleActionExecutor.executePlayerSkill(skillB, player, enemy);
      const second = BattleActionExecutor.executePlayerSkill(skillB, player, enemy);

      expect(first.damage).toBeGreaterThan(second.damage);

      jest.restoreAllMocks();
    });
  });
});
