import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * battleコマンド - モンスターファイルとバトルする
 */
export class BattleCommand extends BaseCommand {
  public name = 'battle';
  public description = 'モンスターファイルとバトルする';

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
   * battleコマンドを実行する
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

    // モンスターファイルかどうかを確認
    if (targetNode.fileType !== FileType.MONSTER) {
      return this.error(`${fileName} is not a monster file`);
    }

    // バトル開始のメッセージを生成
    const output = this.generateBattleOutput(fileName);
    return this.success(undefined, output);
  }

  /**
   * バトル出力を生成する
   * @param fileName ファイル名
   * @returns バトル出力の配列
   */
  private generateBattleOutput(fileName: string): string[] {
    const lines: string[] = [];
    
    lines.push(`Starting battle with ${fileName}...`);
    lines.push('');
    lines.push('⚔️  Monster encountered!');
    lines.push(`Type: ${this.getMonsterType(fileName)}`);
    lines.push('Level: ???');
    lines.push('');
    lines.push('[Battle system not yet implemented]');
    lines.push('The monster runs away...');

    return lines;
  }

  /**
   * ファイル名からモンスタータイプを取得する
   * @param fileName ファイル名
   * @returns モンスタータイプ
   */
  private getMonsterType(fileName: string): string {
    const extension = this.getExtension(fileName);
    const typeMap: { [key: string]: string } = {
      '.js': 'JavaScript Monster',
      '.ts': 'TypeScript Monster',
      '.py': 'Python Monster',
      '.java': 'Java Monster',
      '.cpp': 'C++ Monster',
      '.c': 'C Monster',
      '.go': 'Go Monster',
      '.rs': 'Rust Monster',
      '.rb': 'Ruby Monster',
      '.php': 'PHP Monster',
    };

    return typeMap[extension] || 'Unknown Monster';
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
      'Usage: battle <filename>',
      '',
      'Start battle with a monster file.',
      '',
      'Arguments:',
      '  filename    The name of the monster file to battle',
      '',
      'Examples:',
      '  battle script.js     # Battle with JavaScript monster',
      '  battle app.py        # Battle with Python monster',
    ];
  }
}