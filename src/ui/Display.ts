/**
 * 画面表示管理
 */

import { bold, cyan, green, yellow, red } from './colors';

export class Display {
  static clear(): void {
    process.stdout.write('\x1b[2J\x1b[0f');
  }

  static print(text: string): void {
    console.log(text);
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

  static printSuccess(message: string): void {
    console.log(green(`✅ ${message}`));
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

  static async waitForEnter(message: string = 'Press Enter to continue...'): Promise<void> {
    return new Promise(resolve => {
      process.stdout.write(cyan(message));
      process.stdin.once('data', () => {
        resolve();
      });
    });
  }
}
