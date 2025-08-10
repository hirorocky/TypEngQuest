import { BattleTypingPhase } from './BattleTypingPhase';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { Battle } from '../battle/Battle';

// stdin.setRawModeをモック
const mockSetRawMode = jest.fn();
Object.defineProperty(process.stdin, 'setRawMode', {
  value: mockSetRawMode,
  writable: true,
});

describe('BattleTypingPhase', () => {
  let battleTypingPhase: BattleTypingPhase;
  let mockSkill: any;
  let mockOnComplete: jest.Mock;
  let player: Player;
  let enemy: Enemy;
  let battle: Battle;

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

    player = new Player('TestPlayer');
    enemy = new Enemy({
      id: 'test-enemy',
      name: 'Test Enemy',
      description: 'A test enemy',
      level: 1,
      stats: {
        maxHp: 100,
        maxMp: 50,
        strength: 10,
        willpower: 5,
        agility: 10,
        fortune: 5,
      },
      drops: [],
      skills: [],
    });

    battle = new Battle(player, enemy);
    battle.start();

    mockOnComplete = jest.fn();
    battleTypingPhase = new BattleTypingPhase({
      skills: [mockSkill],
      battle: battle,
      onComplete: mockOnComplete,
    });
  });

  afterEach(() => {
    // クリーンアップを実行してリソースを解放
    if (battleTypingPhase) {
      // process.stdinのすべてのリスナーを削除
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('keypress');
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
      }
    }
    // モックをクリア
    mockSetRawMode.mockClear();
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
});
