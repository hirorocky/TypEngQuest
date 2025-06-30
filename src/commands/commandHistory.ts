/**
 * コマンド履歴管理クラス
 * セッション中のコマンド履歴を管理し、↑↓キーでの履歴ナビゲーションと
 * インクリメンタル検索機能を提供する
 */
export class CommandHistory {
  private history: string[] = [];
  private currentIndex: number = -1; // -1 means at the newest position
  private maxSize: number;

  /**
   * CommandHistoryインスタンスを初期化する
   * @param maxSize - 保持する履歴の最大数（デフォルト: 100）
   */
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 新しいコマンドを履歴に追加する
   * @param command - 追加するコマンド文字列
   */
  addCommand(command: string): void {
    const trimmed = command.trim();

    // 空のコマンドや連続する重複コマンドは追加しない
    if (!trimmed || this.history[this.history.length - 1] === trimmed) {
      return;
    }

    this.history.push(trimmed);

    // 最大サイズを超えた場合は古いものを削除
    if (this.maxSize <= 0) {
      // maxSize が 0 以下の場合は履歴を保持しない
      this.history = [];
      return;
    }

    if (this.history.length > this.maxSize) {
      this.history.shift();
    }

    // 新しいコマンド追加時はナビゲーション位置をリセット
    this.currentIndex = -1;
  }

  /**
   * 履歴を1つ前に戻る（↑キー）
   * @returns 前のコマンド文字列、または履歴の最初に到達している場合は現在のコマンド
   */
  getPrevious(): string {
    if (this.history.length === 0) {
      return '';
    }

    // 最新位置からの場合
    if (this.currentIndex === -1) {
      this.currentIndex = this.history.length - 1;
    } else if (this.currentIndex > 0) {
      this.currentIndex--;
    }

    return this.history[this.currentIndex];
  }

  /**
   * 履歴を1つ後に進める（↓キー）
   * @returns 次のコマンド文字列、または履歴の最後を超えた場合は空文字
   */
  getNext(): string {
    if (this.history.length === 0 || this.currentIndex === -1) {
      return '';
    }

    this.currentIndex++;

    // 最新を超えた場合
    if (this.currentIndex >= this.history.length) {
      this.currentIndex = -1;
      return '';
    }

    return this.history[this.currentIndex];
  }

  /**
   * プレフィックスに基づいてコマンドを検索する
   * @param prefix - 検索するプレフィックス
   * @returns マッチするコマンドの配列（重複排除済み、時系列順）
   */
  search(prefix: string): string[] {
    if (!prefix.trim()) {
      return [...this.history];
    }

    const lowerPrefix = prefix.toLowerCase();
    const seen = new Set<string>();
    const uniqueCommands: string[] = [];

    // 重複を排除しつつ時系列順を保持
    for (const command of this.history) {
      if (!seen.has(command)) {
        seen.add(command);
        uniqueCommands.push(command);
      }
    }

    // プレフィックスマッチを実行
    return uniqueCommands.filter(command => command.toLowerCase().startsWith(lowerPrefix));
  }

  /**
   * 履歴全体を取得する
   * @returns 履歴のコピー
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * 履歴のサイズを取得する
   * @returns 現在の履歴サイズ
   */
  size(): number {
    return this.history.length;
  }

  /**
   * 履歴をクリアする
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 現在のナビゲーション位置を取得する（テスト用）
   * @returns 現在のインデックス
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * ナビゲーション位置をリセットする
   */
  resetNavigation(): void {
    this.currentIndex = -1;
  }
}
