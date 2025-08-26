import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileSystem } from '../../world/FileSystem';
import { FileNode } from '../../world/FileNode';
import { blueBold } from '../../ui/colors';

/**
 * ls コマンド - ディレクトリの内容を一覧表示
 */
export class LsCommand extends BaseCommand {
  public name = 'ls';
  public description = 'list directory contents';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as FileSystem;
    const options = this.parseOptions(args);
    const targetPath = options.remaining[0];

    // ls オプションを設定
    const listOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      detailed: options.flags.includes('l') || options.flags.includes('long'),
      path: targetPath,
    };

    // ファイル一覧を取得
    const result = fileSystem.ls(listOptions);

    if (!result.success) {
      return this.error(result.error || 'failed to list directory');
    }

    if (!result.files || result.files.length === 0) {
      return this.success('directory is empty', []);
    }

    // 出力を生成
    const output: string[] = [];

    if (listOptions.detailed) {
      // 詳細表示
      output.push(...this.formatDetailedOutput(result.files));
    } else {
      // 通常表示
      output.push(...this.formatSimpleOutput(result.files));
    }

    return this.success('directory listing:', output);
  }

  /**
   * 通常表示のフォーマット
   */
  private formatSimpleOutput(files: FileNode[]): string[] {
    const output: string[] = [];
    let currentLine = '';
    const maxLineLength = 80;

    for (const file of files) {
      const displayName = this.getDisplayName(file);

      // 行の長さをチェック
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
   * 詳細表示のフォーマット
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
   * ファイル表示名を取得（ディレクトリに / を追加し、青色太字で表示）
   */
  private getDisplayName(file: FileNode): string {
    let displayName = file.name;

    if (file.isDirectory()) {
      displayName += '/';
      return blueBold(displayName);
    }

    return displayName;
  }

  /**
   * ファイルサイズを取得（簡単な実装）
   */
  private getFileSize(file: FileNode): string {
    // ファイルタイプに基づいて適切なサイズを返す
    switch (file.fileType) {
      case 'monster':
        return '1024';
      case 'treasure':
        return '512';
      case 'savepoint':
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
