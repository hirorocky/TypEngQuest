import { Phase } from '../core/Phase';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { World } from '../world/World';
import { TabCompleter } from '../core/completion/TabCompleter';
import { PhaseType, PhaseTypes } from '../core/types';
import { TypingResult } from '../typing/types';
import { BattleTypingResult } from './types';

/**
 * BattleTypingPhaseクラス - 戦闘時のタイピングチャレンジフェーズ
 * - TypingPhaseを継承
 * - 複数スキルの連続実行をサポート
 * - リアルタイムで戦闘状態を更新
 */
export class BattleTypingPhase extends Phase {
  private skills: Skill[];
  private battle: Battle;
  private currentSkillIndex: number = 0;

  // 結果サマリー
  private summary: {
    totalDamageDealt: number;
    totalHealing: number;
    totalMpRestored: number;
    statusEffectsApplied: string[];
    criticalHits: number;
    misses: number;
  };

  constructor(options: {
    skills: Skill[];
    battle: Battle;
    world?: World;
    tabCompleter?: TabCompleter;
  }) {
    super(options.world, options.tabCompleter);

    this.skills = options.skills;
    this.battle = options.battle;

    // サマリーを初期化
    this.summary = {
      totalDamageDealt: 0,
      totalHealing: 0,
      totalMpRestored: 0,
      statusEffectsApplied: [],
      criticalHits: 0,
      misses: 0,
    };
  }

  getType(): PhaseType {
    return PhaseTypes.BATTLE_TYPING;
  }

  getPrompt(): string {
    return 'typing> ';
  }

  async initialize(): Promise<void> {
    // Phase基底クラスの初期化は不要（abstractメソッドではない）
    this.startNextSkillChallenge();
  }

  /**
   * 次のスキルのタイピングチャレンジを開始
   */
  private startNextSkillChallenge(): void {
    if (this.currentSkillIndex >= this.skills.length) {
      this.completeAllChallenges();
      return;
    }

    const skill = this.skills[this.currentSkillIndex];
    console.log(
      `\n=== SKILL ${this.currentSkillIndex + 1}/${this.skills.length}: ${skill.name} ===`
    );
    console.log(`Description: ${skill.description}`);
    console.log(`MP Cost: ${skill.mpCost} | Difficulty: ${'★'.repeat(skill.typingDifficulty)}`);

    // タイピングチャレンジのテキストを生成
    const challengeText = this.generateChallengeText(skill);
    console.log(`\nType the following text:`);
    console.log(`"${challengeText}"`);

    // タイピングチャレンジを開始（TypingPhaseの機能を利用）
    this.startTypingChallenge(challengeText, skill);
  }

  /**
   * スキルに応じたタイピングテキストを生成
   */
  private generateChallengeText(skill: Skill): string {
    const difficultyTexts: { [key: number]: string[] } = {
      1: ['attack', 'strike', 'slash', 'hit'],
      2: ['powerful strike', 'critical hit', 'swift attack'],
      3: ['elemental magic', 'arcane power', 'mystical force'],
      4: ['thunderous lightning bolt', 'raging inferno blast'],
      5: ['catastrophic meteor storm', 'dimensional rift attack'],
    };

    const texts = difficultyTexts[skill.typingDifficulty] || difficultyTexts[1];
    return texts[Math.floor(Math.random() * texts.length)];
  }

  /**
   * タイピングチャレンジを開始（内部実装）
   */
  private startTypingChallenge(text: string, skill: Skill): void {
    const startTime = Date.now();
    let userInput = '';

    console.log('\n⏰ START TYPING NOW!');

    // キーボード入力の処理
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();

    const onKeyPress = (key: Buffer) => {
      const char = key.toString();

      // Ctrl+C で終了
      if (key[0] === 3) {
        process.exit(0);
      }

      // Enter で完了
      if (key[0] === 13) {
        stdin.removeListener('data', onKeyPress);
        stdin.setRawMode(false);

        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        this.evaluateTyping(skill, text, userInput, timeTaken);
        return;
      }

      // Backspace
      if (key[0] === 127 || key[0] === 8) {
        if (userInput.length > 0) {
          userInput = userInput.slice(0, -1);
          process.stdout.write('\b \b');
        }
        return;
      }

      // 通常の文字入力
      if (char.length === 1 && char.charCodeAt(0) >= 32) {
        userInput += char;
        process.stdout.write(char);
      }
    };

    stdin.on('data', onKeyPress);

    // タイムアウト処理（10秒）は現在無効化されています
    // TODO: タイムアウト処理を実装する場合はsetTimeoutを復活させる
  }

