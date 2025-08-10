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
  onSkillsSelected: (skills: Skill[]) => void;
  onBack: () => void;
  world?: World;
  tabCompleter?: TabCompleter;
}

/**
 * SkillSelectionPhaseクラス - 戦闘時のスキル選択フェーズ
 */
export class SkillSelectionPhase extends Phase {
  private player: Player;
  private battle: Battle;
  private onSkillsSelected: (skills: Skill[]) => void;
  private onBack: () => void;
  private availableSkills: Skill[] = [];
  private selectedSkills: Skill[] = [];
  private currentIndex: number = 0;
  private isRawModeEnabled: boolean = false;

  constructor(options: SkillSelectionOptions) {
    super(options.world, options.tabCompleter);
    this.player = options.player;
    this.battle = options.battle;
    this.onSkillsSelected = options.onSkillsSelected;
    this.onBack = options.onBack;
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

    const command = input.trim().toLowerCase();
    return this.handleCommand(command);
  }
  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    if (this.player) {
      this.availableSkills = this.player.getAllAvailableSkills();

      // Raw modeを有効にしてキーボードイベントを取得
      this.enableRawMode();
      this.renderUI();
      this.setupKeyboardHandlers();
    }
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
        this.goBack();
        break;
      case '\r': // Enter
      case '\n':
        this.confirmSelection();
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
   * 選択確定
   */
  private confirmSelection(): void {
    if (this.selectedSkills.length === 0) {
      this.renderUI('No skills selected!');
      return;
    }

    this.disableRawMode();

    // BattlePhaseに戻って選択されたスキルでバトル処理を実行
    // 一時的にコールバックを呼び出し（後でフェーズ遷移システムに統合予定）
    this.onSkillsSelected(this.selectedSkills);
  }

  /**
   * 戻る
   */
  private goBack(): void {
    this.disableRawMode();
    this.onBack();
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
