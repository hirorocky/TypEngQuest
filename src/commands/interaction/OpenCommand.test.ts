import { OpenCommand } from './OpenCommand';
import { CommandContext } from '../BaseCommand';
import { FileSystem } from '../../world/FileSystem';
import { FileNode, NodeType } from '../../world/FileNode';
import { PhaseTypes } from '../../core/types';
import { Player } from '../../player/Player';
import { ItemType } from '../../items/Item';

describe('OpenCommand', () => {
  let command: OpenCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;
  let player: Player;

  beforeEach(() => {
    command = new OpenCommand();
    player = new Player('TestPlayer');
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    const srcDir = new FileNode('src', NodeType.DIRECTORY);
    root.addChild(srcDir);

    // 宝箱ファイルとその他のファイルを作成
    const treasureFile = new FileNode('config.json', NodeType.FILE);
    const monsterFile = new FileNode('monster.js', NodeType.FILE);
    const emptyFile = new FileNode('empty.txt', NodeType.FILE);

    srcDir.addChild(treasureFile);
    srcDir.addChild(monsterFile);
    srcDir.addChild(emptyFile);

    // srcディレクトリに移動
    fileSystem.cd('/src');
    
    context = {
      currentPhase: PhaseTypes.EXPLORATION,
      fileSystem,
      player,
    };
  });

  describe('基本プロパティ', () => {
    test('名前が正しく設定されている', () => {
      expect(command.name).toBe('open');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('open treasure chest file');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合はエラーになる', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('filename required');
    });

    test('引数が2つ以上の場合はエラーになる', () => {
      const result = command.validateArgs(['file1.json', 'file2.json']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('too many arguments');
    });

    test('正しい引数の場合は成功する', () => {
      const result = command.validateArgs(['config.json']);
      expect(result.valid).toBe(true);
    });
  });

  describe('コマンド実行', () => {
    test('存在しないファイルの場合はエラーになる', () => {
      const result = command.execute(['nonexistent.json'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('no such file or directory');
    });

    test('ディレクトリを指定した場合はエラーになる', () => {
      fileSystem.cd('/');
      const result = command.execute(['src'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('not a file');
    });

    test('宝箱ファイル以外を指定した場合はエラーになる', () => {
      const result = command.execute(['monster.js'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('monster.js is not a treasure chest');
    });

    test('宝箱ファイル（JSON）の場合は成功する', () => {
      const result = command.execute(['config.json'], context);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Opening treasure chest: config.json...');
      expect(result.output).toContain('📦 You found a treasure chest!');
      expect(result.output).toContain('Type: Configuration Treasure');
    });

    test('宝箱ファイル（YAML）の場合は成功する', () => {
      const yamlFile = new FileNode('settings.yaml', NodeType.FILE);
      fileSystem.currentNode.addChild(yamlFile);
      
      const result = command.execute(['settings.yaml'], context);
      expect(result.success).toBe(true);
      expect(result.output).toContain('Type: Configuration Treasure');
    });

    test('宝箱を開くとアイテムがインベントリに追加される', () => {
      const result = command.execute(['config.json'], context);
      expect(result.success).toBe(true);
      
      // インベントリに消費アイテムが追加されているか確認
      const inventory = player.getInventory();
      expect(inventory.getItemCount()).toBe(1);
      
      const items = inventory.findItemsByType(ItemType.CONSUMABLE);
      expect(items).toHaveLength(1);
      expect(items[0].getName()).toMatch(/potion/i);
    });

    test('作用済みファイルは再度開けない', () => {
      const treasureFile = fileSystem.currentNode.findChild('config.json');
      expect(treasureFile).toBeTruthy();
      
      // 最初は開ける
      const result1 = command.execute(['config.json'], context);
      expect(result1.success).toBe(true);
      
      // 作用済みになっているので再度開けない
      const result2 = command.execute(['config.json'], context);
      expect(result2.success).toBe(false);
      expect(result2.message).toBe('config.json has already been opened');
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'Usage: open <filename>',
        '',
        'Open a treasure chest file.',
        '',
        'Arguments:',
        '  filename    The name of the treasure file to open',
        '',
        'Examples:',
        '  open config.json     # Open JSON configuration treasure',
        '  open settings.yaml   # Open YAML configuration treasure',
      ]);
    });
  });

  describe('ファイルシステムなしの場合', () => {
    test('ファイルシステムがない場合はエラーになる', () => {
      const contextWithoutFs: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
      };
      const result = command.execute(['config.json'], contextWithoutFs);
      expect(result.success).toBe(false);
      expect(result.message).toBe('filesystem not available');
    });

    test('プレイヤーがない場合はエラーになる', () => {
      const contextWithoutPlayer: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
        fileSystem,
      };
      const result = command.execute(['config.json'], contextWithoutPlayer);
      expect(result.success).toBe(false);
      expect(result.message).toBe('player not available');
    });
  });
});