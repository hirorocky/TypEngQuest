/**
 * ゲームメインクラス
 */

import * as readline from 'readline';
import { PhaseType, GameState, CommandResult } from './types';
import { Phase } from './Phase';
import { TitlePhase } from '../phases/TitlePhase';
import { ExplorationPhase } from '../phases/ExplorationPhase';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { CommandParser } from './CommandParser';
// import { red, cyan } from '../ui/colors'; // TODO: Use in future error handling

export class Game {
  private state: GameState;
  private currentPhase: Phase | null = null;
  private rl: readline.Interface;
  private signalHandlers: { signal: 'SIGINT' | 'SIGTERM'; handler: () => void }[] = [];
  private currentWorld: World | null = null;
  private isTestMode: boolean;
  private commandParser: CommandParser;

  constructor(isTestMode: boolean = false) {
    this.state = {
      currentPhase: 'title',
      isRunning: false,
    };

    this.commandParser = new CommandParser();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
      completer: this.completer.bind(this),
    });

    this.isTestMode = isTestMode;
    this.setupSignalHandlers();
  }

  async start(): Promise<void> {
    this.state.isRunning = true;

    try {
      await this.transitionToPhase('title');
      await this.gameLoop();
    } catch (error) {
      Display.printError(
        `Game crashed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      await this.cleanup();
    }
  }

  private async gameLoop(): Promise<void> {
    return new Promise(resolve => {
      const handleInput = async (input: string) => {
        if (!this.state.isRunning) {
          resolve();
          return;
        }

        try {
          const result = await this.processInput(input.trim());
          await this.handleCommandResult(result);
        } catch (error) {
          Display.printError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        if (this.state.isRunning) {
          this.rl.prompt();
        } else {
          resolve();
        }
      };

      this.rl.on('line', handleInput);
      this.rl.prompt();
    });
  }

  private async processInput(input: string): Promise<CommandResult> {
    if (!this.currentPhase) {
      return {
        success: false,
        message: 'No active phase to process input',
      };
    }

    return await this.currentPhase.processInput(input);
  }

  private async handleCommandResult(result: CommandResult): Promise<void> {
    if (result.message) {
      if (result.success) {
        Display.printSuccess(result.message);
      } else {
        Display.printError(result.message);
      }
    }

    // Handle output array
    if (result.output && result.output.length > 0) {
      for (const line of result.output) {
        Display.print(line + '\n');
      }
    }

    // Handle phase transitions
    if (result.nextPhase) {
      await this.transitionToPhase(result.nextPhase);
    }

    // Handle special data
    if (result.data?.exit) {
      this.state.isRunning = false;
    }
  }

  private async transitionToPhase(phaseType: PhaseType): Promise<void> {
    // Cleanup current phase
    if (this.currentPhase) {
      await this.currentPhase.cleanup();
    }

    // Create and initialize new phase
    this.currentPhase = this.createPhase(phaseType);
    this.state.currentPhase = phaseType;

    await this.currentPhase.initialize();
  }

  private createPhase(phaseType: PhaseType): Phase {
    switch (phaseType) {
      case 'title':
        return new TitlePhase();

      case 'exploration':
        // explorationフェーズではワールドが必要
        if (!this.currentWorld) {
          // デフォルトワールドを生成
          this.currentWorld = this.generateDefaultWorld();
        }
        return new ExplorationPhase(this.currentWorld);

      default:
        throw new Error(`Unknown phase type: ${phaseType}`);
    }
  }

  /**
   * デフォルトワールドを生成する
   * 設定に基づいて後でカスタマイズ可能
   */
  private generateDefaultWorld(): World {
    if (this.isTestMode) {
      // テストモードでは固定のファイル構造を使用
      return World.generateTestWorld();
    } else {
      // デフォルトはランダムドメインのレベル1
      return World.generateRandomWorld(1);
    }
  }

  private setupSignalHandlers(): void {
    const sigintHandler = async () => {
      console.log();
      Display.printInfo('Received interrupt signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    };

    const sigtermHandler = async () => {
      Display.printInfo('Received termination signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);

    // ハンドラーを保存して、後で削除できるようにする
    this.signalHandlers.push(
      { signal: 'SIGINT', handler: sigintHandler },
      { signal: 'SIGTERM', handler: sigtermHandler }
    );
  }

  /**
   * Tab補完機能
   * @param line 現在の入力行
   * @returns 補完候補の配列
   */
  private completer(line: string): [string[], string] {
    const input = line.trim();
    const completions = this.commandParser.getCompletions(input);

    // 完全一致する補完候補が1つの場合は、それを返す
    if (completions.length === 1) {
      return [completions, input];
    }

    // 複数の補完候補がある場合は、共通部分を見つける
    if (completions.length > 1) {
      const commonPrefix = this.findCommonPrefix(completions);
      if (commonPrefix.length > input.length) {
        return [[commonPrefix], input];
      }
    }

    return [completions, input];
  }

  /**
   * 文字列配列の共通プレフィックスを見つける
   * @param strings 文字列配列
   * @returns 共通プレフィックス
   */
  private findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (prefix.length > 0 && !strings[i].startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    }
    return prefix;
  }

  private async cleanup(): Promise<void> {
    if (this.currentPhase) {
      await this.currentPhase.cleanup();
    }

    this.rl.close();

    // シグナルハンドラーを削除
    this.signalHandlers.forEach(({ signal, handler }) => {
      process.removeListener(signal, handler);
    });
    this.signalHandlers = [];
  }

  // Getters for testing
  getCurrentPhase(): PhaseType {
    return this.state.currentPhase;
  }

  isRunning(): boolean {
    return this.state.isRunning;
  }
}
