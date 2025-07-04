import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * startコマンド - 新しいゲームを開始する
 */
export class StartCommand extends BaseCommand {
  public name = 'start';
  public description = '新しいゲームを開始する';

  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    // 新しいゲーム開始処理
    return this.successWithPhase(
      '新しいゲームを開始しました！',
      'exploration',
      { newGame: true }
    );
  }

  public getHelp(): string[] {
    return [
      'start - 新しいゲームを開始します',
      '',
      '使用法:',
      '  start',
      '',
      '説明:',
      '  新しい冒険を始めます。',
      '  現在の進行状況は失われます。',
    ];
  }
}