import type { Game } from '../core/game';

/**
 * 自動補完クラス
 * コマンドとその引数に対するTab補完機能を提供する
 */
export class AutoComplete {
  private game: Game;
  private readonly commands = [
    'help',
    'status',
    'inventory',
    'equipment',
    'equip',
    'unequip',
    'validate',
    'start',
    'world',
    'newworld',
    'cd',
    'ls',
    'pwd',
    'file',
    'cat',
    'head',
    'interact',
    'battle',
    'attack',
    'flee',
    'avoid',
    'skip',
    'events',
    'save',
    'load',
    'saves',
    'deletesave',
    'autosave',
    'quit',
    'exit',
  ];

  /**
   * AutoCompleteインスタンスを初期化する
   * @param game - ゲームインスタンス
   */
  constructor(game: Game) {
    this.game = game;
  }

  /**
   * 入力に対する補完候補を取得する
   * @param input - 補完対象の入力文字列
   * @returns 補完候補の配列
   */
  complete(input: string): string[] {
    // 空白のみの入力は空配列を返す
    if (!input.trim()) {
      return input === '' ? this.commands.slice() : [];
    }

    // 末尾にスペースがあるかどうかで引数補完かコマンド補完かを判定
    const hasTrailingSpace = input.endsWith(' ');
    const parts = input
      .trim()
      .split(' ')
      .filter(part => part.length > 0);

    if (parts.length === 0) {
      return this.commands.slice();
    }

    // コマンドの補完（末尾にスペースがない場合）
    if (parts.length === 1 && !hasTrailingSpace) {
      return this.completeCommand(parts[0]);
    }

    // 引数の補完（末尾にスペースがある場合、または複数のパーツがある場合）
    const command = parts[0];
    const args = hasTrailingSpace ? parts.slice(1).concat(['']) : parts.slice(1);

    return this.completeArguments(command, args);
  }

  /**
   * コマンド名を補完する
   * @param partial - 部分的なコマンド名
   * @returns マッチするコマンドの配列
   */
  private completeCommand(partial: string): string[] {
    const lowerPartial = partial.toLowerCase();
    return this.commands.filter(cmd => cmd.toLowerCase().startsWith(lowerPartial));
  }

  /**
   * コマンドの引数を補完する
   * @param command - コマンド名
   * @param args - 現在の引数配列
   * @returns 補完候補の配列
   */
  private completeArguments(command: string, args: string[]): string[] {
    const lowerCommand = command.toLowerCase();

    // ファイル系コマンド
    if (['file', 'cat', 'head', 'interact', 'battle'].includes(lowerCommand)) {
      return this.completeFiles(args[0] || '');
    }

    return this.completeSpecificCommand(lowerCommand, args);
  }

  private completeSpecificCommand(command: string, args: string[]): string[] {
    const commandHandlers = {
      cd: () => this.completeDirectories(args[0] || ''),
      ls: () => this.completeFilesAndDirectories(args[0] || ''),
      equip: () => this.completeEquipCommand(args),
      unequip: () => this.completeSlotNumbers(args, 5),
      deletesave: () => this.completeSlotNumbers(args, 10),
      save: () => this.completeSaveCommand(args),
      load: () => this.completeLoadCommand(args),
      newworld: () => this.completeWorldLevel(args),
      autosave: () => this.completeAutoSaveOptions(args),
    };

    const handler = commandHandlers[command as keyof typeof commandHandlers];
    return handler ? handler() : [];
  }

  /**
   * ディレクトリを補完する
   * @param partial - 部分的なパス
   * @returns マッチするディレクトリの配列
   */
  private completeDirectories(partial: string): string[] {
    const map = this.game.getMap();

    // 絶対パスか相対パスかを判定
    const isAbsolute = partial.startsWith('/');

    // パスを解析
    const pathParts = partial.split('/');
    const fileName = pathParts.pop() || '';
    const dirPath = pathParts.length > 0 ? pathParts.join('/') : '';

    const targetPath = isAbsolute ? dirPath || '/' : map.resolvePath(dirPath || '.');

    // ターゲットディレクトリの内容を取得
    const locations = map.getLocations(targetPath);
    const directories = locations.filter(loc => loc.isDirectory());

    // ファイル名でフィルタリング
    const matches = directories
      .filter(dir => dir.getName().toLowerCase().startsWith(fileName.toLowerCase()))
      .map(dir => dir.getName());

    return matches;
  }

