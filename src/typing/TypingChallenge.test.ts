import { TypingChallenge } from './TypingChallenge';
import { TypingDifficulty } from './types';

describe('TypingChallenge', () => {
  let challenge: TypingChallenge;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('コンストラクタ', () => {
    test('問題文と難易度を設定できる', () => {
      challenge = new TypingChallenge('hello world', 1);
      expect(challenge.getText()).toBe('hello world');
    });

    test('難易度が制限時間に影響する', () => {
      challenge = new TypingChallenge('test', 1);
      expect(challenge.getTimeLimit()).toBe(15); // 10 + (1 * 5)

      challenge = new TypingChallenge('test', 5);
      expect(challenge.getTimeLimit()).toBe(35); // 10 + (5 * 5)
    });
  });

  describe('start', () => {
    test('チャレンジを開始できる', () => {
      challenge = new TypingChallenge('test', 1);
      const now = Date.now();
      jest.setSystemTime(now);

      challenge.start();

      expect(challenge.getRemainingTime()).toBe(15);
    });

    test('開始するとinputとerrorsがリセットされる', () => {
      challenge = new TypingChallenge('test', 1);
      // 事前に何か入力しておく
      challenge.handleInput('t');
      challenge.handleInput('x'); // エラー

      challenge.start();

      const progress = challenge.getProgress();
      expect(progress.input).toBe('');
      expect(progress.errors).toEqual([]);
    });
  });

  describe('handleInput', () => {
    beforeEach(() => {
      challenge = new TypingChallenge('hello', 1);
      challenge.start();
    });

    test('正しい文字を入力できる', () => {
      challenge.handleInput('h');
      const progress = challenge.getProgress();

      expect(progress.input).toBe('h');
      expect(progress.errors).toEqual([]);
    });

    test('間違った文字を入力するとエラーになる', () => {
      challenge.handleInput('x');
      const progress = challenge.getProgress();

      expect(progress.input).toBe('x');
      expect(progress.errors).toEqual([0]);
    });

    test('複数文字を順番に入力できる', () => {
      challenge.handleInput('h');
      challenge.handleInput('e');
      challenge.handleInput('l');

      const progress = challenge.getProgress();
      expect(progress.input).toBe('hel');
      expect(progress.errors).toEqual([]);
    });

    test('バックスペースで文字を削除できる', () => {
      challenge.handleInput('h');
      challenge.handleInput('e');
      challenge.handleInput('\x7f'); // Backspace

      const progress = challenge.getProgress();
      expect(progress.input).toBe('h');
    });

    test('入力が空の状態でバックスペースしても問題ない', () => {
      challenge.handleInput('\x7f');

      const progress = challenge.getProgress();
      expect(progress.input).toBe('');
    });

    test('エラーのある文字を削除するとエラーも削除される', () => {
      challenge.handleInput('h');
      challenge.handleInput('x'); // エラー
      challenge.handleInput('l');

      let progress = challenge.getProgress();
      expect(progress.errors).toEqual([1]);

      challenge.handleInput('\x7f'); // 'l'を削除
      challenge.handleInput('\x7f'); // 'x'を削除

      progress = challenge.getProgress();
      expect(progress.input).toBe('h');
      expect(progress.errors).toEqual([]);
    });

    test('チャレンジ完了後は入力を受け付けない', () => {
      // 全文字入力
      'hello'.split('').forEach(char => challenge.handleInput(char));

      const beforeInput = challenge.getProgress().input;
      challenge.handleInput('x'); // 追加入力

      expect(challenge.getProgress().input).toBe(beforeInput);
    });
  });

  describe('isComplete', () => {
    beforeEach(() => {
      challenge = new TypingChallenge('test', 1);
      challenge.start();
    });

    test('全文字正しく入力すると完了', () => {
      'test'.split('').forEach(char => challenge.handleInput(char));

      expect(challenge.isComplete()).toBe(true);
    });

    test('一部だけ入力では完了しない', () => {
      challenge.handleInput('t');
      challenge.handleInput('e');

      expect(challenge.isComplete()).toBe(false);
    });

    test('エラーがあっても全文字入力すれば完了', () => {
      challenge.handleInput('x'); // エラー
      challenge.handleInput('e');
      challenge.handleInput('s');
      challenge.handleInput('t');

      expect(challenge.isComplete()).toBe(true);
    });

    test('時間切れでも完了扱い', () => {
      const now = Date.now();
      jest.setSystemTime(now);
      challenge.start();

      // 時間を進める
      jest.setSystemTime(now + 16000); // 16秒後

      expect(challenge.isComplete()).toBe(true);
    });
  });

  describe('getRemainingTime', () => {
    test('残り時間が正しく計算される', () => {
      challenge = new TypingChallenge('test', 1);
      const now = Date.now();
      jest.setSystemTime(now);

      challenge.start();
      expect(challenge.getRemainingTime()).toBe(15);

      jest.setSystemTime(now + 5000); // 5秒後
      expect(challenge.getRemainingTime()).toBe(10);

      jest.setSystemTime(now + 15000); // 15秒後
      expect(challenge.getRemainingTime()).toBe(0);

      jest.setSystemTime(now + 20000); // 20秒後
      expect(challenge.getRemainingTime()).toBe(0); // 負の値にならない
    });

    test('開始前は制限時間を返す', () => {
      challenge = new TypingChallenge('test', 3);
      expect(challenge.getRemainingTime()).toBe(25); // 10 + (3 * 5)
    });
  });

  describe('getResult', () => {
    beforeEach(() => {
      challenge = new TypingChallenge('hello', 1);
      const now = Date.now();
      jest.setSystemTime(now);
      challenge.start();
    });

    test('完璧な入力（S + Perfect）', () => {
      jest.setSystemTime(Date.now() + 1000); // 1秒で完了
      'hello'.split('').forEach(char => challenge.handleInput(char));

      const result = challenge.getResult();
      expect(result.speedRating).toBe('S');
      expect(result.accuracyRating).toBe('Perfect');
      expect(result.totalRating).toBe(150);
      expect(result.accuracy).toBe(100);
      expect(result.isSuccess).toBe(true);
    });

    test('速い入力で1文字ミス（S + Perfect）', () => {
      jest.setSystemTime(Date.now() + 3000); // 3秒で完了（15秒の20%なのでS）
      challenge.handleInput('h');
      challenge.handleInput('x'); // ミス
      challenge.handleInput('\x7f'); // 削除（バックスペースで削除すると統計も調整される）
      challenge.handleInput('e');
      challenge.handleInput('l');
      challenge.handleInput('l');
      challenge.handleInput('o');

      const result = challenge.getResult();
      expect(result.speedRating).toBe('S');
      expect(result.accuracyRating).toBe('Perfect'); // バックスペースで削除したので100%
      expect(result.accuracy).toBe(100);
      expect(result.totalRating).toBe(150); // S + Perfect
    });

    test('ミスを修正しない場合（B + Poor）', () => {
      jest.setSystemTime(Date.now() + 11000); // 11秒で完了（15秒の73%なのでB）
      challenge.handleInput('h');
      challenge.handleInput('x'); // ミス（修正せず）
      challenge.handleInput('l');
      challenge.handleInput('l');
      challenge.handleInput('o');

      const result = challenge.getResult();
      expect(result.speedRating).toBe('B');
      expect(result.accuracyRating).toBe('Poor'); // 4/5 = 80% < 90%
      expect(result.accuracy).toBe(80);
      expect(result.totalRating).toBe(0); // B + Poor = 失敗
    });

    test('遅い入力（C + Perfect）', () => {
      jest.setSystemTime(Date.now() + 14000); // 14秒で完了
      'hello'.split('').forEach(char => challenge.handleInput(char));

      const result = challenge.getResult();
      expect(result.speedRating).toBe('C');
      expect(result.accuracyRating).toBe('Perfect');
      expect(result.totalRating).toBe(80);
    });

    test('時間切れ（F）', () => {
      jest.setSystemTime(Date.now() + 16000); // 16秒（時間切れ）
      challenge.handleInput('h');
      challenge.handleInput('e');

      const result = challenge.getResult();
      expect(result.speedRating).toBe('F');
      expect(result.totalRating).toBe(0);
      expect(result.isSuccess).toBe(false);
    });

    test('多くのミスがある場合（Poor）', () => {
      jest.setSystemTime(Date.now() + 5000);
      // 11文字入力して5文字のみ正解
      'hxlxo'.split('').forEach(char => challenge.handleInput(char));

      const result = challenge.getResult();
      expect(result.accuracyRating).toBe('Poor'); // 3/5 = 60% < 90%
      expect(result.totalRating).toBe(0);
      expect(result.isSuccess).toBe(false);
    });
  });

  describe('getTimeLimit', () => {
    test.each<[TypingDifficulty, number]>([
      [1, 15],
      [2, 20],
      [3, 25],
      [4, 30],
      [5, 35],
    ])('難易度%dの制限時間は%d秒', (difficulty, expected) => {
      challenge = new TypingChallenge('test', difficulty);
      expect(challenge.getTimeLimit()).toBe(expected);
    });
  });
});
