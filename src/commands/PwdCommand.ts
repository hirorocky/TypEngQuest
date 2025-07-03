import { BaseCommand, CommandResult, CommandContext } from './BaseCommand';

/**
 * pwdコマンド - 現在の作業ディレクトリを表示する
 */
export class PwdCommand extends BaseCommand {
  public name = 'pwd';
  public description = '現在の作業ディレクトリのパスを表示します';

  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const currentPath = fileSystem.pwd();
    return this.success(currentPath);
  }

  public getHelp(): string[] {
    return [
      'pwd - 現在の作業ディレクトリのパスを表示します',
      '',
      'このコマンドは引数を取りません。',
      '現在いるディレクトリの絶対パスを表示します。',
      '',
      '例:',
      '  pwd              # 現在のディレクトリパスを表示',
      '',
      '出力例:',
      '  /projects/game-studio/src',
    ];
  }
}
