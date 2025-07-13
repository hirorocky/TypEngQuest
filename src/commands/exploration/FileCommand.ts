import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * fileコマンド - ファイルタイプとアクションを表示する
 */
export class FileCommand extends BaseCommand {
  public name = 'file';
  public description = 'show file type and available actions';

  /**
   * 引数の検証を行う
   * @param args コマンド引数
   * @returns 検証結果
   */
  public validateArgs(args: string[]): ValidationResult {
    if (!args || args.length === 0) {
      return { valid: false, error: 'filename required' };
    }

    if (args.length > 1) {
      return { valid: false, error: 'too many arguments' };
    }

    return { valid: true };
  }

  /**
   * fileコマンドを実行する
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

    const output = this.generateFileInfo(targetNode.name, targetNode.fileType);
    return this.success(undefined, output);
  }

  /**
   * ファイル情報を生成する
   * @param fileName ファイル名
   * @param fileType ファイルタイプ
   * @returns ファイル情報の配列
   */
  private generateFileInfo(fileName: string, fileType: FileType): string[] {
    const lines: string[] = [];
    
    lines.push(`File: ${fileName}`);
    lines.push(`Type: ${this.getFileTypeDescription(fileType)}`);
    lines.push(`Description: ${this.getFileDescription(fileType)}`);
    lines.push('');
    lines.push('Available actions:');
    
    const actions = this.getAvailableActions(fileName, fileType);
    actions.forEach(action => {
      lines.push(`  ${action}`);
    });

    return lines;
  }

  /**
   * ファイルタイプの説明を取得する
   * @param fileType ファイルタイプ
   * @returns ファイルタイプの説明
   */
  private getFileTypeDescription(fileType: FileType): string {
    switch (fileType) {
      case FileType.MONSTER:
        return 'Monster File (Programming)';
      case FileType.TREASURE:
        return 'Treasure Chest (Configuration)';
      case FileType.SAVE_POINT:
        return 'Save Point (Documentation)';
      case FileType.EVENT:
        return 'Event File (Executable)';
      case FileType.EMPTY:
        return 'Empty File';
      default:
        return 'Unknown File';
    }
  }

  /**
   * ファイルの説明を取得する
   * @param fileType ファイルタイプ
   * @returns ファイルの説明
   */
  private getFileDescription(fileType: FileType): string {
    switch (fileType) {
      case FileType.MONSTER:
        return 'Contains a monster that can be battled';
      case FileType.TREASURE:
        return 'Contains items that can be obtained';
      case FileType.SAVE_POINT:
        return 'Allows saving game and recovering HP/MP';
      case FileType.EVENT:
        return 'Triggers random events when executed';
      case FileType.EMPTY:
        return 'Contains no special content';
      default:
        return 'Unknown file type';
    }
  }

  /**
   * 利用可能なアクションを取得する
   * @param fileName ファイル名
   * @param fileType ファイルタイプ
   * @returns アクションの配列
   */
  private getAvailableActions(fileName: string, fileType: FileType): string[] {
    const actions: string[] = [];

    switch (fileType) {
      case FileType.MONSTER:
        actions.push(`battle ${fileName} - Start battle with the monster`);
        break;

      case FileType.TREASURE:
        actions.push(`open ${fileName}  - Open treasure chest`);
        break;

      case FileType.SAVE_POINT:
        actions.push(`save ${fileName}      - Save game progress`);
        actions.push(`rest ${fileName}      - Recover HP/MP`);
        break;

      case FileType.EVENT:
        actions.push(`execute ${fileName} - Run the event`);
        break;

      case FileType.EMPTY:
        actions.push(`[No special actions available]`);
        break;

      default:
        actions.push(`[No special actions available]`);
        break;
    }

    return actions;
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public getHelp(): string[] {
    return [
      'Usage: file <filename>',
      '',
      'Display file type and available actions.',
      '',
      'Arguments:',
      '  filename    The name of the file to examine',
      '',
      'Examples:',
      '  file script.js     # Show monster file info',
      '  file config.json   # Show treasure chest info',
      '  file readme.md     # Show save point info',
      '  file setup.exe     # Show event file info',
    ];
  }
}