import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';

/**
 * start コマンド - 新しいゲームを開始
 */
export class StartCommand extends BaseCommand {
  public name = 'start';
  public description = 'start new game';

  protected executeInternal(_args: string[], _context: CommandContext): CommandResult {
    // 新しいゲームを開始
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