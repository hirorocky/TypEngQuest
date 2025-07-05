import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';

/**
 * pwd command - print working directory
 */
export class PwdCommand extends BaseCommand {
  public name = 'pwd';
  public description = 'print working directory';

  protected executeInternal(_args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
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
