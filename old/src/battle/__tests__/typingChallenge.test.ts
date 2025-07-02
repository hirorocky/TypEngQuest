import { TypingChallenge, TypingResult, ChallengeDifficulty } from '../typingChallenge';

describe('TypingChallengeクラス', () => {
  let typingChallenge: TypingChallenge;

  beforeEach(() => {
    typingChallenge = new TypingChallenge();
  });

  describe('チャレンジ生成', () => {
    test('基本レベルのチャレンジを生成', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.BASIC);
      
      expect(challenge.word).toBeDefined();
      expect(challenge.word.length).toBeGreaterThan(0);
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.difficulty).toBe(ChallengeDifficulty.BASIC);
    });

    test('中級レベルのチャレンジを生成', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.INTERMEDIATE);
      
      expect(challenge.word).toBeDefined();
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.difficulty).toBe(ChallengeDifficulty.INTERMEDIATE);
    });

    test('上級レベルのチャレンジを生成', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.ADVANCED);
      
      expect(challenge.word).toBeDefined();
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.difficulty).toBe(ChallengeDifficulty.ADVANCED);
    });

    test('プログラミング用語のチャレンジを生成', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.PROGRAMMING);
      
      expect(challenge.word).toBeDefined();
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.difficulty).toBe(ChallengeDifficulty.PROGRAMMING);
    });

    test('専門用語のチャレンジを生成', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.EXPERT);
      
      expect(challenge.word).toBeDefined();
      expect(challenge.timeLimit).toBeGreaterThan(0);
      expect(challenge.difficulty).toBe(ChallengeDifficulty.EXPERT);
    });
  });

  describe('タイピング結果評価', () => {
    test('完璧な入力の評価', () => {
      const word = 'function';
      const input = 'function';
      const timeUsed = 2.5; // 2.5秒
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.input).toBe(input);
      expect(result.accuracy).toBe(100);
      expect(result.perfect).toBe(true);
      expect(result.speed).toBeGreaterThan(0);
      expect(result.timeUsed).toBe(timeUsed);
    });

    test('部分的に正しい入力の評価', () => {
      const word = 'function';
      const input = 'functoin'; // 1文字間違い
      const timeUsed = 3.0;
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.input).toBe(input);
      expect(result.accuracy).toBeLessThan(100);
      expect(result.accuracy).toBeGreaterThan(70); // 8文字中7文字正解
      expect(result.perfect).toBe(false);
      expect(result.timeUsed).toBe(timeUsed);
    });

    test('完全に間違った入力の評価', () => {
      const word = 'function';
      const input = 'xyz';
      const timeUsed = 5.0;
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.input).toBe(input);
      expect(result.accuracy).toBe(0);
      expect(result.perfect).toBe(false);
      expect(result.timeUsed).toBe(timeUsed);
    });

    test('空の入力の評価', () => {
      const word = 'function';
      const input = '';
      const timeUsed = 1.0;
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.input).toBe(input);
      expect(result.accuracy).toBe(0);
      expect(result.perfect).toBe(false);
      expect(result.speed).toBe(0);
    });

    test('高速タイピングのスピード計算', () => {
      const word = 'function'; // 8文字
      const input = 'function';
      const timeUsed = 1.0; // 1秒で8文字 = 480文字/分 = 96WPM
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.speed).toBeGreaterThan(90);
      expect(result.speed).toBeLessThan(100);
    });

    test('低速タイピングのスピード計算', () => {
      const word = 'function'; // 8文字
      const input = 'function';
      const timeUsed = 8.0; // 8秒で8文字 = 60文字/分 = 12WPM
      
      const result = typingChallenge.evaluateTyping(word, input, timeUsed);
      
      expect(result.speed).toBeGreaterThan(10);
      expect(result.speed).toBeLessThan(15);
    });
  });

  describe('ダメージ倍率計算', () => {
    test('完璧なタイピングの最大倍率', () => {
      const result: TypingResult = {
        input: 'function',
        accuracy: 100,
        speed: 80, // 80 WPM
        timeUsed: 1.5,
        perfect: true,
      };
      
      const multiplier = typingChallenge.calculateDamageMultiplier(result);
      
      expect(multiplier).toBeGreaterThan(1.5); // 完璧ボーナス1.5倍
      expect(multiplier).toBeLessThanOrEqual(3.0); // 理論的最大値
    });

    test('平均的なタイピングの標準倍率', () => {
      const result: TypingResult = {
        input: 'function',
        accuracy: 80,
        speed: 40, // 40 WPM
        timeUsed: 3.0,
        perfect: false,
      };
      
      const multiplier = typingChallenge.calculateDamageMultiplier(result);
      
      expect(multiplier).toBeGreaterThan(0.5);
      expect(multiplier).toBeLessThan(1.5);
    });

    test('低品質タイピングの最小倍率', () => {
      const result: TypingResult = {
        input: 'functoin',
        accuracy: 30,
        speed: 15, // 15 WPM
        timeUsed: 8.0,
        perfect: false,
      };
      
      const multiplier = typingChallenge.calculateDamageMultiplier(result);
      
      expect(multiplier).toBeGreaterThan(0.1);
      expect(multiplier).toBeLessThan(0.6);
    });

    test('失敗タイピングの最小倍率保証', () => {
      const result: TypingResult = {
        input: '',
        accuracy: 0,
        speed: 0,
        timeUsed: 10.0,
        perfect: false,
      };
      
      const multiplier = typingChallenge.calculateDamageMultiplier(result);
      
      expect(multiplier).toBeGreaterThanOrEqual(0.1); // 最小倍率保証
    });
  });

  describe('単語データベース', () => {
    test('基本単語のリストが存在', () => {
      const words = typingChallenge.getWordsByDifficulty(ChallengeDifficulty.BASIC);
      
      expect(words).toBeDefined();
      expect(words.length).toBeGreaterThan(0);
      expect(words).toContain('the');
      expect(words).toContain('int');
    });

    test('プログラミング用語のリストが存在', () => {
      const words = typingChallenge.getWordsByDifficulty(ChallengeDifficulty.PROGRAMMING);
      
      expect(words).toBeDefined();
      expect(words.length).toBeGreaterThan(0);
      expect(words.some(word => word.includes('Element'))).toBe(true);
    });

    test('専門用語のリストが存在', () => {
      const words = typingChallenge.getWordsByDifficulty(ChallengeDifficulty.EXPERT);
      
      expect(words).toBeDefined();
      expect(words.length).toBeGreaterThan(0);
    });

    test('難易度が上がるにつれて単語が複雑化', () => {
      const basicWords = typingChallenge.getWordsByDifficulty(ChallengeDifficulty.BASIC);
      const expertWords = typingChallenge.getWordsByDifficulty(ChallengeDifficulty.EXPERT);
      
      const basicAvgLength = basicWords.reduce((sum, word) => sum + word.length, 0) / basicWords.length;
      const expertAvgLength = expertWords.reduce((sum, word) => sum + word.length, 0) / expertWords.length;
      
      expect(expertAvgLength).toBeGreaterThan(basicAvgLength);
    });
  });

  describe('制限時間設定', () => {
    test('基本レベルは十分な時間が与えられる', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.BASIC);
      
      // 基本レベルは1文字あたり1秒以上の時間
      const timePerChar = challenge.timeLimit / challenge.word.length;
      expect(timePerChar).toBeGreaterThanOrEqual(0.8);
    });

    test('上級レベルは短い制限時間', () => {
      const challenge = typingChallenge.generateChallenge(ChallengeDifficulty.EXPERT);
      
      // 上級レベルは1文字あたり0.5秒程度
      const timePerChar = challenge.timeLimit / challenge.word.length;
      expect(timePerChar).toBeLessThan(0.8);
      expect(timePerChar).toBeGreaterThan(0.3);
    });
  });
});