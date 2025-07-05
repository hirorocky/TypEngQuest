import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * start command - start new game
 */
export class StartCommand extends BaseCommand {
  public name = 'start';
  public description = 'start new game';

  protected executeInternal(_args: string[], _context: CommandContext): CommandResult {
    // start new game
    return this.successWithPhase(
      'new game started!',
      'exploration',
      { newGame: true }
    );
  }

  public getHelp(): string[] {
    return [
      'start - start new game',
      '',
      'usage:',
      '  start',
      '',
      'description:',
      '  begin a new adventure.',
      '  current progress will be lost.',
    ];
  }
}