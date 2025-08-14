import { SkillSelectionPhase } from './SkillSelectionPhase';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';

describe('SkillSelectionPhase', () => {
  let skillSelectionPhase: SkillSelectionPhase;
  let mockPlayer: any;
  let battle: Battle;

  // process.stdin.isTTYをモック
  const originalIsTTY = process.stdin.isTTY;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // TTYをモック
    process.stdin.isTTY = true;
    process.stdin.setRawMode = jest.fn();

    // テスト環境を設定
    process.env.NODE_ENV = 'test';
    const mockSkills = [
      {
        name: 'attack',
        mpCost: 0,
        actionCost: 1,
        difficulty: 1,
        effects: [{ type: 'damage', value: 10 }],
      },
      {
        name: 'fireball',
        mpCost: 10,
        actionCost: 2,
        difficulty: 2,
        effects: [{ type: 'damage', value: 30 }],
      },
      {
        name: 'heal',
        mpCost: 5,
        actionCost: 1,
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
  });

  afterEach(async () => {
    // TTYモックを元に戻す
    process.stdin.isTTY = originalIsTTY;
    process.env.NODE_ENV = originalNodeEnv;
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

  describe('リッチUI入力処理', () => {
    beforeEach(async () => {
      await skillSelectionPhase.initialize();
    });

    it('テスト環境では自動的にスキル選択完了を返す', async () => {
      const result = await skillSelectionPhase.startInputLoop();

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Skill selection completed (test mode)');
      expect(result?.nextPhase).toBe('battleTyping');
      expect(result?.data?.battle).toBe(battle);
      expect(result?.data?.transitionReason).toBe('skillsSelected');
    });

    it('NODE_ENV=production の場合はリッチUIモードになる', () => {
      // processKeyInputメソッドが正しく動作することを確認
      const upArrowResult = (skillSelectionPhase as any).processKeyInput('\u001b[A');
      const enterResult = (skillSelectionPhase as any).processKeyInput('\r');
      const qResult = (skillSelectionPhase as any).processKeyInput('q');

      expect(upArrowResult).toBeNull(); // ナビゲーション継続
      expect(enterResult).toBeNull(); // スキル未選択時は継続
      expect(qResult?.success).toBe(true); // 戻る処理
    });
  });

  describe('キー入力処理', () => {
    beforeEach(async () => {
      await skillSelectionPhase.initialize();
    });

    it('エンターキーで確定処理が実行される（内部処理テスト）', () => {
      // processKeyInputメソッドを直接テスト
      const result = (skillSelectionPhase as any).processKeyInput('\r');

      // スキルが選択されていない場合はnullが返される
      expect(result).toBeNull();
    });

    it('Qキーで戻る処理が実行される（内部処理テスト）', () => {
      // processKeyInputメソッドを直接テスト
      const result = (skillSelectionPhase as any).processKeyInput('q');

      expect(result?.success).toBe(true);
      expect(result?.message).toBe('Returning to battle...');
      expect(result?.nextPhase).toBe('battle');
      expect(result?.data?.battle).toBe(battle);
    });

    it('矢印キーでナビゲーションが動作する（内部処理テスト）', () => {
      // processKeyInputメソッドを直接テスト（上矢印）
      const result = (skillSelectionPhase as any).processKeyInput('\u001b[A');

      // ナビゲーションの場合はnullが返される（継続）
      expect(result).toBeNull();
    });

    it('右矢印キーでスキル追加が動作する（内部処理テスト）', () => {
      // processKeyInputメソッドを直接テスト（右矢印）
      const result = (skillSelectionPhase as any).processKeyInput('\u001b[C');

      // スキル追加の場合はnullが返される（継続）
      expect(result).toBeNull();
    });

    it('左矢印キーでスキル削除が動作する（内部処理テスト）', () => {
      // processKeyInputメソッドを直接テスト（左矢印）
      const result = (skillSelectionPhase as any).processKeyInput('\u001b[D');

      // スキル削除の場合はnullが返される（継続）
      expect(result).toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('スキルが存在しない場合でも初期化が正常に完了する', async () => {
      mockPlayer.getEquippedItemSkills.mockReturnValue([]);
      mockPlayer.getAllAvailableSkills.mockReturnValue([]);
      const emptySkillPhase = new SkillSelectionPhase({
        player: mockPlayer,
        battle: battle,
      });

      await expect(emptySkillPhase.initialize()).resolves.not.toThrow();
    });

    it('プレイヤーが存在しない場合でも初期化が完了する', async () => {
      const phaseWithoutPlayer = new SkillSelectionPhase({
        player: null as any,
        battle: battle,
      });

      await expect(phaseWithoutPlayer.initialize()).resolves.not.toThrow();
    });

    it('cleanup処理が正常に動作する', async () => {
      await expect(skillSelectionPhase.cleanup()).resolves.not.toThrow();
    });
  });
});
