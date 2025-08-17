import { Phase } from '../core/Phase';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { World } from '../world/World';
import { TabCompleter } from '../core/completion/TabCompleter';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { TypingResult, TypingDifficulty, TypingProgress } from '../typing/types';
import { BattleTypingResult } from './types';
import { TypingChallenge } from '../typing/TypingChallenge';
import { WordDatabase } from '../typing/WordDatabase';
import { Display } from '../ui/Display';
import { green, red, gray } from '../ui/colors';
import * as readline from 'readline';

export class BattleTypingPhase extends Phase {
  private skills: Skill[];
  private battle: Battle;
  private currentSkillIndex: number = 0;
  private currentChallenge: TypingChallenge | null = null;
  private wordDatabase: WordDatabase;

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
    this.wordDatabase = new WordDatabase();

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

  /**
   * フェーズ初期化
   */
  async initialize(): Promise<void> {
    // 最初のスキルチャレンジを開始
    this.startNextSkillChallenge();
  }

  /**
   * フェーズクリーンアップ
   */
  async cleanup(): Promise<void> {
    // 特別なクリーンアップは不要
  }

  /**
   * 入力処理ループを開始
   * @returns Phase遷移が必要な場合はCommandResultを返す
   */
  async startInputLoop(): Promise<CommandResult | null> {
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      // Raw modeを有効にして文字単位で入力を受け取る
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      const handleData = async (data: Buffer) => {
        const char = data.toString();
        const result = await this.handleInput(char);

        if (result?.nextPhase || result?.data?.cancelled) {
          // リスナーを削除してraw modeを無効化
          process.stdin.removeListener('data', handleData);
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          rl.close();
          resolve(result);
        }
      };

      process.stdin.on('data', handleData);
    });
  }

  /**
   * 入力処理（Enter キー不要のリアルタイム入力）
   * @param input - ユーザー入力（1文字）
   * @returns フェーズ結果
   */
  async handleInput(input: string): Promise<CommandResult | null> {
    // Escキーで中断
    if (input === '\x1b') {
      console.log('\nBattle typing cancelled');
      return {
        success: true,
        message: 'Battle typing cancelled',
        nextPhase: PhaseTypes.BATTLE,
        data: {
          cancelled: true,
          battle: this.battle,
        },
      };
    }

    // 現在のチャレンジがない場合は何もしない
    if (!this.currentChallenge) {
      return null;
    }

    // 入力をチャレンジに渡す
    this.currentChallenge.handleInput(input);

    // チャレンジ完了チェック
    if (this.currentChallenge.isComplete()) {
      const result = this.currentChallenge.getResult();
      this.displayResult(result);

      // スキル効果を適用
      const skill = this.skills[this.currentSkillIndex];
      this.applySkillEffect(skill, result);

      // 次のスキルへ
      this.currentSkillIndex++;
      this.currentChallenge = null;

      // 全スキル完了チェック
      if (this.currentSkillIndex >= this.skills.length) {
        return this.completeAllChallenges();
      }

      // 次のスキルチャレンジを開始（1秒後）
      // Note: setTimeoutの代わりに即座に開始
      this.startNextSkillChallenge();

      return null;
    }

    // 進捗表示
    this.displayProgress();

    return null;
  }

  /**
   * 次のスキルのタイピングチャレンジを開始
   */
  private startNextSkillChallenge(): void {
    if (this.currentSkillIndex >= this.skills.length) {
      return;
    }

    const skill = this.skills[this.currentSkillIndex];

    // スキル情報を表示
    Display.clear();
    console.log(
      `\n=== SKILL ${this.currentSkillIndex + 1}/${this.skills.length}: ${skill.name} ===`
    );
    console.log(`Description: ${skill.description}`);
    console.log(`MP Cost: ${skill.mpCost} | Difficulty: ${'★'.repeat(skill.typingDifficulty)}`);

    // タイピングチャレンジのテキストを生成
    const challengeText = this.wordDatabase.getRandomText(
      skill.typingDifficulty as TypingDifficulty
    );

    console.log(`\nType the following text:`);
    console.log(`"${challengeText}"`);
    console.log(gray('(Press ESC to cancel)\n'));

    // チャレンジを作成して開始
    this.currentChallenge = new TypingChallenge(
      challengeText,
      skill.typingDifficulty as TypingDifficulty
    );
    this.currentChallenge.start();
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

      // 敵のHPが0になったらバトル終了フラグを立てる
      if (enemy.currentHp <= 0) {
        console.log('\n💀 Enemy defeated!');
        // バトル終了を即座に処理せず、全スキル完了後に処理する
      }
    }
  }

  /**
   * 進捗を表示
   */
  private displayProgress(): void {
    if (!this.currentChallenge) return;

    const progress = this.currentChallenge.getProgress();
    const remainingTime = this.currentChallenge.getRemainingTime();

    // カーソルを上に移動してクリア（プログレスエリアのみ更新）
    process.stdout.write('\x1b[3A\x1b[0J'); // 3行上に移動して下をクリア

    console.log('Progress:');
    console.log(this.formatProgress(progress));
    console.log(`Time remaining: ${remainingTime.toFixed(1)}s`);
  }

  /**
   * 進捗をフォーマットして表示用文字列を生成
   * @param progress - 進捗情報
   * @returns フォーマットされた文字列
   */
  private formatProgress(progress: TypingProgress): string {
    const { text, input, errors } = progress;
    let result = '';

    // 入力済み部分
    const errorSet = new Set(errors);
    for (let i = 0; i < input.length; i++) {
      if (errorSet.has(i)) {
        result += red(input[i]);
      } else {
        result += green(input[i]);
      }
    }

    // 未入力部分
    result += gray(text.slice(input.length));

    return result;
  }

  /**
   * 結果を表示
   * @param result - タイピング結果
   */
  private displayResult(result: TypingResult): void {
    console.log('\n=== Challenge Complete! ===');
    console.log(`Speed: ${result.speedRating}`);
    console.log(`Accuracy: ${result.accuracyRating} (${result.accuracy.toFixed(1)}%)`);
    console.log(`Effect: ${result.totalRating}%`);

    if (result.isSuccess) {
      console.log(green('\nSuccess!'));
    } else {
      console.log(red('\nFailed...'));
    }
  }

  /**
   * 全チャレンジ完了時の処理
   */
  private completeAllChallenges(): CommandResult {
    console.log('\n=== SKILL EXECUTION COMPLETE ===');
    this.displayFinalSummary();

    // バトル終了チェック
    const enemy = this.battle['enemy'];
    const player = this.battle['player'];

    let battleEnded = false;

    if (enemy && enemy.currentHp <= 0) {
      battleEnded = true;
      console.log('\n🎉 Victory! Enemy has been defeated!');
    } else if (player && player.getBodyStats().getCurrentHP() <= 0) {
      battleEnded = true;
      console.log('\n💀 Defeat! You have been defeated!');
    }

    // 結果を返す
    const result: BattleTypingResult = {
      completedSkills: this.currentSkillIndex,
      totalSkills: this.skills.length,
      summary: this.summary,
      battleEnded: battleEnded,
    };

    // BattlePhaseに結果を渡して戻る
    return {
      success: true,
      message: 'Battle typing complete',
      nextPhase: PhaseTypes.BATTLE,
      data: {
        typingResult: result,
        battle: this.battle,
      },
    };
  }

  /**
   * 最終結果サマリーを表示
   */
  private displayFinalSummary(): void {
    console.log('\n--- Battle Summary ---');
    console.log(`Skills completed: ${this.currentSkillIndex}/${this.skills.length}`);
    console.log(`Total damage dealt: ${this.summary.totalDamageDealt}`);
    if (this.summary.criticalHits > 0) {
      console.log(`Critical hits: ${this.summary.criticalHits}`);
    }
    if (this.summary.totalHealing > 0) {
      console.log(`Total healing: ${this.summary.totalHealing}`);
    }
    if (this.summary.totalMpRestored > 0) {
      console.log(`MP restored: ${this.summary.totalMpRestored}`);
    }
    if (this.summary.misses > 0) {
      console.log(`Misses: ${this.summary.misses}`);
    }
  }
}
