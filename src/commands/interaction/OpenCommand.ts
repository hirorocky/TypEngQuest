import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';
import { ConsumableItem, EffectType } from '../../items/ConsumableItem';
import { ItemType, ItemRarity } from '../../items/Item';

/**
 * openコマンド - 宝箱ファイルを開く
 */
export class OpenCommand extends BaseCommand {
  public name = 'open';
  public description = 'open treasure chest file';

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

    const player = this.getPlayer(context);
    if (!player) {
      return this.error('player not available');
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

    // 作用済みかどうかを確認
    if (targetNode.isInteracted()) {
      return this.error(`${fileName} has already been opened`);
    }

    // アイテムを生成してインベントリに追加
    const item = this.generateItem(fileName);
    const inventory = player.getInventory();
    const added = inventory.addItem(item);

    if (!added) {
      return this.error('inventory is full');
    }

    // 作用済みフラグを設定
    targetNode.setInteracted(true);

    // 宝箱を開くメッセージを生成
    const output = this.generateOpenOutput(fileName, item);
    return this.success(undefined, output);
  }

  /**
   * 宝箱を開く出力を生成する
   * @param fileName ファイル名
   * @param item 生成されたアイテム
   * @returns 出力の配列
   */
  private generateOpenOutput(fileName: string, item: ConsumableItem): string[] {
    const lines: string[] = [];
    
    lines.push(`Opening treasure chest: ${fileName}...`);
    lines.push('');
    lines.push('📦 You found a treasure chest!');
    lines.push(`Type: ${this.getTreasureType(fileName)}`);
    lines.push('');
    lines.push(`✨ You obtained: ${item.getDisplayName()}`);
    lines.push(`   ${item.getDescription()}`);
    lines.push('');
    lines.push('The item has been added to your inventory.');

    return lines;
  }

  /**
   * アイテムを生成する
   * @param fileName ファイル名
   * @returns 生成されたアイテム
   */
  private generateItem(fileName: string): ConsumableItem {
    const itemId = `treasure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ファイル拡張子に基づいてアイテムタイプを決定
    const extension = this.getExtension(fileName);
    const isHPPotion = Math.random() < 0.5;
    
    if (isHPPotion) {
      return new ConsumableItem({
        id: itemId,
        name: 'Life Potion',
        description: 'Restores HP when consumed',
        type: ItemType.CONSUMABLE,
        rarity: this.getRandomRarity(),
        effects: [{ type: EffectType.HEAL_HP, value: this.getRandomHealValue() }],
      });
    } else {
      return new ConsumableItem({
        id: itemId,
        name: 'Mana Potion',
        description: 'Restores MP when consumed',
        type: ItemType.CONSUMABLE,
        rarity: this.getRandomRarity(),
        effects: [{ type: EffectType.HEAL_MP, value: this.getRandomHealValue() }],
      });
    }
  }

  /**
   * ランダムなレアリティを取得する
   * @returns レアリティ
   */
  private getRandomRarity(): ItemRarity {
    const rand = Math.random();
    if (rand < 0.6) return ItemRarity.COMMON;
    if (rand < 0.85) return ItemRarity.RARE;
    if (rand < 0.95) return ItemRarity.EPIC;
    return ItemRarity.LEGENDARY;
  }

  /**
   * ランダムな回復値を取得する
   * @returns 回復値
   */
  private getRandomHealValue(): number {
    return Math.floor(Math.random() * 50) + 25; // 25-74の範囲
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