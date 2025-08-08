import { Phase } from '../core/Phase';
import { World } from '../world/World';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { TypingChallenge } from '../typing/TypingChallenge';
import { TypingDifficulty } from '../typing/types';
import { Skill } from '../battle/Skill';
import { TabCompleter } from '../core/completion';

interface TypingResult {
  success: boolean;
  skill?: Skill;
}

interface SkillEffectResult {
  success: boolean;
  skillEffect: number;
  multiplier: number;
}

/**
 * BattleTypingPhaseクラス - 戦闘時のタイピングチャレンジフェーズ
 */
export class BattleTypingPhase extends Phase {
  private skill: Skill;
  private onComplete: (result: TypingResult) => void;
  private typingChallenge: TypingChallenge | null = null;
  private isActive: boolean = false;

  constructor(
    skill: Skill,
    onComplete: (result: TypingResult) => void,
    world?: World,
    tabCompleter?: TabCompleter
  ) {
    super(world, tabCompleter);
    this.skill = skill;
    this.onComplete = onComplete;
  }

  /**
   * フェーズタイプを取得
   */
  getType(): PhaseType {
    return PhaseTypes.BATTLE_TYPING;
  }

  /**
   * プロンプトを取得
   */
  getPrompt(): string {
    return 'typing> ';
  }

  /**
   * 初期化処理
   */
  async initialize(): Promise<void> {
    // タイピングチャレンジ初期化は startTypingChallenge で行う
  }

  /**
   * タイピングチャレンジを開始
   */
  async startTypingChallenge(): Promise<CommandResult> {
    const targetWord = this.getCurrentTargetWord();
    this.typingChallenge = new TypingChallenge(
      targetWord,
      this.skill.typingDifficulty as TypingDifficulty
    );
    this.typingChallenge.start();
    this.isActive = true;

    return {
      success: true,
      message: `Type the following word to cast ${this.skill.name}:`,
      output: [targetWord],
    };
  }

  /**
   * タイピング完了処理
   */
  async completeTyping(): Promise<void> {
    if (this.onComplete) {
      this.onComplete({ success: true, skill: this.skill });
    }
    this.isActive = false;
  }

  /**
   * タイピング結果を評価
   */
  async evaluateTypingResult(accuracy: string, speed: string): Promise<SkillEffectResult> {
    let multiplier = 1.0;

    if (accuracy === 'perfect' && speed === 'fast') {
      multiplier = 1.5; // 150%効果
    } else if (accuracy === 'perfect' || accuracy === 'great') {
      multiplier = 1.2; // 120%効果
    }

    // Skillインターフェースの構造に合わせて修正
    const baseEffect = this.skill.mpCharge || this.skill.mpCost || 0;
    const enhancedEffect = Math.floor(baseEffect * multiplier);

    return {
      success: true,
      skillEffect: enhancedEffect,
      multiplier,
    };
  }

  /**
   * 入力処理
   */
  async processInput(input: string): Promise<CommandResult> {
    if (!this.isActive) {
      return {
        success: false,
        message: 'Typing challenge not started',
      };
    }

    if (!this.typingChallenge) {
      return {
        success: false,
        message: 'Typing challenge not initialized',
      };
    }

    // TypingChallengeクラスを使って入力を処理
    this.typingChallenge.handleInput(input);
    const progress = this.typingChallenge.getProgress();

    if (this.typingChallenge.isComplete()) {
      // タイピング完了
      await this.completeTyping();
      return {
        success: true,
        message: 'Typing completed!',
      };
    }

    // 最後の文字が正しく入力されたかチェック
    const lastIndex = progress.input.length - 1;
    const isLastCorrect = !progress.errors.includes(lastIndex);

    return {
      success: isLastCorrect,
      message: isLastCorrect ? 'Correct!' : 'Incorrect input',
    };
  }

  /**
   * 現在のターゲット単語を取得
   */
  getCurrentTargetWord(): string {
    // スキル難易度に基づいて単語を生成
    const words = ['attack', 'fireball', 'lightning', 'heal', 'shield'];
    return words[Math.min(this.skill.typingDifficulty - 1, words.length - 1)] || 'attack';
  }

  /**
   * タイムアウト強制実行（テスト用）
   */
  async forceTimeout(): Promise<CommandResult> {
    this.isActive = false;
    return {
      success: false,
      message: 'Typing challenge timeout',
    };
  }
}
