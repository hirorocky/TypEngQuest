import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * loadコマンド - セーブデータをロードする
 */
export class LoadCommand extends BaseCommand {
  public name = 'load';
  public description = 'セーブデータをロードする';

  protected executeInternal(args: string[], _context: CommandContext): CommandResult {
    // セーブファイルの確認（現在は未実装のため固定メッセージ）
    if (args.length > 0) {
      const saveSlot = args[0];
      return this.error(`セーブスロット${saveSlot}が見つかりません。`);
    }

    return this.error('セーブファイルが見つかりません。startコマンドで新しいゲームを始めてください。');
  }

  public getHelp(): string[] {
    return [
      'load [スロット番号] - セーブデータをロードします',
      '',
      '使用法:',
      '  load',
      '  load 1',
      '',
      '説明:',
      '  指定したスロットのセーブデータをロードします。',
      '  スロット番号を省略した場合、利用可能なセーブファイル一覧を表示します。',
    ];
  }
}