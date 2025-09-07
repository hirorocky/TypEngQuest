import { Phase } from '../core/Phase';
import { CommandResult, PhaseType, PhaseTypes } from '../core/types';
import { Battle } from '../battle/Battle';
import { BattleActionExecutor } from '../battle/BattleActionExecutor';
import { Player } from '../player/Player';
import { Enemy } from '../battle/Enemy';
import { World } from '../world/World';
import { TabCompleter } from '../core/completion/TabCompleter';

import { BattleTypingResult } from './types';
import { ConsumableItem } from '../items/ConsumableItem';
import { delay } from '../utils/timer';
import { createFractionBar } from '../ui/FractionBar';
import { EX_COST_FOCUS, EX_COST_SPARK } from '../battle/const';

/**
 * BattlePhaseクラス - 戦闘フェーズの制御を行う
 * - タイピング処理はBattleTypingPhaseに委譲
 * - フェーズ間の連携を改善
 */
export class BattlePhase extends Phase {
  private battle: Battle | null = null;
  private player: Player;
  private enemy: Enemy | null = null;
  private turnMessage: string = '';
  private typingResult: BattleTypingResult | null = null;

  constructor(world: World, tabCompleter: TabCompleter, player: Player) {
    super(world, tabCompleter);
    this.player = player;
  }

  getType(): PhaseType {
    return PhaseTypes.BATTLE;
  }

  getPrompt(): string {
    return 'battle> ';
  }

  async initialize(): Promise<void> {
    this.registerBattleCommands();
    this.showBattleStatus();
  }

  /**
   * Enemyインスタンスを設定
   */
  setEnemy(enemy: Enemy): void {
    this.enemy = enemy;
  }

  /**
   * Battleインスタンスを設定
   */
  setBattle(battle: Battle): void {
    this.battle = battle;
    if (battle['player']) {
      this.player = battle['player'];
    }
    if (battle['enemy']) {
      this.enemy = battle['enemy'];
    }
  }

  /**
   * タイピング結果を設定
   */
  setTypingResult(result: BattleTypingResult): void {
    this.typingResult = result;
  }

  /**
   * 入力処理ループを開始
   * @returns Phase遷移が必要な場合はCommandResultを返す
   */
  async startInputLoop(): Promise<CommandResult | null> {
    if (this.enemy === null) {
      throw new Error('Enemy is not set');
    }

    // 初回
    if (this.battle === null) {
      this.battle = new Battle(this.player, this.enemy);
      const message = this.battle.start();
      console.log(`\n${message}`);
      if (this.battle.getCurrentTurnActor() === 'enemy') {
        console.log('Enemy goes first...');
        await this.executeEnemyTurn();
      }
    }

    if (this.typingResult) {
      await this.handleBattleTypingComplete();
      this.typingResult = null; // 処理済みの結果をクリア
    }

    // タイピング結果処理や初回敵ターンでバトルが終了した場合は、ここで処理を終了
    // （endBattleメソッド内でcleanupとnotifyTransitionが呼ばれているため）
    if (!this.battle?.isActive) {
      return null;
    }

    await this.startPlayerTurn();

    // 基底クラスの入力ループを使用
    return super.startInputLoop();
  }