  /**
   * タイピング結果を評価してスキル効果を適用
   */
  private evaluateTyping(
    skill: Skill,
    targetText: string,
    userInput: string,
    timeTaken: number
  ): void {
    const accuracy = this.calculateAccuracy(targetText, userInput);
    const speed = this.calculateSpeed(targetText.length, timeTaken);

    console.log(`\n\n=== TYPING RESULT ===`);
    console.log(`Target:   "${targetText}"`);
    console.log(`Typed:    "${userInput}"`);
    console.log(`Time:     ${(timeTaken / 1000).toFixed(1)}s`);
    console.log(`Accuracy: ${(accuracy * 100).toFixed(1)}%`);

    const typingResult: TypingResult = {
      isSuccess: accuracy >= 0.8,
      accuracyRating: this.getAccuracyRating(accuracy),
      speedRating: this.getSpeedRating(speed),
      totalRating: Math.floor(accuracy * 100 + (speed > 1 ? 20 : 0)),
      timeTaken,
      accuracy: accuracy * 100,
    };

    // スキル効果を即座に適用（リアルタイム更新）
    this.applySkillEffect(skill, typingResult);

    // 次のスキルへ
    this.currentSkillIndex++;
    this.startNextSkillChallenge();
  }

  /**
   * スキル効果をリアルタイムで適用
   */
  private applySkillEffect(skill: Skill, typingResult: TypingResult): void {
    console.log(`\n⚔️ Executing ${skill.name}...`);

    // Battle.playerUseSkillを使用して効果を適用
    const result = this.battle.playerUseSkill(skill, typingResult);

    if (result.success) {
      console.log(`✅ ${result.message}`);

      // サマリーを更新
      if (result.damage) {
        this.summary.totalDamageDealt += result.damage;
        if (typingResult.accuracyRating === 'Perfect') {
          this.summary.criticalHits++;
        }
      }

      if (result.healing) {
        this.summary.totalHealing += result.healing;
      }

      if (result.mpRestored) {
        this.summary.totalMpRestored += result.mpRestored;
      }

      if (result.statusEffect) {
        this.summary.statusEffectsApplied.push(result.statusEffect);
      }
    } else {
      console.log(`❌ ${result.message}`);
      this.summary.misses++;
    }

    // 現在のHP/MPを表示
    const enemy = this.battle['enemy'];
    const player = this.battle['player'];

    if (enemy && player) {
      console.log(`Enemy HP: ${enemy.currentHp}/${enemy.stats.maxHp}`);
      console.log(
        `Player MP: ${player.getBodyStats().getCurrentMP()}/${player.getBodyStats().getMaxMP()}`
      );
    }
  }

  /**
   * 正確性を計算
   */
  private calculateAccuracy(target: string, input: string): number {
    if (target.length === 0) return 1;

    let matches = 0;
    const minLength = Math.min(target.length, input.length);

    for (let i = 0; i < minLength; i++) {
      if (target[i] === input[i]) {
        matches++;
      }
    }

    const lengthPenalty = Math.abs(target.length - input.length) / target.length;
    return Math.max(0, matches / target.length - lengthPenalty);
  }

  /**
   * 速度を計算（文字/秒）
   */
  private calculateSpeed(charCount: number, timeMs: number): number {
    return charCount / (timeMs / 1000);
  }

  /**
   * 正確性評価を取得
   */
  private getAccuracyRating(accuracy: number): 'Perfect' | 'Great' | 'Good' | 'Poor' {
    if (accuracy >= 0.95) return 'Perfect';
    if (accuracy >= 0.85) return 'Great';
    if (accuracy >= 0.7) return 'Good';
    return 'Poor';
  }

  /**
   * 速度評価を取得
   */
  private getSpeedRating(speed: number): 'S' | 'A' | 'B' | 'C' | 'F' {
    if (speed >= 3) return 'S';
    if (speed >= 2) return 'A';
    if (speed >= 1) return 'B';
    if (speed >= 0.5) return 'C';
    return 'F';
  }

  /**
   * 全チャレンジ完了時の処理
   */
  private completeAllChallenges(): void {
    console.log('\n=== ALL SKILLS COMPLETED ===');

    // 戦闘終了チェック
    const battleEnd = this.battle.checkBattleEnd();

    // 結果をまとめる
    const result: BattleTypingResult = {
      completedSkills: this.currentSkillIndex,
      totalSkills: this.skills.length,
      summary: this.summary,
      battleEnded: battleEnd !== null,
    };

    // サマリーを表示
    console.log('\n📊 BATTLE SUMMARY:');
    console.log(`Completed Skills: ${result.completedSkills}/${result.totalSkills}`);
    console.log(`Total Damage Dealt: ${result.summary.totalDamageDealt}`);
    console.log(`Total Healing: ${result.summary.totalHealing}`);
    console.log(`Total MP Restored: ${result.summary.totalMpRestored}`);
    console.log(`Critical Hits: ${result.summary.criticalHits}`);
    console.log(`Misses: ${result.summary.misses}`);

    if (result.summary.statusEffectsApplied.length > 0) {
      console.log(`Status Effects: ${result.summary.statusEffectsApplied.join(', ')}`);
    }

    // フェーズ遷移を通知
    this.notifyTransition({
      success: true,
      message: 'Battle typing completed',
      nextPhase: 'battle',
      data: {
        battle: this.battle,
        typingResult: result,
        transitionReason: 'typingComplete',
      },
    });

    // readlineインターフェースを終了してプロンプトを停止
    if (this.rl) {
      this.rl.close();
    }
  }
}
