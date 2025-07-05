import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * exit コマンド - ゲームを終了
 */
export class ExitCommand extends BaseCommand {
  public name = 'exit';
  public description = 'exit game';

  protected executeInternal(_args: string[], _context: CommandContext): CommandResult {
    return this.success(
      'exiting game. thanks for playing TypEngQuest!',
      undefined
    );
  }

  public getHelp(): string[] {
    return [
      'exit - exit game',
      '',
      'usage:',
      '  exit',
      '',
      'description:',
      '  exit game and close title screen.',
      '  unsaved progress will be lost.',
    ];
  }
}