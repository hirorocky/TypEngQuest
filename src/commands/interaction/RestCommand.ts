import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * restコマンド - セーブポイントでHP/MPを回復する
 */
export class RestCommand extends BaseCommand {
  public name = 'rest';
  public description = 'セーブポイントでHP/MPを回復する';

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
   * restコマンドを実行する
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

    // 休息処理のメッセージを生成
    const output = this.generateRestOutput(fileName);
    return this.success(undefined, output);
  }

  /**
   * 休息出力を生成する
   * @param fileName ファイル名
   * @returns 出力の配列
   */
  private generateRestOutput(fileName: string): string[] {
    const lines: string[] = [];
    
    lines.push(`Resting at: ${fileName}...`);
    lines.push('');
    lines.push('🛏️  Peaceful Rest!');
    lines.push('Type: Documentation Rest Area');
    lines.push('');
    lines.push('[HP/MP system not yet implemented]');
    lines.push('You feel refreshed...');

    return lines;
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public getHelp(): string[] {
    return [
      'Usage: rest <filename>',
      '',
      'Recover HP/MP at a save point.',
      '',
      'Arguments:',
      '  filename    The name of the save point file',
      '',
      'Examples:',
      '  rest readme.md       # Rest at README save point',
      '  rest notes.md        # Rest at notes save point',
    ];
  }
}