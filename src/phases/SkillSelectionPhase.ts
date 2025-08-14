import { Phase } from '../core/Phase';
import { World } from '../world/World';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { Player } from '../player/Player';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { TabCompleter } from '../core/completion';

interface SkillSelectionOptions {
  player: Player;
  battle: Battle;
  world?: World;
  tabCompleter?: TabCompleter;
}

/**
 * SkillSelectionPhaseクラス - 戦闘時のスキル選択フェーズ
 */
export class SkillSelectionPhase extends Phase {
  private player: Player;
  private battle: Battle;
  private availableSkills: Skill[] = [];
  private selectedSkills: Skill[] = [];
  private currentIndex: number = 0;
  private isRawModeEnabled: boolean = false;

  constructor(options: SkillSelectionOptions) {
    super(options.world, options.tabCompleter);
    this.player = options.player;
    this.battle = options.battle;
  }

  /**
   * フェーズタイプを取得
   */
  getType(): PhaseType {
    return PhaseTypes.SKILL_SELECTION;
  }

  /**
   * プロンプトを取得（リッチUIでは使用しない）
   */
  getPrompt(): string {
    return 'skill> ';
  }

  /**
   * テスト用のコマンド入力処理
   */
  async processInput(input: string): Promise<CommandResult> {
    if (!this.player) {
      return {
        success: false,
        message: 'Player not available',
      };
    }

    const trimmedInput = input.trim();

    // 数字入力でスキル選択
    const skillIndex = parseInt(trimmedInput, 10);
    if (!isNaN(skillIndex) && skillIndex > 0 && skillIndex <= this.availableSkills.length) {
      const skill = this.availableSkills[skillIndex - 1];

      // MP不足チェック
      const currentMP = this.player.getBodyStats().getCurrentMP();
      if (currentMP < skill.mpCost) {
        return {
          success: false,
          message: `Not enough MP for ${skill.name} (Requires: ${skill.mpCost}, Current: ${currentMP})`,
        };
      }

      this.selectedSkills.push(skill);
      this.disableRawMode();

      // フェーズ遷移を返す
      return {
        success: true,
        message: `Selected ${skill.name}`,
        nextPhase: 'battleTyping',
        data: {
          battle: this.battle,
          skills: this.selectedSkills,
          transitionReason: 'skillsSelected',
        },
      };
    }

    // スキル名で選択
    const skill = this.availableSkills.find(
      s => s.name.toLowerCase() === trimmedInput.toLowerCase()
    );
    if (skill) {
      // MP不足チェック
      const currentMP = this.player.getBodyStats().getCurrentMP();
      if (currentMP < skill.mpCost) {
        return {
          success: false,
          message: `Not enough MP for ${skill.name} (Requires: ${skill.mpCost}, Current: ${currentMP})`,
        };
      }

      this.selectedSkills.push(skill);
      this.disableRawMode();

      // フェーズ遷移を返す
      return {
        success: true,
        message: `Selected ${skill.name}`,
        nextPhase: 'battleTyping',
        data: {
          battle: this.battle,
          skills: this.selectedSkills,
          transitionReason: 'skillsSelected',
        },
      };
    }

    // 親クラスのprocessInputを使用（コマンド処理）
    const result = await super.processInput(input);
    if (result.success) {
      return result;
    }

    // コマンドでもスキルでもない場合
    return {
      success: false,
      message: 'Unknown command or skill. Type "help" for available commands.',
    };
  }
  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    if (this.player) {
      this.availableSkills = this.player.getAllAvailableSkills();

      // コマンドを登録
      this.registerCommands();

      // Raw modeを有効にしてキーボードイベントを取得
      this.enableRawMode();
      this.renderUI();
      this.setupKeyboardHandlers();
    }
  }

  /**
   * コマンドを登録
   */
  private registerCommands(): void {
    this.registerCommand({
      name: 'list',
      aliases: ['l'],
      description: 'Show available skills',
      execute: async () => this.listSkills(),
    });

    this.registerCommand({
      name: 'help',
      aliases: ['h', '?'],
      description: 'Show available commands',
      execute: async () => this.showHelp(),
    });

    this.registerCommand({
      name: 'back',
      aliases: ['b', 'return'],
      description: 'Return to battle',
      execute: async () => {
        this.disableRawMode();
        return {
          success: true,
          message: 'Returning to battle...',
          nextPhase: 'battle',
          data: {
            battle: this.battle,
            transitionReason: 'back',
          },
        };
      },
    });

    this.registerCommand({
      name: 'status',
      aliases: ['s'],
      description: 'Show player status',
      execute: async () => this.showStatus(),
    });
  }

  private async listSkills() {
    if (this.availableSkills.length === 0) {
      return { success: true, message: 'No skills available' };
    }

    const output = this.availableSkills.map(
      (skill, index) => `  ${index + 1}. ${skill.name} (MP: ${skill.mpCost})`
    );

    return {
      success: true,
      message: 'Available skills:',
      output,
    };
  }

  private async showHelp() {
    return {
      success: true,
      message: 'Available commands:',
      output: [
        '  list - Show available skills',
        '  back - Return to battle',
        '  status - Show player MP',
        '  help - Show this help',
      ],
    };
  }

  private async showStatus() {
    const bodyStats = this.player?.getBodyStats();
    const mp = bodyStats?.getCurrentMP() || 0;
    const maxMp = bodyStats?.getMaxMP() || 0;

    return {
      success: true,
      message: 'Player Status:',
      output: [`  MP: ${mp}/${maxMp}`],
    };
  }

  /**
   * Raw modeを有効にする
   */
  private enableRawMode(): void {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      this.isRawModeEnabled = true;
    }
  }

  /**
   * Raw modeを無効にする
   */
  private disableRawMode(): void {
    if (this.isRawModeEnabled && process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
      this.isRawModeEnabled = false;
    }
  }

  /**
   * キーボードハンドラーを設定
   */
  private setupKeyboardHandlers(): void {
    process.stdin.on('data', (key: Buffer) => {
      const keyStr = key.toString();
      this.handleKeyInput(keyStr);
    });
  }

  /**
   * キー入力を処理
   */
  private handleKeyInput(key: string): void {
    switch (key) {
      case '\u001b[A': // 上矢印
        this.moveUp();
        break;
      case '\u001b[B': // 下矢印
        this.moveDown();
        break;
      case '\u001b[C': // 右矢印
        this.addSkill();
        break;
      case '\u001b[D': // 左矢印
        this.removeLastSkill();
        break;
      case 'q':
        // qキーでbackコマンドを実行
        this.processInput('back');
        break;
      case '\r': // Enter
      case '\n':
        // Enterキーは無視（コマンド入力で処理）
        break;
      case '\u0003': // Ctrl+C
        this.handleExit();
        break;
    }
  }

  /**
   * カーソルを上に移動
   */
  private moveUp(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderUI();
    }
  }

  /**
   * カーソルを下に移動
   */
  private moveDown(): void {
    if (this.currentIndex < this.availableSkills.length - 1) {
      this.currentIndex++;
      this.renderUI();
    }
  }

  /**
   * 現在のスキルを選択リストに追加
   */
  private addSkill(): void {
    const skill = this.availableSkills[this.currentIndex];
    if (!skill) return;

    // MP足りているかチェック
    const totalMpCost = this.selectedSkills.reduce((sum, s) => sum + s.mpCost, 0) + skill.mpCost;
    const currentMP = this.player.getBodyStats().getCurrentMP();

    if (totalMpCost > currentMP) {
      this.renderUI('Insufficient MP!');
      return;
    }

    // 行動ポイント足りているかチェック
    const totalActionCost =
      this.selectedSkills.reduce((sum, s) => sum + s.actionCost, 0) + skill.actionCost;
    const actionPoints = this.battle.calculatePlayerActionPoints();

    if (totalActionCost > actionPoints) {
      this.renderUI('Insufficient Action Points!');
      return;
    }

    this.selectedSkills.push(skill);
    this.renderUI();
  }

  /**
   * 最後に選択したスキルを削除
   */
  private removeLastSkill(): void {
    if (this.selectedSkills.length > 0) {
      this.selectedSkills.pop();
      this.renderUI();
    }
  }

  /**
   * 終了処理
   */
  private handleExit(): void {
    this.disableRawMode();
    process.exit(0);
  }

  /**
   * UIをレンダリング
   */
  private renderUI(errorMessage?: string): void {
    // 画面をクリア
    console.clear();

    // タイトル
    console.log('\n🗡️  SKILL SELECTION 🗡️\n');

    // プレイヤーステータス表示
    this.renderPlayerStatus();

    // エラーメッセージ表示
    if (errorMessage) {
      console.log(`\n❌ ${errorMessage}\n`);
    }

    // スキルリスト表示
    this.renderSkillList();

    // 選択されたスキル表示
    this.renderSelectedSkills();

    // ヘルプ表示
    this.renderHelp();
  }

  /**
   * プレイヤーステータスを表示
   */
  private renderPlayerStatus(): void {
    const stats = this.player.getBodyStats();
    const actionPoints = this.battle.calculatePlayerActionPoints();
    const usedActionPoints = this.selectedSkills.reduce((sum, skill) => sum + skill.actionCost, 0);
    const usedMP = this.selectedSkills.reduce((sum, skill) => sum + skill.mpCost, 0);

    console.log(
      `📊 Status: MP ${stats.getCurrentMP() - usedMP}/${stats.getMaxMP()} | Action Points ${actionPoints - usedActionPoints}/${actionPoints}\n`
    );
  }

  /**
   * スキルリストを表示
   */
  private renderSkillList(): void {
    console.log('Available Skills:');

    this.availableSkills.forEach((skill, index) => {
      const isSelected = index === this.currentIndex;
      const cursor = isSelected ? '► ' : '  ';
      const currentMP = this.player.getBodyStats().getCurrentMP();
      const usedMP = this.selectedSkills.reduce((sum, s) => sum + s.mpCost, 0);
      const availableMP = currentMP - usedMP;
      const canUseMP = skill.mpCost <= availableMP;

      const actionPoints = this.battle.calculatePlayerActionPoints();
      const usedActionPoints = this.selectedSkills.reduce((sum, s) => sum + s.actionCost, 0);
      const availableActionPoints = actionPoints - usedActionPoints;
      const canUseAP = skill.actionCost <= availableActionPoints;

      const canUse = canUseMP && canUseAP;
      const statusIcon = canUse ? '✅' : '❌';

      console.log(`${cursor}${statusIcon} ${skill.name}`);
      console.log(
        `     MP: ${skill.mpCost} | Action Cost: ${skill.actionCost} | ${skill.description}`
      );
    });

    console.log('');
  }

  /**
   * 選択されたスキルを表示
   */
  private renderSelectedSkills(): void {
    if (this.selectedSkills.length === 0) {
      console.log('Selected Skills: None\n');
      return;
    }

    console.log('Selected Skills:');
    this.selectedSkills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill.name} (MP: ${skill.mpCost}, AC: ${skill.actionCost})`);
    });
    console.log('');
  }

  /**
   * ヘルプを表示
   */
  private renderHelp(): void {
    console.log('Controls:');
    console.log('  ↑↓   Navigate skills');
    console.log('  →    Add skill to selection');
    console.log('  ←    Remove last selected skill');
    console.log('  Q    Go back');
    console.log('  Enter Confirm selection and start battle');
  }

  /**
   * クリーンアップ
   */
  async cleanup(): Promise<void> {
    this.disableRawMode();
  }
}
