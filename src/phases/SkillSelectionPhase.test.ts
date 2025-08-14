import { SkillSelectionPhase } from './SkillSelectionPhase';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';

describe('SkillSelectionPhase', () => {
  let skillSelectionPhase: SkillSelectionPhase;
  let mockPlayer: any;
  let battle: Battle;
  let notifyTransitionSpy: jest.Mock;

  // process.stdin.isTTYをモック
  const originalIsTTY = process.stdin.isTTY;

  beforeEach(() => {
    // TTYをモック
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();

    // notifyTransitionメソッドをスパイに置き換える
    notifyTransitionSpy = jest.fn();
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
      getCurrentMP: jest.fn().mockReturnValue(15),
      getMaxMP: jest.fn().mockReturnValue(50),
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

    skillSelectionPhase = new SkillSelectionPhase({
      player: mockPlayer,
      battle: battle,
    });

    // notifyTransitionをモックに置き換え
    (skillSelectionPhase as any).notifyTransition = notifyTransitionSpy;
  });

  afterEach(async () => {
    // TTYモックを元に戻す
    process.stdin.isTTY = originalIsTTY;
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
      expect(result.message).toBe('Available skills:');
      expect(result.output).toEqual([
        '  1. attack (MP: 0)',
        '  2. fireball (MP: 10)',
        '  3. heal (MP: 5)',
      ]);
    });

    it('スキル番号選択で正しいスキルを選択', async () => {
      const result = await skillSelectionPhase.processInput('2');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Selected fireball');
      // フェーズ遷移が設定されていることを確認
      expect(result.nextPhase).toBe('battleTyping');
      expect(result.data?.skills).toEqual([mockPlayer.getAllAvailableSkills()[1]]);
    });

    it('スキル名で選択', async () => {
      const result = await skillSelectionPhase.processInput('fireball');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Selected fireball');
      // フェーズ遷移が設定されていることを確認
      expect(result.nextPhase).toBe('battleTyping');
      expect(result.data?.skills).toEqual([expect.objectContaining({ name: 'fireball' })]);
    });

    it('MP不足スキル選択時にエラー', async () => {
      // MPを5に設定してfireball（10MP必要）を選択不可にする
      mockPlayer.getCurrentMP.mockReturnValue(5);
      mockPlayer.getBodyStats().getCurrentMP.mockReturnValue(5);

      const result = await skillSelectionPhase.processInput('fireball');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not enough MP for fireball (Requires: 10, Current: 5)');
    });
  });

  describe('コマンド処理', () => {
    beforeEach(async () => {
      await skillSelectionPhase.initialize();
    });

    it('helpコマンドで利用可能コマンドを表示', async () => {
      const result = await skillSelectionPhase.processInput('help');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Available commands:');
      expect(result.output).toContain('  list - Show available skills');
    });

    it('backコマンドで前フェーズに戻る', async () => {
      const result = await skillSelectionPhase.processInput('back');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Returning to battle...');
      // フェーズ遷移が設定されていることを確認
      expect(result.nextPhase).toBe('battle');
      expect(result.data?.battle).toBe(battle);
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
      });
      await phaseWithoutPlayer.initialize();

      const result = await phaseWithoutPlayer.processInput('list');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Player not available');
    });
  });
});
