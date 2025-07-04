/**
 * ファイルノードの種類
 */
export enum NodeType {
  FILE = 'file',
  DIRECTORY = 'directory',
}

/**
 * ファイルの用途タイプ
 */
export enum FileType {
  MONSTER = 'monster', // モンスターファイル (.js, .ts, .py等)
  TREASURE = 'treasure', // 宝箱ファイル (.json, .yaml等)
  SAVE_POINT = 'save_point', // セーブポイント (.md)
  EVENT = 'event', // イベントファイル (.exe, .bin等)
  EMPTY = 'empty', // 空ファイル
  NONE = 'none', // ディレクトリ用
}

/**
 * ファイル・ディレクトリノードを表現するクラス
 * ゲーム内のファイルシステムの基本要素
 */
export class FileNode {
  public name: string;
  public nodeType: NodeType;
  public isHidden: boolean;
  public parent: FileNode | null = null;
  public children: FileNode[] = [];
  public fileType: FileType;

  /**
   * FileNodeインスタンスを作成する
   * @param name ファイル・ディレクトリ名
   * @param nodeType ノードタイプ（ファイル・ディレクトリ）
   * @throws {Error} 無効な名前の場合
   */
  constructor(name: string, nodeType: NodeType) {
    this.validateName(name);

    this.name = name;
    this.nodeType = nodeType;
    this.isHidden = name.startsWith('.');
    this.fileType = this.determineFileType(name, nodeType);
  }

  /**
   * ファイル名のバリデーションを行う
   * @param name ファイル名
   * @throws {Error} 無効な名前の場合
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('ファイル名は空にできません');
    }

    // パス区切り文字やその他の無効文字をチェック
    const invalidChars = /[/\\]/;
    if (invalidChars.test(name)) {
      throw new Error('ファイル名に無効な文字が含まれています');
    }
  }

  /**
   * ファイルタイプを決定する
   * @param name ファイル名
   * @param nodeType ノードタイプ
   * @returns ファイルタイプ
   */
  private determineFileType(name: string, nodeType: NodeType): FileType {
    if (nodeType === NodeType.DIRECTORY) {
      return FileType.NONE;
    }

    const extension = this.getExtension(name);

    // モンスターファイル（プログラムファイル）
    const monsterExtensions = [
      '.js',
      '.ts',
      '.py',
      '.java',
      '.cpp',
      '.c',
      '.h',
      '.cs',
      '.php',
      '.rb',
      '.go',
      '.rs',
    ];
    if (monsterExtensions.includes(extension)) {
      return FileType.MONSTER;
    }

    // 宝箱ファイル（設定ファイル）
    const treasureExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.cfg'];
    if (treasureExtensions.includes(extension)) {
      return FileType.TREASURE;
    }

    // セーブポイント（マークダウンファイル）
    if (extension === '.md') {
      return FileType.SAVE_POINT;
    }

    // イベントファイル（実行ファイル）
    const eventExtensions = ['.exe', '.bin', '.app', '.dmg', '.deb', '.rpm', '.msi'];
    if (eventExtensions.includes(extension)) {
      return FileType.EVENT;
    }

    // その他は空ファイル
    return FileType.EMPTY;
  }

  /**
   * ファイル名から拡張子を取得する
   * @param name ファイル名
   * @returns 拡張子（小文字、ドット付き）
   */
  private getExtension(name: string): string {
    const lastDotIndex = name.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === name.length - 1) {
      return '';
    }
    return name.substring(lastDotIndex).toLowerCase();
  }

  /**
   * このノードがファイルかどうかを判定する
   * @returns ファイルの場合true
   */
  public isFile(): boolean {
    return this.nodeType === NodeType.FILE;
  }

  /**
   * このノードがディレクトリかどうかを判定する
   * @returns ディレクトリの場合true
   */
  public isDirectory(): boolean {
    return this.nodeType === NodeType.DIRECTORY;
  }

  /**
   * 子ノードを追加する
   * @param child 追加する子ノード
   * @throws {Error} ファイルに子ノードを追加しようとした場合
   */
  public addChild(child: FileNode): void {
    if (this.isFile()) {
      throw new Error('ファイルに子ノードは追加できません');
    }

    // 既に親がある場合は解除
    if (child.parent) {
      child.parent.removeChild(child);
    }

    this.children.push(child);
    child.parent = this;
  }

  /**
   * 子ノードを削除する
   * @param child 削除する子ノード
   */
  public removeChild(child: FileNode): void {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }

  /**
   * 名前で子ノードを検索する
   * @param name 検索するノード名
   * @returns 見つかった子ノード、見つからない場合はundefined
   */
  public findChild(name: string): FileNode | undefined {
    return this.children.find(child => child.name === name);
  }

  /**
   * このノードの絶対パスを取得する
   * @returns 絶対パス文字列
   */
  public getPath(): string {
    const pathParts: string[] = [];
    let current: FileNode | null = this;

    while (current) {
      pathParts.unshift(current.name);
      current = current.parent;
    }

    return '/' + pathParts.join('/');
  }
}
