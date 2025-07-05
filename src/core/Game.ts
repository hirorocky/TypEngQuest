/**
 * ゲームメインクラス
 */

import * as readline from 'readline';
import { PhaseType, GameState, CommandResult } from './types';
import { Phase } from './Phase';
import { TitlePhase } from '../phases/TitlePhase';
import { ExplorationPhase } from '../phases/ExplorationPhase';
import { Display } from '../ui/Display';
// import { red, cyan } from '../ui/colors'; // TODO: Use in future error handling

export class Game {
  private state: GameState;
  private currentPhase: Phase | null = null;
  private rl: readline.Interface;

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
        return new ExplorationPhase();

      default:
        throw new Error(`Unknown phase type: ${phaseType}`);
    }
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', async () => {
      console.log();
      Display.printInfo('Received interrupt signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      Display.printInfo('Received termination signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    });
  }

  private async cleanup(): Promise<void> {
    if (this.currentPhase) {
      await this.currentPhase.cleanup();
    }

    this.rl.close();
  }

  // Getters for testing
  getCurrentPhase(): PhaseType {
    return this.state.currentPhase;
  }

  isRunning(): boolean {
    return this.state.isRunning;
  }
}
