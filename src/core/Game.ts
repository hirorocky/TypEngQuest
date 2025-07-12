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
    const parts = input.split(' ');

    // コマンドの補完（最初の単語または引数がない場合）
    if (parts.length <= 1) {
      return this.completeCommand(input);
    }

    // 引数の補完（cdコマンドなど）
    const command = parts[0];
    const currentArg = parts[parts.length - 1]; // 現在補完対象の引数

    if (command === 'cd' && this.currentWorld) {
      return this.completeDirectoryArgument(currentArg);
    }

    return [[], currentArg];
  }

  /**
   * コマンド名の補完処理
   * @param input 入力されたコマンド名
   * @returns 補完候補の配列
   */
  private completeCommand(input: string): [string[], string] {
    // グローバルコマンドとフェーズ固有のコマンドを両方取得
    const globalCompletions = this.commandParser.getCompletions(input);
    const phaseCompletions = this.currentPhase
      ? this.currentPhase
          .getAvailableCommands()
          .filter(cmd => cmd.toLowerCase().startsWith(input.toLowerCase()))
      : [];

    // 重複を除去してマージ
    const allCompletions = [...new Set([...globalCompletions, ...phaseCompletions])].sort();

    // マッチするものがない場合は全コマンドを表示
    const hits = allCompletions.length > 0 ? allCompletions : this.getAllAvailableCommands();

    return [hits, input];
  }

  /**
   * 利用可能な全コマンドを取得する
   * @returns 全コマンドの配列
   */
  private getAllAvailableCommands(): string[] {
    const globalCommands = this.commandParser.getAvailableCommands();
    const phaseCommands = this.currentPhase ? this.currentPhase.getAvailableCommands() : [];
    return [...new Set([...globalCommands, ...phaseCommands])].sort();
  }

  /**
   * ディレクトリ引数の補完処理
   * @param currentArg 現在の引数
   * @returns 補完候補の配列
   */
  private completeDirectoryArgument(currentArg: string): [string[], string] {
    const directories = this.getDirectoryCompletions(currentArg);

    // マッチするディレクトリがない場合は全ディレクトリを表示
    const hits = directories.length > 0 ? directories : this.getAllDirectories();

    return [hits, currentArg];
  }

  /**
   * 現在ディレクトリの全ディレクトリを取得する
   * @returns 全ディレクトリの配列
   */
  private getAllDirectories(): string[] {
    if (!this.currentWorld) return [];

    try {
      const fileSystem = this.currentWorld.getFileSystem();
      return fileSystem.getDirectoryCompletions('');
    } catch (_error) {
      return [];
    }
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

  /**
   * ディレクトリの補完候補を取得する
   * @param partialPath 部分的なパス
   * @returns ディレクトリ名の配列
   */
  private getDirectoryCompletions(partialPath: string): string[] {
    if (!this.currentWorld) return [];

    try {
      const fileSystem = this.currentWorld.getFileSystem();
      return fileSystem.getDirectoryCompletions(partialPath);
    } catch (_error) {
      return [];
    }
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
