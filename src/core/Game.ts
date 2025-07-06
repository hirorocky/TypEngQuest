/**
 * ゲームメインクラス
 */

import * as readline from 'readline';
import { PhaseType, GameState, CommandResult } from './types';
import { Phase } from './Phase';
import { TitlePhase } from '../phases/TitlePhase';
import { ExplorationPhase } from '../phases/ExplorationPhase';
import { Display } from '../ui/Display';
import { WorldGenerator } from '../world/WorldGenerator';
import { World } from '../world/World';
// import { red, cyan } from '../ui/colors'; // TODO: Use in future error handling

export class Game {
  private state: GameState;
  private currentPhase: Phase | null = null;
  private rl: readline.Interface;
  private signalHandlers: { signal: 'SIGINT' | 'SIGTERM'; handler: () => void }[] = [];
  private worldGenerator: WorldGenerator;
  private currentWorld: World | null = null;

  constructor() {
    this.state = {
      currentPhase: 'title',
      isRunning: false,
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> ',
    });

    this.worldGenerator = new WorldGenerator();
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
    // デフォルトはランダムドメインのレベル1
    return this.worldGenerator.generateRandomWorld(1);
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
