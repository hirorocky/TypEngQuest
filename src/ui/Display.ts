/**
 * 画面表示管理
 */

import { bold, cyan, yellow, red, formatCommand, formatSuccess } from './colors';

export class Display {
  static clear(): void {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  static print(text: string): void {
    process.stdout.write(text);
  }

  static printLine(char: string = '-', length: number = 50): void {
    console.log(char.repeat(length));
  }

  static printTitle(title: string): void {
    this.clear();
    this.printLine('=', 60);
    console.log(bold(cyan(`    🎮 ${title}`)));
    this.printLine('=', 60);
    console.log();
  }

  static printHeader(header: string): void {
    console.log();
    console.log(bold(yellow(header)));
    this.printLine('-', header.length);
  }

  static newLine(): void {
    console.log();
  }

  static printSuccess(message: string): void {
    console.log(formatSuccess(message));
  }

  static printError(message: string): void {
    console.log(red(`❌ ${message}`));
  }

  static printInfo(message: string): void {
    console.log(cyan(`ℹ️  ${message}`));
  }

  static printWarning(message: string): void {
    console.log(yellow(`⚠️  ${message}`));
  }

  static printEmptyLine(): void {
    console.log();
  }

  static printCommand(command: string, description: string): void {
    const formatted = `  ${formatCommand(command)} - ${description}`;
    console.log(formatted);
  }

  static async waitForEnter(message: string = 'Press Enter to continue...'): Promise<void> {
    return new Promise(resolve => {
      process.stdout.write(cyan(message));

      const onData = (data: Buffer) => {
        const key = data.toString();
        // Enterキー（\n または \r\n）の場合のみ処理
        if (key === '\n' || key === '\r\n') {
          process.stdin.removeListener('data', onData);
          resolve();
        }
        // それ以外のキーは無視
      };

      process.stdin.on('data', onData);
    });
  }
}