  /**
   * ファイルとディレクトリを補完する
   * @param partial - 部分的なパス
   * @returns マッチするファイル・ディレクトリの配列
   */
  private completeFilesAndDirectories(partial: string): string[] {
    const map = this.game.getMap();

    // 絶対パスか相対パスかを判定
    const isAbsolute = partial.startsWith('/');

    // パスを解析
    const pathParts = partial.split('/');
    const fileName = pathParts.pop() || '';
    const dirPath = pathParts.length > 0 ? pathParts.join('/') : '';

    const targetPath = isAbsolute ? dirPath || '/' : map.resolvePath(dirPath || '.');

    // ターゲットディレクトリの内容を取得
    const locations = map.getLocations(targetPath);

    // ファイル名でフィルタリング
    const matches = locations
      .filter(loc => loc.getName().toLowerCase().startsWith(fileName.toLowerCase()))
      .map(loc => loc.getName());

    return matches;
  }

  /**
   * ファイルのみを補完する
   * @param partial - 部分的なファイル名
   * @returns マッチするファイルの配列
   */
  private completeFiles(partial: string): string[] {
    const map = this.game.getMap();

    // 絶対パスか相対パスかを判定
    const isAbsolute = partial.startsWith('/');

    // パスを解析
    const pathParts = partial.split('/');
    const fileName = pathParts.pop() || '';
    const dirPath = pathParts.length > 0 ? pathParts.join('/') : '';

    const targetPath = isAbsolute ? dirPath || '/' : map.resolvePath(dirPath || '.');

    // ターゲットディレクトリの内容を取得
    const locations = map.getLocations(targetPath);
    const files = locations.filter(loc => loc.isFile());

    // ファイル名でフィルタリング
    const matches = files
      .filter(file => file.getName().toLowerCase().startsWith(fileName.toLowerCase()))
      .map(file => file.getName());

    return matches;
  }

  /**
   * equipコマンドの補完
   * @param args - 現在の引数
   * @returns 補完候補
   */
  private completeEquipCommand(args: string[]): string[] {
    if (args.length === 0 || (args.length === 1 && args[0] === '')) {
      // スロット番号を補完
      return ['1', '2', '3', '4', '5'];
    } else if (args.length === 1 || (args.length === 2 && args[1] === '')) {
      // 単語を補完
      const player = this.game.getPlayer();
      return player.getInventory();
    }

    return [];
  }

  /**
   * スロット番号を補完する
   * @param args - 現在の引数
   * @param maxSlot - 最大スロット番号
   * @returns スロット番号の配列
   */
  private completeSlotNumbers(args: string[], maxSlot: number): string[] {
    if (args.length === 0 || (args.length === 1 && args[0] === '')) {
      return Array.from({ length: maxSlot }, (_, i) => (i + 1).toString());
    }
    return [];
  }

  /**
   * saveコマンドの補完
   * @param args - 現在の引数
   * @returns 補完候補
   */
  private completeSaveCommand(args: string[]): string[] {
    if (args.length === 0 || (args.length === 1 && args[0] === '')) {
      // セーブスロット番号（1-9）
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    }

    // 説明文は補完しない
    return [];
  }

  /**
   * loadコマンドの補完
   * @param args - 現在の引数
   * @returns 補完候補
   */
  private completeLoadCommand(args: string[]): string[] {
    if (args.length === 0 || (args.length === 1 && args[0] === '')) {
      // ロードスロット番号（1-10、10は自動セーブ）
      return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    }

    return [];
  }

  /**
   * newworldコマンドの補完
   * @param args - 現在の引数
   * @returns 補完候補
   */
  private completeWorldLevel(args: string[]): string[] {
    if (args.length === 0) {
      const currentLevel = this.game.getWorld().getLevel();
      const suggestions = [];

      // 現在のレベル周辺を提案
      for (let i = Math.max(1, currentLevel - 2); i <= currentLevel + 3; i++) {
        suggestions.push(i.toString());
      }

      return suggestions;
    }

    return [];
  }

  /**
   * autosaveコマンドの補完
   * @param args - 現在の引数
   * @returns 補完候補
   */
  private completeAutoSaveOptions(args: string[]): string[] {
    if (args.length === 0) {
      return ['on', 'off', 'enable', 'disable'];
    }

    return [];
  }
}
