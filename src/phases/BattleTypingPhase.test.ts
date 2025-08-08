import { BattleTypingPhase } from './BattleTypingPhase';
import { PhaseTypes } from '../core/types';

describe('BattleTypingPhase', () => {
  let battleTypingPhase: BattleTypingPhase;
  let mockSkill: any;
  let mockOnComplete: jest.Mock;

  beforeEach(() => {
    mockSkill = {
      id: 'fireball',
      name: 'fireball',
      description: 'A powerful fireball spell',
      mpCost: 10,
      mpCharge: 15,
      actionCost: 1,
      successRate: 90,
      target: 'enemy',
      typingDifficulty: 2,
      effects: [{ type: 'damage', value: 30 }],
    };

    mockOnComplete = jest.fn();
    battleTypingPhase = new BattleTypingPhase(mockSkill, mockOnComplete);
  });

  describe('Phase基本実装', () => {
    it('PhaseTypeを正しく返す', () => {
      expect(battleTypingPhase.getType()).toBe(PhaseTypes.BATTLE_TYPING);
    });

    it('プロンプトを正しく返す', () => {
      const prompt = battleTypingPhase.getPrompt();
      expect(prompt).toContain('typing');
    });

    it('初期化処理が完了する', async () => {
      await expect(battleTypingPhase.initialize()).resolves.not.toThrow();
    });
  });

  describe('タイピングチャレンジ', () => {
    beforeEach(async () => {
      await battleTypingPhase.initialize();
    });

    it('スキル使用時にタイピングチャレンジを開始', async () => {
      const result = await battleTypingPhase.startTypingChallenge();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Type');
    });

    it('タイピング完了時にコールバックを呼び出す', async () => {
      await battleTypingPhase.startTypingChallenge();

      // タイピング完了をシミュレート
      await battleTypingPhase.completeTyping();

      expect(mockOnComplete).toHaveBeenCalled();
    });

    it('タイピング結果に基づいてスキル効果を計算', async () => {
      await battleTypingPhase.startTypingChallenge();

      const result = await battleTypingPhase.evaluateTypingResult('perfect', 'fast');

      expect(result.success).toBe(true);
      // mpCharge=15, perfect(1.5倍)なので15 * 1.5 = 22.5, floor(22.5) = 22
      expect(result.skillEffect).toBe(22);
    });
  });

  describe('入力処理', () => {
    beforeEach(async () => {
      await battleTypingPhase.initialize();
    });

    it('文字入力でタイピング進行をチェック', async () => {
      await battleTypingPhase.startTypingChallenge();

      // typingDifficulty=2なので'fireball'が選択されるはず
      const targetWord = battleTypingPhase.getCurrentTargetWord();
      const firstChar = targetWord[0];

      const result = await battleTypingPhase.processInput(firstChar);

      expect(result.success).toBe(true);
    });

    it('不正な入力でタイピングエラーを記録', async () => {
      await battleTypingPhase.startTypingChallenge();

      const result = await battleTypingPhase.processInput('x'); // 'f'が期待されるが'x'を入力

      expect(result.success).toBe(false);
    });

    it('タイピング完了時に自動的に次フェーズへ移行', async () => {
      await battleTypingPhase.startTypingChallenge();

      // 完全なタイピング入力をシミュレート
      const word = battleTypingPhase.getCurrentTargetWord();
      for (const char of word) {
        await battleTypingPhase.processInput(char);
      }

      expect(mockOnComplete).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('タイピング開始前の入力でエラー', async () => {
      const result = await battleTypingPhase.processInput('a');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not started');
    });

    it('制限時間超過でタイピング失敗', async () => {
      await battleTypingPhase.startTypingChallenge();

      // 制限時間超過をシミュレート
      const result = await battleTypingPhase.forceTimeout();

      expect(result.success).toBe(false);
      expect(result.message).toContain('timeout');
    });
  });
});
