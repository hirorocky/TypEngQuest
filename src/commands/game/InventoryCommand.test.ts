import { InventoryCommand } from './InventoryCommand';
import { CommandContext } from '../BaseCommand';
import { PhaseTypes } from '../../core/types';
import { Player } from '../../player/Player';

describe('InventoryCommand', () => {
  let command: InventoryCommand;
  let player: Player;
  let context: CommandContext;

  beforeEach(() => {
    command = new InventoryCommand();
    player = new Player('TestPlayer');
    context = {
      currentPhase: PhaseTypes.EXPLORATION,
      player,
    };
  });

  describe('基本プロパティ', () => {
    test('名前が正しく設定されている', () => {
      expect(command.name).toBe('inventory');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('open inventory to manage items');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合は成功する', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(true);
    });

    test('引数がある場合はエラーになる', () => {
      const result = command.validateArgs(['extra']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('inventory command takes no arguments');
    });
  });

  describe('コマンド実行', () => {
    test('正常な場合はインベントリフェーズに遷移する', () => {
      const result = command.execute([], context);
      expect(result.success).toBe(true);
      expect(result.message).toBe('opening inventory...');
      expect(result.nextPhase).toBe(PhaseTypes.INVENTORY);
    });

    test('プレイヤーがない場合はエラーになる', () => {
      const contextWithoutPlayer: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
      };
      const result = command.execute([], contextWithoutPlayer);
      expect(result.success).toBe(false);
      expect(result.message).toBe('player not available');
    });

    test('引数がある場合は検証エラーになる', () => {
      const result = command.execute(['extra'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('inventory command takes no arguments');
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toContain('Usage: inventory');
      expect(help).toContain('Open the inventory to view and manage your items.');
      expect(help).toContain('  up/down - Navigate through items');
      expect(help).toContain('  use     - Use the selected item');
      expect(help).toContain('  drop    - Drop the selected item');
      expect(help).toContain('  back    - Return to exploration');
    });

    test('使用例が含まれている', () => {
      const help = command.getHelp();
      expect(help).toContain('  inventory   # Open inventory interface');
    });
  });
});