  private registerBattleCommands(): void {
    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show battle commands',
      execute: async () => this.showHelp(),
    });

    this.registerCommand({
      name: 'status',
      aliases: ['s'],
      description: 'Show battle status',
      execute: async () => this.showBattleStatus(),
    });

    this.registerCommand({
      name: 'skill',
      aliases: ['skills', 'attack'],
      description: 'Select and use skills',
      execute: async () => this.enterSkillSelection(),
    });

    this.registerCommand({
      name: 'item',
      aliases: ['items'],
      description: 'Use an item',
      execute: async () => this.enterItemSelection(),
    });

    this.registerCommand({
      name: 'run',
      aliases: ['escape', 'flee'],
      description: 'Attempt to escape from battle',
      execute: async () => this.attemptEscape(),
    });

    // EXモード（最小実装）
    this.registerCommand({
      name: 'focus',
      description: `Enter Focus Mode (cost ${EX_COST_FOCUS} EX)`,
      execute: async () => this.enterFocusMode(),
    });

    this.registerCommand({
      name: 'spark',
      description: `Enter Spark Mode (cost ${EX_COST_SPARK} EX)`,
      execute: async () => this.enterSparkMode(),
    });
  }

  private async showHelp(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return {
        success: false,
        message: 'Commands not available during enemy turn',
      };
    }

    return {
      success: true,
      message: 'Available battle commands:',
      output: [
        '  help/h - Show this help',
        '  status/s - Show battle status',
        '  skill/attack - Select and use skills',
        '  item - Use an item',
        '  run/escape - Attempt to escape',
      ],
    };
  }

  private async showBattleStatus(): Promise<CommandResult> {
    if (!this.player || !this.enemy || !this.battle) {
      return {
        success: false,
        message: 'Battle not initialized',
      };
    }

    const playerStats = this.player.getBodyStats();
    const ex = this.player.getExPoints?.() ?? 0;
    const exModes: string[] = [];
    if (ex >= EX_COST_FOCUS) exModes.push('Focus');
    if (ex >= EX_COST_SPARK) exModes.push('Spark');

    const output = [
      `■ BATTLE STATUS`,
      '',
      `🗡️ ${this.player.getName()}`,
      `  HP: ${createFractionBar(playerStats.getCurrentHP(), playerStats.getMaxHP())} ${playerStats.getCurrentHP()}/${playerStats.getMaxHP()}`,
      `  MP: ${createFractionBar(playerStats.getCurrentMP(), playerStats.getMaxMP())} ${playerStats.getCurrentMP()}/${playerStats.getMaxMP()}`,
      `  EX: ${ex}` + (exModes.length ? ` (${exModes.join(', ')} Available)` : ''),
      '',
      `👹 ${this.enemy.name}`,
      `  HP: ${createFractionBar(this.enemy.currentHp, this.enemy.stats.maxHp)} ${this.enemy.currentHp}/${this.enemy.stats.maxHp}`,
    ];

    if (this.turnMessage) {
      output.push('', '--- Last Action ---', this.turnMessage);
    }

    return {
      success: true,
      message: '',
      output,
    };
  }

  /**
   * Focus Mode へ（最小実装: スキルコスト低下 + 失敗で終了）
   */
  private async enterFocusMode(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return { success: false, message: "It's not your turn!" };
    }
    if (!this.battle) return { success: false, message: 'Battle not initialized' };
    if (!this.player.consumeExPoints(EX_COST_FOCUS)) {
      return { success: false, message: 'not enough ex points' };
    }

    return {
      success: true,
      message: 'Entering Focus Mode...',
      nextPhase: 'skillSelection',
      data: {
        battle: this.battle,
        exMode: 'focus',
      },
    };
  }

  /**
   * Spark Mode へ（最小実装: 1スキル選択→固定3回実行）
   */
  private async enterSparkMode(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return { success: false, message: "It's not your turn!" };
    }
    if (!this.battle) return { success: false, message: 'Battle not initialized' };
    if (!this.player.consumeExPoints(EX_COST_SPARK)) {
      return { success: false, message: 'not enough ex points' };
    }

    return {
      success: true,
      message: 'Entering Spark Mode...',
      nextPhase: 'skillSelection',
      data: {
        battle: this.battle,
        exMode: 'spark',
        sparkRepeatHint: 3,
      },
    };
  }

  /**
   * スキル選択フェーズに移行
   */
  private async enterSkillSelection(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return {
        success: false,
        message: "It's not your turn!",
      };
    }

    if (!this.battle) {
      return {
        success: false,
        message: 'Battle not initialized',
      };
    }

    return {
      success: true,
      message: 'Entering skill selection...',
      nextPhase: 'skillSelection',
      data: {
        battle: this.battle,
      },
    };
  }

  /**
   * BattleTypingPhase完了後の処理
   */
  private async handleBattleTypingComplete(): Promise<void> {
    const result = this.typingResult;

    if (!result) {
      throw new Error('No typing result available');
    }

    console.log('\n=== TYPING COMPLETE ===');
    console.log(`Completed ${result.completedSkills}/${result.totalSkills} skills`);
    console.log(`Total Damage: ${result.summary.totalDamageDealt}`);

    if (result.battleEnded) {
      const battleEnd = this.battle?.checkBattleEnd();
      if (battleEnd) {
        await this.endBattle(battleEnd);
      }
    } else {
      await this.finishPlayerTurn();
      await this.executeEnemyTurn();
    }
  }

  /**
   * アイテム選択フェーズに移行
   */
  private async enterItemSelection(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return {
        success: false,
        message: "It's not your turn!",
      };
    }

    if (!this.battle) {
      return {
        success: false,
        message: 'Battle not initialized',
      };
    }

    return {
      success: true,
      message: 'Entering item selection...',
      nextPhase: 'battleItemConsumption',
      data: {
        battle: this.battle,
        onItemUsed: (item: ConsumableItem) => this.onItemUsed(item),
        onBack: () => this.cancelPlayerTurn(),
      },
    };
  }

  /**
   * アイテム使用後の処理
   */
  private onItemUsed(item: ConsumableItem): void {
    console.log(`Used ${item.getName()}`);
    // アイテム使用後、敵のターンへ
    this.executeEnemyTurn();
  }

  /**
   * 逃走を試みる
   */
  private async attemptEscape(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player') {
      return {
        success: false,
        message: "It's not your turn!",
      };
    }

    // 逃走用のBattleTypingPhaseに遷移する設計も可能
    // 現在は簡単な実装
    this.turnMessage = 'You tried to escape but failed!';

    // 逃走失敗後、敵のターンへ
    this.battle.nextTurn();
    await this.executeEnemyTurn();

    return {
      success: true,
      message: this.turnMessage,
    };
  }

  private cancelPlayerTurn(): void {}

  private async startPlayerTurn(): Promise<void> {
    if (!this.battle) return;

    console.log(`\n=== TURN ${this.battle.currentTurn}: PLAYER🗡️ ===`);
    await delay(250);

    console.log('\nWhat will you do? (Type "help" for commands)');
  }

  private async finishPlayerTurn(): Promise<void> {
    if (!this.battle) return;

    // 勝敗判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      await this.endBattle(battleEnd);
      return;
    }

    // 敵ターンに移行
    this.battle.nextTurn();
  }

  private async executeEnemyTurn(): Promise<void> {
    if (!this.battle || !this.enemy || !this.player) return;

    console.log(`\n=== TURN ${this.battle.currentTurn}: ENEMY👹 ===`);
    await delay(250);

    // 敵のスキル選択と実行をBattleActionExecutorで処理
    const selectedSkill = this.enemy.selectSkill() || Battle.getNormalAttackSkill();

    const result = BattleActionExecutor.executeEnemySkill(selectedSkill, this.enemy, this.player);

    this.turnMessage = result.message.join(' ');
    result.message.forEach(msg => console.log(msg));
    await delay(1500);

    // 勝敗判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      await this.endBattle(battleEnd);
      return;
    }

    // プレイヤーターンに移行（入力待ち状態）
    this.battle.nextTurn();
  }

  private async endBattle(battleEnd: {
    winner: 'player' | 'enemy';
    message: string;
  }): Promise<void> {
    if (!this.battle) {
      console.log('No battle object, returning');
      return;
    }

    console.log(`\n=== BATTLE END ===`);
    console.log(battleEnd.message);

    if (battleEnd.winner === 'player') {
      // ドロップアイテム計算
      const droppedItems = this.battle.calculateDrops();
      if (droppedItems.length > 0) {
        console.log(`\nDropped items: ${droppedItems.join(', ')}`);

        if (this.player) {
          // TODO: ドロップアイテムをプレイヤーのインベントリに追加
          console.log('Items added to inventory!');
        }
      }
    }

    // キー入力待ち
    await this.waitForKeyPress();

    // 戦闘がアクティブな場合のみ終了処理を実行
    if (this.battle.isActive) {
      this.battle.end();
    }

    // readlineインターフェースをクリーンアップ
    this.cleanup();

    // フェーズ遷移を通知
    if (battleEnd.winner === 'player') {
      // プレイヤー勝利時は探索フェーズに戻る
      this.notifyTransition({
        success: true,
        message: 'Battle ended, returning to exploration',
        nextPhase: 'exploration',
        data: {
          world: this.world,
          player: this.player,
        },
      });
    } else {
      // プレイヤー敗北時はタイトルフェーズに戻る
      this.notifyTransition({
        success: true,
        message: 'Game over, returning to title',
        nextPhase: 'title',
        data: {},
      });
    }
  }
}
