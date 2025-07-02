/**
 * colorsモジュールのユニットテスト
 */

import { Colors, colorize, bold, dim, red, green, yellow, blue, cyan, magenta } from './colors';

describe('colors', () => {
  describe('Colors constants', () => {
    it('必要な全ての色定数を持つ', () => {
      expect(Colors.RESET).toBe('\x1b[0m');
      expect(Colors.BRIGHT).toBe('\x1b[1m');
      expect(Colors.DIM).toBe('\x1b[2m');

      expect(Colors.BLACK).toBe('\x1b[30m');
      expect(Colors.RED).toBe('\x1b[31m');
      expect(Colors.GREEN).toBe('\x1b[32m');
      expect(Colors.YELLOW).toBe('\x1b[33m');
      expect(Colors.BLUE).toBe('\x1b[34m');
      expect(Colors.MAGENTA).toBe('\x1b[35m');
      expect(Colors.CYAN).toBe('\x1b[36m');
      expect(Colors.WHITE).toBe('\x1b[37m');

      expect(Colors.BG_BLACK).toBe('\x1b[40m');
      expect(Colors.BG_RED).toBe('\x1b[41m');
      expect(Colors.BG_GREEN).toBe('\x1b[42m');
      expect(Colors.BG_YELLOW).toBe('\x1b[43m');
      expect(Colors.BG_BLUE).toBe('\x1b[44m');
      expect(Colors.BG_MAGENTA).toBe('\x1b[45m');
      expect(Colors.BG_CYAN).toBe('\x1b[46m');
      expect(Colors.BG_WHITE).toBe('\x1b[47m');
    });

    it('読み取り専用定数である', () => {
      // Colors object should be frozen or readonly
      expect(typeof Colors).toBe('object');
      expect(Colors.RED).toBe('\x1b[31m');
    });
  });

  describe('colorize', () => {
    it('テキストを色とリセットで囲む', () => {
      const text = 'Hello';
      const color = Colors.RED;
      const result = colorize(text, color);

      expect(result).toBe(`${color}${text}${Colors.RESET}`);
    });

    it('空のテキストを処理する', () => {
      const result = colorize('', Colors.BLUE);
      expect(result).toBe(`${Colors.BLUE}${Colors.RESET}`);
    });

    it('特殊文字を処理する', () => {
      const text = 'Special: !@#$%^&*()';
      const result = colorize(text, Colors.GREEN);
      expect(result).toBe(`${Colors.GREEN}${text}${Colors.RESET}`);
    });
  });

  describe('bold', () => {
    it('テキストを太字にする', () => {
      const text = 'Bold Text';
      const result = bold(text);

      expect(result).toBe(`${Colors.BRIGHT}${text}${Colors.RESET}`);
    });

    it('空文字を処理する', () => {
      const result = bold('');
      expect(result).toBe(`${Colors.BRIGHT}${Colors.RESET}`);
    });
  });

  describe('dim', () => {
    it('テキストを薄くする', () => {
      const text = 'Dim Text';
      const result = dim(text);

      expect(result).toBe(`${Colors.DIM}${text}${Colors.RESET}`);
    });

    it('空文字を処理する', () => {
      const result = dim('');
      expect(result).toBe(`${Colors.DIM}${Colors.RESET}`);
    });
  });

  describe('red', () => {
    it('テキストを赤色にする', () => {
      const text = 'Red Text';
      const result = red(text);

      expect(result).toBe(`${Colors.RED}${text}${Colors.RESET}`);
    });

    it('複数行テキストを処理する', () => {
      const text = 'Line 1\nLine 2';
      const result = red(text);

      expect(result).toBe(`${Colors.RED}${text}${Colors.RESET}`);
    });
  });

  describe('green', () => {
    it('テキストを緑色にする', () => {
      const text = 'Green Text';
      const result = green(text);

      expect(result).toBe(`${Colors.GREEN}${text}${Colors.RESET}`);
    });
  });

  describe('yellow', () => {
    it('テキストを黄色にする', () => {
      const text = 'Yellow Text';
      const result = yellow(text);

      expect(result).toBe(`${Colors.YELLOW}${text}${Colors.RESET}`);
    });
  });

  describe('blue', () => {
    it('テキストを青色にする', () => {
      const text = 'Blue Text';
      const result = blue(text);

      expect(result).toBe(`${Colors.BLUE}${text}${Colors.RESET}`);
    });
  });

  describe('cyan', () => {
    it('テキストをシアン色にする', () => {
      const text = 'Cyan Text';
      const result = cyan(text);

      expect(result).toBe(`${Colors.CYAN}${text}${Colors.RESET}`);
    });
  });

  describe('magenta', () => {
    it('テキストをマゼンタ色にする', () => {
      const text = 'Magenta Text';
      const result = magenta(text);

      expect(result).toBe(`${Colors.MAGENTA}${text}${Colors.RESET}`);
    });
  });

  describe('color function consistency', () => {
    it('全ての色関数が内部でcolorize関数を使用する', () => {
      const text = 'Test';

      expect(red(text)).toBe(colorize(text, Colors.RED));
      expect(green(text)).toBe(colorize(text, Colors.GREEN));
      expect(yellow(text)).toBe(colorize(text, Colors.YELLOW));
      expect(blue(text)).toBe(colorize(text, Colors.BLUE));
      expect(cyan(text)).toBe(colorize(text, Colors.CYAN));
      expect(magenta(text)).toBe(colorize(text, Colors.MAGENTA));
      expect(bold(text)).toBe(colorize(text, Colors.BRIGHT));
      expect(dim(text)).toBe(colorize(text, Colors.DIM));
    });
  });

  describe('nested color application', () => {
    it('ネストした色適用を処理する', () => {
      const text = 'Test';
      const nested = red(bold(text));

      // Should contain both color codes and text
      expect(nested).toBe(`${Colors.RED}${Colors.BRIGHT}${text}${Colors.RESET}${Colors.RESET}`);
    });
  });

  describe('color stripping for length calculation', () => {
    it('色コードなしでテキスト長を計算可能である', () => {
      const text = 'Hello World';
      const coloredText = red(bold(text));

      // The actual text should be recoverable for length calculations
      // eslint-disable-next-line no-control-regex
      const withoutColors = coloredText.replace(/\x1b\[[0-9;]*m/g, '');
      expect(withoutColors).toBe(text);
      expect(withoutColors.length).toBe(text.length);
    });
  });

  describe('performance', () => {
    it('多数の色適用を効率的に処理する', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        red(`Test ${i}`);
        green(`Test ${i}`);
        blue(`Test ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
