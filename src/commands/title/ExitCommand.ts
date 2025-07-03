import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * exitコマンド - ゲームを終了する
 */
export class ExitCommand extends BaseCommand {
  public name = 'exit';
  public description = 'ゲームを終了する';

  protected executeInternal(_args: string[], _context: CommandContext): CommandResult {
    return this.success(
      'ゲームを終了します。TypEngQuestをプレイしていただき、ありがとうございました！',
      undefined
    );
  }

  public getHelp(): string[] {
    return [
      'exit - ゲームを終了します',
      '',
      '使用法:',
      '  exit',
      '',
      '説明:',
      '  ゲームを終了してタイトル画面を閉じます。',
      '  保存されていない進行状況は失われます。',
    ];
  }
}