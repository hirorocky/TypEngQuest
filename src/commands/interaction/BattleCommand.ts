import { BaseCommand, CommandContext, ValidationResult } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { FileType } from '../../world/FileNode';

/**
 * battleコマンド - モンスターファイルとバトルする
 */
export class BattleCommand extends BaseCommand {
  public name = 'battle';
  public description = 'start battle with monster file';

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

    // 実際の戦闘フェーズに移行
    return {
      success: true,
      message: `Starting battle with ${fileName}...`,
      nextPhase: 'battle',
      data: {
        enemy: this.createEnemyFromFile(fileName, targetNode),
      },
    };
  }

  /**
   * ファイルから敵を生成する
   * @param fileName ファイル名
   * @param fileNode ファイルノード
   * @returns 敵オブジェクト
   */
  private createEnemyFromFile(fileName: string, _fileNode: any): any {
    const extension = this.getExtension(fileName);
    const monsterType = this.getMonsterType(fileName);
    
    // ファイル名とタイプから敵の基本情報を生成
    const baseLevel = 1; // 後でファイルサイズや階層から決定可能
    const stats = this.generateEnemyStats(extension, baseLevel);
    
    return {
      id: `file_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: `${monsterType.replace(' Monster', '')} Beast`,
      description: `A ${monsterType.toLowerCase()} lurking in ${fileName}`,
      level: baseLevel,
      stats: stats,
      skills: this.generateEnemySkills(extension),
      drops: this.generateEnemyDrops(extension),
    };
  }

  /**
   * 拡張子に基づいて敵のステータスを生成
   */
  private generateEnemyStats(extension: string, level: number): any {
    const baseStats = {
      maxHp: 30 + (level * 10),
      maxMp: 10 + (level * 5),
      strength: 8 + level,
      willpower: 6 + level,
      agility: 7 + level,
      fortune: 5 + level,
    };

    // 拡張子による特性調整
    const adjustments: { [key: string]: Partial<typeof baseStats> } = {
      '.js': { strength: -1, agility: +2 },
      '.ts': { willpower: +2, strength: +1 },
      '.py': { willpower: +1, fortune: +1 },
      '.java': { strength: +1, maxHp: +10 },
      '.cpp': { strength: +2, maxHp: +5 },
      '.html': { agility: +1, fortune: +2 },
    };

    const adjustment = adjustments[extension] || {};
    return { ...baseStats, ...adjustment };
  }

  /**
   * 拡張子に基づいて敵のスキルを生成
   */
  private generateEnemySkills(extension: string): any[] {
    const baseSkills = [
      {
        name: 'syntax_error',
        actionCost: 1,
        mpCost: 3,
        difficulty: 2,
        effects: [{ type: 'damage', value: 8 }],
      },
    ];

    // 拡張子による特殊スキル
    const specialSkills: { [key: string]: any } = {
      '.js': {
        name: 'callback_hell',
        actionCost: 2,
        mpCost: 5,
        difficulty: 3,
        effects: [{ type: 'damage', value: 12 }],
      },
      '.py': {
        name: 'indentation_error',
        actionCost: 1,
        mpCost: 4,
        difficulty: 2,
        effects: [{ type: 'damage', value: 10 }],
      },
      '.html': {
        name: 'tag_mismatch',
        actionCost: 1,
        mpCost: 3,
        difficulty: 1,
        effects: [{ type: 'damage', value: 6 }],
      },
    };

    if (specialSkills[extension]) {
      baseSkills.push(specialSkills[extension]);
    }

    return baseSkills;
  }

  /**
   * 拡張子に基づいて敵のドロップアイテムを生成
   */
  private generateEnemyDrops(_extension: string): any[] {
    return [
      {
        item: 'Code Fragment',
        probability: 0.7,
        quantity: 1,
      },
      {
        item: 'Debug Token',
        probability: 0.3,
        quantity: 1,
      },
    ];
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
      '.html': 'HTML Monster',
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
