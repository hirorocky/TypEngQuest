import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * openコマンド - 宝箱ファイルを開く
 */
export class OpenCommand extends BaseCommand {
  public name = 'open';
  public description = '宝箱ファイルを開く';

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
   * openコマンドを実行する
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

    // 宝箱ファイルかどうかを確認
    if (targetNode.fileType !== FileType.TREASURE) {
      return this.error(`${fileName} is not a treasure chest`);
    }

    // 宝箱を開くメッセージを生成
    const output = this.generateOpenOutput(fileName);
    return this.success(undefined, output);
  }

  /**
   * 宝箱を開く出力を生成する
   * @param fileName ファイル名
   * @returns 出力の配列
   */
  private generateOpenOutput(fileName: string): string[] {
    const lines: string[] = [];
    
    lines.push(`Opening treasure chest: ${fileName}...`);
    lines.push('');
    lines.push('📦 You found a treasure chest!');
    lines.push(`Type: ${this.getTreasureType(fileName)}`);
    lines.push('');
    lines.push('[Treasure system not yet implemented]');
    lines.push('The chest is empty for now...');

    return lines;
  }

  /**
   * ファイル名から宝箱タイプを取得する
   * @param fileName ファイル名
   * @returns 宝箱タイプ
   */
  private getTreasureType(fileName: string): string {
    const extension = this.getExtension(fileName);
    const typeMap: { [key: string]: string } = {
      '.json': 'Configuration Treasure',
      '.yaml': 'Configuration Treasure',
      '.yml': 'Configuration Treasure',
      '.toml': 'Configuration Treasure',
      '.ini': 'Settings Treasure',
      '.conf': 'Settings Treasure',
      '.cfg': 'Settings Treasure',
      '.xml': 'Data Treasure',
      '.properties': 'Properties Treasure',
      '.env': 'Environment Treasure',
    };

    return typeMap[extension] || 'Unknown Treasure';
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
      'Usage: open <filename>',
      '',
      'Open a treasure chest file.',
      '',
      'Arguments:',
      '  filename    The name of the treasure file to open',
      '',
      'Examples:',
      '  open config.json     # Open JSON configuration treasure',
      '  open settings.yaml   # Open YAML configuration treasure',
    ];
  }
}