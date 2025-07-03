/**
 * Displayクラスのユニットテスト
 */

import { Display } from './Display';

// Console出力をモック
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const processStdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
const processStdinOnSpy = jest.spyOn(process.stdin, 'on');
const processStdinRemoveListenerSpy = jest.spyOn(process.stdin, 'removeListener');

describe('Display', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
    processStdoutSpy.mockClear();
    processStdinOnSpy.mockClear();
    processStdinRemoveListenerSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
    processStdoutSpy.mockRestore();
    processStdinOnSpy.mockRestore();
    processStdinRemoveListenerSpy.mockRestore();
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

      expect(processStdoutSpy).toHaveBeenCalledWith(testText);
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
      processStdinOnSpy.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('\n')), 0);
        }
        return process.stdin;
      });
      processStdinRemoveListenerSpy.mockImplementation(() => process.stdin);

      const promise = Display.waitForEnter();
      await promise;

      expect(processStdoutSpy).toHaveBeenCalledWith(
        expect.stringContaining('Press Enter to continue')
      );
      expect(processStdinOnSpy).toHaveBeenCalledWith('data', expect.any(Function));
    });

    it('カスタムメッセージでEnterキーを待つ', async () => {
      const customMessage = 'Press any key...';
      processStdinOnSpy.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(Buffer.from('\n')), 0);
        }
        return process.stdin;
      });
      processStdinRemoveListenerSpy.mockImplementation(() => process.stdin);

      const promise = Display.waitForEnter(customMessage);
      await promise;

      expect(processStdoutSpy).toHaveBeenCalledWith(expect.stringContaining(customMessage));
    });

    it('Enterキー（\\n）でresolveされる', async () => {
      let resolveCallback: (data: Buffer) => void;
      processStdinOnSpy.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          resolveCallback = callback as (data: Buffer) => void;
        }
        return process.stdin;
      });
      processStdinRemoveListenerSpy.mockImplementation(() => process.stdin);

      const promise = Display.waitForEnter();

      // Simulate enter key press
      setTimeout(() => resolveCallback(Buffer.from('\n')), 10);

      await expect(promise).resolves.toBeUndefined();
    });

    it('Enterキー（\\r\\n）でresolveされる', async () => {
      let resolveCallback: (data: Buffer) => void;
      processStdinOnSpy.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          resolveCallback = callback as (data: Buffer) => void;
        }
        return process.stdin;
      });
      processStdinRemoveListenerSpy.mockImplementation(() => process.stdin);

      const promise = Display.waitForEnter();

      // Simulate enter key press (Windows style)
      setTimeout(() => resolveCallback(Buffer.from('\r\n')), 10);

      await expect(promise).resolves.toBeUndefined();
    });

    it('Enter以外のキーでは進まない', async () => {
      let dataCallback: (data: Buffer) => void;

      processStdinOnSpy.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          dataCallback = callback as (data: Buffer) => void;
        }
        return process.stdin;
      });
      processStdinRemoveListenerSpy.mockImplementation(() => process.stdin);

      const promise = Display.waitForEnter();
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });

      // Enter以外のキーを押す
      setTimeout(() => dataCallback(Buffer.from('a')), 10);
      setTimeout(() => dataCallback(Buffer.from('1')), 20);
      setTimeout(() => dataCallback(Buffer.from(' ')), 30);

      // 少し待つ
      await new Promise(resolve => setTimeout(resolve, 50));

      // まだresolveされていないことを確認
      expect(resolved).toBe(false);

      // Enterキーを押す
      setTimeout(() => dataCallback(Buffer.from('\n')), 60);

      // resolveされることを確認
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

      expect(processStdoutSpy).toHaveBeenCalledTimes(3);
      expect(processStdoutSpy).toHaveBeenNthCalledWith(1, 'Line 1');
      expect(processStdoutSpy).toHaveBeenNthCalledWith(2, 'Line 2');
      expect(processStdoutSpy).toHaveBeenNthCalledWith(3, 'Line 3');
    });
  });
});
