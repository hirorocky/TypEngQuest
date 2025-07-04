import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';
import { TreeNode } from '../../world/FileSystem';

/**
 * treeコマンド - ディレクトリ構造をツリー形式で表示する
 */
export class TreeCommand extends BaseCommand {
  public name = 'tree';
  public description = 'ディレクトリ構造をツリー形式で表示します';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const options = this.parseOptions(args);

    // treeオプションを設定
    const treeOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      maxDepth: this.getDepthOption(options),
    };

    // ツリーデータを取得
    const treeData = fileSystem.tree(treeOptions);

    // ツリー表示用の出力を生成
    const output = this.formatTreeOutput(treeData, treeOptions.showHidden);

    return this.success('ディレクトリツリー:', output);
  }

  /**
   * 深度オプションを取得する
   */
  private getDepthOption(options: {
    flags: string[];
    values: Record<string, string>;
    remaining: string[];
  }): number | undefined {
    // --depth または -d オプションから深度を取得
    const depthValue = options.values['depth'] || options.values['d'];
    if (depthValue) {
      const depth = parseInt(depthValue, 10);
      if (!isNaN(depth) && depth > 0) {
        return depth;
      }
    }
    return undefined; // 制限なし
  }

  /**
   * ツリー形式の出力をフォーマットする
   */
  private formatTreeOutput(treeNode: TreeNode, showHidden: boolean): string[] {
    const output: string[] = [];
    this.formatTreeNode(treeNode, '', true, { output, showHidden });
    return output;
  }

  /**
   * 単一のツリーノードをフォーマットする
   */
  private formatTreeNode(
    node: TreeNode,
    prefix: string,
    isLast: boolean,
    context: { output: string[]; showHidden: boolean }
  ): void {
    // ノード名の表示
    const connector = isLast ? '└── ' : '├── ';
    const displayName = this.getNodeDisplayName(node);
    context.output.push(prefix + connector + displayName);

    // 子ノードの処理
    if (node.children && node.children.length > 0) {
      let visibleChildren = node.children;

      // 隠しファイルのフィルタリング
      if (!context.showHidden) {
        visibleChildren = node.children.filter(child => !child.name.startsWith('.'));
      }

      const nextPrefix = prefix + (isLast ? '    ' : '│   ');

      visibleChildren.forEach((child, index) => {
        const isChildLast = index === visibleChildren.length - 1;
        this.formatTreeNode(child, nextPrefix, isChildLast, context);
      });
    }
  }

  /**
   * ノードの表示名を取得する
   */
  private getNodeDisplayName(node: TreeNode): string {
    let displayName = node.name;

    // ディレクトリには/を付加
    if (node.nodeType === 'directory') {
      displayName += '/';
    }

    // ファイルタイプに応じてアイコンを追加
    const icon = this.getFileTypeIcon(node.fileType);
    if (icon) {
      displayName += ` ${icon}`;
    }

    return displayName;
  }

  /**
   * ファイルタイプに応じたアイコンを取得する
   */
  private getFileTypeIcon(fileType?: string): string {
    switch (fileType) {
      case 'monster':
        return '⚔️'; // モンスターファイル
      case 'treasure':
        return '💰'; // 宝箱ファイル
      case 'save_point':
        return '💾'; // セーブポイント
      case 'event':
        return '🎭'; // イベントファイル
      case 'empty':
        return '📄'; // 空ファイル
      default:
        return ''; // ディレクトリや不明なタイプ
    }
  }

  public getHelp(): string[] {
    return [
      'tree [options] - ディレクトリ構造をツリー形式で表示します',
      '',
      'オプション:',
      '  -a, --all         隠しファイルも表示します',
      '  -d, --depth N     表示する最大深度を指定します',
      '',
      '例:',
      '  tree              # 現在のディレクトリのツリー表示',
      '  tree -a           # 隠しファイルも含めてツリー表示',
      '  tree -d 2         # 深度2までのツリー表示',
      '  tree --depth 3    # 深度3までのツリー表示',
      '  tree -a -d 2      # 隠しファイルも含めて深度2まで表示',
      '',
      'ファイルタイプアイコン:',
      '  ⚔️  モンスターファイル (.js, .ts, .py等)',
      '  💰 宝箱ファイル (.json, .yaml等)',
      '  💾 セーブポイント (.md)',
      '  🎭 イベントファイル (.exe, .bin等)',
      '  📄 空ファイル (その他)',
    ];
  }
}
