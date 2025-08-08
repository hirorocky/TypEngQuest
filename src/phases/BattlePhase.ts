import { Phase } from '../core/Phase';
import { World } from '../world/World';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { Battle } from '../battle/Battle';
import { Enemy } from '../battle/Enemy';
import { Player } from '../player/Player';
import { Skill } from '../battle/Skill';
import { TabCompleter } from '../core/completion';

/**
 * BattlePhaseクラス - 戦闘フェーズの制御を行う
 */
export class BattlePhase extends Phase {
  private battle: Battle | null = null;
  private player?: Player; // プレイヤーインスタンスを保持

  constructor(world?: World, tabCompleter?: TabCompleter, player?: Player) {
    super(world, tabCompleter);
    this.player = player;
  }

  /**
   * フェーズタイプを取得
   */
  getType(): PhaseType {
    return PhaseTypes.BATTLE;
  }

  /**
   * プロンプトを取得
   */
  getPrompt(): string {
    return 'battle> ';
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    this.registerBattleCommands();
  }

  /**
   * 戦闘用コマンドを登録
   */
  private registerBattleCommands(): void {
    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show battle commands',
      execute: async () => this.showHelp(),
    });

    this.registerCommand({
      name: 'status',
      description: 'Show battle status',
      execute: async () => this.showBattleStatus(),
    });

    this.registerCommand({
      name: 'skill',
      aliases: ['skills'],
      description: 'Select and use a skill',
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

  /**
   * ヘルプを表示
   */
  private async showHelp(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Available battle commands:',
      output: [
        '  help - Show this help',
        '  status - Show battle status',
        '  skill - Select and use a skill',
        '  item - Use an item',
        '  run - Attempt to escape',
      ],
    };
  }

  /**
   * 戦闘ステータスを表示
   */
  private async showBattleStatus(): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'player not available',
      };
    }

    const playerStats = this.player.getBodyStats();
    return {
      success: true,
      message: 'Battle Status',
      output: [
        `Player HP: ${playerStats.getCurrentHP()}/${playerStats.getMaxHP()}`,
        `Player MP: ${playerStats.getCurrentMP()}/${playerStats.getMaxMP()}`,
      ],
    };
  }

  /**
   * 利用可能なスキルを表示
   */
  /**
   * 利用可能なスキルを表示（廃止予定 - skillコマンドでフェーズ遷移を使用）
   */
  private async showAvailableSkills(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Use "skill" command to select and use skills',
      output: ['Skill selection has been moved to a dedicated phase'],
    };
  }

  /**
   * 逃走を試みる
   */
  private async attemptEscape(): Promise<CommandResult> {
    return {
      success: true,
      message: 'You cannot escape from this battle!',
    };
  }

  /**
   * スキル選択フェーズに移行
   */
  private async enterSkillSelection(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Entering skill selection...',
      nextPhase: 'skillSelection',
      data: {
        battle: this.getBattle(),
        onSkillsSelected: (skills: Skill[]) => {
          console.log(`Selected ${skills.length} skills for battle!`);
          // TODO: スキル選択後の処理を実装
        },
        onBack: () => {
          console.log('Returned from skill selection');
          // TODO: 戻る処理を実装
        },
      },
    };
  }

  /**
   * アイテム選択フェーズに移行
   */
  private async enterItemSelection(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Entering item selection...',
      nextPhase: 'battleItemConsumption',
    };
  }

  /**
   * 戦闘を開始
   * @param enemy 戦う敵
   */
  async startBattle(enemy: Enemy): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'player not available',
      };
    }

    this.battle = new Battle(this.player, enemy);
    const message = this.battle.start();

    return {
      success: true,
      message: message,
      output: ['', 'Battle started! Use "help" to see available commands.'],
    };
  }

  /**
   * 戦闘状態を確認
   */
  private getBattle(): Battle {
    if (!this.battle) {
      throw new Error('Battle not initialized');
    }
    return this.battle;
  }
}
