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
        strength: 10,
        willpower: 8,
        agility: 12,
        fortune: 5,
      },
      physicalEvadeRate: 15,
      magicalEvadeRate: 10,
      skills: [],
      drops: [],
    });

    skill = {
      id: 'test_skill',
      name: 'Test Skill',
      description: 'Test skill',
      skillType: 'physical',
      mpCost: 5,
      mpCharge: 0,
      actionCost: 1,
      target: 'enemy',
      typingDifficulty: 1,
      skillSuccessRate: {
        baseRate: 100,
        agilityInfluence: 0.1,
        typingInfluence: 0.2,
      },
      criticalRate: {
        baseRate: 5,
        fortuneInfluence: 0.1,
      },
      effects: [
        {
          type: 'damage',
          target: 'enemy',
          basePower: 1.0,
          successRate: 100,
        },
      ],
    };
  });

  describe('executePlayerSkill', () => {
    it('プレイヤーのスキルを正常に実行する', () => {
      // Math.randomを命中するように固定
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.01); // 1%（命中確実）

      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Skill');

      mockRandom.mockRestore();
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
      // Math.randomを命中するように固定
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.01); // 1%（命中確実）

      const typingResult = {
        speedRating: 'Fast' as const,
        accuracyRating: 'Perfect' as const,
        totalRating: 150,
        timeTaken: 1000,
        accuracy: 100,
        isSuccess: true,
      };

      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy, typingResult);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);

      mockRandom.mockRestore();
    });
  });

  describe('executeEnemySkill', () => {
    it('敵のスキルを正常に実行する', () => {
      // Math.randomを命中するように固定
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0.01); // 1%（命中確実）

      const result = BattleActionExecutor.executeEnemySkill(skill, enemy, player);

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.message).toContain('Test Enemy');

      mockRandom.mockRestore();
    });
  });
});
