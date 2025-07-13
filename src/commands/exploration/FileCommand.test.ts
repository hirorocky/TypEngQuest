import { FileCommand } from './FileCommand';
import { CommandContext } from '../BaseCommand';
import { FileSystem } from '../../world/FileSystem';
import { FileNode, NodeType } from '../../world/FileNode';
import { PhaseTypes } from '../../core/types';

describe('FileCommand', () => {
  let command: FileCommand;
  let fileSystem: FileSystem;
  let context: CommandContext;

  beforeEach(() => {
    command = new FileCommand();
    
    // テスト用のファイル構造を構築
    const root = new FileNode('projects', NodeType.DIRECTORY);
    fileSystem = new FileSystem(root);
    const srcDir = new FileNode('src', NodeType.DIRECTORY);
    root.addChild(srcDir);

    // 各ファイルタイプのテストファイルを作成
    const monsterFile = new FileNode('monster.js', NodeType.FILE);
    const treasureFile = new FileNode('config.json', NodeType.FILE);
    const saveFile = new FileNode('save.md', NodeType.FILE);
    const eventFile = new FileNode('script.exe', NodeType.FILE);
    const emptyFile = new FileNode('empty.txt', NodeType.FILE);

    srcDir.addChild(monsterFile);
    srcDir.addChild(treasureFile);
    srcDir.addChild(saveFile);
    srcDir.addChild(eventFile);
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
      expect(command.name).toBe('file');
    });

    test('説明が正しく設定されている', () => {
      expect(command.description).toBe('ファイルタイプとアクションを表示する');
    });
  });

  describe('引数の検証', () => {
    test('引数なしの場合はエラーになる', () => {
      const result = command.validateArgs([]);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ファイル名を指定してください');
    });

    test('引数が2つ以上の場合はエラーになる', () => {
      const result = command.validateArgs(['file1.js', 'file2.js']);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ファイル名は1つだけ指定してください');
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
      // ルートディレクトリに移動してsrcディレクトリを指定
      fileSystem.cd('/');
      const result = command.execute(['src'], context);
      expect(result.success).toBe(false);
      expect(result.message).toBe('not a file');
    });

    test('モンスターファイルの場合は正しい情報を表示する', () => {
      const result = command.execute(['monster.js'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'File: monster.js',
        'Type: Monster File (Programming)',
        'Description: Contains a monster that can be battled',
        '',
        'Available actions:',
        '  battle monster.js - Start battle with the monster',
        '  cat monster.js    - View and start battle',
        '  head monster.js   - Preview monster strength',
        '  vim monster.js    - Edit and start battle',
        '  nano monster.js   - Edit and start battle',
      ]);
    });

    test('宝箱ファイルの場合は正しい情報を表示する', () => {
      const result = command.execute(['config.json'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'File: config.json',
        'Type: Treasure Chest (Configuration)',
        'Description: Contains items that can be obtained',
        '',
        'Available actions:',
        '  open config.json  - Open treasure chest',
        '  cat config.json   - View and obtain items',
        '  head config.json  - Preview chest contents',
        '  jq . config.json  - Parse and obtain items',
        '  yq . config.json  - Parse and obtain items',
      ]);
    });

    test('セーブポイントファイルの場合は正しい情報を表示する', () => {
      const result = command.execute(['save.md'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'File: save.md',
        'Type: Save Point (Documentation)',
        'Description: Allows saving game and recovering HP/MP',
        '',
        'Available actions:',
        '  save save.md      - Save game progress',
        '  rest save.md      - Recover HP/MP',
        '  cat save.md       - View content and save options',
        '  vim save.md       - Edit and save game',
        '  nano save.md      - Edit and save game',
      ]);
    });

    test('イベントファイルの場合は正しい情報を表示する', () => {
      const result = command.execute(['script.exe'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'File: script.exe',
        'Type: Event File (Executable)',
        'Description: Triggers random events when executed',
        '',
        'Available actions:',
        '  execute script.exe - Run the event',
        '  ./script.exe       - Execute the script',
        '  file script.exe    - Check file information',
        '  chmod +x script.exe - Prepare for execution (reduces bad effects)',
      ]);
    });

    test('空ファイルの場合は正しい情報を表示する', () => {
      const result = command.execute(['empty.txt'], context);
      expect(result.success).toBe(true);
      expect(result.output).toEqual([
        'File: empty.txt',
        'Type: Empty File',
        'Description: Contains no special content',
        '',
        'Available actions:',
        '  cat empty.txt     - View file (no effect)',
        '  head empty.txt    - Preview file (no effect)',
      ]);
    });
  });

  describe('ヘルプ機能', () => {
    test('ヘルプテキストが正しく返される', () => {
      const help = command.getHelp();
      expect(help).toEqual([
        'Usage: file <filename>',
        '',
        'Display file type and available actions.',
        '',
        'Arguments:',
        '  filename    The name of the file to examine',
        '',
        'Examples:',
        '  file script.js     # Show monster file info',
        '  file config.json   # Show treasure chest info',
        '  file readme.md     # Show save point info',
        '  file setup.exe     # Show event file info',
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