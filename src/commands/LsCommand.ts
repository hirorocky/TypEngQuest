import { BaseCommand, CommandResult } from './BaseCommand';
import { FileSystem } from '../world/FileSystem';
import { FileNode } from '../world/FileNode';

/**
 * lsコマンド - ファイル・ディレクトリの一覧を表示する
 */
export class LsCommand extends BaseCommand {
  public name = 'ls';
  public description = 'ファイル・ディレクトリ一覧を表示します';

  protected executeInternal(args: string[], fileSystem: FileSystem): CommandResult {
    const options = this.parseOptions(args);
    const targetPath = options.remaining[0];

    // lsオプションを設定
    const listOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      detailed: options.flags.includes('l') || options.flags.includes('long'),
      path: targetPath,
    };

    // ファイル一覧を取得
    const result = fileSystem.ls(listOptions);

    if (!result.success) {
      return this.error(result.error || 'ファイル一覧の取得に失敗しました');
    }

    if (!result.files || result.files.length === 0) {
      return this.success('ディレクトリは空です', []);
    }

    // 表示用の出力を生成
    const output: string[] = [];

    if (listOptions.detailed) {
      // 詳細表示
      output.push(...this.formatDetailedOutput(result.files));
    } else {
      // 通常表示
      output.push(...this.formatSimpleOutput(result.files));
    }

    return this.success('ファイル一覧:', output);
  }

  /**
   * 通常表示用のフォーマット
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
   * 詳細表示用のフォーマット
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
   * ファイルの表示名を取得（ディレクトリには/を付加）
   */
  private getDisplayName(file: FileNode): string {
    let displayName = file.name;

    if (file.isDirectory()) {
      displayName += '/';
    }

    return displayName;
  }

  /**
   * ファイルサイズを取得（簡単な実装）
   */
  private getFileSize(file: FileNode): string {
    // ファイルタイプによって適当なサイズを返す
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
      'ls [options] [path] - ファイル・ディレクトリ一覧を表示します',
      '',
      'オプション:',
      '  -a, --all      隠しファイルも表示します',
      '  -l, --long     詳細情報を表示します',
      '',
      '引数:',
      '  path          表示するディレクトリのパス（省略時は現在のディレクトリ）',
      '',
      '例:',
      '  ls            # 現在のディレクトリの一覧表示',
      '  ls -a         # 隠しファイルも含めて表示',
      '  ls -l         # 詳細情報付きで表示',
      '  ls -la        # 隠しファイルも含めて詳細表示',
      '  ls src        # srcディレクトリの一覧表示',
      '  ls -l ~/game  # ホームパスの詳細表示',
    ];
  }
}
