import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * executeコマンド - イベントファイルを実行する
 */
export class ExecuteCommand extends BaseCommand {
  public name = 'execute';
  public description = 'イベントファイルを実行する';

  /**
   * 引数の検証を行う
   * @param args コマンド引数
   * @returns 検証結果
   */
  public validateArgs(args: string[]): ValidationResult {
    if (!args || args.length === 0) {
      return { valid: false, error: 'ファイル名を指定してください' };
    }

    if (args.length > 1) {
      return { valid: false, error: 'ファイル名は1つだけ指定してください' };
    }

    return { valid: true };
  }

  /**
   * executeコマンドを実行する
   * @param args コマンド引数
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context);
    if (!fileSystem) {
      return this.error('filesystem not available');
    }

    const fileName = args[0];
    const currentNode = fileSystem.currentNode;
    const targetNode = currentNode.findChild(fileName);

    if (!targetNode) {
      return this.error('no such file or directory');
    }

    if (targetNode.isDirectory()) {
      return this.error('not a file');
    }

    // イベントファイルかどうかを確認
    if (targetNode.fileType !== FileType.EVENT) {
      return this.error(`${fileName} is not an executable file`);
    }

    // イベント実行のメッセージを生成
    const output = this.generateExecuteOutput(fileName);
    return this.success(undefined, output);
  }

  /**
   * イベント実行出力を生成する
   * @param fileName ファイル名
   * @returns 出力の配列
   */
  private generateExecuteOutput(fileName: string): string[] {
    const lines: string[] = [];
    
    lines.push(`Executing: ${fileName}...`);
    lines.push('');
    lines.push('⚡ Event Triggered!');
    lines.push(`Type: ${this.getEventType(fileName)}`);
    lines.push('');
    lines.push('[Event system not yet implemented]');
    lines.push('Something mysterious happens...');

    return lines;
  }

  /**
   * ファイル名からイベントタイプを取得する
   * @param fileName ファイル名
   * @returns イベントタイプ
   */
  private getEventType(fileName: string): string {
    const extension = this.getExtension(fileName);
    const typeMap: { [key: string]: string } = {
      '.exe': 'Executable Event',
      '.bin': 'Binary Event',
      '.app': 'Application Event',
      '.dmg': 'Disk Image Event',
      '.deb': 'Package Event',
      '.rpm': 'Package Event',
      '.msi': 'Installer Event',
      '.sh': 'Script Event',
      '.ps1': 'PowerShell Event',
      '.bat': 'Batch Event',
      '.cmd': 'Command Event',
      '.com': 'DOS Event',
    };

    return typeMap[extension] || 'Unknown Event';
  }

  /**
   * ファイル名から拡張子を取得する
   * @param fileName ファイル名
   * @returns 拡張子（小文字、ドット付き）
   */
  private getExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return '';
    }
    return fileName.substring(lastDotIndex).toLowerCase();
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public getHelp(): string[] {
    return [
      'Usage: execute <filename>',
      '',
      'Execute an event file.',
      '',
      'Arguments:',
      '  filename    The name of the event file to execute',
      '',
      'Examples:',
      '  execute setup.exe    # Execute Windows executable',
      '  execute install.sh   # Execute shell script',
    ];
  }
}