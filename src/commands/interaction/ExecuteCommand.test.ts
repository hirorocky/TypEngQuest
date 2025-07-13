import { ExecuteCommand } from './ExecuteCommand';
import { CommandContext } from '../BaseCommand';
import { FileSystem } from '../../world/FileSystem';
import { FileNode, NodeType } from '../../world/FileNode';
import { PhaseTypes } from '../../core/types';

describe('ExecuteCommand', () => {
  let command: ExecuteCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    command = new ExecuteCommand();
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    const srcDir = new FileNode('src', NodeType.DIRECTORY);
    root.addChild(srcDir);

    // イベントファイルとその他のファイルを作成
    const eventFile = new FileNode('setup.exe', NodeType.FILE);
    const monsterFile = new FileNode('monster.js', NodeType.FILE);
    const emptyFile = new FileNode('empty.txt', NodeType.FILE);

    srcDir.addChild(eventFile);
    srcDir.addChild(monsterFile);
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
      expect(command.name).toBe('execute');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('イベントファイルを実行する');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合はエラーになる', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ファイル名を指定してください');
    });

    test('引数が2つ以上の場合はエラーになる', () => {
      const result = command.validateArgs(['file1.exe', 'file2.exe']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ファイル名は1つだけ指定してください');
    });

    test('正しい引数の場合は成功する', () => {
      const result = command.validateArgs(['setup.exe']);
      expect(result.valid).toBe(true);
    });
  });

  describe('コマンド実行', () => {
    test('存在しないファイルの場合はエラーになる', () => {
      const result = command.execute(['nonexistent.exe'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('no such file or directory');
    });

    test('ディレクトリを指定した場合はエラーになる', () => {
      fileSystem.cd('/');
      const result = command.execute(['src'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('not a file');
    });

    test('イベントファイル以外を指定した場合はエラーになる', () => {
      const result = command.execute(['monster.js'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('monster.js is not an executable file');
    });

    test('イベントファイル（EXE）の場合は成功する', () => {
      const result = command.execute(['setup.exe'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'Executing: setup.exe...',
        '',
        '⚡ Event Triggered!',
        'Type: Executable Event',
        '',
        '[Event system not yet implemented]',
        'Something mysterious happens...',
      ]);
    });

    test('イベントファイル（SH）の場合は成功する', () => {
      const shFile = new FileNode('install.sh', NodeType.FILE);
      fileSystem.currentNode.addChild(shFile);
      
      const result = command.execute(['install.sh'], context);
      expect(result.success).toBe(true);
      expect(result.output![3]).toBe('Type: Script Event');
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'Usage: execute <filename>',
        '',
        'Execute an event file.',
        '',
        'Arguments:',
        '  filename    The name of the event file to execute',
        '',
        'Examples:',
        '  execute setup.exe    # Execute Windows executable',
        '  execute install.sh   # Execute shell script',
      ]);
    });
  });

  describe('ファイルシステムなしの場合', () => {
    test('ファイルシステムがない場合はエラーになる', () => {
      const contextWithoutFs: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
      };
      const result = command.execute(['setup.exe'], contextWithoutFs);
      expect(result.success).toBe(false);
      expect(result.message).toBe('filesystem not available');
    });
  });
});