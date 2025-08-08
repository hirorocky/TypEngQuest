/**
 * ゲームメインクラス
 */
import { PhaseType, GameState, CommandResult } from './types';
import { Phase } from './Phase';
import { Skill } from '../battle/Skill';
import { TitlePhase } from '../phases/TitlePhase';
import { ExplorationPhase } from '../phases/ExplorationPhase';
import { InventoryPhase } from '../phases/InventoryPhase';
import { ItemConsumptionPhase } from '../phases/ItemConsumptionPhase';
import { ItemEquipmentPhase } from '../phases/ItemEquipmentPhase';
import { TypingPhase } from '../phases/TypingPhase';
import { BattlePhase } from '../phases/BattlePhase';
import { BattleTypingPhase } from '../phases/BattleTypingPhase';
import { SkillSelectionPhase } from '../phases/SkillSelectionPhase';
import { BattleItemConsumptionPhase } from '../phases/BattleItemConsumptionPhase';
import { Enemy } from '../battle/Enemy';
import { Display } from '../ui/Display';
import { World } from '../world/World';
import { Player } from '../player/Player';
import { ConsumableItem } from '../items/ConsumableItem';
import { CommandParser } from './CommandParser';
import {
  TabCompleter,
  CommandCompletionProvider,
  DirectoryCompletionProvider,
  BattleCompletionProvider,
} from './completion';
// import { red, cyan } from '../ui/colors'; // TODO: Use in future error handling

/**
 * Phase遷移時のデータ型定義
 */
interface PhaseTransitionData {
  // Battle phase
  enemy?: Enemy;

  // BattleTyping phase
  skill?: Skill;
  onComplete?: (result: { success: boolean; skill?: Skill }) => void;

  // SkillSelection phase
  onSkillSelected?: (skill: Skill) => void;
  onBack?: () => void;

  // BattleItemConsumption phase
  onItemUsed?: (item: ConsumableItem) => void;

  // Typing phase
  difficulty?: number;

  // General
  exit?: boolean;
}

export class Game {
  private state: GameState;
  private currentPhase: Phase | null = null;
  private signalHandlers: { signal: 'SIGINT' | 'SIGTERM'; handler: () => void }[] = [];
  private currentWorld: World | null = null;
  private currentPlayer: Player | null = null;
  private isTestMode: boolean;
  private commandParser: CommandParser;
  private tabCompleter: TabCompleter;

  constructor(isTestMode: boolean = false) {
    this.state = {
      currentPhase: 'title',
      isRunning: false,
    };

    this.commandParser = new CommandParser();

    // Tab補完システムを初期化
    this.tabCompleter = new TabCompleter(this.commandParser);

    // 補完プロバイダーを追加
    this.tabCompleter.addProvider(new CommandCompletionProvider());
    this.tabCompleter.addProvider(new DirectoryCompletionProvider());
    this.tabCompleter.addProvider(new BattleCompletionProvider());

    this.isTestMode = isTestMode;
    this.setupSignalHandlers();
  }

