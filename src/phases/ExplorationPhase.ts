import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, PhaseType } from '../core/types';
import { Display } from '../ui/Display';
import { FileSystem } from '../world/FileSystem';
import { CdCommand } from '../commands/exploration/CdCommand';
import { LsCommand } from '../commands/exploration/LsCommand';
import { PwdCommand } from '../commands/exploration/PwdCommand';
import { TreeCommand } from '../commands/exploration/TreeCommand';
import { BaseCommand } from '../commands/BaseCommand';

/**
 * 探索フェーズ - ゲーム内でファイルシステムを探索する
 */
export class ExplorationPhase extends Phase {
  private fileSystem: FileSystem;
  private navigationCommands: Map<string, BaseCommand>;

  constructor() {
    super();

    // テスト用のファイルシステムを作成
    this.fileSystem = FileSystem.createTestStructure();

    // ナビゲーションコマンドを初期化
    this.navigationCommands = new Map();
    this.registerNavigationCommands();
  }

  /**
   * ナビゲーションコマンドを登録する
   */
  private registerNavigationCommands(): void {
    const commands: BaseCommand[] = [
      new CdCommand(),
      new LsCommand(),
      new PwdCommand(),
      new TreeCommand(),
    ];

    commands.forEach(command => {
      this.navigationCommands.set(command.name, command);
    });
  }

  public getName(): string {
    return 'exploration';
  }

  public enter(): void {
    Display.clear();
    Display.printHeader('マップ探索モード');
    Display.newLine();
    Display.printInfo('仮想ファイルシステムを探索できます。');
    Display.printInfo('helpコマンドで利用可能なコマンドを表示します。');
    Display.newLine();

    // 現在地を表示
    Display.printSuccess(`現在地: ${this.fileSystem.pwd()}`);
    Display.newLine();

    // プロンプトを表示
    this.showPrompt();
  }

  protected processCommand(input: string): PhaseResult {
    const [command, ...args] = input.trim().split(/\s+/);

    // ナビゲーションコマンドの処理
    if (this.navigationCommands.has(command)) {
      return this.handleNavigationCommand(command, args);
    }

    // システムコマンドの処理
    return this.handleSystemCommand(command);
  }

  /**
   * ナビゲーションコマンドを処理する
   */
  private handleNavigationCommand(command: string, args: string[]): PhaseResult {
    const navCommand = this.navigationCommands.get(command)!;
    const context = {
      currentPhase: 'exploration' as const,
      fileSystem: this.fileSystem,
    };
    const result = navCommand.execute(args, context);

    if (result.success) {
      if (result.output && result.output.length > 0) {
        // 出力がある場合は表示
        result.output.forEach(line => Display.printLine(line));
      } else if (result.message) {
        // メッセージのみの場合
        Display.printSuccess(result.message);
      }
    } else {
      Display.printError(result.message);
    }

    Display.newLine();
    this.showPrompt();
    return { type: PhaseTypes.CONTINUE };
  }

  /**
   * システムコマンドを処理する
   */
  private handleSystemCommand(command: string): PhaseResult {
    switch (command) {
      case 'help':
      case 'h':
      case '?':
        this.showHelp();
        return { type: PhaseTypes.CONTINUE };

      case 'exit':
      case 'quit':
      case 'q':
        Display.printInfo('タイトル画面に戻ります...');
        return { type: PhaseTypes.TITLE };

      case 'clear':
      case 'cls':
        Display.clear();
        this.showPrompt();
        return { type: PhaseTypes.CONTINUE };

      default:
        Display.printError(`不明なコマンド: ${command}`);
        Display.printInfo('helpで利用可能なコマンドを確認してください。');
        Display.newLine();
        this.showPrompt();
        return { type: PhaseTypes.CONTINUE };
    }
  }

  /**
   * ヘルプを表示する
   */
  private showHelp(): void {
    Display.newLine();
    Display.printHeader('利用可能なコマンド');
    Display.printLine('------------------');

    // ナビゲーションコマンド
    Display.printInfo('ナビゲーション:');
    this.navigationCommands.forEach(command => {
      Display.printCommand(command.name, command.description);
    });

    Display.newLine();

    // システムコマンド
    Display.printInfo('システム:');
    Display.printCommand('help', 'このヘルプを表示');
    Display.printCommand('clear', '画面をクリア');
    Display.printCommand('exit', 'タイトル画面に戻る');

    Display.newLine();
    Display.printInfo('各コマンドの詳細は「コマンド名 --help」で確認できます。');
    Display.newLine();
    this.showPrompt();
  }

  /**
   * プロンプトを表示する
   */
  private showPrompt(): void {
    const currentPath = this.fileSystem.pwd();
    const promptPath = currentPath === '/projects' ? '~' : currentPath.replace('/projects', '~');
    Display.print(`[${promptPath}]$ `);
  }

  /**
   * フェーズタイプを取得する
   */
  getType(): PhaseType {
    return 'exploration';
  }

  /**
   * フェーズの初期化処理
   */
  async initialize(): Promise<void> {
    this.enter();
  }

  /**
   * フェーズのクリーンアップ処理
   */
  async cleanup(): Promise<void> {
    // 特に処理なし
  }

  public exit(): void {
    // 特に処理なし
  }
}
