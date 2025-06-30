import * as readline from 'readline';
import chalk from 'chalk';
import type { Game } from '../core/game';
import { CommandHistory } from '../commands/commandHistory';
import { AutoComplete } from '../commands/autoComplete';

interface KeyPressEvent {
  name?: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
}

/**
 * 拡張CLIインターフェース
 * readline を使用してTab補完とコマンド履歴機能を提供する
 */
export class EnhancedCli {
  private game: Game;
  private rl: readline.Interface;
  private history: CommandHistory;
  private autoComplete: AutoComplete;
  private isRunning = false;

  /**
   * EnhancedCliインスタンスを初期化する
   * @param game - ゲームインスタンス
   */
  constructor(game: Game) {
    this.game = game;
    this.history = new CommandHistory(100); // 最大100コマンドの履歴
    this.autoComplete = new AutoComplete(game);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      tabSize: 4,
    });

    this.setupKeyHandlers();
  }

  /**
   * キーハンドラーを設定する
   */
  private setupKeyHandlers(): void {
    // readlineの代わりに手動でキーイベントを処理
    const emitKeypressEvents = readline.emitKeypressEvents;
    emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // キーイベントハンドラー
    process.stdin.on('keypress', (char: string, key: KeyPressEvent) => {
      if (!key) return;

      switch (key.name) {
        case 'tab':
          this.handleTabCompletion();
          break;
        case 'up':
          this.handleHistoryUp();
          break;
        case 'down':
          this.handleHistoryDown();
          break;
      }
    });
  }

  /**
   * 現在の入力行を取得する
   */
  private getCurrentLine(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.rl as any).line || '';
  }

  /**
   * 現在の入力行を置き換える
   * @param text - 新しいテキスト
   */
  private replaceCurrentLine(text: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rlInterface = this.rl as any;
    
    // 現在の行をクリアして新しいテキストを設定
    rlInterface.line = text;
    rlInterface.cursor = text.length;
    rlInterface._refreshLine();
  }

  /**
   * Tab補完を手動で処理する
   */
  private handleTabCompletion(): void {
    const currentLine = this.getCurrentLine();
    const suggestions = this.autoComplete.complete(currentLine);

    if (suggestions.length === 1) {
      // 単一候補の場合は即座に補完
      const completion = this.getFullCompletion(currentLine, suggestions[0]);
      this.replaceCurrentLine(completion);
    } else if (suggestions.length > 1) {
      // 複数候補の場合は候補を表示
      console.log(chalk.yellow('\n📋 Completions:'));
      suggestions.forEach((suggestion, index) => {
        console.log(chalk.gray(`  ${index + 1}. `) + chalk.cyan(suggestion));
      });
      
      // 共通プレフィックスがあれば部分補完
      const commonPrefix = this.findCommonPrefix(suggestions);
      const lastWord = currentLine.trim().split(' ').pop() || '';
      if (commonPrefix && commonPrefix.length > lastWord.length) {
        this.replaceCurrentLine(this.getFullCompletion(currentLine, commonPrefix));
      }
      
      // プロンプトを再表示
      console.log(); // 空行
      this.showPrompt();
    } else if (currentLine.trim()) {
      // 入力があるが候補が見つからない場合のみメッセージ表示
      console.log(chalk.gray('\n💭 No completions found'));
      console.log(); // 空行
      this.showPrompt();
    }
  }

  /**
   * 上矢印キーの処理（履歴を戻る）
   */
  private handleHistoryUp(): void {
    const previousCommand = this.history.getPrevious();
    if (previousCommand) {
      this.replaceCurrentLine(previousCommand);
    }
  }

  /**
   * 下矢印キーの処理（履歴を進める）
   */
  private handleHistoryDown(): void {
    const nextCommand = this.history.getNext();
    this.replaceCurrentLine(nextCommand);
  }


  /**
   * 単一候補の完全補完文字列を生成する
   * @param currentLine - 現在の入力行
   * @param suggestion - 補完候補
   * @returns 完全補完された文字列
   */
  private getFullCompletion(currentLine: string, suggestion: string): string {
    const trimmed = currentLine.trim();
    
    // 末尾にスペースがある場合（引数補完）
    if (currentLine.endsWith(' ')) {
      return trimmed + ' ' + suggestion;
    }
    
    // コマンドまたは引数の部分補完
    const parts = trimmed.split(' ');
    const lastPart = parts[parts.length - 1];
    
    // 最後の部分を補完候補で置き換え
    parts[parts.length - 1] = suggestion;
    
    return parts.join(' ');
  }

  /**
   * 補完候補の共通プレフィックスを見つける
   * @param suggestions - 補完候補の配列
   * @returns 共通プレフィックス
   */
  private findCommonPrefix(suggestions: string[]): string {
    if (suggestions.length === 0) return '';
    if (suggestions.length === 1) return suggestions[0];

    let prefix = suggestions[0];
    for (let i = 1; i < suggestions.length; i++) {
      while (prefix && !suggestions[i].startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
      if (!prefix) break;
    }

    return prefix;
  }

  /**
   * CLIプロンプトを表示する
   * @returns プロンプト文字列
   */
  private getPrompt(): string {
    const map = this.game.getMap();
    const currentPath = map.getCurrentPath();
    const player = this.game.getPlayer();
    const level = player.getStats().level;

    return chalk.cyan(`[Lv.${level}] `) + chalk.yellow(`${currentPath}`) + chalk.green(' $ ');
  }

  /**
   * コマンドを処理する
   * @param command - 入力されたコマンド
   */
  private async processCommand(command: string): Promise<void> {
    const trimmed = command.trim();

    if (!trimmed) {
      this.showPrompt();
      return;
    }

    // 履歴に追加
    this.history.addCommand(trimmed);

    // 終了コマンドの処理
    if (trimmed.toLowerCase() === 'quit' || trimmed.toLowerCase() === 'exit') {
      this.stop();
      return;
    }

    try {
      // ゲームのコマンドプロセッサーにコマンドを渡す
      const processor = this.game.getCommandProcessor();
      await processor.process(trimmed);
    } catch (error) {
      console.error(chalk.red('Command execution error:'), error);
    }

    this.showPrompt();
  }

  /**
   * プロンプトを表示する
   */
  private showPrompt(): void {
    if (this.isRunning) {
      this.rl.question(this.getPrompt(), this.processCommand.bind(this));
    }
  }

  /**
   * CLIを開始する
   */
  start(): void {
    this.isRunning = true;

    console.log(chalk.cyan('🎮 Enhanced CLI Mode Started!'));
    console.log(chalk.gray('Use ↑↓ for history, Tab for completion, Ctrl+C to exit.'));
    console.log();

    this.showPrompt();

    // Ctrl+C での終了処理
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Goodbye!'));
      this.stop();
    });
  }

  /**
   * CLIを停止する
   */
  stop(): void {
    this.isRunning = false;
    this.rl.close();
    process.exit(0);
  }

  /**
   * 履歴統計を表示する（デバッグ用）
   */
  showHistoryStats(): void {
    const historySize = this.history.size();
    const recentCommands = this.history.getHistory().slice(-5);

    console.log(chalk.yellow('\n📊 History Statistics:'));
    console.log(`Total commands: ${historySize}`);
    console.log('Recent commands:', recentCommands);
    console.log();
  }

  /**
   * 履歴検索結果を表示する（デバッグ用）
   * @param prefix - 検索プレフィックス
   */
  showSearchResults(prefix: string): void {
    const matches = this.history.search(prefix);

    console.log(chalk.yellow(`\n🔍 Search results for "${prefix}":`));
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match}`);
    });
    console.log();
  }
}
