import { Phase } from '../core/Phase';
import { PhaseResult, PhaseTypes, PhaseType, CommandResult } from '../core/types';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { CdCommand } from '../commands/exploration/CdCommand';
import { LsCommand } from '../commands/exploration/LsCommand';
import { PwdCommand } from '../commands/exploration/PwdCommand';
import { TreeCommand } from '../commands/exploration/TreeCommand';
import { FileCommand } from '../commands/exploration/FileCommand';
import { BaseCommand } from '../commands/BaseCommand';

/**
 * 探索フェーズ - ゲーム内でファイルシステムを探索する
 */
export class ExplorationPhase extends Phase {
  private navigationCommands: Map<string, BaseCommand>;
  protected world: World; // worldを必須に

  constructor(world: World) {
    super(world);

    if (!world) {
      throw new Error('World is required for ExplorationPhase');
    }
    this.world = world;

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
      new FileCommand(),
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
    Display.printHeader('exploration mode');
    Display.newLine();

    // ワールド情報を表示
    Display.printInfo(`exploring: ${this.world.getDomainName()} (level ${this.world.level})`);
    Display.printInfo('explore the generated filesystem and find treasures!');
    Display.printInfo('type "help" to see available commands.');
    Display.newLine();

    // 現在地を表示
    Display.printSuccess(`current location: ${this.world.fileSystem.pwd()}`);
    Display.newLine();

    // プロンプトを表示
    this.showPrompt();
  }

  /**
   * 入力を処理してCommandResultを返す
   */
  async processInput(input: string): Promise<CommandResult> {
    const [command, ...args] = input.trim().split(/\s+/);

    // ナビゲーションコマンドの処理
    if (this.navigationCommands.has(command)) {
      const navCommand = this.navigationCommands.get(command)!;
      const context = {
        currentPhase: 'exploration' as const,
        fileSystem: this.world.fileSystem,
      };
      const result = navCommand.execute(args, context);

      // ナビゲーションコマンドの結果をそのまま返す
      return result;
    }

    // システムコマンドの処理
    if (this.isSystemCommand(command)) {
      const result = this.processCommand(input);

      if (result.type === PhaseTypes.CONTINUE) {
        return { success: true };
      } else {
        return {
          success: true,
          nextPhase: result.type,
          data: result.data,
        };
      }
    }

    // 無効なコマンドの場合は失敗を返す
    return {
      success: false,
      message: `command not found: ${command}`,
    };
  }

  /**
   * 有効なコマンドかチェックする
   */
  private isValidCommand(command: string): boolean {
    const availableCommands = this.getAvailableCommands();
    return availableCommands.includes(command);
  }

  /**
   * システムコマンドかチェックする
   */
  private isSystemCommand(command: string): boolean {
    const systemCommands = ['help', 'h', '?', 'exit', 'quit', 'q', 'clear', 'cls'];
    return systemCommands.includes(command);
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
      fileSystem: this.world.fileSystem,
    };
    const result = navCommand.execute(args, context);

    if (result.success) {
      if (result.output && result.output.length > 0) {
        // 出力がある場合は表示
        result.output.forEach(line => Display.printLine(line));
      } else if (result.message) {
        // メッセージのみの場合
        Display.printSuccess(result.message || 'operation completed');
      }
    } else {
      Display.printError(result.message || 'operation failed');
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
        Display.printInfo('returning to title...');
        return { type: PhaseTypes.TITLE };

      case 'clear':
      case 'cls':
        Display.clear();
        this.showPrompt();
        return { type: PhaseTypes.CONTINUE };

      default:
        Display.printError(`command not found: ${command}`);
        Display.printInfo('type "help" to see available commands.');
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
    Display.printHeader('available commands');
    Display.printLine('------------------');

    // ナビゲーションコマンド
    Display.printInfo('navigation:');
    this.navigationCommands.forEach(command => {
      Display.printCommand(command.name, command.description);
    });

    Display.newLine();

    // システムコマンド
    Display.printInfo('system:');
    Display.printCommand('help', 'show this help');
    Display.printCommand('clear', 'clear screen');
    Display.printCommand('exit', 'return to title');

    Display.newLine();
    Display.printInfo('use "command --help" for detailed information.');
    Display.newLine();
    this.showPrompt();
  }

  /**
   * プロンプトを表示する
   */
  private showPrompt(): void {
    const currentPath = this.world.fileSystem.pwd();
    const promptPath = currentPath === '/' ? '~' : currentPath.replace('/', '~');
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

  /**
   * 利用可能なコマンド一覧を取得する
   */
  public getAvailableCommands(): string[] {
    const navigationCommands = Array.from(this.navigationCommands.keys());
    const systemCommands = ['help', 'clear', 'exit'];
    return [...navigationCommands, ...systemCommands];
  }
}
