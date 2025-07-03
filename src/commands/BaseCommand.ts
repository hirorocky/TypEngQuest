import { PhaseType } from '../core/types';

/**
 * コマンド実行結果
 */
export interface CommandResult {
  success: boolean;
  message: string;
  output?: string[];
  nextPhase?: PhaseType;
  data?: Record<string, unknown>;
}

/**
 * コマンド実行コンテキスト
 */
export interface CommandContext {
  currentPhase: PhaseType;
  gameState?: Record<string, unknown>;
  fileSystem?: unknown;
  player?: unknown;
  battle?: unknown;
  [key: string]: unknown;
}

/**
 * 引数の検証結果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * パースされたオプション
 */
export interface ParsedOptions {
  flags: string[]; // -a, --verbose などのフラグ
  values: { [key: string]: string }; // --depth 3, -n 5 などの値付きオプション
  remaining: string[]; // オプション以外の引数
}

/**
 * コマンドの基底クラス
 * 全てのゲーム内コマンドはこのクラスを継承する
 */
export abstract class BaseCommand {
  /**
   * コマンド名
   */
  public abstract name: string;

  /**
   * コマンドの説明
   */
  public abstract description: string;

  /**
   * コマンドを実行する
   * @param args コマンド引数
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  public execute(args: string[], context: CommandContext): CommandResult {
    try {
      // 引数の検証
      const validation = this.validateArgs(args);
      if (!validation.valid) {
        return this.error(validation.error || '引数が無効です');
      }

      // 実際のコマンド処理を実行
      return this.executeInternal(args, context);
    } catch (error) {
      return this.error(
        `コマンド実行中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 内部的なコマンド実行処理（各コマンドで実装）
   * @param args コマンド引数
   * @param context 実行コンテキスト
   * @returns 実行結果
   */
  protected abstract executeInternal(args: string[], context: CommandContext): CommandResult;

  /**
   * 引数の検証を行う
   * @param args コマンド引数
   * @returns 検証結果
   */
  public validateArgs(args: string[]): ValidationResult {
    // デフォルトでは全て有効とする（各コマンドでオーバーライド可能）
    if (!args) {
      return { valid: true };
    }
    return { valid: true };
  }

  /**
   * ヘルプテキストを取得する
   * @returns ヘルプテキストの配列
   */
  public abstract getHelp(): string[];

  /**
   * 成功結果を作成する
   * @param message 成功メッセージ
   * @param output 出力行（オプション）
   * @returns 成功結果
   */
  protected success(message: string, output?: string[]): CommandResult {
    return {
      success: true,
      message,
      output,
    };
  }

  /**
   * エラー結果を作成する
   * @param message エラーメッセージ
   * @returns エラー結果
   */
  protected error(message: string): CommandResult {
    return {
      success: false,
      message,
    };
  }

  /**
   * フェーズ遷移を伴う成功結果を作成する
   * @param message 成功メッセージ
   * @param nextPhase 次のフェーズ
   * @param data 追加データ
   * @returns 成功結果
   */
  protected successWithPhase(
    message: string,
    nextPhase: PhaseType,
    data?: Record<string, unknown>
  ): CommandResult {
    return {
      success: true,
      message,
      nextPhase,
      data,
    };
  }

  /**
   * コマンドライン引数からオプションを解析する
   * @param args 引数配列
   * @returns パースされたオプション
   */
  protected parseOptions(args: string[]): ParsedOptions {
    const flags: string[] = [];
    const values: { [key: string]: string } = {};
    const remaining: string[] = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      // -- で区切られた場合、以降は全て残りの引数
      if (arg === '--') {
        remaining.push(...args.slice(i + 1));
        break;
      }

      if (arg.startsWith('-')) {
        i = this.handleOption(args, i, flags, values);
      } else {
        remaining.push(arg);
      }
    }

