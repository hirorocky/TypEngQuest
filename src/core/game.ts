import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { Player } from './player';
import { CommandProcessor } from '../commands/processor';

export interface GameState {
  isRunning: boolean;
  currentScreen: 'menu' | 'game' | 'battle' | 'equipment' | 'quit';
  player: Player;
}

export class Game {
  private state: GameState;
  private commandProcessor: CommandProcessor;

  constructor() {
    this.state = {
      isRunning: false,
      currentScreen: 'menu',
      player: new Player(),
    };
    this.commandProcessor = new CommandProcessor(this);
  }

  async start(): Promise<void> {
    this.state.isRunning = true;

    console.log(chalk.green('Welcome to CodeQuest RPG!'));
    console.log(chalk.gray('Type "help" for available commands.\n'));

    await this.mainLoop();
  }

  private async mainLoop(): Promise<void> {
    while (this.state.isRunning) {
      try {
        const command = await input({
          message: chalk.cyan('> '),
        });

        await this.commandProcessor.process(command.trim());
      } catch (error) {
        console.error(
          chalk.red('Error:'),
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  }

  // Game State Management
  getState(): GameState {
    return this.state;
  }

  setState(newState: Partial<GameState>): void {
    this.state = { ...this.state, ...newState };
  }

  quit(): void {
    console.log(chalk.yellow('Thanks for playing CodeQuest RPG!'));
    console.log(chalk.gray('May your code be bug-free and your typing swift! 🚀\n'));
    this.state.isRunning = false;
  }

  // Screen Management
  setScreen(screen: GameState['currentScreen']): void {
    this.state.currentScreen = screen;
  }

  getCurrentScreen(): GameState['currentScreen'] {
    return this.state.currentScreen;
  }

  // Player Access
  getPlayer(): Player {
    return this.state.player;
  }
}
