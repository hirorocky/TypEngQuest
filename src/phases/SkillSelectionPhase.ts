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
  exMode?: 'focus' | 'spark';
  sparkRepeatHint?: number;
}

/**
 * SkillSelectionPhaseクラス - 戦闘時のスキル選択フェーズ
 * リッチなキー入力UIでスキル選択: ↑↓: スキル選択, →: 追加, ←: 削除, Enter: 確定, Q: 戻る
 */
export class SkillSelectionPhase extends Phase {
  private player: Player;
  private battle: Battle;
  private availableSkills: Skill[] = [];
  private selectedSkills: Skill[] = [];
  private currentIndex: number = 0;
  private isActive: boolean = true;
  private exMode: 'focus' | 'spark' | undefined;
  private sparkRepeatHint: number | undefined;

  constructor(options: SkillSelectionOptions) {
    super(options.world, options.tabCompleter);
    this.player = options.player;
    this.battle = options.battle;
    this.exMode = options.exMode;
    this.sparkRepeatHint = options.sparkRepeatHint;
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
   * 初期化処理
   */
  async initialize(): Promise<void> {
    if (this.player) {
      this.availableSkills = this.player.getAllAvailableSkills();
      if (this.exMode === 'focus') {
        // Focus: 表示上のコストも最小化
        this.availableSkills = this.availableSkills.map(s => ({
          ...s,
          actionCost: 1,
          mpCost: 0,
          typingDifficulty: 1,
        }));
      }
      if (this.exMode === 'spark') {
        // Spark: 1スキル選択のみを促す（UIメッセージのみ/検証はconfirmで）
      }
      this.renderUI();
    }
  }

  /**
   * リッチUI用の入力処理ループ
   */
  async startInputLoop(): Promise<CommandResult | null> {
    // テスト環境では自動終了
    if (process.env.NODE_ENV === 'test' && process.env.DEBUG_UI !== 'true') {
      return {
        success: true,
        message: 'Skill selection completed (test mode)',
        nextPhase: 'battleTyping',
        data: {
          battle: this.battle,
          skills: this.selectedSkills,
          transitionReason: 'skillsSelected',
        },
      };
    }

    this.isActive = true;

    // raw modeを有効にしてキー入力を直接取得
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
    process.stdin.resume();

    return new Promise(resolve => {
      const handleKeyInput = (key: string) => {
        if (!this.isActive) {
          return;
        }

        const result = this.processKeyInput(key);

        if (result) {
          // raw modeを無効にして入力処理を終了
          if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
          }
          process.stdin.removeListener('data', handleKeyInput);
          this.isActive = false;
          resolve(result);
        }
      };

      process.stdin.on('data', handleKeyInput);
    });
  }

  /**
   * キー入力を処理してCommandResultを返す
   */
  private processKeyInput(key: string): CommandResult | null {
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
      case '\r': // Enter
      case '\n':
        return this.confirmSelection();
      case 'q':
      case 'Q':
        return this.goBack();
      case '\u0003': // Ctrl+C
        this.handleExit();
        break;
    }
    return null;
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

    if (this.exMode === 'spark' && this.selectedSkills.length >= 1) {
      this.renderUI('Spark Mode allows selecting only one skill');
      return;
    }

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
  private confirmSelection(): CommandResult | null {
    if (this.selectedSkills.length === 0) {
      this.renderUI('No skills selected!');
      return null; // UIを更新して続行
    }
    let skills = this.selectedSkills;
    const exMode: 'focus' | 'spark' | undefined = this.exMode;

    if (this.exMode === 'focus') {
      // コスト/難易度を最小化したコピーを渡す
      skills = skills.map(s => ({ ...s, actionCost: 1, mpCost: 0, typingDifficulty: 1 }));
    }
    if (this.exMode === 'spark') {
      // 1スキルを複数回実行（最小実装: ヒント回数または3回）
      const repeat = Math.max(1, Math.min(10, this.sparkRepeatHint ?? 3));
      skills = Array.from({ length: repeat }, () => ({ ...skills[0] }));
    }

    return {
      success: true,
      message: 'Skills selected, transitioning to battle typing...',
      nextPhase: 'battleTyping',
      data: {
        battle: this.battle,
        skills,
        transitionReason: 'skillsSelected',
        exMode,
      },
    };
  }

  /**
   * 戻る
   */
  private goBack(): CommandResult {
    return {
      success: true,
      message: 'Returning to battle...',
      nextPhase: 'battle',
      data: {
        battle: this.battle,
        transitionReason: 'back',
      },
    };
  }

  /**
   * 終了処理
   */
  private handleExit(): void {
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
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
    if (this.exMode === 'focus') {
      console.log('\nMode: Focus (all skills AC=1, MP=0, min difficulty; stop on fail)');
    }
    if (this.exMode === 'spark') {
      console.log('\nMode: Spark (select one skill; repeats a few times)');
    }
  }

  /**
   * クリーンアップ
   */
  async cleanup(): Promise<void> {
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
    this.isActive = false;
  }
}
