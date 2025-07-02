/**
 * Displayクラスのユニットテスト
 */

import { Display } from './Display';

// Console出力をモック
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const processStdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
const processStdinSpy = jest.spyOn(process.stdin, 'once');

describe('Display', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
    processStdoutSpy.mockClear();
    processStdinSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();
    processStdinSpy.mockRestore();
  });

  describe('clear', () => {
    it('画面をクリアする', () => {
      Display.clear();

      expect(processStdoutSpy).toHaveBeenCalledWith('\x1b[2J\x1b[0f');
    });
  });

  describe('print', () => {
    it('テキストを出力する', () => {
      const testText = 'Hello, World!';
      Display.print(testText);

      expect(consoleSpy).toHaveBeenCalledWith(testText);
    });
  });

  describe('printLine', () => {
    it('デフォルト文字と長さでラインを出力する', () => {
      Display.printLine();

      expect(consoleSpy).toHaveBeenCalledWith('-'.repeat(50));
    });

    it('カスタム文字でラインを出力する', () => {
      Display.printLine('=');

      expect(consoleSpy).toHaveBeenCalledWith('='.repeat(50));
    });

    it('カスタム長さでラインを出力する', () => {
      Display.printLine('-', 10);

      expect(consoleSpy).toHaveBeenCalledWith('-'.repeat(10));
    });

    it('カスタム文字と長さでラインを出力する', () => {
      Display.printLine('*', 5);

      expect(consoleSpy).toHaveBeenCalledWith('*'.repeat(5));
    });
  });

  describe('printTitle', () => {
    it('適切なフォーマットでタイトルを出力する', () => {
      const title = 'Test Game';
      Display.printTitle(title);

      expect(processStdoutSpy).toHaveBeenCalledWith('\x1b[2J\x1b[0f'); // clear screen
      expect(consoleSpy).toHaveBeenCalledWith('='.repeat(60));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(title));
      expect(consoleSpy).toHaveBeenCalledWith(); // empty line (called with no arguments)
    });
  });

  describe('printHeader', () => {
    it('アンダーライン付きでヘッダーを出力する', () => {
      const header = 'Test Header';
      Display.printHeader(header);

      expect(consoleSpy).toHaveBeenCalledWith(); // empty line before
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(header));
      expect(consoleSpy).toHaveBeenCalledWith('-'.repeat(header.length));
    });
  });

  describe('printSuccess', () => {
    it('チェックマーク付きで成功メッセージを出力する', () => {
      const message = 'Operation successful';
      Display.printSuccess(message);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(message));
    });
  });

  describe('printError', () => {
    it('Xマーク付きでエラーメッセージを出力する', () => {
      const message = 'Operation failed';
      Display.printError(message);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(message));
    });
  });

  describe('printInfo', () => {
    it('情報アイコン付きで情報メッセージを出力する', () => {
      const message = 'Information message';
      Display.printInfo(message);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ️'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(message));
    });
  });

  describe('printWarning', () => {
    it('警告アイコン付きで警告メッセージを出力する', () => {
      const message = 'Warning message';
      Display.printWarning(message);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(message));
    });
  });

  describe('printEmptyLine', () => {
    it('空行を出力する', () => {
      Display.printEmptyLine();

      expect(consoleSpy).toHaveBeenCalledWith();
    });
  });

  describe('waitForEnter', () => {
    it('デフォルトメッセージでEnterキーを待つ', async () => {
      processStdinSpy.mockImplementation((event: string, callback: () => void) => {
        if (event === 'data') {
          setTimeout(() => callback(), 0);
        }
        return process.stdin;
      });

      const promise = Display.waitForEnter();
      await promise;

      expect(processStdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('Press Enter to continue')
      );
      expect(processStdinSpy).toHaveBeenCalledWith('data', expect.any(Function));
    });

    it('カスタムメッセージでEnterキーを待つ', async () => {
      const customMessage = 'Press any key...';
      processStdinSpy.mockImplementation((event: string, callback: () => void) => {
        if (event === 'data') {
          setTimeout(() => callback(), 0);
        }
        return process.stdin;
      });

      const promise = Display.waitForEnter(customMessage);
      await promise;

      expect(processStdoutSpy).toHaveBeenCalledWith(expect.stringContaining(customMessage));
    });

    it('データ受信時にresolveされる', async () => {
      let resolveCallback: () => void;
      processStdinSpy.mockImplementation((event: string, callback: () => void) => {
        if (event === 'data') {
          resolveCallback = callback as () => void;
        }
        return process.stdin;
      });

      const promise = Display.waitForEnter();

      // Simulate enter key press
      setTimeout(() => resolveCallback(), 10);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('static methods accessibility', () => {
    it('全てのメソッドがstaticである', () => {
      expect(typeof Display.clear).toBe('function');
      expect(typeof Display.print).toBe('function');
      expect(typeof Display.printLine).toBe('function');
      expect(typeof Display.printTitle).toBe('function');
      expect(typeof Display.printHeader).toBe('function');
      expect(typeof Display.printSuccess).toBe('function');
      expect(typeof Display.printError).toBe('function');
      expect(typeof Display.printInfo).toBe('function');
      expect(typeof Display.printWarning).toBe('function');
      expect(typeof Display.printEmptyLine).toBe('function');
      expect(typeof Display.waitForEnter).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('非常に長いタイトルを処理する', () => {
      const longTitle = 'A'.repeat(100);
      Display.printTitle(longTitle);

      expect(processStdoutSpy).toHaveBeenCalledWith('\x1b[2J\x1b[0f');
      expect(consoleSpy).toHaveBeenCalledWith('='.repeat(60));
    });

    it('空のヘッダーを処理する', () => {
      Display.printHeader('');

      expect(consoleSpy).toHaveBeenCalledWith(''); // empty line
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('')); // header
      expect(consoleSpy).toHaveBeenCalledWith(''); // underline for empty string
    });

    it('メッセージ内の特殊文字を処理する', () => {
      const specialMessage = 'Test with émojis 🎮 and ünïcödé';

      Display.printSuccess(specialMessage);
      Display.printError(specialMessage);
      Display.printInfo(specialMessage);
      Display.printWarning(specialMessage);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(specialMessage));
    });

    it('連続した複数の呼び出しを処理する', () => {
      Display.print('Line 1');
      Display.print('Line 2');
      Display.print('Line 3');

      expect(consoleSpy).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Line 1');
      expect(consoleSpy).toHaveBeenNthCalledWith(2, 'Line 2');
      expect(consoleSpy).toHaveBeenNthCalledWith(3, 'Line 3');
    });
  });
});
