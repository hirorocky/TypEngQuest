import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * saveコマンド - セーブポイントでゲームを保存する
 */
export class SaveCommand extends BaseCommand {
  public name = 'save';
  public description = 'save game at save point';

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
   * saveコマンドを実行する
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

    // セーブポイントファイルかどうかを確認
    if (targetNode.fileType !== FileType.SAVE_POINT) {
      return this.error(`${fileName} is not a save point`);
    }

    // セーブ処理のメッセージを生成
    const output = this.generateSaveOutput(fileName);
    return this.success(undefined, output);
  }

  /**
   * セーブ出力を生成する
   * @param fileName ファイル名
   * @returns 出力の配列
   */
  private generateSaveOutput(fileName: string): string[] {
    const lines: string[] = [];
    
    lines.push(`Saving game at: ${fileName}...`);
    lines.push('');
    lines.push('💾 Save Point Activated!');
    lines.push('Type: Documentation Save Point');
    lines.push('');
    lines.push('[Save system not yet implemented]');
    lines.push('Your progress has been noted...');

    return lines;
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public getHelp(): string[] {
    return [
      'Usage: save <filename>',
      '',
      'Save game progress at a save point.',
      '',
      'Arguments:',
      '  filename    The name of the save point file',
      '',
      'Examples:',
      '  save readme.md       # Save at README save point',
      '  save notes.md        # Save at notes save point',
    ];
  }
}