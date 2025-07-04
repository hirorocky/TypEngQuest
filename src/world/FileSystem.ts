/**
 * ファイルシステムのナビゲーション結果
 */
export interface NavigationResult {
  success: boolean;
  error?: string;
}

/**
 * ファイル一覧の取得オプション
 */
export interface ListOptions {
  showHidden?: boolean; // 隠しファイルを表示
  detailed?: boolean; // 詳細情報を表示
  path?: string; // 指定パスの一覧取得
}

/**
 * ファイル一覧の取得結果
 */
export interface ListResult {
  success: boolean;
  files?: FileNode[];
  error?: string;
}

/**
 * ツリー表示のオプション
 */
export interface TreeOptions {
  maxDepth?: number; // 最大深度
  showHidden?: boolean; // 隠しファイルを表示
}

/**
 * ツリー表示用のノードデータ
 */
export interface TreeNode {
  name: string;
  nodeType: string;
  fileType?: string;
  children?: TreeNode[];
}

import { FileNode, NodeType } from './FileNode';

/**
 * ゲーム内ファイルシステムの管理クラス
 * ディレクトリツリー構造の管理とナビゲーション機能を提供
 */
export class FileSystem {
  public root: FileNode;
  public currentNode: FileNode;

  /**
   * FileSystemインスタンスを作成する
   * @param root ルートディレクトリノード
   */
  constructor(root: FileNode) {
    if (!root.isDirectory()) {
      throw new Error('ルートノードはディレクトリである必要があります');
    }

    this.root = root;
    this.currentNode = root;
  }

  /**
   * 現在の位置を取得する
   * @returns 現在位置の絶対パス
   */
  public pwd(): string {
    return this.currentNode.getPath();
  }

  /**
   * ディレクトリを移動する
   * @param path 移動先のパス（相対パス・絶対パス・特殊パス対応）
   * @returns 移動結果
   */
  public cd(path?: string): NavigationResult {
    // 引数なしまたは ~ の場合はルートへ移動
    if (!path || path === '~') {
      this.currentNode = this.root;
      return { success: true };
    }

    // .. の場合は親ディレクトリへ移動
    if (path === '..') {
      if (this.currentNode === this.root) {
        return {
          success: false,
          error: 'ルートディレクトリより上には移動できません',
        };
      }
      this.currentNode = this.currentNode.parent!;
      return { success: true };
    }

    // パスを解決してノードを取得
    const targetNode = this.getNodeByPath(path);
    if (!targetNode) {
      return {
        success: false,
        error: `ディレクトリが見つかりません: ${path}`,
      };
    }

    if (!targetNode.isDirectory()) {
      return {
        success: false,
        error: `${path} はディレクトリではありません`,
      };
    }

    this.currentNode = targetNode;
    return { success: true };
  }

