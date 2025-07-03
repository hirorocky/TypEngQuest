/**
 * ExplorationPhaseクラスのテスト
 */

import { ExplorationPhase } from './ExplorationPhase';
import { CommandParser } from '../core/CommandParser';
import { Display } from '../ui/Display';
import { PhaseTypes } from '../core/types';

// Displayモジュールをモック化
jest.mock('../ui/Display');

describe('ExplorationPhase', () => {
  let phase: ExplorationPhase;
  let commandParser: CommandParser;
  let mockPrint: jest.Mock;
  let mockPrintLine: jest.Mock;
  let mockClear: jest.Mock;
  let mockPrintHeader: jest.Mock;
  let mockPrintInfo: jest.Mock;
  let mockPrintSuccess: jest.Mock;
  let mockPrintError: jest.Mock;
  let mockPrintCommand: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    commandParser = new CommandParser();
    phase = new ExplorationPhase(commandParser);

    // Displayメソッドのモック設定
    mockPrint = Display.print as jest.Mock;
    mockPrintLine = Display.printLine as jest.Mock;
    mockClear = Display.clear as jest.Mock;
    mockPrintHeader = Display.printHeader as jest.Mock;
    mockPrintInfo = Display.printInfo as jest.Mock;
    mockPrintSuccess = Display.printSuccess as jest.Mock;
    mockPrintError = Display.printError as jest.Mock;
    mockPrintCommand = Display.printCommand as jest.Mock;
    Display.newLine as jest.Mock;
  });

  describe('基本プロパティ', () => {
    test('フェーズ名が正しい', () => {
      expect(phase.getName()).toBe('exploration');
    });

    test('ファイルシステムが初期化される', () => {
      // enter()を呼んで現在地が表示されることを確認
      phase.enter();
      expect(mockPrintSuccess).toHaveBeenCalledWith(expect.stringContaining('現在地: /projects'));
    });
  });

  describe('enter - フェーズ開始', () => {
    test('画面がクリアされる', () => {
      phase.enter();
      expect(mockClear).toHaveBeenCalled();
    });

    test('ヘッダーが表示される', () => {
      phase.enter();
      expect(mockPrintHeader).toHaveBeenCalledWith('マップ探索モード');
    });

    test('説明文が表示される', () => {
      phase.enter();
      expect(mockPrintInfo).toHaveBeenCalledWith('仮想ファイルシステムを探索できます。');
      expect(mockPrintInfo).toHaveBeenCalledWith('helpコマンドで利用可能なコマンドを表示します。');
    });

    test('現在地が表示される', () => {
      phase.enter();
      expect(mockPrintSuccess).toHaveBeenCalledWith('現在地: /projects');
    });

    test('プロンプトが表示される', () => {
      phase.enter();
      expect(mockPrint).toHaveBeenCalledWith('[~]$ ');
    });
  });

  describe('processCommand - コマンド処理', () => {
    beforeEach(() => {
      phase.enter();
      jest.clearAllMocks();
    });

    describe('ナビゲーションコマンド', () => {
      test('cdコマンドが動作する', () => {
        const result = (phase as any).processCommand('cd game-studio');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintSuccess).toHaveBeenCalledWith(expect.stringContaining('移動しました'));
      });

      test('lsコマンドが動作する', () => {
        const result = (phase as any).processCommand('ls');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintLine).toHaveBeenCalled();
      });

      test('pwdコマンドが動作する', () => {
        const result = (phase as any).processCommand('pwd');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintSuccess).toHaveBeenCalledWith('/projects');
      });

      test('treeコマンドが動作する', () => {
        const result = (phase as any).processCommand('tree');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintLine).toHaveBeenCalled();
      });

      test('コマンドエラーが表示される', () => {
        const result = (phase as any).processCommand('cd nonexistent');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintError).toHaveBeenCalledWith(
          expect.stringContaining('ディレクトリが見つかりません')
        );
      });
    });

    describe('システムコマンド', () => {
      test('helpコマンドが動作する', () => {
        const result = (phase as any).processCommand('help');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockPrintHeader).toHaveBeenCalledWith('利用可能なコマンド');
        expect(mockPrintCommand).toHaveBeenCalled();
      });

      test('clearコマンドが動作する', () => {
        const result = (phase as any).processCommand('clear');

        expect(result.type).toBe(PhaseTypes.CONTINUE);
        expect(mockClear).toHaveBeenCalled();
        expect(mockPrint).toHaveBeenCalledWith('[~]$ ');
      });

      test('exitコマンドでタイトルに戻る', () => {
        const result = (phase as any).processCommand('exit');

        expect(result.type).toBe(PhaseTypes.TITLE);
        expect(mockPrintInfo).toHaveBeenCalledWith('タイトル画面に戻ります...');
      });

      test('quitコマンドでタイトルに戻る', () => {
        const result = (phase as any).processCommand('quit');

        expect(result.type).toBe(PhaseTypes.TITLE);
      });

      test('qコマンドでタイトルに戻る', () => {
        const result = (phase as any).processCommand('q');

        expect(result.type).toBe(PhaseTypes.TITLE);
      });
    });

    test('不明なコマンドでエラーメッセージ', () => {
      const result = (phase as any).processCommand('unknown');

      expect(result.type).toBe(PhaseTypes.CONTINUE);
      expect(mockPrintError).toHaveBeenCalledWith('不明なコマンド: unknown');
      expect(mockPrintInfo).toHaveBeenCalledWith('helpで利用可能なコマンドを確認してください。');
    });

    test('空のコマンドで継続', () => {
      const result = (phase as any).processCommand('');

      expect(result.type).toBe(PhaseTypes.CONTINUE);
    });
  });

  describe('プロンプト表示', () => {
    test('ルートディレクトリでは~が表示される', () => {
      phase.enter();
      expect(mockPrint).toHaveBeenCalledWith('[~]$ ');
    });

    test('サブディレクトリでは相対パスが表示される', () => {
      phase.enter();
      jest.clearAllMocks();

      // game-studioに移動
      (phase as any).processCommand('cd game-studio');

      // プロンプトが更新される
      expect(mockPrint).toHaveBeenCalledWith('[~/game-studio]$ ');
    });

    test('深いディレクトリでも正しくパスが表示される', () => {
      phase.enter();
      jest.clearAllMocks();

      // 深いディレクトリに移動
      (phase as any).processCommand('cd game-studio/src');

      expect(mockPrint).toHaveBeenCalledWith('[~/game-studio/src]$ ');
    });
  });

  describe('exit - フェーズ終了', () => {
    test('正常に終了する', () => {
      expect(() => phase.exit()).not.toThrow();
    });
  });

  describe('ヘルプ表示', () => {
    test('ナビゲーションコマンドが表示される', () => {
      phase.enter();
      jest.clearAllMocks();

      (phase as any).processCommand('help');

      expect(mockPrintInfo).toHaveBeenCalledWith('ナビゲーション:');
      expect(mockPrintCommand).toHaveBeenCalledWith('cd', expect.any(String));
      expect(mockPrintCommand).toHaveBeenCalledWith('ls', expect.any(String));
      expect(mockPrintCommand).toHaveBeenCalledWith('pwd', expect.any(String));
      expect(mockPrintCommand).toHaveBeenCalledWith('tree', expect.any(String));
    });

    test('システムコマンドが表示される', () => {
      phase.enter();
      jest.clearAllMocks();

      (phase as any).processCommand('help');

      expect(mockPrintInfo).toHaveBeenCalledWith('システム:');
      expect(mockPrintCommand).toHaveBeenCalledWith('help', 'このヘルプを表示');
      expect(mockPrintCommand).toHaveBeenCalledWith('clear', '画面をクリア');
      expect(mockPrintCommand).toHaveBeenCalledWith('exit', 'タイトル画面に戻る');
    });

    test('詳細ヘルプの案内が表示される', () => {
      phase.enter();
      jest.clearAllMocks();

      (phase as any).processCommand('help');

      expect(mockPrintInfo).toHaveBeenCalledWith(
        '各コマンドの詳細は「コマンド名 --help」で確認できます。'
      );
    });
  });
});
