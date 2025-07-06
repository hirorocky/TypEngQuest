import { BaseCommand, CommandContext } from '../BaseCommand';
import { CommandResult } from '../../core/types';
import { TreeNode } from '../../world/FileSystem';

/**
 * tree コマンド - ディレクトリツリー構造を表示
 */
export class TreeCommand extends BaseCommand {
  public name = 'tree';
  public description = 'display directory tree structure';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const options = this.parseOptions(args);

    // ツリーオプションを設定
    const treeOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      maxDepth: this.getDepthOption(options),
    };

    // ツリーデータを取得
    const treeData = fileSystem.tree(treeOptions);

    // ツリー出力を生成
    const output = this.formatTreeOutput(treeData, treeOptions.showHidden);

    return this.success('directory tree:', output);
  }

  /**
   * 深度オプションを取得
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
   * ツリー出力をフォーマット
   */
  private formatTreeOutput(treeNode: TreeNode, showHidden: boolean): string[] {
    const output: string[] = [];
    this.formatTreeNode(treeNode, '', true, { output, showHidden });
    return output;
  }

  /**
   * 単一のツリーノードをフォーマット
   */
  private formatTreeNode(
    node: TreeNode,
    prefix: string,
    isLast: boolean,
    context: { output: string[]; showHidden: boolean }
  ): void {
    // ノード名を表示
    const connector = isLast ? '└── ' : '├── ';
    const displayName = this.getNodeDisplayName(node);
    context.output.push(prefix + connector + displayName);

    // 子ノードを処理
    if (node.children && node.children.length > 0) {
      let visibleChildren = node.children;

      // 隠しファイルをフィルタ
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
   * ノード表示名を取得
   */
  private getNodeDisplayName(node: TreeNode): string {
    let displayName = node.name;

    // ディレクトリに / を追加
    if (node.nodeType === 'directory') {
      displayName += '/';
    }

    // ファイルタイプに基づいてアイコンを追加
    const icon = this.getFileTypeIcon(node.fileType);
    if (icon) {
      displayName += ` ${icon}`;
    }

    return displayName;
  }

  /**
   * ファイルタイプに基づいてアイコンを取得
   */
  private getFileTypeIcon(fileType?: string): string {
    switch (fileType) {
      case 'monster':
        return '⚔️'; // モンスターファイル
      case 'treasure':
        return '💰'; // 宝物ファイル
      case 'save_point':
        return '💾'; // セーブポイント
      case 'event':
        return '🎭'; // イベントファイル
      case 'empty':
        return '📄'; // 空のファイル
      default:
        return ''; // ディレクトリまたは不明なタイプ
    }
  }

  public getHelp(): string[] {
    return [
      'tree [options] - display directory tree structure',
      '',
      'options:',
      '  -a, --all         show hidden files',
      '  -d, --depth N     specify maximum depth to display',
      '',
      'examples:',
      '  tree              # display tree of current directory',
      '  tree -a           # display tree including hidden files',
      '  tree -d 2         # display tree up to depth 2',
      '  tree --depth 3    # display tree up to depth 3',
      '  tree -a -d 2      # show hidden files up to depth 2',
      '',
      'file type icons:',
      '  ⚔️  monster files (.js, .ts, .py etc)',
      '  💰 treasure files (.json, .yaml etc)',
      '  💾 save points (.md)',
      '  🎭 event files (.exe, .bin etc)',
      '  📄 empty files (others)',
    ];
  }
}
