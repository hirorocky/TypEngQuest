import { EquipmentGrammarChecker } from './EquipmentGrammarChecker';

describe('EquipmentGrammarChecker', () => {
  let grammarChecker: EquipmentGrammarChecker;

  beforeEach(() => {
    grammarChecker = new EquipmentGrammarChecker();
  });

  describe('isValidSentence', () => {
    it('有効な英文（SVO構造）の場合trueを返す', () => {
      const words = ['I', 'love', 'TypeScript', 'programming', 'language'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('有効な英文（SVC構造）の場合trueを返す', () => {
      const words = ['The', 'game', 'is', 'very', 'fun'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('形容詞+名詞の組み合わせの場合trueを返す', () => {
      const words = ['beautiful', 'sword'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('5単語未満でも文法的に正しい場合trueを返す', () => {
      const words = ['I', 'love', 'you'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('単語数に関係なく動詞+名詞があれば有効', () => {
      const words = ['I', 'love', 'to', 'play', 'this', 'amazing', 'game'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('形容詞+名詞の組み合わせがある場合trueを返す', () => {
      const words = ['beautiful', 'programming', 'language'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('英単語でない文字列が含まれる場合falseを返す', () => {
      const words = ['I', 'love', '123', 'programming', 'language'];
      expect(grammarChecker.isValidSentence(words)).toBe(false);
    });

    it('空の配列の場合falseを返す', () => {
      const words: string[] = [];
      expect(grammarChecker.isValidSentence(words)).toBe(false);
    });

    it('null値を含む配列の場合falseを返す', () => {
      const words = ['I', null, 'programming', 'language', 'today'] as any;
      expect(grammarChecker.isValidSentence(words)).toBe(false);
    });

    it('undefined値を含む配列の場合falseを返す', () => {
      const words = ['I', undefined, 'programming', 'language', 'today'] as any;
      expect(grammarChecker.isValidSentence(words)).toBe(false);
    });
  });

  describe('validateWords', () => {
    it('有効な英単語のみの場合trueを返す', () => {
      const words = ['hello', 'world', 'programming', 'language', 'awesome'];
      expect(grammarChecker.validateWords(words)).toBe(true);
    });

    it('数字が含まれる場合falseを返す', () => {
      const words = ['hello', '123', 'programming', 'language', 'awesome'];
      expect(grammarChecker.validateWords(words)).toBe(false);
    });

    it('特殊文字が含まれる場合falseを返す', () => {
      const words = ['hello', 'world!', 'programming', 'language', 'awesome'];
      expect(grammarChecker.validateWords(words)).toBe(false);
    });

    it('空の文字列が含まれる場合falseを返す', () => {
      const words = ['hello', '', 'programming', 'language', 'awesome'];
      expect(grammarChecker.validateWords(words)).toBe(false);
    });
  });

  describe('checkBasicGrammar', () => {
    it('基本的な文法構造を満たす場合trueを返す', () => {
      const words = ['The', 'cat', 'runs', 'very', 'fast'];
      expect(grammarChecker.checkBasicGrammar(words)).toBe(true);
    });

    it('形容詞+名詞の組み合わせがある場合trueを返す', () => {
      const words = ['The', 'big', 'red', 'beautiful', 'cat'];
      expect(grammarChecker.checkBasicGrammar(words)).toBe(true);
    });

    it('動詞のみで名詞がない場合falseを返す', () => {
      const words = ['Very', 'quickly', 'runs', 'and', 'jumps'];
      expect(grammarChecker.checkBasicGrammar(words)).toBe(false);
    });
  });

  describe('getGrammarErrorMessage', () => {
    it('有効な文法の場合、適切なメッセージを返す', () => {
      const words = ['I', 'love'];
      const message = grammarChecker.getGrammarErrorMessage(words);
      expect(message).toBe('valid sentence');
    });

    it('単語数に関係なく有効な文法の場合、適切なメッセージを返す', () => {
      const words = ['I', 'love', 'to', 'play', 'this', 'amazing'];
      const message = grammarChecker.getGrammarErrorMessage(words);
      expect(message).toBe('valid sentence');
    });

    it('不正な単語が含まれている場合、適切なエラーメッセージを返す', () => {
      const words = ['I', 'love', '123', 'programming', 'language'];
      const message = grammarChecker.getGrammarErrorMessage(words);
      expect(message).toBe('invalid word found: 123');
    });

    it('文法的に正しい場合、適切なメッセージを返す', () => {
      const words = ['beautiful', 'programming', 'language'];
      const message = grammarChecker.getGrammarErrorMessage(words);
      expect(message).toBe('valid sentence');
    });

    it('短い表現で有効な単語のみの場合、trueを返す', () => {
      const words = ['very', 'good'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('単一の名詞の場合、trueを返す', () => {
      const words = ['sword'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('単一の形容詞の場合、trueを返す', () => {
      const words = ['beautiful'];
      expect(grammarChecker.isValidSentence(words)).toBe(true);
    });

    it('意味のない単語の組み合わせの場合、falseを返す', () => {
      const words = ['the', 'the', 'the'];
      expect(grammarChecker.isValidSentence(words)).toBe(false);
    });
  });
});
