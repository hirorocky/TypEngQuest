import { Map } from '../world/map';
import { ElementManager } from '../world/elements';
import { LocationType, ElementType, Element } from '../world/location';

/**
 * コマンド実行結果の型定義
 */
export interface CommandResult {
  success: boolean;
  output: string;
}

/**
 * ファイル調査コマンドクラス - file, cat, head コマンドによる段階的ファイル発見システム
 */
export class FileInvestigationCommands {
  private map: Map;
  private elementManager: ElementManager;

  constructor(map: Map, elementManager: ElementManager) {
    this.map = map;
    this.elementManager = elementManager;
  }

  /**
   * fileコマンド - ファイルタイプ調査と要素のヒント表示
   * @param filename - 調査するファイル名
   * @returns コマンド実行結果
   */
  file(filename: string): CommandResult {
    const validationResult = this.validateFileInput(filename);
    if (!validationResult.success) {
      return validationResult;
    }

    const resolvedPath = this.map.resolvePath(filename);
    const location = this.map.findLocation(resolvedPath);
    if (!location) {
      return {
        success: false,
        output: `file: ${filename}: No such file or directory`,
      };
    }

    if (location.getType() === LocationType.DIRECTORY) {
      return {
        success: false,
        output: `file: ${filename}: Is a directory`,
      };
    }

    const fileType = this.getFileTypeDescription(location);
    const dangerText = this.getDangerLevelText(location.getDangerLevel());
    const potentialText = this.getPotentialElementsText(location);

    return {
      success: true,
      output: `${filename}: ${fileType} (Danger: ${dangerText}, Potential: ${potentialText})`,
    };
  }

  /**
   * catコマンド - ファイル内容表示と要素の確定・配置
   * @param filename - 内容を表示するファイル名
   * @returns コマンド実行結果
   */
  cat(filename: string): CommandResult {
    if (!filename.trim()) {
      return {
        success: false,
        output: 'Usage: cat <filename>',
      };
    }

    const resolvedPath = this.map.resolvePath(filename);
    const location = this.map.findLocation(resolvedPath);
    if (!location) {
      return {
        success: false,
        output: `cat: ${filename}: No such file or directory`,
      };
    }

    if (location.getType() === LocationType.DIRECTORY) {
      return {
        success: false,
        output: `cat: ${filename}: Is a directory`,
      };
    }

    // 既に探索済みの場合
    if (location.isExplored()) {
      let output = `File contents of ${filename} (already explored):\n`;

      if (location.hasElement()) {
        const element = location.getElement()!;
        output += this.formatElementDescription(element);
      } else {
        output += 'The file contains standard code with nothing unusual.';
      }

      return {
        success: true,
        output,
      };
    }

    // 新規探索: 要素生成と配置
    location.markExplored();
    const element = this.elementManager.generateElement(location);

    if (element) {
      location.setElement(element.type, element.data);
    }

    let output = `File contents of ${filename}:\n`;

    if (element) {
      output += this.formatElementDescription(element);
    } else {
      output += 'The file contains standard code with nothing unusual.';
    }

    return {
      success: true,
      output,
    };
  }

  /**
   * headコマンド - ファイル先頭部分表示（軽量調査）
   * @param filename - 先頭を表示するファイル名
   * @returns コマンド実行結果
   */
  head(filename: string): CommandResult {
    const validationResult = this.validateFileInput(filename);
    if (!validationResult.success) {
      return {
        success: false,
        output: validationResult.output.replace('Usage: file', 'Usage: head'),
      };
    }

    const resolvedPath = this.map.resolvePath(filename);
    const location = this.map.findLocation(resolvedPath);
    if (!location) {
      return {
        success: false,
        output: `head: ${filename}: No such file or directory`,
      };
    }

    if (location.getType() === LocationType.DIRECTORY) {
      return {
        success: false,
        output: `head: ${filename}: Is a directory`,
      };
    }

    const output = this.generateHeadOutput(filename, location);

    return {
      success: true,
      output,
    };
  }

  /**
   * 要素の説明文を生成する
   * @param element - 要素情報
   * @returns 要素の説明文
   */
  private formatElementDescription(element: Element): string {
    switch (element.type) {
      case ElementType.MONSTER:
        return (
          `File contents reveal a ${element.data.name} lurking inside!\n` +
          `Health: ${element.data.health}, Attack: ${element.data.attack}`
        );

      case ElementType.TREASURE:
        return (
          `File contents reveal a treasure chest!\n` +
          `Rarity: ${element.data.rarity}\n` +
          `Contents: ${(element.data.contents as string[]).join(', ')}`
        );

      case ElementType.RANDOM_EVENT:
        return (
          `File contents trigger a random event!\n` +
          `Event: ${element.data.description} (${element.data.eventType})`
        );

      case ElementType.SAVE_POINT:
        return (
          `File contents reveal a save point: ${element.data.name}!\n` +
          `Restoration: ${element.data.healthRestore} HP, ${element.data.manaRestore} MP`
        );

      default:
        return 'File contents contain something unusual...';
    }
  }

