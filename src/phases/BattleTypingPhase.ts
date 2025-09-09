import { Phase } from '../core/Phase';
import { Skill } from '../battle/Skill';
import { Battle } from '../battle/Battle';
import { BattleActionExecutor } from '../battle/BattleActionExecutor';
import { World } from '../world/World';
import { TabCompleter } from '../core/completion/TabCompleter';
import { PhaseType, PhaseTypes, CommandResult } from '../core/types';
import { TypingResult, TypingDifficulty, TypingProgress } from '../typing/types';
import { BattleTypingResult } from './types';
import { TypingChallenge } from '../typing/TypingChallenge';
import { ComboBoostManager } from '../battle/ComboBoostManager';
import { calculateExPointGain } from '../battle/expoints';
import { WordDatabase } from '../typing/WordDatabase';
import { Display } from '../ui/Display';
import { green, red, gray } from '../ui/colors';
import * as readline from 'readline';
import { delay } from '../utils/timer';

export class BattleTypingPhase extends Phase {
  // Spark Mode constants
  private static readonly SPARK_MODE_CHAR_TIMEOUT_MS = 2000;
  private static readonly SPARK_MODE_CHALLENGE_COUNT = 10;
  private static readonly SPARK_MODE_CHARS =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  private static readonly KEY_ESCAPE = '\\x1b';
  private skills: Skill[];
  private battle: Battle;
  private currentSkillIndex: number = 0;
  private currentChallenge: TypingChallenge | null = null;
  private wordDatabase: WordDatabase;
  private isFirstInput: boolean = true;
  private comboBoostManager: ComboBoostManager = new ComboBoostManager();
  private exMode: 'focus' | 'spark' | undefined;
  private sparkChars: string[] = [];
  private sparkSuccessCount = 0;

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
    exMode?: 'focus' | 'spark';
  }) {
    super(options.world, options.tabCompleter);

    this.skills = options.skills;
    this.battle = options.battle;
    this.wordDatabase = new WordDatabase();
    this.exMode = options.exMode;

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
    if (this.exMode === 'spark') {
      // Spark: 単文字チャレンジ配列を用意
      this.sparkChars = this.generateSingleCharChallenges();
      console.log('\n⚡ Spark Mode: type the prompted single characters!');
      console.log('Press ESC to cancel\n');
    } else {
      // 通常/Focus: 最初のスキルチャレンジを開始
      this.startNextSkillChallenge();
    }
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
    if (this.exMode === 'spark') {
      return this.runSparkMode();
    }
    return new Promise(resolve => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: undefined, // outputをundefinedに設定してエコーバックを防ぐ
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
   * Spark Mode: 単文字タイピングモードを実行
   */
  private async runSparkMode(): Promise<CommandResult> {
    // skillsは1つのみ想定
    const skill = this.skills[0];
    const total = this.sparkChars.length;
    this.sparkSuccessCount = 0;

    for (let i = 0; i < total; i++) {
      const ch = this.sparkChars[i];
      process.stdout.write(`Type: ${ch}  `);
      const { success } = await this.singleCharTyping(
        ch,
        BattleTypingPhase.SPARK_MODE_CHAR_TIMEOUT_MS
      );
      console.log(success ? '✔' : '✖');
      if (!success) break;
      this.sparkSuccessCount++;
    }

    // 成功数分だけスキルを実行（コスト0/タイピングなし）
    const player = this.battle.getPlayer();
    const enemy = this.battle.getEnemy();
    for (let i = 0; i < this.sparkSuccessCount; i++) {
      const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
        comboBoostManager: this.comboBoostManager,
      });
      result.message.forEach(m => console.log(m));
      if (result.damage) {
        this.summary.totalDamageDealt += result.damage;
        if (result.isCritical) this.summary.criticalHits++;
      }
      if (result.targetDefeated) break;
    }

    console.log(`\nSpark successes: ${this.sparkSuccessCount}/${total}`);

    return {
      success: true,
      message: 'Spark mode complete',
      nextPhase: PhaseTypes.BATTLE,
      data: {
        typingResult: {
          completedSkills: this.sparkSuccessCount,
          totalSkills: total,
          summary: this.summary,
          battleEnded: enemy.isDefeated(),
        },
        battle: this.battle,
      },
    };
  }

  /**
   * 単文字チャレンジを生成
   */
  private generateSingleCharChallenges(): string[] {
    const chars = BattleTypingPhase.SPARK_MODE_CHARS;
    const list: string[] = [];
    for (let i = 0; i < BattleTypingPhase.SPARK_MODE_CHALLENGE_COUNT; i++) {
      list.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    return list;
  }

  /**
   * 単文字タイピング（制限時間内に一致文字を入力できたらsuccess）
   */
  private singleCharTyping(expected: string, timeoutMs: number): Promise<{ success: boolean }> {
    return new Promise(resolve => {
      let done = false;
      const onData = (data: Buffer) => {
        if (done) return;
        const c = data.toString();
        if (c === BattleTypingPhase.KEY_ESCAPE) {
          cleanup();
          resolve({ success: false });
          return;
        }
        if (c === expected) {
          cleanup();
          resolve({ success: true });
        } else {
          // 1ミス即失敗
          cleanup();
          resolve({ success: false });
        }
      };
      const cleanup = () => {
        done = true;
        process.stdin.removeListener('data', onData);
      };
      const t = global.setTimeout(() => {
        if (!done) {
          cleanup();
          resolve({ success: false });
        }
      }, timeoutMs);
      // ensure timer cleared in resolve path
      const origResolve = resolve;
      resolve = v => {
        global.clearTimeout(t);
        origResolve(v);
      };
      process.stdin.once('data', onData);
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

    // 最初の入力時の特別処理
    const wasFirstInput = this.isFirstInput;
    if (this.isFirstInput) {
      // 初回入力時: challengeTextの行、"(Press ESC to cancel)"の行、その後の空行の3行分を上書き
      process.stdout.write('\x1b[3A\x1b[0J');
      this.isFirstInput = false;
    }

    // 入力をチャレンジに渡す
    this.currentChallenge.handleInput(input);

    // チャレンジ完了チェック
    if (this.currentChallenge.isComplete()) {
      const result = this.currentChallenge.getResult();

      // 完了時は最終的なプログレスを表示してから結果を表示
      const progress = this.currentChallenge.getProgress();
      if (!wasFirstInput) {
        // 2回目以降の入力で完了した場合、前の表示をクリア
        process.stdout.write('\x1b[2A\x1b[0J');
      }
      console.log(this.formatProgress(progress));
      console.log(`⌛ Time remaining: ${this.currentChallenge.getRemainingTime().toFixed(1)}s`);

      await this.displayResult(result);

      // スキル効果を適用
      const skill = this.skills[this.currentSkillIndex];
      await this.applySkillEffect(skill, result);

      // 次のスキルへ
      this.currentSkillIndex++;
      this.currentChallenge = null;

      // 全スキル完了チェック
      if (this.currentSkillIndex >= this.skills.length) {
        return this.completeAllChallenges();
      }

      // 次のスキルチャレンジを開始
      this.startNextSkillChallenge();

      return null;
    }

    // 進捗表示（チャレンジ未完了の場合）
    const progress = this.currentChallenge.getProgress();
    const remainingTime = this.currentChallenge.getRemainingTime();

    if (!wasFirstInput) {
      // 2回目以降: プログレスと残り時間の2行分だけを上書き
      process.stdout.write('\x1b[2A\x1b[0J');
    }

    // プログレス表示（入力状況を視覚的に表示）
    console.log(this.formatProgress(progress));
    console.log(`⌛ Time remaining: ${remainingTime.toFixed(1)}s`);

    return null;
  }

  /**
   * 次のスキルのタイピングチャレンジを開始
   */
  private startNextSkillChallenge(): void {
    if (this.currentSkillIndex >= this.skills.length) {
      return;
    }

    const baseSkill = this.skills[this.currentSkillIndex];
    const skill =
      this.exMode === 'focus'
        ? { ...baseSkill, actionCost: 1, mpCost: 0, typingDifficulty: 1 }
        : this.exMode === 'spark'
          ? { ...baseSkill, actionCost: 0, mpCost: 0 }
          : baseSkill;

    // スキル情報を表示
    Display.clear();
    console.log(
      `\n=== SKILL ${this.currentSkillIndex + 1}/${this.skills.length}: ${skill.name} ===`
    );
    console.log(`Description: ${skill.description}`);

    // タイピングチャレンジのテキストを生成
    const challengeText = this.wordDatabase.getRandomText(
      skill.typingDifficulty as TypingDifficulty
    );

    console.log(`\n⌨️ Type the following text:`);
    console.log(challengeText); // テンプレートリテラルを使わない
    console.log(gray('(Press ESC to cancel)\n'));

    // 次のチャレンジ開始時にフラグをリセット
    this.isFirstInput = true;

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
  // eslint-disable-next-line complexity
  private async applySkillEffect(skill: Skill, typingResult: TypingResult): Promise<void> {
    // BattleActionExecutorを使用して効果を適用
    const player = this.battle.getPlayer();
    const enemy = this.battle.getEnemy();

    if (!player || !enemy) {
      console.log('❌ Battle not properly initialized');
      return;
    }

    const result = BattleActionExecutor.executePlayerSkill(skill, player, enemy, {
      comboBoostManager: this.comboBoostManager,
      typingResult,
    });

    if (result.success) {
      result.message.forEach(msg => console.log(msg));
      // EXモード中はEX加算なし
      if (!this.exMode) {
        const gained = calculateExPointGain(
          skill.typingDifficulty,
          typingResult.speedRating,
          typingResult.accuracyRating
        );
        if (gained > 0 && typeof player.getExPoints === 'function') {
          player.addExPoints(gained);
          console.log(`+${gained} EX points`);
        }
      }
      // サマリーを更新
      if (result.damage) {
        this.summary.totalDamageDealt += result.damage;
        if (result.isCritical) {
          this.summary.criticalHits++;
        }
      }

      if (result.hpHealing) {
        this.summary.totalHealing += result.hpHealing;
      }

      if (result.mpCharge) {
        this.summary.totalMpRestored += result.mpCharge;
      }
    } else {
      console.log(`❌ ${result.message}`);
      this.summary.misses++;
      if (this.exMode === 'focus') {
        // 失敗時は以降のスキルを打ち切る
        this.currentSkillIndex = this.skills.length;
      }
    }

    // 敵のHPが0になったらバトル終了フラグを立てる
    if (enemy.currentHp <= 0) {
      console.log('\n💀 Enemy defeated!');
      // バトル終了を即座に処理せず、全スキル完了後に処理する
    }

    await this.waitForKeyPress();
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
  private async displayResult(result: TypingResult): Promise<void> {
    console.log('\n=== Challenge Complete! ===');
    console.log(`Speed: ${result.speedRating}`);
    console.log(`Accuracy: ${result.accuracyRating} (${result.accuracy.toFixed(1)}%)`);
    console.log(`Effect: ${result.totalRating}%`);

    if (result.isSuccess) {
      console.log(green('\nSuccess!'));
    } else {
      console.log(red('\nFailed...'));
    }
    await delay(500);
  }

  /**
   * 全チャレンジ完了時の処理
   */
  private completeAllChallenges(): CommandResult {
    console.log('\n=== SKILL EXECUTION COMPLETE ===');
    this.displayFinalSummary();

    // バトル終了チェック
    const enemy = this.battle.getEnemy();
    const player = this.battle.getPlayer();

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

  /**
   * キー入力待ち（BattleTypingPhase専用版）
   * startInputLoopのdataリスナーと競合しないように、一時的にリスナーを管理する
   */
  protected async waitForKeyPress(
    message: string = '⏸︎ Press any key to continue...'
  ): Promise<void> {
    // テスト環境やTTYでない環境では即座にresolve
    if (!process.stdin.isTTY || process.env.NODE_ENV === 'test') {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      console.log(`\n${message}`);

      // 待機中フラグを設定して、handleInputが処理をスキップするようにする
      const originalChallenge = this.currentChallenge;
      this.currentChallenge = null; // 一時的にチャレンジをnullにして入力を無視

      const onKeyPress = () => {
        // チャレンジを復元
        this.currentChallenge = originalChallenge;
        resolve();
      };

      // 次のキー入力を1回だけ待つ
      const waitHandler = (_data: Buffer) => {
        process.stdin.removeListener('data', waitHandler);
        onKeyPress();
      };

      process.stdin.once('data', waitHandler);
    });
  }
}
