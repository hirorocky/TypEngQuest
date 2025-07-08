/**
 * 色定義とテキスト装飾
 */

export const Colors = {
  // 基本色
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',

  // 文字色
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',

  // 背景色
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m',
} as const;

export function colorize(text: string, color: string): string {
  return `${color}${text}${Colors.RESET}`;
}

export function bold(text: string): string {
  return colorize(text, Colors.BRIGHT);
}

export function dim(text: string): string {
  return colorize(text, Colors.DIM);
}

export function red(text: string): string {
  return colorize(text, Colors.RED);
}

export function green(text: string): string {
  return colorize(text, Colors.GREEN);
}

export function yellow(text: string): string {
  return colorize(text, Colors.YELLOW);
}

export function blue(text: string): string {
  return colorize(text, Colors.BLUE);
}

export function cyan(text: string): string {
  return colorize(text, Colors.CYAN);
}

export function magenta(text: string): string {
  return colorize(text, Colors.MAGENTA);
}

export function formatCommand(text: string): string {
  return bold(cyan(text));
}

export function formatSuccess(text: string): string {
  return green(`✅ ${text}`);
}

/**
 * 青色太字のテキストを生成する
 * @param text 装飾するテキスト
 * @returns 青色太字のテキスト
 */
export function blueBold(text: string): string {
  return `${Colors.BRIGHT}${Colors.BLUE}${text}${Colors.RESET}`;
}
