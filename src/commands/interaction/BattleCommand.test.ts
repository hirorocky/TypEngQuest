import { BattleCommand } from './BattleCommand';
import { CommandContext } from '../BaseCommand';
import { FileSystem } from '../../world/FileSystem';
import { FileNode, NodeType } from '../../world/FileNode';
import { PhaseTypes } from '../../core/types';

describe('BattleCommand', () => {
  let command: BattleCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    command = new BattleCommand();
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    const srcDir = new FileNode('src', NodeType.DIRECTORY);
    root.addChild(srcDir);

    // モンスターファイルとその他のファイルを作成
    const monsterFile = new FileNode('monster.js', NodeType.FILE);
    const treasureFile = new FileNode('config.json', NodeType.FILE);
    const emptyFile = new FileNode('empty.txt', NodeType.FILE);

    srcDir.addChild(monsterFile);
    srcDir.addChild(treasureFile);
    srcDir.addChild(emptyFile);

    // srcディレクトリに移動
    fileSystem.cd('/src');
    
    context = {
      currentPhase: PhaseTypes.EXPLORATION,
      fileSystem,
    };
  });

  describe('基本プロパティ', () => {
    test('名前が正しく設定されている', () => {
      expect(command.name).toBe('battle');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('start battle with monster file');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合はエラーになる', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('filename required');
    });

    test('引数が2つ以上の場合はエラーになる', () => {
      const result = command.validateArgs(['file1.js', 'file2.js']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('too many arguments');
    });

    test('正しい引数の場合は成功する', () => {
      const result = command.validateArgs(['monster.js']);
      expect(result.valid).toBe(true);
    });
  });

  describe('コマンド実行', () => {
    test('存在しないファイルの場合はエラーになる', () => {
      const result = command.execute(['nonexistent.js'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('no such file or directory');
    });

    test('ディレクトリを指定した場合はエラーになる', () => {
      fileSystem.cd('/');
      const result = command.execute(['src'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('not a file');
    });

    test('モンスターファイル以外を指定した場合はエラーになる', () => {
      const result = command.execute(['config.json'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('config.json is not a monster file');
    });

    test('モンスターファイルの場合は成功する', () => {
      const result = command.execute(['monster.js'], context);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Starting battle with monster.js...');
      expect(result.nextPhase).toBe('battle');
      expect(result.data?.enemy).toBeDefined();
      const enemy = result.data?.enemy as any;
      expect(enemy.name).toBe('JavaScript Beast');
      expect(enemy.level).toBe(1);
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'Usage: battle <filename>',
        '',
        'Start battle with a monster file.',
        '',
        'Arguments:',
        '  filename    The name of the monster file to battle',
        '',
        'Examples:',
        '  battle script.js     # Battle with JavaScript monster',
        '  battle app.py        # Battle with Python monster',
      ]);
    });
  });

  describe('ファイルシステムなしの場合', () => {
    test('ファイルシステムがない場合はエラーになる', () => {
      const contextWithoutFs: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
      };
      const result = command.execute(['monster.js'], contextWithoutFs);
      expect(result.success).toBe(false);
      expect(result.message).toBe('filesystem not available');
    });
  });
});