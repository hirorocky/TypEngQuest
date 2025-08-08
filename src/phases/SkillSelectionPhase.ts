import { Phase } from '../core/Phase';
import { World } from '../world/World';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { Player } from '../player/Player';
import { Skill } from '../battle/Skill';
import { TabCompleter } from '../core/completion';

interface SkillSelectionOptions {
  player: Player;
  onSkillSelected: (skill: Skill) => void;
  onBack: () => void;
  world?: World;
  tabCompleter?: TabCompleter;
}

/**
 * SkillSelectionPhaseクラス - 戦闘時のスキル選択フェーズ
 */
export class SkillSelectionPhase extends Phase {
  private player: Player;
  private onSkillSelected: (skill: Skill) => void;
  private onBack: () => void;
  private availableSkills: Skill[] = [];

  constructor(options: SkillSelectionOptions) {
    super(options.world, options.tabCompleter);
    this.player = options.player;
    this.onSkillSelected = options.onSkillSelected;
    this.onBack = options.onBack;
  }

  /**
   * フェーズタイプを取得
   */
  getType(): PhaseType {
    return PhaseTypes.SKILL_SELECTION;
  }

  /**
   * プロンプトを取得
   */
  getPrompt(): string {
    return 'skill> ';
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    if (this.player) {
      this.availableSkills = this.player.getAllAvailableSkills();
    }
    this.registerSkillSelectionCommands();
  }

  /**
   * スキル選択用コマンドを登録
   */
  private registerSkillSelectionCommands(): void {
    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show skill selection commands',
      execute: async () => this.showHelp(),
    });

    this.registerCommand({
      name: 'list',
      aliases: ['ls', 'skills'],
      description: 'Show available skills',
      execute: async () => this.showAvailableSkills(),
    });

    this.registerCommand({
      name: 'status',
      description: 'Show player MP status',
      execute: async () => this.showPlayerStatus(),
    });

    this.registerCommand({
      name: 'back',
      aliases: ['return'],
      description: 'Go back to battle menu',
      execute: async () => this.goBack(),
    });
  }

  /**
   * 入力処理
   */
  async processInput(input: string): Promise<CommandResult> {
    const trimmed = input.trim();

    // 数字の場合はスキル番号として処理
    const skillIndex = parseInt(trimmed);
    if (!isNaN(skillIndex) && skillIndex >= 1 && skillIndex <= this.availableSkills.length) {
      return this.selectSkillByIndex(skillIndex - 1);
    }

    // スキル名として処理を試行
    const skill = this.availableSkills.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if (skill) {
      return this.selectSkill(skill);
    }

    // 通常のコマンド処理
    return super.processInput(input);
  }

  /**
   * ヘルプを表示
   */
  private async showHelp(): Promise<CommandResult> {
    return {
      success: true,
      message: 'Skill Selection Commands:',
      output: [
        '  help - Show this help',
        '  list - Show available skills',
        '  status - Show MP status',
        '  back - Go back to battle menu',
        '  <number> - Select skill by number',
        '  <skill_name> - Select skill by name',
      ],
    };
  }

  /**
   * 利用可能なスキルを表示
   */
  private async showAvailableSkills(): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    if (this.availableSkills.length === 0) {
      return {
        success: true,
        message: 'No skills available',
      };
    }

    const currentMP = this.player.getBodyStats().getCurrentMP();
    const skillList = this.availableSkills.map((skill, index) => {
      const canUse = skill.mpCost <= currentMP ? '' : ' (Insufficient MP)';
      return `  ${index + 1}. ${skill.name} - Cost: ${skill.mpCost} MP${canUse}`;
    });

    return {
      success: true,
      message: 'Available skills:',
      output: skillList,
    };
  }

  /**
   * プレイヤーステータスを表示
   */
  private async showPlayerStatus(): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    const stats = this.player.getBodyStats();
    return {
      success: true,
      message: 'Player Status:',
      output: [`  MP: ${stats.getCurrentMP()}/${stats.getMaxMP()}`],
    };
  }

  /**
   * 前のフェーズに戻る
   */
  private async goBack(): Promise<CommandResult> {
    if (this.onBack) {
      this.onBack();
    }
    return {
      success: true,
      message: 'Returning to battle menu...',
    };
  }

  /**
   * インデックスでスキルを選択
   */
  private async selectSkillByIndex(index: number): Promise<CommandResult> {
    if (index < 0 || index >= this.availableSkills.length) {
      return {
        success: false,
        message: 'Invalid skill number',
      };
    }

    return this.selectSkill(this.availableSkills[index]);
  }

  /**
   * スキルを選択
   */
  private async selectSkill(skill: Skill): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    const currentMP = this.player.getBodyStats().getCurrentMP();
    if (skill.mpCost > currentMP) {
      return {
        success: false,
        message: `Cannot use ${skill.name}: insufficient MP (need ${skill.mpCost}, have ${currentMP})`,
      };
    }

    if (this.onSkillSelected) {
      this.onSkillSelected(skill);
    }

    return {
      success: true,
      message: `Selected skill: ${skill.name}`,
    };
  }
}
