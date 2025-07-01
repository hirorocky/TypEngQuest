/**
 * タイピングチャレンジの難易度レベル
 */
export enum ChallengeDifficulty {
  BASIC = 1, // 基本単語（3-6文字）
  INTERMEDIATE = 2, // 中級単語（6-10文字）
  ADVANCED = 3, // 上級単語（10-15文字）
  PROGRAMMING = 4, // プログラミング用語（関数名、クラス名等）
  EXPERT = 5, // 専門用語・複雑な文章
}

// 将来の拡張で使用予定のため、使用していない定数を明示的にエクスポート
export const UNUSED_DIFFICULTY_LEVELS = {
  BASIC: ChallengeDifficulty.BASIC,
  INTERMEDIATE: ChallengeDifficulty.INTERMEDIATE,
  ADVANCED: ChallengeDifficulty.ADVANCED,
  PROGRAMMING: ChallengeDifficulty.PROGRAMMING,
  EXPERT: ChallengeDifficulty.EXPERT,
};

/**
 * タイピングチャレンジの情報
 */
export interface Challenge {
  word: string; // タイプする単語/文章
  timeLimit: number; // 制限時間（秒）
  difficulty: ChallengeDifficulty; // 難易度
}

/**
 * タイピング結果の評価
 */
export interface TypingResult {
  input: string; // プレイヤーの入力
  accuracy: number; // 精度（0-100%）
  speed: number; // WPM（Words Per Minute）
  timeUsed: number; // 使用時間（秒）
  perfect: boolean; // 完璧入力かどうか
}

/**
 * タイピングチャレンジシステム
 * プログラミング用語を中心としたタイピングテストを管理する
 */
export class TypingChallenge {
  private wordDatabase: Record<ChallengeDifficulty, string[]> = {
    [ChallengeDifficulty.BASIC]: [
      'the',
      'and',
      'or',
      'not',
      'if',
      'for',
      'int',
      'var',
      'let',
      'new',
      'try',
      'do',
      'is',
      'as',
      'in',
      'at',
      'to',
      'of',
      'on',
      'by',
      'true',
      'false',
      'null',
      'void',
      'this',
      'self',
      'main',
      'args',
      'char',
      'byte',
      'long',
      'bool',
      'file',
      'path',
      'data',
      'text',
    ],
    [ChallengeDifficulty.INTERMEDIATE]: [
      'function',
      'method',
      'class',
      'object',
      'string',
      'number',
      'return',
      'import',
      'export',
      'module',
      'public',
      'private',
      'static',
      'const',
      'async',
      'await',
      'catch',
      'finally',
      'switch',
      'while',
      'break',
      'continue',
      'default',
      'package',
      'interface',
      'abstract',
      'extends',
      'implements',
      'override',
    ],
    [ChallengeDifficulty.ADVANCED]: [
      'constructor',
      'destructor',
      'namespace',
      'template',
      'generic',
      'polymorphism',
      'inheritance',
      'encapsulation',
      'abstraction',
      'algorithm',
      'structure',
      'exception',
      'collection',
      'iterator',
      'recursive',
      'factorial',
      'fibonacci',
      'binary',
      'hexadecimal',
      'authentication',
      'authorization',
      'synchronous',
      'asynchronous',
    ],
    [ChallengeDifficulty.PROGRAMMING]: [
      'getElementById',
      'addEventListener',
      'querySelector',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'localStorage',
      'sessionStorage',
      'XMLHttpRequest',
      'responseText',
      'responseJSON',
      'statusCode',
      'appendChild',
      'removeChild',
      'createElement',
      'setAttribute',
      'preventDefault',
      'stopPropagation',
      'clientHeight',
      'scrollTop',
      'offsetWidth',
      'innerHTML',
      'textContent',
      'className',
    ],
    [ChallengeDifficulty.EXPERT]: [
      'Object.prototype.hasOwnProperty.call',
      'Array.prototype.forEach.call',
      'Function.prototype.bind.apply',
      'Promise.all([...promises])',
      'async function* generator()',
      'const {data, error} = await fetch()',
      'interface GenericRepository<T>',
      'export default class AbstractFactory',
      'try...catch...finally statement',
      'Object.defineProperty(target, key, descriptor)',
      'Proxy(target, {get, set, has, deleteProperty})',
      'Symbol.iterator implementation',
    ],
  };

  /**
   * 指定難易度のチャレンジを生成
   * @param difficulty - チャレンジ難易度
   * @returns 生成されたチャレンジ
   */
  generateChallenge(difficulty: ChallengeDifficulty): Challenge {
    const words = this.wordDatabase[difficulty];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const timeLimit = this.calculateTimeLimit(randomWord, difficulty);

    return {
      word: randomWord,
      timeLimit,
      difficulty,
    };
  }

