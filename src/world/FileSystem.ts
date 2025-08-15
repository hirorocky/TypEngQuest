import { createTestFileSystem } from '../test-utils/createTestFileSystem';

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

import { FileNode, NodeType, FileType } from './FileNode';
import { DomainData, getRandomDirectoryName, getRandomFileName } from './domains';

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
      throw new Error('root node must be a directory');
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
          error: 'cannot change directory above root',
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
        error: `no such directory: ${path}`,
      };
    }

    if (!targetNode.isDirectory()) {
      return {
        success: false,
        error: `${path}: not a directory`,
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
          error: `no such path: ${options.path}`,
        };
      }

      if (!node.isDirectory()) {
        return {
          success: false,
          error: `${options.path}: not a directory`,
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
   * 指定されたドメインとレベルでファイルシステムを生成する
   * @param domain ドメインデータ
   * @param level ワールドレベル
   * @returns 生成されたファイルシステム
   * @throws {Error} 無効なドメインまたはレベルの場合
   */
  public static generateFileSystem(domain: DomainData, level: number): FileSystem {
    if (!domain) {
      throw new Error('ドメインデータが必要です');
    }

    if (level < 1) {
      throw new Error('ワールドレベルは1以上である必要があります');
    }

    const maxDepth = Math.min(3 + level, 10);
    const root = new FileNode(domain.name, NodeType.DIRECTORY);
    const fileSystem = new FileSystem(root);

    // ルートの下にディレクトリ構造を生成
    FileSystem.generateDirectoryStructure(root, domain, 1, maxDepth);

    return fileSystem;
  }

  /**
   * ディレクトリ構造を再帰的に生成する
   * @param parentNode 親ディレクトリノード
   * @param domain ドメインデータ
   * @param currentDepth 現在の深度
   * @param maxDepth 最大深度
   */
  private static generateDirectoryStructure(
    parentNode: FileNode,
    domain: DomainData,
    currentDepth: number,
    maxDepth: number
  ): void {
    if (currentDepth >= maxDepth) {
      return;
    }

    // 各深度でのディレクトリ数を決定（深くなるほど少なく）
    const dirCount = Math.max(1, Math.ceil(Math.random() * (4 - currentDepth)));

    for (let i = 0; i < dirCount; i++) {
      const dirName = getRandomDirectoryName(domain, currentDepth);
      const dirNode = new FileNode(dirName, NodeType.DIRECTORY);
      parentNode.addChild(dirNode);

      // 各ディレクトリにファイルを追加
      FileSystem.generateFiles(dirNode, domain, currentDepth);

      // 再帰的に子ディレクトリを生成
      if (currentDepth + 1 < maxDepth && Math.random() < 0.7) {
        FileSystem.generateDirectoryStructure(dirNode, domain, currentDepth + 1, maxDepth);
      }
    }
  }

  /**
   * 指定されたディレクトリにファイルを生成する
   * @param parentNode 親ディレクトリノード
   * @param domain ドメインデータ
   * @param depth 現在の深度
   */
  private static generateFiles(parentNode: FileNode, domain: DomainData, depth: number): void {
    // 各ファイルタイプを最低1つずつ、最大3つまで生成
    const fileTypes: ('monster' | 'treasure' | 'event' | 'savepoint')[] = [
      'monster',
      'treasure',
      'event',
      'savepoint',
    ];

    fileTypes.forEach(fileType => {
      const fileCount = Math.max(1, Math.ceil(Math.random() * 3));

      for (let i = 0; i < fileCount; i++) {
        const fileName = getRandomFileName(domain, fileType, depth);
        const fileNode = new FileNode(fileName, NodeType.FILE);
        // FileTypeのenumの値で設定
        switch (fileType) {
          case 'monster':
            fileNode.fileType = FileType.MONSTER;
            break;
          case 'treasure':
            fileNode.fileType = FileType.TREASURE;
            break;
          case 'event':
            fileNode.fileType = FileType.EVENT;
            break;
          case 'savepoint':
            fileNode.fileType = FileType.SAVE_POINT;
            break;
          default:
            fileNode.fileType = FileType.EMPTY;
        }
        parentNode.addChild(fileNode);
      }
    });
  }

  /**
   * 指定されたパスのディレクトリ一覧を取得する（補完機能用）
   * @param partialPath 部分的なパス
   * @returns マッチするディレクトリ名の配列
   */
  public getDirectoryCompletions(partialPath: string): string[] {
    if (!partialPath) {
      // 空の場合は現在ディレクトリの全ディレクトリを返す
      const result = this.ls();
      if (result.success && result.files) {
        return result.files
          .filter(file => file.isDirectory())
          .map(file => file.name)
          .concat(['..', '.'])
          .sort();
      }
      return ['..', '.'];
    }

    // 絶対パスの場合
    if (partialPath.startsWith('/')) {
      return this.getAbsolutePathCompletions(partialPath);
    }

    // 相対パスの場合
    return this.getRelativePathCompletions(partialPath);
  }

  /**
   * 絶対パスの補完候補を取得する
   * @param absolutePath 絶対パス
   * @returns マッチするディレクトリ名の配列
   */
  private getAbsolutePathCompletions(absolutePath: string): string[] {
    // 最後のスラッシュより前の部分をディレクトリパスとして解釈
    const lastSlashIndex = absolutePath.lastIndexOf('/');
    const dirPath = absolutePath.substring(0, lastSlashIndex);
    const partial = absolutePath.substring(lastSlashIndex + 1);

    const targetNode = this.getNodeByPath(dirPath || '/');
    if (!targetNode || !targetNode.isDirectory()) {
      return [];
    }

    return targetNode.children
      .filter(child => child.isDirectory())
      .map(child => child.name)
      .filter(name => name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(name => `${dirPath}/${name}`)
      .sort();
  }

  /**
   * 相対パスの補完候補を取得する
   * @param relativePath 相対パス
   * @returns マッチするディレクトリ名の配列
   */
  private getRelativePathCompletions(relativePath: string): string[] {
    // パスに / が含まれる場合（サブディレクトリ内の補完）
    if (relativePath.includes('/')) {
      const lastSlashIndex = relativePath.lastIndexOf('/');
      const dirPath = relativePath.substring(0, lastSlashIndex);
      const partial = relativePath.substring(lastSlashIndex + 1);

      const targetNode = this.getNodeByPath(dirPath);
      if (!targetNode || !targetNode.isDirectory()) {
        return [];
      }

      return targetNode.children
        .filter(child => child.isDirectory())
        .map(child => child.name)
        .filter(name => name.toLowerCase().startsWith(partial.toLowerCase()))
        .map(name => `${dirPath}/${name}`)
        .sort();
    }

    // 単純な名前の補完
    const specialDirs = ['..', '.'].filter(dir =>
      dir.toLowerCase().startsWith(relativePath.toLowerCase())
    );

    const directories = this.currentNode.children
      .filter(child => child.isDirectory())
      .map(child => child.name)
      .filter(name => name.toLowerCase().startsWith(relativePath.toLowerCase()));

    return [...specialDirs, ...directories].sort();
  }

  /**
   * ファイル補完候補を取得する
   * @param partialPath 部分的なパス
   * @returns マッチするファイル名の配列
   */
  public getFileCompletions(partialPath: string): string[] {
    if (!partialPath) {
      // 空の場合は現在ディレクトリの全ファイルを返す
      const result = this.ls();
      if (result.success && result.files) {
        return result.files
          .filter(file => file.isFile())
          .map(file => file.name)
          .sort();
      }
      return [];
    }

    // 絶対パスの場合
    if (partialPath.startsWith('/')) {
      return this.getAbsolutePathFileCompletions(partialPath);
    }

    // 相対パスの場合
    return this.getRelativePathFileCompletions(partialPath);
  }

  /**
   * 絶対パスのファイル補完候補を取得する
   * @param absolutePath 絶対パス
   * @returns マッチするファイル名の配列
   */
  private getAbsolutePathFileCompletions(absolutePath: string): string[] {
    // 最後のスラッシュより前の部分をディレクトリパスとして解釈
    const lastSlashIndex = absolutePath.lastIndexOf('/');
    const dirPath = absolutePath.substring(0, lastSlashIndex);
    const partial = absolutePath.substring(lastSlashIndex + 1);

    const targetNode = this.getNodeByPath(dirPath || '/');
    if (!targetNode || !targetNode.isDirectory()) {
      return [];
    }

    return targetNode.children
      .filter(child => child.isFile())
      .map(child => child.name)
      .filter(name => name.toLowerCase().startsWith(partial.toLowerCase()))
      .map(name => `${dirPath}/${name}`)
      .sort();
  }

  /**
   * 相対パスのファイル補完候補を取得する
   * @param relativePath 相対パス
   * @returns マッチするファイル名の配列
   */
  private getRelativePathFileCompletions(relativePath: string): string[] {
    // パスに / が含まれる場合（サブディレクトリ内の補完）
    if (relativePath.includes('/')) {
      const lastSlashIndex = relativePath.lastIndexOf('/');
      const dirPath = relativePath.substring(0, lastSlashIndex);
      const partial = relativePath.substring(lastSlashIndex + 1);

      const targetNode = this.getNodeByPath(dirPath);
      if (!targetNode || !targetNode.isDirectory()) {
        return [];
      }

      return targetNode.children
        .filter(child => child.isFile())
        .map(child => child.name)
        .filter(name => name.toLowerCase().startsWith(partial.toLowerCase()))
        .map(name => `${dirPath}/${name}`)
        .sort();
    }

    // 単純な名前の補完
    const files = this.currentNode.children
      .filter(child => child.isFile())
      .map(child => child.name)
      .filter(name => name.toLowerCase().startsWith(relativePath.toLowerCase()));

    return files.sort();
  }

  /**
   * テスト用の固定ファイル構造を作成する
   * 既存のユニットテストとの互換性のために保持
   * @returns テスト用FileSystemインスタンス
   */
  public static createTestStructure(): FileSystem {
    return createTestFileSystem();
  }
}
