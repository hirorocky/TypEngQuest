import { StatusCommand } from './StatusCommand';
import { CommandContext } from '../BaseCommand';
import { Player } from '../../player/Player';
import { Stats } from '../../player/Stats';

describe('StatusCommand', () => {
  let command: StatusCommand;
  let mockContext: CommandContext;
  let mockPlayer: Player;
  let mockStats: Stats;

  beforeEach(() => {
    // Statsモックの作成
    mockStats = {
      getCurrentHP: jest.fn(() => 80),
      getMaxHP: jest.fn(() => 120),
      getCurrentMP: jest.fn(() => 45),
      getMaxMP: jest.fn(() => 60),
      getAttack: jest.fn(() => 25),
      getDefense: jest.fn(() => 18),
      getSpeed: jest.fn(() => 22),
      getAccuracy: jest.fn(() => 20),
      getFortune: jest.fn(() => 15),
    } as any;

    // Playerモックの作成
    mockPlayer = {
      getName: jest.fn(() => 'TestPlayer'),
      getLevel: jest.fn(() => 1),
      getStats: jest.fn(() => mockStats),
    } as any;

    // CommandContextモックの作成
    mockContext = {
      currentPhase: 'exploration',
      player: mockPlayer,
      fileSystem: {} as any,
      gameState: {} as any,
    };

    command = new StatusCommand();
  });

  describe('execute', () => {
    test('プレイヤーのステータス情報を正常に表示する', () => {
      const result = command.execute([], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('TestPlayer');
      expect(result.message).toContain('Level: 1');
      expect(result.message).toContain('HP: 80/120');
      expect(result.message).toContain('MP: 45/60');
      expect(result.message).toContain('Attack: 25');
      expect(result.message).toContain('Defense: 18');
      expect(result.message).toContain('Speed: 22');
      expect(result.message).toContain('Accuracy: 20');
      expect(result.message).toContain('Fortune: 15');
    });

    test('HP/MPバーが正しく表示される', () => {
      const result = command.execute([], mockContext);

      expect(result.success).toBe(true);
      // HPバー (80/120 = 66.7% ≈ 13/20個の■)
      expect(result.message).toMatch(/HP: .*■{13}□{7}/);
      // MPバー (45/60 = 75% = 15/20個の■)
      expect(result.message).toMatch(/MP: .*■{15}□{5}/);
    });

    test('HP/MPが最大値の場合、バーが全て満たされる', () => {
      mockStats.getCurrentHP = jest.fn(() => 120);
      mockStats.getCurrentMP = jest.fn(() => 60);

      const result = command.execute([], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/HP: .*■{20}/);
      expect(result.message).toMatch(/MP: .*■{20}/);
    });

    test('HP/MPが0の場合、バーが全て空になる', () => {
      mockStats.getCurrentHP = jest.fn(() => 0);
      mockStats.getCurrentMP = jest.fn(() => 0);

      const result = command.execute([], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toMatch(/HP: .*□{20}/);
      expect(result.message).toMatch(/MP: .*□{20}/);
    });

    test('引数が渡されても無視される', () => {
      const result = command.execute(['arg1', 'arg2'], mockContext);

      expect(result.success).toBe(true);
      expect(result.message).toContain('TestPlayer');
    });

    test('Playerが存在しない場合エラーを返す', () => {
      const contextWithoutPlayer = {
        ...mockContext,
        player: undefined as any,
      };

      const result = command.execute([], contextWithoutPlayer);

      expect(result.success).toBe(false);
      expect(result.message).toBe('player not initialized');
    });

    test('Stats情報が取得できない場合エラーを返す', () => {
      mockPlayer.getStats = jest.fn(() => {
        throw new Error('Stats not available');
      });

      const result = command.execute([], mockContext);

      expect(result.success).toBe(false);
      expect(result.message).toBe('unable to get player stats');
    });
  });

  describe('getHelp', () => {
    test('ヘルプメッセージを返す', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'status - display player status and equipment bonuses',
        '',
        'Shows current HP, MP, and all character statistics.',
        'Available in exploration, battle, and inventory phases.',
      ]);
    });
  });

  describe('name and description', () => {
    test('コマンド名とdescriptionが正しく設定されている', () => {
      expect(command.name).toBe('status');
      expect(command.description).toBe('display player status and equipment bonuses');
    });
  });

  describe('HP/MPバー表示機能', () => {
    test('バーの長さが20文字固定である', () => {
      const result = command.execute([], mockContext);
      
      // HPバーとMPバーの■と□の合計が20個であることを確認
      const hpBarMatch = result.message!.match(/HP: \d+\/\d+ (■*□*)/);
      const mpBarMatch = result.message!.match(/MP: \d+\/\d+ (■*□*)/);
      
      expect(hpBarMatch).toBeTruthy();
      expect(mpBarMatch).toBeTruthy();
      expect(hpBarMatch![1].length).toBe(20);
      expect(mpBarMatch![1].length).toBe(20);
    });

    test('端数処理が正しく行われる', () => {
      // 33/100 = 33% = 6.6/20 ≈ 7個の■
      mockStats.getCurrentHP = jest.fn(() => 33);
      mockStats.getMaxHP = jest.fn(() => 100);

      const result = command.execute([], mockContext);

      expect(result.message).toMatch(/HP: .*■{7}□{13}/);
    });
  });
});