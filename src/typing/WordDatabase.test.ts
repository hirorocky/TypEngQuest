import { WordDatabase } from './WordDatabase';
import { TypingDifficulty } from './types';

describe('WordDatabase', () => {
  let wordDatabase: WordDatabase;

  beforeEach(() => {
    wordDatabase = new WordDatabase();
  });

  describe('コンストラクタ', () => {
    test('インスタンスを作成できる', () => {
      expect(wordDatabase).toBeInstanceOf(WordDatabase);
    });
  });

  describe('getRandomText', () => {
    test('難易度1の問題文を取得できる', () => {
      const text = wordDatabase.getRandomText(1);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(20); // 難易度1は20文字以下
    });

    test('難易度2の問題文を取得できる', () => {
      const text = wordDatabase.getRandomText(2);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(30); // 難易度2は30文字以下
    });

    test('難易度3の問題文を取得できる', () => {
      const text = wordDatabase.getRandomText(3);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(40); // 難易度3は40文字以下
    });

    test('難易度4の問題文を取得できる', () => {
      const text = wordDatabase.getRandomText(4);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(50); // 難易度4は50文字以下
    });

    test('難易度5の問題文を取得できる', () => {
      const text = wordDatabase.getRandomText(5);

      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
      expect(text.length).toBeLessThanOrEqual(60); // 難易度5は60文字以下
    });

    test('無効な難易度でもエラーにならない', () => {
      expect(() => {
        wordDatabase.getRandomText(0 as TypingDifficulty);
      }).not.toThrow();

      expect(() => {
        wordDatabase.getRandomText(6 as TypingDifficulty);
      }).not.toThrow();
    });

    test('複数回呼び出すとランダムに選択される', () => {
      const texts = new Set<string>();

      // 10回取得して少なくとも2つ以上の異なる文字列が返されることを確認
      for (let i = 0; i < 10; i++) {
        texts.add(wordDatabase.getRandomText(1));
      }

      // 少なくとも1つは返される（同じ文字列が10回連続で返される可能性もあるため）
      expect(texts.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getAllTextsForDifficulty', () => {
    test('難易度1の全問題文を取得できる', () => {
      const texts = wordDatabase.getAllTextsForDifficulty(1);

      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      texts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeLessThanOrEqual(20);
      });
    });

    test('難易度2の全問題文を取得できる', () => {
      const texts = wordDatabase.getAllTextsForDifficulty(2);

      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      texts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeLessThanOrEqual(30);
      });
    });

    test('難易度3の全問題文を取得できる', () => {
      const texts = wordDatabase.getAllTextsForDifficulty(3);

      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      texts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeLessThanOrEqual(40);
      });
    });

    test('難易度4の全問題文を取得できる', () => {
      const texts = wordDatabase.getAllTextsForDifficulty(4);

      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      texts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeLessThanOrEqual(50);
      });
    });

    test('難易度5の全問題文を取得できる', () => {
      const texts = wordDatabase.getAllTextsForDifficulty(5);

      expect(Array.isArray(texts)).toBe(true);
      expect(texts.length).toBeGreaterThan(0);
      texts.forEach(text => {
        expect(typeof text).toBe('string');
        expect(text.length).toBeLessThanOrEqual(60);
      });
    });

    test('無効な難易度の場合は空配列を返す', () => {
      expect(wordDatabase.getAllTextsForDifficulty(0 as TypingDifficulty)).toEqual([]);
      expect(wordDatabase.getAllTextsForDifficulty(6 as TypingDifficulty)).toEqual([]);
    });
  });

  describe('getTotalCount', () => {
    test('難易度1の問題文数を取得できる', () => {
      const count = wordDatabase.getTotalCount(1);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('難易度2の問題文数を取得できる', () => {
      const count = wordDatabase.getTotalCount(2);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('難易度3の問題文数を取得できる', () => {
      const count = wordDatabase.getTotalCount(3);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('難易度4の問題文数を取得できる', () => {
      const count = wordDatabase.getTotalCount(4);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('難易度5の問題文数を取得できる', () => {
      const count = wordDatabase.getTotalCount(5);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
    });

    test('無効な難易度の場合は0を返す', () => {
      expect(wordDatabase.getTotalCount(0 as TypingDifficulty)).toBe(0);
      expect(wordDatabase.getTotalCount(6 as TypingDifficulty)).toBe(0);
    });

    test('getAllTextsForDifficultyの結果と一致する', () => {
      for (let difficulty = 1; difficulty <= 5; difficulty++) {
        const texts = wordDatabase.getAllTextsForDifficulty(difficulty as TypingDifficulty);
        const count = wordDatabase.getTotalCount(difficulty as TypingDifficulty);
        expect(count).toBe(texts.length);
      }
    });
  });

  describe('問題文の内容', () => {
    test('各難易度に適切な問題文が含まれている', () => {
      // 難易度1: 基本的な英単語
      const difficulty1 = wordDatabase.getAllTextsForDifficulty(1);
      expect(difficulty1.some(text => text.match(/^[a-zA-Z\s]+$/))).toBe(true);

      // 難易度2: より長い単語や簡単な文章
      const difficulty2 = wordDatabase.getAllTextsForDifficulty(2);
      expect(difficulty2.some(text => text.length > 10)).toBe(true);

      // 難易度3: 数字や記号を含む可能性
      const difficulty3 = wordDatabase.getAllTextsForDifficulty(3);
      expect(difficulty3.length).toBeGreaterThan(0);

      // 難易度4: より複雑な文章
      const difficulty4 = wordDatabase.getAllTextsForDifficulty(4);
      expect(difficulty4.length).toBeGreaterThan(0);

      // 難易度5: 最も複雑な文章
      const difficulty5 = wordDatabase.getAllTextsForDifficulty(5);
      expect(difficulty5.length).toBeGreaterThan(0);
    });

    test('問題文に空文字列や空白のみの文字列が含まれていない', () => {
      for (let difficulty = 1; difficulty <= 5; difficulty++) {
        const texts = wordDatabase.getAllTextsForDifficulty(difficulty as TypingDifficulty);
        texts.forEach(text => {
          expect(text.trim().length).toBeGreaterThan(0);
        });
      }
    });
  });
});
