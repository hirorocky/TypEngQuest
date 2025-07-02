/**
 * タイトルフェーズ
 */

import { Phase } from '../core/Phase';
import { PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { bold, cyan, green, red } from '../ui/colors';

export class TitlePhase extends Phase {
  getType(): PhaseType {
    return 'title';
  }

  async initialize(): Promise<void> {
    this.registerTitleCommands();
    await this.showTitleScreen();
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for title phase
  }

  private registerTitleCommands(): void {
    this.registerCommand({
      name: 'start',
      aliases: ['s', 'new'],
      description: 'Start a new game',
      execute: async () => this.startNewGame(),
    });

    this.registerCommand({
      name: 'load',
      aliases: ['l'],
      description: 'Load a saved game',
      execute: async () => this.loadGame(),
    });

    this.registerCommand({
      name: 'exit',
      aliases: ['quit', 'q'],
      description: 'Exit the game',
      execute: async () => this.exitGame(),
    });
  }

  private async showTitleScreen(): Promise<void> {
    Display.printTitle('TypEngQuest');

    console.log(cyan('    A typing-based CLI RPG adventure!'));
    console.log();
    console.log('    Explore virtual file systems, battle code monsters,');
    console.log('    and improve your typing skills in this unique RPG.');
    console.log();

    Display.printHeader('What would you like to do?');
    console.log(`  ${bold(green('start'))} - Begin your adventure`);
    console.log(`  ${bold(cyan('load'))}  - Continue from a save file`);
    console.log(`  ${bold(red('exit'))}  - Leave the game`);
    console.log();
    console.log('Type a command and press Enter, or type "help" for more options.');
  }

  private async startNewGame(): Promise<CommandResult> {
    Display.printSuccess('Starting new adventure...');
    Display.printInfo('Generating world... Please wait.');

    // For now, we'll just simulate starting the game
    await this.simulateLoading();

    return {
      success: true,
      message: 'New game started! Welcome to TypEngQuest!',
      nextPhase: 'exploration',
    };
  }

  private async loadGame(): Promise<CommandResult> {
    Display.printInfo('Looking for save files...');

    // For now, simulate no save files
    await this.simulateLoading();

    return {
      success: false,
      message: 'No save files found. Please start a new game.',
    };
  }

  private async exitGame(): Promise<CommandResult> {
    Display.printInfo('Thanks for playing TypEngQuest!');
    console.log();
    console.log(cyan('    May your code be bug-free and your typing swift!'));
    console.log();

    return {
      success: true,
      message: 'Exiting game...',
      data: { exit: true },
    };
  }

  private async simulateLoading(): Promise<void> {
    return new Promise<void>(resolve => {
      // eslint-disable-next-line no-undef
      setTimeout(resolve, 500);
    });
  }
}
