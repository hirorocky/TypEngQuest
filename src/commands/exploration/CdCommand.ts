import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';

/**
 * cd コマンド - ワーキングディレクトリを変更
 */
export class CdCommand extends BaseCommand {
  public name = 'cd';
  public description = 'change working directory';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const targetPath = args[0];

    // ディレクトリの変更を実行
    const result = fileSystem.cd(targetPath);

    if (result.success) {
      return this.success(`changed to: ${fileSystem.pwd()}`);
    } else {
      return this.error(result.error || 'change directory failed');
    }
  }

  public getHelp(): string[] {
    return [
      'cd [path] - change working directory',
      '',
      'arguments:',
      '  path    destination path (default: root directory)',
      '',
      'examples:',
      '  cd              # change to root directory',
      '  cd ~            # change to root directory',
      '  cd ..           # change to parent directory',
      '  cd src          # change to src directory',
      '  cd /projects    # change using absolute path',
      '  cd ~/game       # change using home path',
    ];
  }
}
