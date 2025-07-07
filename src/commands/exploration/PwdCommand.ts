import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';

/**
 * pwd コマンド - ワーキングディレクトリを表示
 */
export class PwdCommand extends BaseCommand {
  public name = 'pwd';
  public description = 'print working directory';

  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context);
    if (!fileSystem) {
      return this.error('file system not found');
    }
    const currentPath = fileSystem.pwd();
    return this.success(undefined, [currentPath]);
  }

  public getHelp(): string[] {
    return [
      'pwd - print working directory',
      '',
      'this command takes no arguments.',
      'displays the absolute path of the current directory.',
      '',
      'examples:',
      '  pwd              # display current directory path',
      '',
      'output example:',
      '  /projects/game-studio/src',
    ];
  }
}
