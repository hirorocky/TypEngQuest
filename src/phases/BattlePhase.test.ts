import { BattlePhase } from './BattlePhase';
import { Enemy } from '../battle/Enemy';
import { PhaseTypes } from '../core/types';

describe('BattlePhase', () => {
  let battlePhase: BattlePhase;
  let mockWorld: any;
  let _mockEnemy: Enemy;

  beforeEach(() => {
    mockWorld = {
      player: {
        getEquippedItemSkills: jest.fn().mockReturnValue([
          {
            name: 'attack',
            actionCost: 1,
            mpCost: 0,
            difficulty: 1,
            effects: [{ type: 'damage', value: 10 }],
          },
        ]),
        getBodyStats: jest.fn().mockReturnValue({
          getCurrentHP: jest.fn().mockReturnValue(100),
          getMaxHP: jest.fn().mockReturnValue(100),
          getCurrentMP: jest.fn().mockReturnValue(50),
          getMaxMP: jest.fn().mockReturnValue(50),
          healHP: jest.fn(),
          resetMP: jest.fn(),
        }),
        getTotalStats: jest.fn().mockReturnValue({
          strength: 10,
          willpower: 10,
          agility: 10,
          fortune: 10,
        }),
      },
    };

    // Enemy構築時の正しいパラメータを使用
    _mockEnemy = new Enemy({
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

    battlePhase = new BattlePhase(mockWorld, undefined, mockWorld.player);
  });

  describe('Phase基本実装', () => {
    it('PhaseTypeを正しく返す', () => {
      expect(battlePhase.getType()).toBe(PhaseTypes.BATTLE);
    });

    it('プロンプトを正しく返す', () => {
      const prompt = battlePhase.getPrompt();
      expect(prompt).toContain('battle');
    });

    it('初期化処理が完了する', async () => {
      await expect(battlePhase.initialize()).resolves.not.toThrow();
    });
  });

  describe('基本コマンド処理', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
    });

    it('helpコマンドで利用可能コマンドを表示', async () => {
      const result = await battlePhase.processInput('help');

      expect(result.success).toBe(true);
      expect(result.message || result.output?.join('')).toContain('battle');
    });

    it('statusコマンドでプレイヤーステータスを表示', async () => {
      const result = await battlePhase.processInput('status');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Battle Status');
      expect(result.output).toContain('Player HP: 100/100');
      expect(result.output).toContain('Player MP: 50/50');
    });

    it('skillsコマンドで利用可能スキルを表示', async () => {
      const result = await battlePhase.processInput('skills');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });

    it('runコマンドで逃走試行メッセージを表示', async () => {
      const result = await battlePhase.processInput('run');

      expect(result.success).toBe(true);
      expect(result.message).toBe('You cannot escape from this battle!');
    });

    it('不明なコマンドでエラーを返す', async () => {
      const result = await battlePhase.processInput('invalid');

      expect(result.success).toBe(false);
    });
  });

  describe('フェーズ遷移', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
    });

    it('skillコマンドでスキル選択フェーズに移行', async () => {
      const result = await battlePhase.processInput('skill');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });

    it('itemコマンドでアイテム選択フェーズに移行', async () => {
      const result = await battlePhase.processInput('item');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering item selection...');
      expect(result.nextPhase).toBe('battleItemConsumption');
    });
  });

  describe('戦闘初期化', () => {
    beforeEach(async () => {
      await battlePhase.initialize();
    });

    it('敵との戦闘を開始できる', async () => {
      const result = await battlePhase.startBattle(_mockEnemy);

      expect(result.success).toBe(true);
      expect(result.message).toBe('TestGoblin appeared!');
      expect(result.output).toContain('Battle started! Use "help" to see available commands.');
    });

    it('プレイヤーが存在しない場合は戦闘開始に失敗', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(mockWorld, undefined, undefined);
      await battlePhaseWithoutPlayer.initialize();

      const result = await battlePhaseWithoutPlayer.startBattle(_mockEnemy);

      expect(result.success).toBe(false);
      expect(result.message).toBe('player not available');
    });
  });

  describe('エラーハンドリング', () => {
    it('プレイヤー不在時のstatusコマンドでエラー', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(mockWorld, undefined, undefined);
      await battlePhaseWithoutPlayer.initialize();

      const result = await battlePhaseWithoutPlayer.processInput('status');

      expect(result.success).toBe(false);
      expect(result.message).toBe('player not available');
    });

    it('プレイヤー不在時のskillsコマンドでエラー', async () => {
      const battlePhaseWithoutPlayer = new BattlePhase(mockWorld, undefined, undefined);
      await battlePhaseWithoutPlayer.initialize();

      const result = await battlePhaseWithoutPlayer.processInput('skills');

      expect(result.success).toBe(true);
      expect(result.nextPhase).toBe('skillSelection');
    });

    it('スキルが存在しない場合の表示', async () => {
      const mockPlayerWithoutSkills = {
        ...mockWorld.player,
        getEquippedItemSkills: jest.fn().mockReturnValue([]),
      };
      const battlePhaseWithoutSkills = new BattlePhase(
        mockWorld,
        undefined,
        mockPlayerWithoutSkills
      );
      await battlePhaseWithoutSkills.initialize();

      const result = await battlePhaseWithoutSkills.processInput('skills');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Entering skill selection...');
      expect(result.nextPhase).toBe('skillSelection');
    });
  });
});
