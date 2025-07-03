import { BaseCommand, CommandResult, CommandContext } from './BaseCommand';

/**
 * cdコマンド - ディレクトリの移動を行う
 */
export class CdCommand extends BaseCommand {
  public name = 'cd';
  public description = 'ディレクトリを移動します';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const targetPath = args[0];

    // ディレクトリ移動を実行
    const result = fileSystem.cd(targetPath);

    if (result.success) {
      return this.success(`移動しました: ${fileSystem.pwd()}`);
    } else {
      return this.error(result.error || 'ディレクトリの移動に失敗しました');
    }
  }

  public getHelp(): string[] {
    return [
      'cd [path] - ディレクトリを移動します',
      '',
      '引数:',
      '  path    移動先のパス（省略時はルートディレクトリ）',
      '',
      '例:',
      '  cd              # ルートディレクトリに移動',
      '  cd ~            # ルートディレクトリに移動',
      '  cd ..           # 親ディレクトリに移動',
      '  cd src          # srcディレクトリに移動',
      '  cd /projects    # 絶対パスで移動',
      '  cd ~/game       # ホームパスで移動',
    ];
  }
}
