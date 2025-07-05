import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * load コマンド - セーブされたゲームを読み込み
 */
export class LoadCommand extends BaseCommand {
  public name = 'load';
  public description = 'load saved game';

  protected executeInternal(args: string[], _context: CommandContext): CommandResult {
    // セーブファイルをチェック（未実装、固定メッセージ）
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