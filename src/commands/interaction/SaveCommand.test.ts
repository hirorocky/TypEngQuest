import { SaveCommand } from './SaveCommand';
import { CommandContext } from '../BaseCommand';
import { FileSystem } from '../../world/FileSystem';
import { FileNode, NodeType } from '../../world/FileNode';
import { PhaseTypes } from '../../core/types';

describe('SaveCommand', () => {
  let command: SaveCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    command = new SaveCommand();
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    const srcDir = new FileNode('src', NodeType.DIRECTORY);
    root.addChild(srcDir);

    // セーブポイントファイルとその他のファイルを作成
    const saveFile = new FileNode('readme.md', NodeType.FILE);
    const monsterFile = new FileNode('monster.js', NodeType.FILE);
    const emptyFile = new FileNode('empty.txt', NodeType.FILE);

    srcDir.addChild(saveFile);
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
      expect(command.name).toBe('save');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('save game at save point');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合はエラーになる', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('filename required');
    });

    test('引数が2つ以上の場合はエラーになる', () => {
      const result = command.validateArgs(['file1.md', 'file2.md']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('too many arguments');
    });

    test('正しい引数の場合は成功する', () => {
      const result = command.validateArgs(['readme.md']);
      expect(result.valid).toBe(true);
    });
  });

  describe('コマンド実行', () => {
    test('存在しないファイルの場合はエラーになる', () => {
      const result = command.execute(['nonexistent.md'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('no such file or directory');
    });

    test('ディレクトリを指定した場合はエラーになる', () => {
      fileSystem.cd('/');
      const result = command.execute(['src'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('not a file');
    });

    test('セーブポイントファイル以外を指定した場合はエラーになる', () => {
      const result = command.execute(['monster.js'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('monster.js is not a save point');
    });

    test('セーブポイントファイルの場合は成功する', () => {
      const result = command.execute(['readme.md'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'Saving game at: readme.md...',
        '',
        '💾 Save Point Activated!',
        'Type: Documentation Save Point',
        '',
        '[Save system not yet implemented]',
        'Your progress has been noted...',
      ]);
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'Usage: save <filename>',
        '',
        'Save game progress at a save point.',
        '',
        'Arguments:',
        '  filename    The name of the save point file',
        '',
        'Examples:',
        '  save readme.md       # Save at README save point',
        '  save notes.md        # Save at notes save point',
      ]);
    });
  });

  describe('ファイルシステムなしの場合', () => {
    test('ファイルシステムがない場合はエラーになる', () => {
      const contextWithoutFs: CommandContext = {
        currentPhase: PhaseTypes.EXPLORATION,
      };
      const result = command.execute(['readme.md'], contextWithoutFs);
      expect(result.success).toBe(false);
      expect(result.message).toBe('filesystem not available');
    });
  });
});