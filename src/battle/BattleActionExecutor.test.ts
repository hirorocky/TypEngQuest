import { BattleActionExecutor } from './BattleActionExecutor';
import { Player } from '../player/Player';
import { Enemy } from './Enemy';
import { Skill } from './Skill';

describe('BattleActionExecutor', () => {
  let player: Player;
  let enemy: Enemy;
  let skill: Skill;

  beforeEach(() => {
    player = new Player('Test Player');
    // プレイヤーの現在MP設定（初期は0）
    player.getBodyStats().healMP(10);

    enemy = new Enemy({
      id: 'test_enemy',
      name: 'Test Enemy',
      description: 'Test enemy',
      level: 1,
      stats: {
        maxHp: 100,
        maxMp: 50,
        strength: 10,
        willpower: 8,
        agility: 12,
        fortune: 5,
      },
      skills: [],
      drops: [],
    });

    skill = {
      id: 'test_skill',
      name: 'Test Skill',
      description: 'Test skill',
      effects: [{ type: 'damage', power: 1.0, target: 'enemy' }],
      successRate: 100,
      mpCost: 5,
      mpCharge: 0,
      actionCost: 1,
      typingDifficulty: 1,
      target: 'enemy',
    };
  });

  describe('executePlayerSkill', () => {
    it('プレイヤーのスキルを正常に実行する', () => {
      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Skill');
    });

    it('MPが不足している場合は失敗する', () => {
      const currentMP = player.getBodyStats().getCurrentMP();

      const expensiveSkill = {
        ...skill,
        mpCost: currentMP + 1, // 現在MPより1多いコスト
      };

      const result = BattleActionExecutor.executePlayerSkill(expensiveSkill, player, enemy);

      expect(result.success).toBe(false);
      expect(result.message[0]).toContain('Not enough MP');
    });

    it('タイピング結果が正しく適用される', () => {
      const typingResult = {
        speedRating: 'S' as const,
        accuracyRating: 'Perfect' as const,
        totalRating: 150,
        timeTaken: 1000,
        accuracy: 100,
        isSuccess: true,
      };

      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy, typingResult);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
    });
  });

  describe('executeEnemySkill', () => {
    it('敵のスキルを正常に実行する', () => {
      const result = BattleActionExecutor.executeEnemySkill(skill, enemy, player);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Enemy');
    });

    it('敵のMPが不足している場合は失敗する', () => {
      enemy.consumeMp(50); // 全MPを消費
      const expensiveSkill = {
        ...skill,
        mpCost: 10,
      };

      const result = BattleActionExecutor.executeEnemySkill(expensiveSkill, enemy, player);

      expect(result.success).toBe(false);
      expect(result.message[0]).toContain("doesn't have enough MP");
    });
  });
});