  /**
   * ファイル・ディレクトリの一覧を取得する
   * @param options 取得オプション
   * @returns ファイル一覧
   */
  public ls(options: ListOptions = {}): ListResult {
    let targetNode = this.currentNode;

    // 指定パスがある場合はそのノードを取得
    if (options.path) {
      const node = this.getNodeByPath(options.path);
      if (!node) {
        return {
          success: false,
          error: `パスが見つかりません: ${options.path}`,
        };
      }

      if (!node.isDirectory()) {
        return {
          success: false,
          error: `${options.path} はディレクトリではありません`,
        };
      }

      targetNode = node;
    }

    // ファイル一覧を取得
    let files = [...targetNode.children];

    // 隠しファイルのフィルタリング
    if (!options.showHidden) {
      files = files.filter(file => !file.isHidden);
    }

    // ソート（ディレクトリ優先、その後名前順）
    files.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, files };
  }

  /**
   * ファイル・ディレクトリを検索する
   * @param searchTerm 検索語（部分一致、大文字小文字区別なし）
   * @returns マッチしたノードの配列
   */
  public find(searchTerm: string): FileNode[] {
    const results: FileNode[] = [];
    const searchTermLower = searchTerm.toLowerCase();

    const searchRecursively = (node: FileNode) => {
      // 現在のノードが検索語に一致するかチェック
      if (node.name.toLowerCase().includes(searchTermLower)) {
        results.push(node);
      }

      // 子ノードを再帰的に検索
      node.children.forEach(searchRecursively);
    };

    searchRecursively(this.root);
    return results;
  }

  /**
   * パス文字列からノードを取得する
   * @param path パス文字列（絶対パス・相対パス・特殊パス対応）
   * @returns ノード、見つからない場合はnull
   */
  public getNodeByPath(path: string): FileNode | null {
    if (!path) return null;

    // 特殊パス処理
    if (path === '~') {
      return this.root;
    }

    // ~ で始まる場合の処理
    if (path.startsWith('~/')) {
      return this.resolveHomePath(path.substring(2));
    }

    // 通常のパス処理
    return this.resolveRegularPath(path);
  }

  /**
   * ホームパス（~/ で始まるパス）を解決する
   * @param relativePath ~ を除いた相対パス
   * @returns ノード、見つからない場合はnull
   */
  private resolveHomePath(relativePath: string): FileNode | null {
    const normalizedPath = this.normalizePath(relativePath);
    const pathParts = normalizedPath.split('/').filter(part => part !== '');
    return this.traversePathParts(this.root, pathParts);
  }

  /**
   * 通常のパス（絶対パス・相対パス）を解決する
   * @param path パス文字列
   * @returns ノード、見つからない場合はnull
   */
  private resolveRegularPath(path: string): FileNode | null {
    const normalizedPath = this.normalizePath(path);
    const pathParts = normalizedPath.split('/').filter(part => part !== '');

    let currentNode: FileNode;

    // 絶対パスか相対パスかを判定
    if (path.startsWith('/')) {
      currentNode = this.root;
      // ルートディレクトリ名をスキップ
      if (pathParts[0] === this.root.name) {
        pathParts.shift();
      }
    } else {
      currentNode = this.currentNode;
    }

    return this.traversePathParts(currentNode, pathParts);
  }

  /**
   * パス要素を順次辿ってノードを取得する
   * @param startNode 開始ノード
   * @param pathParts パス要素の配列
   * @returns ノード、見つからない場合はnull
   */
  private traversePathParts(startNode: FileNode, pathParts: string[]): FileNode | null {
    let currentNode: FileNode | null = startNode;

    for (const part of pathParts) {
      currentNode = this.processPathPart(currentNode, part);
      if (!currentNode) {
        return null;
      }
    }

    return currentNode;
  }

  /**
   * 単一のパス要素を処理する
   * @param currentNode 現在のノード
   * @param part パス要素
   * @returns 処理後のノード、見つからない場合はnull
   */
  private processPathPart(currentNode: FileNode | null, part: string): FileNode | null {
    if (!currentNode) return null;
    if (part === '.') {
      return currentNode; // カレントディレクトリ
    }

    if (part === '..') {
      // 親ディレクトリ（ルートより上には行けない）
      return currentNode.parent || currentNode;
    }

    // 子ノードを検索
    return currentNode.findChild(part) || null;
  }

  /**
   * パス文字列を正規化する
   * @param path 正規化するパス
   * @returns 正規化されたパス
   */
  private normalizePath(path: string): string {
    // 連続するスラッシュを単一に
    return path.replace(/\/+/g, '/');
  }

  /**
   * ツリー表示用のデータを生成する
   * @param options ツリー表示オプション
   * @returns ツリーデータ
   */
  public tree(options: TreeOptions = {}): TreeNode {
    const createTreeNode = (node: FileNode, currentDepth: number): TreeNode => {
      const treeNode: TreeNode = {
        name: node.name,
        nodeType: node.nodeType,
        fileType: node.fileType,
      };

      // 深度制限チェック（子ノードを含むかどうかを決定）
      const includeChildren = !options.maxDepth || currentDepth < options.maxDepth;

      // 子ノードの処理
      if (node.isDirectory() && includeChildren) {
        let children = [...node.children];

        // 隠しファイルのフィルタリング
        if (!options.showHidden) {
          children = children.filter(child => !child.isHidden);
        }

        // ソート
        children.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });

        treeNode.children = children.map(child => createTreeNode(child, currentDepth + 1));
      } else if (node.isDirectory()) {
        // 深度制限により子ノードは含まれないが、空の配列を設定
        treeNode.children = [];
      }

      return treeNode;
    };

    return createTreeNode(this.currentNode, 0);
  }

  /**
   * テスト用のファイルシステム構造を作成する
   * @returns テスト用FileSystemインスタンス
   */
  public static createTestStructure(): FileSystem {
    const root = new FileNode('projects', NodeType.DIRECTORY);

    // game-studio ディレクトリ
    const gameStudio = new FileNode('game-studio', NodeType.DIRECTORY);
    const src = new FileNode('src', NodeType.DIRECTORY);
    const config = new FileNode('config', NodeType.DIRECTORY);
    const docs = new FileNode('docs', NodeType.DIRECTORY);

    // ファイル
    const mainJs = new FileNode('main.js', NodeType.FILE);
    const utilsTs = new FileNode('utils.ts', NodeType.FILE);
    const hiddenPy = new FileNode('.hidden.py', NodeType.FILE);
    const configJson = new FileNode('config.json', NodeType.FILE);
    const settingsYaml = new FileNode('settings.yaml', NodeType.FILE);
    const readmeMd = new FileNode('README.md', NodeType.FILE);
    const buildExe = new FileNode('build.exe', NodeType.FILE);

    // 階層構造を作成
    root.addChild(gameStudio);

    gameStudio.addChild(src);
    gameStudio.addChild(config);
    gameStudio.addChild(docs);
    gameStudio.addChild(readmeMd);
    gameStudio.addChild(buildExe);

    src.addChild(mainJs);
    src.addChild(utilsTs);
    src.addChild(hiddenPy);

    config.addChild(configJson);
    config.addChild(settingsYaml);

    // tech-startup ディレクトリ
    const techStartup = new FileNode('tech-startup', NodeType.DIRECTORY);
    const api = new FileNode('api', NodeType.DIRECTORY);
    const tests = new FileNode('tests', NodeType.DIRECTORY);

    const serverJs = new FileNode('server.js', NodeType.FILE);
    const routesTs = new FileNode('routes.ts', NodeType.FILE);
    const packageJson = new FileNode('package.json', NodeType.FILE);
    const testJs = new FileNode('test.js', NodeType.FILE);

    root.addChild(techStartup);

    techStartup.addChild(api);
    techStartup.addChild(tests);
    techStartup.addChild(packageJson);

    api.addChild(serverJs);
    api.addChild(routesTs);

    tests.addChild(testJs);

    return new FileSystem(root);
  }
}
