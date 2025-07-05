import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * load command - load saved game
 */
export class LoadCommand extends BaseCommand {
  public name = 'load';
  public description = 'load saved game';

  protected executeInternal(args: string[], _context: CommandContext): CommandResult {
    // check save file (not implemented yet, fixed message)
    if (args.length > 0) {
      const saveSlot = args[0];
      return this.error(`save slot ${saveSlot} not found`);
    }

    return this.error('no save file found. use start command to begin new game');
  }

  public getHelp(): string[] {
    return [
      'load [slot] - load saved game',
      '',
      'usage:',
      '  load',
      '  load 1',
      '',
      'description:',
      '  load game data from specified slot.',
      '  if no slot specified, show available save files.',
    ];
  }
}