  async start(): Promise<void> {
    this.state.isRunning = true;

    try {
      await this.transitionToPhase('title');
      await this.gameLoop();
    } catch (error) {
      Display.printError(
        `Game crashed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      await this.cleanup();
    }
  }

  private async gameLoop(): Promise<void> {
    while (this.state.isRunning && this.currentPhase) {
      try {
        // Phaseに入力処理を委譲
        const result = await this.currentPhase.startInputLoop();

        if (result) {
          await this.handleCommandResult(result);
        }
      } catch (error) {
        Display.printError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // エラー発生時はループを継続
      }
    }
  }

  private async handleCommandResult(result: CommandResult): Promise<void> {
    if (result.message) {
      if (result.success) {
        Display.printSuccess(result.message);
      } else {
        Display.printError(result.message);
      }
    }

    // Handle output array
    if (result.output && result.output.length > 0) {
      for (const line of result.output) {
        Display.print(line + '\n');
      }
    }

    // Handle phase transitions
    if (result.nextPhase) {
      await this.transitionToPhase(result.nextPhase, result.data);
    }

    // Handle special data
    if (result.data?.exit) {
      this.state.isRunning = false;
    }
  }

  private async transitionToPhase(phaseType: PhaseType, data?: PhaseTransitionData): Promise<void> {
    // Cleanup current phase
    if (this.currentPhase) {
      await this.currentPhase.cleanup();
    }

    // Create and initialize new phase
    this.currentPhase = this.createPhase(phaseType, data);
    this.state.currentPhase = phaseType;

    await this.currentPhase.initialize();
  }

  private createPhase(phaseType: PhaseType, data?: PhaseTransitionData): Phase {
    const phaseFactories: Record<PhaseType, () => Phase> = {
      title: () => new TitlePhase(undefined, this.tabCompleter),
      exploration: () =>
        new ExplorationPhase(this.currentWorld!, this.currentPlayer!, this.tabCompleter),
      inventory: () =>
        new InventoryPhase(this.currentWorld!, this.currentPlayer!, this.tabCompleter),
      itemConsumption: () =>
        new ItemConsumptionPhase(this.currentWorld!, this.currentPlayer!, this.tabCompleter),
      itemEquipment: () =>
        new ItemEquipmentPhase(this.currentWorld!, this.currentPlayer!, this.tabCompleter),
      dialog: () => {
        throw new Error('Dialog phase not implemented');
      },
      battle: () => {
        const battlePhase = new BattlePhase(
          this.currentWorld!,
          this.tabCompleter,
          this.currentPlayer!
        );
        // enemyデータがある場合は戦闘を開始
        if (data?.enemy) {
          // data.enemyはすでにEnemyインスタンス
          const enemy = data.enemy;
          // 戦闘開始は非同期で行う（initialization後に）
          Promise.resolve().then(async () => {
            await battlePhase.startBattle(enemy);
          });
        }
        return battlePhase;
      },
      battleTyping: () => {
        const skill = data?.skill;
        if (!skill) {
          throw new Error('Skill is required for BattleTypingPhase');
        }
        const onComplete =
          data?.onComplete || ((_result: { success: boolean; skill?: Skill }) => {});
        return new BattleTypingPhase(skill, onComplete, this.currentWorld!, this.tabCompleter);
      },
      skillSelection: () =>
        new SkillSelectionPhase({
          player: this.currentPlayer!,
          onSkillSelected: data?.onSkillSelected || (() => {}),
          onBack: data?.onBack || (() => {}),
          world: this.currentWorld!,
          tabCompleter: this.tabCompleter,
        }),
      battleItemConsumption: () =>
        new BattleItemConsumptionPhase({
          player: this.currentPlayer!,
          onItemUsed: data?.onItemUsed || (() => {}),
          onBack: data?.onBack || (() => {}),
          world: this.currentWorld!,
          tabCompleter: this.tabCompleter,
        }),
      typing: () => {
        const difficulty = data?.difficulty;
        // TODO: Refactor TypingPhase to properly extend Phase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new TypingPhase(difficulty as 1 | 2 | 3 | 4 | 5 | undefined) as any;
      },
      continue: () => {
        throw new Error('Continue phase not implemented');
      },
    };

    const factory = phaseFactories[phaseType];
    if (!factory) {
      throw new Error(`Unknown phase type: ${phaseType}`);
    }

    // 共通のワールドとプレイヤーの初期化（有効なフェーズタイプが確認された後）
    if (phaseType !== 'title' && phaseType !== 'typing') {
      this.ensureWorldAndPlayer(phaseType);
    }

    return factory();
  }

  private ensureWorldAndPlayer(phaseType: PhaseType): void {
    if (phaseType === 'exploration') {
      // explorationフェーズではワールドを生成
      if (!this.currentWorld) {
        this.currentWorld = this.generateDefaultWorld();
      }
      if (!this.currentPlayer) {
        this.currentPlayer = this.generateDefaultPlayer();
      }
    } else {
      // その他のフェーズではワールドとプレイヤーが必須
      if (!this.currentWorld) {
        throw new Error(`World is required for ${phaseType} phase`);
      }
      if (!this.currentPlayer) {
        throw new Error(`Player is required for ${phaseType} phase`);
      }
    }
  }

  /**
   * デフォルトワールドを生成する
   * 設定に基づいて後でカスタマイズ可能
   */
  private generateDefaultWorld(): World {
    if (this.isTestMode) {
      // テストモードでは固定のファイル構造を使用
      return World.generateTestWorld();
    } else {
      // デフォルトはランダムドメインのレベル1
      return World.generateRandomWorld(1);
    }
  }

  /**
   * デフォルトプレイヤーを生成する
   * 設定に基づいて後でカスタマイズ可能
   */
  private generateDefaultPlayer(): Player {
    return new Player('Test Player', this.isTestMode);
  }

  private setupSignalHandlers(): void {
    const sigintHandler = async () => {
      console.log();
      Display.printInfo('Received interrupt signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    };

    const sigtermHandler = async () => {
      Display.printInfo('Received termination signal. Shutting down gracefully...');
      this.state.isRunning = false;
      await this.cleanup();
      process.exit(0);
    };

    process.on('SIGINT', sigintHandler);
    process.on('SIGTERM', sigtermHandler);

    // ハンドラーを保存して、後で削除できるようにする
    this.signalHandlers.push(
      { signal: 'SIGINT', handler: sigintHandler },
      { signal: 'SIGTERM', handler: sigtermHandler }
    );
  }

  /**
   * Tab補完機能
   * @param line 現在の入力行
   * @returns 補完候補の配列
   */

  private async cleanup(): Promise<void> {
    if (this.currentPhase) {
      await this.currentPhase.cleanup();
    }

    // PhaseのクリーンアップはhandleCommandResult内で行われる

    // シグナルハンドラーを削除
    this.signalHandlers.forEach(({ signal, handler }) => {
      process.removeListener(signal, handler);
    });
    this.signalHandlers = [];
  }

  // Getters for testing
  getCurrentPhase(): PhaseType {
    return this.state.currentPhase;
  }

  isRunning(): boolean {
    return this.state.isRunning;
  }
}
