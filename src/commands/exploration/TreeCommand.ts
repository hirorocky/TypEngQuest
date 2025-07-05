import { BaseCommand, CommandResult, CommandContext } from '../BaseCommand';
import { TreeNode } from '../../world/FileSystem';

/**
 * tree command - display directory tree structure
 */
export class TreeCommand extends BaseCommand {
  public name = 'tree';
  public description = 'display directory tree structure';

  protected executeInternal(args: string[], context: CommandContext): CommandResult {
    const fileSystem = this.getFileSystem(context) as any;
    const options = this.parseOptions(args);

    // set tree options
    const treeOptions = {
      showHidden: options.flags.includes('a') || options.flags.includes('all'),
      maxDepth: this.getDepthOption(options),
    };

    // get tree data
    const treeData = fileSystem.tree(treeOptions);

    // generate tree output
    const output = this.formatTreeOutput(treeData, treeOptions.showHidden);

    return this.success('directory tree:', output);
  }

  /**
   * get depth option
   */
  private getDepthOption(options: {
    flags: string[];
    values: Record<string, string>;
    remaining: string[];
  }): number | undefined {
    // get depth from --depth or -d option
    const depthValue = options.values['depth'] || options.values['d'];
    if (depthValue) {
      const depth = parseInt(depthValue, 10);
      if (!isNaN(depth) && depth > 0) {
        return depth;
      }
    }
    return undefined; // no limit
  }

  /**
   * format tree output
   */
  private formatTreeOutput(treeNode: TreeNode, showHidden: boolean): string[] {
    const output: string[] = [];
    this.formatTreeNode(treeNode, '', true, { output, showHidden });
    return output;
  }

  /**
   * format single tree node
   */
  private formatTreeNode(
    node: TreeNode,
    prefix: string,
    isLast: boolean,
    context: { output: string[]; showHidden: boolean }
  ): void {
    // display node name
    const connector = isLast ? '└── ' : '├── ';
    const displayName = this.getNodeDisplayName(node);
    context.output.push(prefix + connector + displayName);

    // process child nodes
    if (node.children && node.children.length > 0) {
      let visibleChildren = node.children;

      // filter hidden files
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
   * get node display name
   */
  private getNodeDisplayName(node: TreeNode): string {
    let displayName = node.name;

    // add / to directories
    if (node.nodeType === 'directory') {
      displayName += '/';
    }

    // add icon based on file type
    const icon = this.getFileTypeIcon(node.fileType);
    if (icon) {
      displayName += ` ${icon}`;
    }

    return displayName;
  }

  /**
   * get icon based on file type
   */
  private getFileTypeIcon(fileType?: string): string {
    switch (fileType) {
      case 'monster':
        return '⚔️'; // monster file
      case 'treasure':
        return '💰'; // treasure file
      case 'save_point':
        return '💾'; // save point
      case 'event':
        return '🎭'; // event file
      case 'empty':
        return '📄'; // empty file
      default:
        return ''; // directory or unknown type
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
