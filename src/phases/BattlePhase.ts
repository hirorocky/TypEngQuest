import { Phase } from '../core/Phase';
import { CommandResult, PhaseType, PhaseTypes } from '../core/types';
import { Battle } from '../battle/Battle';
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
  private currentTurn: 'player' | 'enemy' | 'waiting' = 'waiting';
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
    if (this.currentTurn === 'player' && !this.isProcessingTurn) {
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
    if (this.currentTurn !== 'player' || this.isProcessingTurn) {
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
    if (this.currentTurn !== 'player' || this.isProcessingTurn) {
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
      this.checkAndEndBattle();
    } else {
      this.finishPlayerTurn();
    }
  }

  /**
   * アイテム選択フェーズに移行
   */
  private async enterItemSelection(): Promise<CommandResult> {
    if (this.currentTurn !== 'player' || this.isProcessingTurn) {
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
    if (this.currentTurn !== 'player' || this.isProcessingTurn) {
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
    // setTimeout(() => this.executeEnemyTurn(), 1500);
  }

  private executeEnemyTurn(): void {
    if (!this.battle) return;

    console.log('\n=== ENEMY TURN ===');

    const enemyResult = this.battle.enemyAction();
    this.turnMessage = enemyResult.message;
    console.log(enemyResult.message);

    // 敵ターン終了後、プレイヤーHPチェック
    if (this.player && this.player.getBodyStats().getCurrentHP() <= 0) {
      console.log('\n💀 You have been defeated!');
      this.endBattle({ winner: 'enemy', message: 'You have been defeated!' });
      return;
    }

    // 勝敗判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      this.endBattle(battleEnd);
      return;
    }

    // プレイヤーターンに移行
    this.battle.nextTurn();
    this.currentTurn = 'player';
    this.isProcessingTurn = false;

    // バトルステータスを表示
    this.showBattleStatus().then(result => {
      if (result.output) {
        console.log('\n' + result.output.join('\n'));
      }
      console.log('\nWhat will you do? (Type "help" for commands)');
    });
  }

  private checkAndEndBattle(): void {
    if (!this.battle) return;

    // 敵のHP確認
    if (this.enemy && this.enemy.currentHp <= 0) {
      this.endBattle({ winner: 'player', message: 'Victory! Enemy has been defeated!' });
      return;
    }

    // プレイヤーのHP確認
    if (this.player && this.player.getBodyStats().getCurrentHP() <= 0) {
      this.endBattle({ winner: 'enemy', message: 'Defeat! You have been defeated!' });
      return;
    }

    // Battle.checkBattleEndによる判定
    const battleEnd = this.battle.checkBattleEnd();
    if (battleEnd) {
      this.endBattle(battleEnd);
    }
  }

  private endBattle(battleEnd: { winner: 'player' | 'enemy'; message: string }): void {
    if (!this.battle) return;

    // 既にバトルが終了している場合は何もしない
    if (!this.battle.isActive) return;

    console.log(`\n=== BATTLE END ===`);
    console.log(battleEnd.message);

    const battleResult = this.battle.getBattleResult();

    if (battleEnd.winner === 'player' && battleResult?.victory) {
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
    this.currentTurn = 'waiting';
    this.turnMessage = '';
    this.isProcessingTurn = false;

    // 探索フェーズに戻る
    console.log('\nReturning to exploration...');
    this.transitionToExploration();
  }

  private transitionToExploration(): void {
    // Game.jsでフェーズ遷移を処理する必要がある
    console.log('Battle completed. Returning to exploration phase...');

    // TODO: Implement proper phase transition through Game class
    // This would typically be handled by the Game class managing phases
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

    // 最初のターンアクターを設定
    this.currentTurn = this.battle.getCurrentTurnActor();
    this.isProcessingTurn = false;

    console.log(`\n${message}`);

    if (this.currentTurn === 'enemy') {
      // 敵が先攻の場合は敵ターンを実行
      // setTimeout(() => this.executeEnemyTurn(), 1000);
    }

    return {
      success: true,
      message: message,
      output: [
        '',
        this.currentTurn === 'player'
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
    this.currentTurn = battle.getCurrentTurnActor();
    this.isProcessingTurn = false;
  }
}
