import chalk from 'chalk';
import { Map } from '../world/map';
import { Location } from '../world/location';

export interface CommandResult {
  success: boolean;
  message: string;
}

export class NavigationCommands {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  pwd(): CommandResult {
    return {
      success: true,
      message: this.map.getCurrentPath(),
    };
  }

  ls(options?: string): CommandResult {
    try {
      const currentPath = this.map.getCurrentPath();
      const locations = this.map.getLocations(currentPath);

      if (locations.length === 0) {
        return {
          success: true,
          message: '(empty)',
        };
      }

      const includeHidden = options?.includes('a') || false;
      const showDetails = options?.includes('l') || false;

      const filteredLocations = includeHidden
        ? locations
        : locations.filter(loc => !loc.isHidden());

      if (showDetails) {
        const detailLines = filteredLocations.map(loc => {
          const type = loc.isDirectory() ? 'drw-r--r--' : '-rw-r--r--';
          const size = loc.isFile() ? '1024' : '4096';
          const name = loc.getName();
          return `${type} 1 user user ${size.padStart(8)} Jan 1 12:00 ${name}`;
        });
        return {
          success: true,
          message: detailLines.join('\n'),
        };
      } else {
        const names = filteredLocations.map(loc => loc.getName());
        return {
          success: true,
          message: names.join('  '),
        };
      }
    } catch {
      return {
        success: false,
        message: `ls: Cannot access '${this.map.getCurrentPath()}': No such file or directory`,
      };
    }
  }

  cd(path?: string): CommandResult {
    try {
      // 特別なパスの処理
      if (this.isSpecialPath(path)) {
        return this.handleSpecialPath(path);
      }

      // 通常のパス移動
      const result = this.map.navigateTo(path!);

      if (!result.success) {
        return this.createErrorResult(path!);
      }

      return {
        success: true,
        message: `${this.map.getCurrentPath()}`,
      };
    } catch {
      return {
        success: false,
        message: `cd: ${path}: No such file or directory`,
      };
    }
  }

  private isSpecialPath(path?: string): boolean {
    return !path || path === '~' || (path === '..' && this.map.getCurrentPath() === '/');
  }

  private handleSpecialPath(path?: string): CommandResult {
    if (!path || path === '~') {
      const result = this.map.navigateTo('/');
      return {
        success: result.success,
        message: result.success ? '' : result.error || 'Navigation failed',
      };
    }

    // ルートディレクトリから..への移動
    return {
      success: true,
      message: '/',
    };
  }

  private createErrorResult(path: string): CommandResult {
    const targetLocation = this.map.findLocation(this.map.resolvePath(path));

    if (targetLocation && targetLocation.isFile()) {
      return {
        success: false,
        message: `cd: ${path}: Not a directory`,
      };
    } else {
      return {
        success: false,
        message: `cd: ${path}: No such file or directory`,
      };
    }
  }
}

export class NavigationHandler {
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  /**
   * 現在のディレクトリパスを表示する (pwd コマンド)
   */
  pwd(): void {
    console.log(this.map.getCurrentPath());
  }

  /**
   * ディレクトリの内容を表示する (ls コマンド)
   */
  ls(args: string[] = []): void {
    const options = this.parseOptions(args);
    const targetPath = options.path || this.map.getCurrentPath();

    // ディレクトリの存在確認
    const listResult = this.map.listDirectory(targetPath);
    if (!listResult.success) {
      console.log(chalk.red(`ls: ${targetPath}: ${listResult.error}`));
      return;
    }

    // ファイル一覧を取得
    const locations = listResult.contents || [];
    const filteredLocations = options.showHidden
      ? locations
      : locations.filter(loc => !loc.isHidden());

    // 表示
    if (options.longFormat) {
      this.displayLongFormat(filteredLocations);
    } else {
      this.displayShortFormat(filteredLocations);
    }
  }

  /**
   * ディレクトリを移動する (cd コマンド)
   */
  cd(args: string[]): void {
    if (args.length === 0) {
      return; // 引数なしの場合は何もしない
    }

    const targetPath = args[0];
    const navigationResult = this.map.navigateTo(targetPath);

    if (navigationResult.success) {
      console.log(chalk.green(`Moved to ${this.map.getCurrentPath()}`));
    } else {
      console.log(chalk.red(`cd: ${targetPath}: ${navigationResult.error}`));
    }
  }

  /**
   * ディレクトリツリーを表示する (tree コマンド)
   */
  tree(args: string[] = []): void {
    const targetPath = args[0] || this.map.getCurrentPath();

    // ディレクトリの存在確認
    const location = this.map.findLocation(targetPath);
    if (!location) {
      console.log(chalk.red(`tree: ${targetPath}: No such file or directory`));
      return;
    }

    if (!location.isDirectory()) {
      console.log(chalk.red(`tree: ${targetPath}: Not a directory`));
      return;
    }

    // ツリー表示
    console.log(targetPath);
    this.displayTree(targetPath, '');
  }

  /**
   * lsコマンドのオプションを解析
   */
  private parseOptions(args: string[]): {
    showHidden: boolean;
    longFormat: boolean;
    path?: string;
  } {
    let showHidden = false;
    let longFormat = false;
    let path: string | undefined;

    for (const arg of args) {
      if (arg.startsWith('-')) {
        if (arg.includes('a')) showHidden = true;
        if (arg.includes('l')) longFormat = true;
      } else {
        path = arg;
      }
    }

    return { showHidden, longFormat, path };
  }

  /**
   * 短縮形式でファイル一覧を表示
   */
  private displayShortFormat(locations: Location[]): void {
    for (const location of locations) {
      const name = location.isDirectory() ? `${location.getName()}/` : location.getName();
      console.log(name);
    }
  }

  /**
   * 詳細形式でファイル一覧を表示
   */
  private displayLongFormat(locations: Location[]): void {
    for (const location of locations) {
      const permissions = location.isDirectory() ? 'drwxr-xr-x' : '-rw-r--r--';
      const type = location.isDirectory() ? 'DIR' : 'FILE';
      const explored = location.isExplored() ? '✓' : '?';
      const danger = this.formatDangerLevel(location.getDangerLevel());
      const name = location.isDirectory() ? `${location.getName()}/` : location.getName();

      console.log(`${permissions} ${type.padEnd(4)} ${explored} ${danger} ${name}`);
    }
  }

  /**
   * ツリー構造を再帰的に表示
   */
  private displayTree(path: string, prefix: string): void {
    const locations = this.map.getLocations(path);

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];
      const isLastItem = i === locations.length - 1;
      const currentPrefix = isLastItem ? '└── ' : '├── ';
      const name = location.isDirectory() ? `${location.getName()}/` : location.getName();

      console.log(prefix + currentPrefix + name);

      // ディレクトリの場合は再帰的に表示
      if (location.isDirectory()) {
        const nextPrefix = prefix + (isLastItem ? '    ' : '│   ');
        this.displayTree(location.getPath(), nextPrefix);
      }
    }
  }

  /**
   * 危険度レベルをフォーマット
   */
  private formatDangerLevel(level: number): string {
    if (level < 0.2) return chalk.green('SAFE');
    if (level < 0.5) return chalk.yellow('WARN');
    return chalk.red('DNGR');
  }
}
