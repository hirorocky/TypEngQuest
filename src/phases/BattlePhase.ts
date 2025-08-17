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

/**
 * BattlePhaseクラス - 戦闘フェーズの制御を行う
 * - タイピング処理はBattleTypingPhaseに委譲
 * - フェーズ間の連携を改善
 */
export class BattlePhase extends Phase {
  private battle: Battle | null = null;
  private player?: Player;
  private enemy?: Enemy;
  private turnMessage: string = '';
  private isProcessingTurn: boolean = false;

  constructor(world?: World, tabCompleter?: TabCompleter, player?: Player) {
    super(world, tabCompleter);
    this.player = player;
  }

  getType(): PhaseType {
    return PhaseTypes.BATTLE;
  }

  getPrompt(): string {
    if (this.battle?.getCurrentTurnActor() === 'player' && !this.isProcessingTurn) {
      return 'battle> ';
    }
    return '';
  }

  async initialize(): Promise<void> {
    this.registerBattleCommands();
    this.showBattleStatus();
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
  }

  private async showHelp(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player' || this.isProcessingTurn) {
      return {
        success: false,
        message: 'Commands not available during enemy turn or processing',
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
    const actionPoints = this.battle.calculatePlayerActionPoints();
    const currentTurnActor = this.battle.getCurrentTurnActor();
    const turnInfo = currentTurnActor === 'player' ? 'Your Turn' : "Enemy's Turn";

    const output = [
      `=== BATTLE STATUS ===`,
      `Turn: ${this.battle.currentTurn} (${turnInfo})`,
      '',
      `🗡️ ${this.player.getName()}`,
      `  HP: ${playerStats.getCurrentHP()}/${playerStats.getMaxHP()}`,
      `  MP: ${playerStats.getCurrentMP()}/${playerStats.getMaxMP()}`,
      `  Action Points: ${actionPoints}`,
      '',
      `👹 ${this.enemy.name}`,
      `  HP: ${this.enemy.currentHp}/${this.enemy.stats.maxHp}`,
      `  MP: ${this.enemy.currentMp}/${this.enemy.stats.maxMp}`,
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
   * スキル選択フェーズに移行
   */
  private async enterSkillSelection(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player' || this.isProcessingTurn) {
      return {
        success: false,
        message: "It's not your turn or turn is being processed!",
      };
    }

    if (!this.battle) {
      return {
        success: false,
        message: 'Battle not initialized',
      };
    }

    this.isProcessingTurn = true;

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
  public handleBattleTypingComplete(result: BattleTypingResult): void {
    console.log('\n=== BATTLE TYPING COMPLETE ===');
    console.log(`Completed ${result.completedSkills}/${result.totalSkills} skills`);
    console.log(`Total Damage: ${result.summary.totalDamageDealt}`);

    if (result.battleEnded) {
      const battleEnd = this.battle?.checkBattleEnd();
      if (battleEnd) {
        this.endBattle(battleEnd);
      }
    } else {
      this.finishPlayerTurn();
    }
  }

  /**
   * アイテム選択フェーズに移行
   */
  private async enterItemSelection(): Promise<CommandResult> {
    if (this.battle?.getCurrentTurnActor() !== 'player' || this.isProcessingTurn) {
      return {
        success: false,
        message: "It's not your turn or turn is being processed!",
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
    if (this.battle?.getCurrentTurnActor() !== 'player' || this.isProcessingTurn) {
      return {
        success: false,
        message: "It's not your turn!",
      };
    }

    // 逃走用のBattleTypingPhaseに遷移する設計も可能
    // 現在は簡単な実装
    this.turnMessage = 'You tried to escape but failed!';
    // setTimeout(() => this.executeEnemyTurn(), 1000);

    return {
      success: true,
      message: this.turnMessage,
    };
  }

  private cancelPlayerTurn(): void {
    this.isProcessingTurn = false;
  }

  private finishPlayerTurn(): void {
    if (!this.battle) return;

    // 勝敗判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      this.endBattle(battleEnd);
      return;
    }

    // 敵ターンに移行
    this.battle.nextTurn();
    global.setTimeout(() => this.executeEnemyTurn(), 1500);
  }

  private executeEnemyTurn(): void {
    if (!this.battle || !this.enemy || !this.player) return;

    console.log('\n=== ENEMY TURN ===');

    // 敵のスキル選択と実行をBattleActionExecutorで処理
    const selectedSkill = this.enemy.selectSkill() || Battle.getNormalAttackSkill();

    // MP消費チェック - 足りない場合は通常攻撃
    const skillToUse =
      this.enemy.currentMp < selectedSkill.mpCost ? Battle.getNormalAttackSkill() : selectedSkill;

    const result = BattleActionExecutor.executeEnemySkill(skillToUse, this.enemy, this.player);

    this.turnMessage = result.message;
    console.log(result.message);

    // 勝敗判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      this.endBattle(battleEnd);
      return;
    }

    // プレイヤーターンに移行（入力待ち状態）
    this.battle.nextTurn();
    this.isProcessingTurn = false;

    // プレイヤーターン開始 - ステータス表示は基底クラスのstartInputLoopで行う
  }

  /**
   * 入力処理ループを開始
   * @returns Phase遷移が必要な場合はCommandResultを返す
   */
  async startInputLoop(): Promise<CommandResult | null> {
    // バトルが既に終了している場合は即座にExplorationPhaseに遷移
    if (!this.battle?.isActive) {
      return {
        success: true,
        message: 'Battle has ended, returning to exploration',
        nextPhase: 'exploration',
        data: {
          world: this.world,
          player: this.player,
        },
      };
    }

    // プレイヤーターンの場合はバトルステータスを表示
    if (this.battle?.getCurrentTurnActor() === 'player' && !this.isProcessingTurn) {
      const statusResult = await this.showBattleStatus();
      if (statusResult.output) {
        console.log('\n' + statusResult.output.join('\n'));
      }
      console.log('\nWhat will you do? (Type "help" for commands)');
    }

    // 基底クラスの入力ループを使用
    return super.startInputLoop();
  }

  private endBattle(battleEnd: { winner: 'player' | 'enemy'; message: string }): void {
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

    this.battle.end();

    // バトル状態をリセット
    this.battle = null;
    this.enemy = undefined;
    // Turn management is now handled by Battle class
    this.turnMessage = '';
    this.isProcessingTurn = false;

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

  /**
   * 戦闘を開始
   */
  async startBattle(enemy: Enemy): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    this.enemy = enemy;
    this.battle = new Battle(this.player, enemy);
    const message = this.battle.start();

    this.isProcessingTurn = false;

    console.log(`\n${message}`);

    if (this.battle.getCurrentTurnActor() === 'enemy') {
      // 敵が先攻の場合は1秒後に敵ターンを実行
      console.log('Enemy goes first...');
      global.setTimeout(() => this.executeEnemyTurn(), 1000);
    }

    return {
      success: true,
      message: message,
      output: [
        '',
        this.battle.getCurrentTurnActor() === 'player'
          ? 'Your turn! Use "skill" to attack or "help" for commands.'
          : 'Enemy goes first...',
      ],
    };
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
    this.isProcessingTurn = false;
  }
}
