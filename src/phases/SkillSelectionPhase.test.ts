import { SkillSelectionPhase } from './SkillSelectionPhase';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';

describe('SkillSelectionPhase', () => {
  let skillSelectionPhase: SkillSelectionPhase;
  let mockPlayer: any;
  let mockOnSkillSelected: jest.Mock;
  let mockOnBack: jest.Mock;
  let battle: Battle;

  beforeEach(() => {
    const mockSkills = [
      {
        name: 'attack',
        mpCost: 0,
        difficulty: 1,
        effects: [{ type: 'damage', value: 10 }],
      },
      {
        name: 'fireball',
        mpCost: 10,
        difficulty: 2,
        effects: [{ type: 'damage', value: 30 }],
      },
      {
        name: 'heal',
        mpCost: 5,
        difficulty: 1,
        effects: [{ type: 'heal', value: 20 }],
      },
    ];

    mockPlayer = {
      getEquippedItemSkills: jest.fn().mockReturnValue(mockSkills),
      getAllAvailableSkills: jest.fn().mockReturnValue(mockSkills),
      getBodyStats: jest.fn().mockReturnValue({
        getCurrentMP: jest.fn().mockReturnValue(15),
        getMaxMP: jest.fn().mockReturnValue(50),
      }),
    };

    // 実際のBattleインスタンスを作成
    const testPlayer = new Player('TestPlayer', true);
    const testEnemy = new Enemy({
      id: 'test_goblin',
      name: 'TestGoblin',
      description: 'A test enemy',
      level: 1,
      stats: {
        maxHp: 50,
        maxMp: 20,
        strength: 10,
        willpower: 8,
        agility: 6,
        fortune: 4,
      },
      skills: [],
      drops: [],
    });
    battle = new Battle(testPlayer, testEnemy);

    mockOnSkillSelected = jest.fn();
    mockOnBack = jest.fn();
    skillSelectionPhase = new SkillSelectionPhase({
      player: mockPlayer,
      battle: battle,
      onSkillsSelected: mockOnSkillSelected,
      onBack: mockOnBack,
    });
  });

  afterEach(async () => {
    // クリーンアップを実行してリソースを解放
    if (skillSelectionPhase) {
      await skillSelectionPhase.cleanup();
      // process.stdinのすべてのリスナーを削除
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('keypress');
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
      }
    }
  });

  describe('Phase基本実装', () => {
    it('PhaseTypeを正しく返す', () => {
      expect(skillSelectionPhase.getType()).toBe(PhaseTypes.SKILL_SELECTION);
    });

    it('プロンプトを正しく返す', () => {
      const prompt = skillSelectionPhase.getPrompt();
      expect(prompt).toBe('skill> ');
    });

    it('初期化処理が完了する', async () => {
      await expect(skillSelectionPhase.initialize()).resolves.not.toThrow();
    });
  });

  describe('スキル表示と選択', () => {
    beforeEach(async () => {
      await skillSelectionPhase.initialize();
    });

    it('利用可能スキル一覧を表示', async () => {
      const result = await skillSelectionPhase.processInput('list');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Available skills');
      expect(result.output).toEqual(
        expect.arrayContaining([
          '  1. attack - Cost: 0 MP',
          '  2. fireball - Cost: 10 MP',
          '  3. heal - Cost: 5 MP',
        ])
      );
    });

    it('スキル番号選択で正しいスキルを選択', async () => {
      const result = await skillSelectionPhase.processInput('2');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Selected fireball');
      expect(mockOnSkillSelected).toHaveBeenCalledWith([mockPlayer.getAllAvailableSkills()[1]]);
    });

    it('スキル名で選択', async () => {
      const result = await skillSelectionPhase.processInput('fireball');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Selected fireball');
      expect(mockOnSkillSelected).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'fireball' }),
      ]);
    });

    it('MP不足スキル選択時にエラー', async () => {
      // MPを5に設定してfireball（10MP必要）を選択不可にする
      mockPlayer.getBodyStats().getCurrentMP.mockReturnValue(5);

      const result = await skillSelectionPhase.processInput('fireball');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient MP to use this skill');
    });
  });

  describe('コマンド処理', () => {
    beforeEach(async () => {
      await skillSelectionPhase.initialize();
    });

    it('helpコマンドで利用可能コマンドを表示', async () => {
      const result = await skillSelectionPhase.processInput('help');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Skill Selection Commands:');
      expect(result.output).toContain('  list - Show available skills');
    });

    it('backコマンドで前フェーズに戻る', async () => {
      const result = await skillSelectionPhase.processInput('back');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Returning to battle...');
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('statusコマンドでプレイヤーMPを表示', async () => {
      const result = await skillSelectionPhase.processInput('status');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Player Status:');
      expect(result.output).toEqual(['  MP: 15/50']);
    });

    it('不正なスキル番号でエラー', async () => {
      const result = await skillSelectionPhase.processInput('999');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown command or skill. Type "help" for available commands.');
    });

    it('存在しないスキル名でエラー', async () => {
      const result = await skillSelectionPhase.processInput('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown command or skill. Type "help" for available commands.');
    });
  });

  describe('エラーハンドリング', () => {
    it('スキルが存在しない場合の処理', async () => {
      mockPlayer.getEquippedItemSkills.mockReturnValue([]);
      mockPlayer.getAllAvailableSkills.mockReturnValue([]);
      const emptySkillPhase = new SkillSelectionPhase({
        player: mockPlayer,
        battle: battle,
        onSkillsSelected: jest.fn(),
        onBack: mockOnBack,
      });
      await emptySkillPhase.initialize();

      const result = await emptySkillPhase.processInput('list');

      expect(result.success).toBe(true);
      expect(result.message).toBe('No skills available');
    });

    it('プレイヤーが存在しない場合の処理', async () => {
      const phaseWithoutPlayer = new SkillSelectionPhase({
        player: null as any,
        battle: battle,
        onSkillsSelected: jest.fn(),
        onBack: mockOnBack,
      });
      await phaseWithoutPlayer.initialize();

      const result = await phaseWithoutPlayer.processInput('list');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not available');
    });
  });
});
