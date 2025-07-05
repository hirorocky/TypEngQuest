import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';
import { FileNode } from '../../world/FileNode';

/**
 * ls command - list directory contents
 */
export class LsCommand extends BaseCommand {
  public name = 'ls';
  public description = 'list directory contents';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const options = this.parseOptions(args);
    const targetPath = options.remaining[0];

    // set ls options
    const listOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      detailed: options.flags.includes('l') || options.flags.includes('long'),
      path: targetPath,
    };

    // get file list
    const result = fileSystem.ls(listOptions);

    if (!result.success) {
      return this.error(result.error || 'failed to list directory');
    }

    if (!result.files || result.files.length === 0) {
      return this.success('directory is empty', []);
    }

    // generate output
    const output: string[] = [];

    if (listOptions.detailed) {
      // detailed display
      output.push(...this.formatDetailedOutput(result.files));
    } else {
      // normal display
      output.push(...this.formatSimpleOutput(result.files));
    }

    return this.success('directory listing:', output);
  }

  /**
   * format for normal display
   */
  private formatSimpleOutput(files: FileNode[]): string[] {
    const output: string[] = [];
    let currentLine = '';
    const maxLineLength = 80;

    for (const file of files) {
      const displayName = this.getDisplayName(file);

      // check line length
      if (currentLine.length + displayName.length + 2 > maxLineLength) {
        if (currentLine.length > 0) {
          output.push(currentLine.trim());
          currentLine = '';
        }
      }

      currentLine += displayName + '  ';
    }

    if (currentLine.length > 0) {
      output.push(currentLine.trim());
    }

    return output;
  }

  /**
   * format for detailed display
   */
  private formatDetailedOutput(files: FileNode[]): string[] {
    const output: string[] = [];
    const now = new Date();

    for (const file of files) {
      const permissions = file.isDirectory() ? 'drwxr-xr-x' : '-rw-r--r--';
      const size = file.isDirectory() ? '4096' : this.getFileSize(file);
      const date = this.formatDate(now);
      const displayName = this.getDisplayName(file);

      output.push(`${permissions} 1 user user ${size.padStart(8)} ${date} ${displayName}`);
    }

    return output;
  }

  /**
   * get file display name (add / to directories)
   */
  private getDisplayName(file: FileNode): string {
    let displayName = file.name;

    if (file.isDirectory()) {
      displayName += '/';
    }

    return displayName;
  }

  /**
   * get file size (simple implementation)
   */
  private getFileSize(file: FileNode): string {
    // return appropriate size based on file type
    switch (file.fileType) {
      case 'monster':
        return '1024';
      case 'treasure':
        return '512';
      case 'save_point':
        return '256';
      case 'event':
        return '2048';
      default:
        return '0';
    }
  }

  public getHelp(): string[] {
    return [
      'ls [options] [path] - list directory contents',
      '',
      'options:',
      '  -a, --all      show hidden files',
      '  -l, --long     show detailed information',
      '',
      'arguments:',
      '  path          directory path to list (default: current directory)',
      '',
      'examples:',
      '  ls            # list current directory',
      '  ls -a         # list including hidden files',
      '  ls -l         # list with detailed information',
      '  ls -la        # list all files with details',
      '  ls src        # list src directory',
      '  ls -l ~/game  # list home path with details',
    ];
  }
}
