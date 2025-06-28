import chalk from 'chalk';
import { input } from '@inquirer/prompts';
import { Player } from './player';
import { CommandProcessor } from '../commands/processor';
import { Map } from '../world/map';
import { World } from '../world/world';
import { ElementManager } from '../world/elements';
import { BattleCommands } from '../battle/battleCommands';

export interface GameState {
  isRunning: boolean;
  currentScreen: 'menu' | 'game' | 'battle' | 'equipment' | 'quit';
  player: Player;
  map: Map;
  world: World;
  elementManager: ElementManager;
  battleCommands: BattleCommands;
}

export class Game {
  private state: GameState;
  private commandProcessor: CommandProcessor;

  constructor() {
    const player = new Player();
    const map = new Map();
    const world = new World('Development World', 1, map);
    const elementManager = new ElementManager();
    const battleCommands = new BattleCommands(player, map, world, elementManager);

    this.state = {
      isRunning: false,
      currentScreen: 'menu',
      player,
      map,
      world,
      elementManager,
      battleCommands,
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

  getPlayer(): Player {
    return this.state.player;
  }

  getMap(): Map {
    return this.state.map;
  }

  getWorld(): World {
    return this.state.world;
  }

  getElementManager(): ElementManager {
    return this.state.elementManager;
  }

  getBattleCommands(): BattleCommands {
    return this.state.battleCommands;
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
}