    return { flags, values, remaining };
  }

  /**
   * オプション処理を行う
   */
  private handleOption(
    args: string[],
    index: number,
    flags: string[],
    values: Record<string, string>
  ): number {
    const arg = args[index];

    if (arg.startsWith('--')) {
      return this.handleLongOption(args, index, flags, values);
    } else {
      return this.handleShortOption(args, index, flags, values);
    }
  }

  private handleLongOption(
    args: string[],
    index: number,
    flags: string[],
    values: Record<string, string>
  ): number {
    const arg = args[index];
    const optionPart = arg.substring(2);
    const equalIndex = optionPart.indexOf('=');

    // --key=value 形式の場合
    if (equalIndex !== -1) {
      const key = optionPart.substring(0, equalIndex);
      const value = optionPart.substring(equalIndex + 1);
      values[key] = value;
      return index;
    }

    // 次の引数が値らしく、オプションでない場合のみ値として扱う
    if (
      index + 1 < args.length &&
      !args[index + 1].startsWith('-') &&
      this.looksLikeValue(args[index + 1])
    ) {
      values[optionPart] = args[index + 1];
      return index + 1;
    }

    // それ以外はフラグとして処理
    flags.push(optionPart);
    return index;
  }

  private handleShortOption(
    args: string[],
    index: number,
    flags: string[],
    values: Record<string, string>
  ): number {
    const arg = args[index];
    const optionChars = arg.substring(1);

    // 複数文字のショートオプション（-la）の場合は全てフラグとして処理
    if (optionChars.length > 1) {
      flags.push(...optionChars.split(''));
      return index;
    }

    // 単体のショートオプション（-a）の場合
    // 次の引数がオプションでなく、明確に値らしい場合のみ値として扱う
    if (
      index + 1 < args.length &&
      !args[index + 1].startsWith('-') &&
      this.looksLikeValue(args[index + 1])
    ) {
      values[optionChars] = args[index + 1];
      return index + 1;
    }

    // それ以外はフラグとして処理
    flags.push(optionChars);
    return index;
  }

  /**
   * 引数が値らしいかどうかを判定する
   */
  private looksLikeValue(arg: string): boolean {
    // 数字のみ、拡張子を含むファイル名、=を含む設定値、または特殊文字を含まない単語
    return /^\d+$/.test(arg) || arg.includes('.') || arg.includes('=') || /^[a-zA-Z0-9_-]+$/.test(arg);
  }

  /**
   * 出力行配列を文字列にフォーマットする
   * @param lines 出力行配列
   * @returns フォーマットされた文字列
   */
  protected formatOutput(lines: string[]): string {
    return lines.join('\n');
  }

  /**
   * ファイルサイズを人間が読みやすい形式にフォーマットする
   * @param bytes バイト数
   * @returns フォーマットされたサイズ文字列
   */
  protected formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }

  /**
   * 日時を人間が読みやすい形式にフォーマットする
   * @param date 日時
   * @returns フォーマットされた日時文字列
   */
  protected formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * パスを相対パスまたは短縮形式で表示する
   * @param fullPath 完全パス
   * @param currentPath 現在のパス
   * @returns 表示用パス
   */
  protected formatPath(fullPath: string, currentPath?: string): string {
    if (!currentPath) {
      return fullPath;
    }

    // 現在のパスからの相対パスを計算
    if (fullPath.startsWith(currentPath)) {
      const relativePath = fullPath.substring(currentPath.length);
      return relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    }

    return fullPath;
  }

  /**
   * コンテキストからファイルシステムを取得する
   * @param context 実行コンテキスト
   * @returns ファイルシステム
   */
  protected getFileSystem(context: CommandContext): unknown {
    return context.fileSystem;
  }

  /**
   * コンテキストからプレイヤーを取得する
   * @param context 実行コンテキスト
   * @returns プレイヤー
   */
  protected getPlayer(context: CommandContext): unknown {
    return context.player;
  }

  /**
   * コンテキストからバトルを取得する
   * @param context 実行コンテキスト
   * @returns バトル
   */
  protected getBattle(context: CommandContext): unknown {
    return context.battle;
  }
}