  /**
   * ファイル入力の検証
   * @param filename - ファイル名
   * @returns 検証結果
   */
  private validateFileInput(filename: string): CommandResult {
    if (!filename.trim()) {
      return {
        success: false,
        output: 'Usage: file <filename>',
      };
    }
    return { success: true, output: '' };
  }

  /**
   * ファイルタイプの説明を取得
   * @param location - 場所情報
   * @returns ファイルタイプの説明
   */
  private getFileTypeDescription(location: any): string {
    const extension = location.getFileExtension().toLowerCase();
    const isHidden = location.isHidden();

    const typeMap: { [key: string]: string } = {
      '.js': 'JavaScript source code',
      '.ts': 'TypeScript source code',
      '.py': 'Python script',
      '.json': 'JSON configuration file',
      '.md': 'Markdown document',
      '.txt': 'text file',
      '.exe': 'executable file',
      '.bin': 'binary file',
    };

    if (typeMap[extension]) {
      return typeMap[extension];
    }
    if (isHidden) {
      return 'hidden configuration file';
    }
    return 'unknown file';
  }

  /**
   * 危険度レベルのテキストを取得
   * @param dangerLevel - 危険度（0-1）
   * @returns 危険度テキスト
   */
  private getDangerLevelText(dangerLevel: number): string {
    if (dangerLevel > 0.7) return 'High';
    if (dangerLevel > 0.4) return 'Medium';
    return 'Low';
  }

  /**
   * 潜在要素のテキストを取得
   * @param location - 場所情報
   * @returns 潜在要素テキスト
   */
  private getPotentialElementsText(location: any): string {
    const probabilities = this.elementManager.getElementProbabilities(location);
    const potentials: string[] = [];

    if (probabilities.monster > 40) potentials.push('Monster');
    if (probabilities.treasure > 20) potentials.push('Treasure');
    if (probabilities.randomEvent > 30) potentials.push('Event');
    if (probabilities.savePoint > 20) potentials.push('Save Point');

    return potentials.length > 0 ? potentials.join('/') : 'Unknown';
  }

  /**
   * headコマンドの出力を生成
   * @param filename - ファイル名
   * @param location - 場所情報
   * @returns 出力文字列
   */
  private generateHeadOutput(filename: string, location: any): string {
    const extension = location.getFileExtension().toLowerCase();
    const dangerLevel = location.getDangerLevel();
    const probabilities = this.elementManager.getElementProbabilities(location);

    let output = `First few lines of ${filename}:\n`;
    output += this.getFileContentPreview(extension, probabilities);
    output += this.getDangerWarning(dangerLevel);

    return output;
  }

  /**
   * ファイル内容のプレビューを取得
   * @param extension - ファイル拡張子
   * @param probabilities - 要素確率
   * @returns プレビュー文字列
   */
  private getFileContentPreview(extension: string, probabilities: any): string {
    const previews: { [key: string]: () => string } = {
      '.js': () => this.getJavaScriptPreview(probabilities),
      '.ts': () => this.getJavaScriptPreview(probabilities),
      '.py': () => this.getPythonPreview(probabilities),
      '.json': () => this.getJsonPreview(probabilities),
      '.md': () => this.getMarkdownPreview(probabilities),
    };

    return previews[extension] ? previews[extension]() : 'File header information...\n';
  }

  /**
   * JavaScript/TypeScriptプレビューを取得
   */
  private getJavaScriptPreview(probabilities: any): string {
    let preview = '// Import statements and function declarations...\n';
    if (probabilities.monster > 50) {
      preview += 'Lines suggest potential syntax complications.';
    }
    return preview;
  }

  /**
   * Pythonプレビューを取得
   */
  private getPythonPreview(probabilities: any): string {
    let preview = '# -*- coding: utf-8 -*-\nimport ...\n';
    if (probabilities.monster > 50) {
      preview += 'Code structure hints at possible runtime issues.';
    }
    return preview;
  }

  /**
   * JSONプレビューを取得
   */
  private getJsonPreview(probabilities: any): string {
    let preview = '{\n  "name": "...",\n  "version": "..."\n';
    if (probabilities.treasure > 20) {
      preview += 'Configuration might contain valuable dependencies.';
    }
    return preview;
  }

  /**
   * Markdownプレビューを取得
   */
  private getMarkdownPreview(probabilities: any): string {
    let preview = '# Documentation\n\nThis file contains...\n';
    if (probabilities.savePoint > 20) {
      preview += 'Documentation suggests helpful information ahead.';
    }
    return preview;
  }

  /**
   * 危険度警告を取得
   * @param dangerLevel - 危険度
   * @returns 警告文字列
   */
  private getDangerWarning(dangerLevel: number): string {
    if (dangerLevel > 0.6) {
      return '\nWarning: File structure suggests high-risk content.';
    }
    if (dangerLevel > 0.3) {
      return '\nNote: File might contain moderate challenges.';
    }
    return '';
  }
}