  /**
   * タイピング結果を評価
   * @param targetWord - 正解単語
   * @param input - プレイヤーの入力
   * @param timeUsed - 使用時間（秒）
   * @returns タイピング結果
   */
  evaluateTyping(targetWord: string, input: string, timeUsed: number): TypingResult {
    const accuracy = this.calculateAccuracy(targetWord, input);
    const speed = this.calculateSpeed(input, timeUsed);
    const perfect = input === targetWord;

    return {
      input,
      accuracy,
      speed,
      timeUsed,
      perfect,
    };
  }

  /**
   * タイピング結果からダメージ倍率を計算
   * @param result - タイピング結果
   * @returns ダメージ倍率（0.1-3.0）
   */
  calculateDamageMultiplier(result: TypingResult): number {
    const accuracyMultiplier = result.accuracy / 100;
    const speedMultiplier = this.getSpeedMultiplier(result.speed);
    const perfectBonus = result.perfect ? 1.5 : 1.0;

    const totalMultiplier = accuracyMultiplier * speedMultiplier * perfectBonus;

    // 最小倍率0.1、最大倍率3.0に制限
    return Math.max(0.1, Math.min(3.0, totalMultiplier));
  }

  /**
   * 難易度別の単語リストを取得
   * @param difficulty - 難易度
   * @returns 単語リスト
   */
  getWordsByDifficulty(difficulty: ChallengeDifficulty): string[] {
    return [...this.wordDatabase[difficulty]]; // 防御的コピー
  }

  /**
   * 制限時間を計算
   * @param word - 対象単語
   * @param difficulty - 難易度
   * @returns 制限時間（秒）
   */
  private calculateTimeLimit(word: string, difficulty: ChallengeDifficulty): number {
    const baseTimePerChar = this.getBaseTimePerChar(difficulty);
    const baseTime = word.length * baseTimePerChar;

    // 最小時間2秒、最大時間30秒
    return Math.max(2, Math.min(30, Math.ceil(baseTime)));
  }

  /**
   * 難易度別の1文字あたりの基本時間を取得
   * @param difficulty - 難易度
   * @returns 1文字あたりの時間（秒）
   */
  private getBaseTimePerChar(difficulty: ChallengeDifficulty): number {
    switch (difficulty) {
      case ChallengeDifficulty.BASIC:
        return 1.0; // 1文字1秒
      case ChallengeDifficulty.INTERMEDIATE:
        return 0.8; // 1文字0.8秒
      case ChallengeDifficulty.ADVANCED:
        return 0.6; // 1文字0.6秒
      case ChallengeDifficulty.PROGRAMMING:
        return 0.5; // 1文字0.5秒
      case ChallengeDifficulty.EXPERT:
        return 0.4; // 1文字0.4秒
      default:
        return 1.0;
    }
  }

  /**
   * 入力精度を計算
   * @param target - 正解文字列
   * @param input - 入力文字列
   * @returns 精度（0-100）
   */
  private calculateAccuracy(target: string, input: string): number {
    if (target.length === 0) return input.length === 0 ? 100 : 0;
    if (input.length === 0) return 0;

    let correctChars = 0;
    const maxLength = Math.max(target.length, input.length);

    for (let i = 0; i < maxLength; i++) {
      if (target[i] && input[i] && target[i] === input[i]) {
        correctChars++;
      }
    }

    return Math.round((correctChars / target.length) * 100);
  }

  /**
   * タイピング速度を計算（WPM）
   * @param input - 入力文字列
   * @param timeUsed - 使用時間（秒）
   * @returns WPM（Words Per Minute）
   */
  private calculateSpeed(input: string, timeUsed: number): number {
    if (timeUsed <= 0 || input.length === 0) return 0;

    // 1単語を5文字として計算（標準的なWPM計算方式）
    const wordsTyped = input.length / 5;
    const timeInMinutes = timeUsed / 60;

    return Math.round(wordsTyped / timeInMinutes);
  }

  /**
   * WPMに基づくスピード倍率を取得
   * @param wpm - Words Per Minute
   * @returns スピード倍率（0.5-2.0）
   */
  private getSpeedMultiplier(wpm: number): number {
    if (wpm >= 80) return 2.0; // 超高速
    if (wpm >= 60) return 1.8; // 高速
    if (wpm >= 40) return 1.5; // 速い
    if (wpm >= 25) return 1.2; // 普通
    if (wpm >= 15) return 1.0; // やや遅い
    if (wpm >= 5) return 0.8; // 遅い
    return 0.5; // 非常に遅い
  }
}
