/**
 * フェーズ管理システム
 */

import * as readline from 'readline';
import { PhaseType, CommandResult, Command } from './types';
import { CommandParser } from './CommandParser';
import { World } from '../world/World';
import { TabCompleter } from './completion';
import { Display } from '../ui/Display';

export abstract class Phase {
  protected parser: CommandParser;
  protected world?: World;
  protected rl: readline.Interface | null = null;
  protected tabCompleter?: TabCompleter;

  // フェーズ遷移ハンドラー
  private transitionHandler?: (result: CommandResult) => void;

  constructor(world?: World, tabCompleter?: TabCompleter) {
    this.parser = new CommandParser();
    this.world = world;
    this.tabCompleter = tabCompleter;
  }

  abstract getType(): PhaseType;
  abstract initialize(): Promise<void>;

  /**
   * Phase固有のプロンプトを取得
   */
  abstract getPrompt(): string;

  /**
   * readlineインターフェースを作成
   */
  protected createReadlineInterface(): readline.Interface {
    return readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt(),
      completer: this.completer.bind(this),
    });
  }

  /**
   * Tab補完機能
   */
  protected completer(line: string): [string[], string] {
    if (this.tabCompleter) {
      return this.tabCompleter.complete(line, this, this.world || null);
    }
    return [[], line];
  }

  /**
   * 入力処理ループを開始
   * @returns Phase遷移が必要な場合はCommandResultを返す
   */
  async startInputLoop(): Promise<CommandResult | null> {
    if (!this.rl) {
      this.rl = this.createReadlineInterface();
    }

    return new Promise(resolve => {
      const handleInput = this.createInputHandler(resolve);
      this.rl?.on('line', handleInput);
      this.rl?.prompt();
    });
  }

  /**
   * 入力ハンドラーを作成
   */
  private createInputHandler(resolve: (result: CommandResult | null) => void) {
    return async (input: string) => {
      try {
        const result = await this.processInput(input.trim());
        this.handleCommandResult(result, resolve);
      } catch (error) {
        this.handleError(error);
      }
    };
  }

  /**
   * コマンド結果を処理
   */
  private handleCommandResult(
    result: CommandResult,
    resolve: (result: CommandResult | null) => void
  ): void {
    this.displayMessages(result);

    // Phase遷移が必要な場合
    if (result.nextPhase || result.data?.exit) {
      // readlineを適切にクローズしてnullに設定
      if (this.rl) {
        this.rl.close();
        this.rl = null;
      }
      resolve(result);
      return;
    }

    // 継続
    this.rl?.prompt();
  }

  /**
   * メッセージと出力を表示
   */
  private displayMessages(result: CommandResult): void {
    // Phase遷移が発生する場合は、Game側でメッセージを処理するのでここではスキップ
    if (result.nextPhase) {
      return;
    }

    if (result.message) {
      if (result.success) {
        Display.printSuccess(result.message);
      } else {
        Display.printError(result.message);
      }
    }

    if (result.output && result.output.length > 0) {
      for (const line of result.output) {
        Display.print(line + '\n');
      }
    }
  }

  /**
   * エラーを処理
   */
  private handleError(error: unknown): void {
    Display.printError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    this.rl?.prompt();
  }

  /**
   * クリーンアップ処理
   */
  async cleanup(): Promise<void> {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  async processInput(input: string): Promise<CommandResult> {
    return await this.parser.parse(input);
  }

  protected registerCommand(command: Command): void {
    this.parser.register(command);
  }

  protected unregisterCommand(name: string): void {
    this.parser.unregister(name);
  }

  getAvailableCommands(): string[] {
    return this.parser.getAvailableCommands();
  }

  /**
   * フェーズ遷移を通知
   */
  protected notifyTransition(result: CommandResult): void {
    if (this.transitionHandler) {
      this.transitionHandler(result);
    }
  }

  /**
   * フェーズ遷移ハンドラーを設定
   */
  public setTransitionHandler(handler: (result: CommandResult) => void): void {
    this.transitionHandler = handler;
  }
}
