import { TypingPhase } from './TypingPhase';
import { PhaseTypes } from '../core/types';
import { Player } from '../player/Player';
import { TypingChallenge } from '../typing/TypingChallenge';
import { WordDatabase } from '../typing/WordDatabase';
import { TypingResult } from '../typing/types';

// モックの作成
jest.mock('../typing/TypingChallenge');
jest.mock('../typing/WordDatabase');

describe('TypingPhase', () => {
  let typingPhase: TypingPhase;
  let mockPlayer: Player;
  let mockChallenge: TypingChallenge;
  let mockWordDatabase: WordDatabase;

  beforeEach(() => {
    mockPlayer = new Player('テストプレイヤー');
    mockChallenge = {
      start: jest.fn(),
      handleInput: jest.fn(),
      isComplete: jest.fn().mockReturnValue(false),
      getResult: jest.fn(),
      getProgress: jest.fn().mockReturnValue({
        text: 'test text',
        input: '',
        errors: [],
      }),
      getRemainingTime: jest.fn().mockReturnValue(10),
      getText: jest.fn().mockReturnValue('test text'),
    } as unknown as TypingChallenge;

    mockWordDatabase = {
      getRandomText: jest.fn().mockReturnValue('test text'),
      getAllTextsForDifficulty: jest.fn().mockReturnValue(['test text']),
      getTotalCount: jest.fn().mockReturnValue(1),
    } as unknown as WordDatabase;

    (TypingChallenge as jest.MockedClass<typeof TypingChallenge>).mockImplementation(
      () => mockChallenge
    );
    (WordDatabase as jest.MockedClass<typeof WordDatabase>).mockImplementation(
      () => mockWordDatabase
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('コンストラクタ', () => {
    test('難易度を指定してインスタンスを作成できる', () => {
      typingPhase = new TypingPhase(1);
      expect(typingPhase).toBeInstanceOf(TypingPhase);
      expect(typingPhase.getType()).toBe(PhaseTypes.TYPING);
    });

    test('難易度を指定しないでインスタンスを作成できる', () => {
      typingPhase = new TypingPhase();
      expect(typingPhase).toBeInstanceOf(TypingPhase);
      expect(typingPhase.getType()).toBe(PhaseTypes.TYPING);
    });

    test('WordDatabaseからランダムテキストを取得する', () => {
      typingPhase = new TypingPhase(2);
      expect(mockWordDatabase.getRandomText).toHaveBeenCalledWith(2);
    });

    test('TypingChallengeが正しく初期化される', () => {
      typingPhase = new TypingPhase(2);
      expect(TypingChallenge).toHaveBeenCalledWith('test text', 2);
    });
  });

  describe('enter', () => {
    test('フェーズ開始時にタイピングチャレンジが開始される', () => {
      typingPhase = new TypingPhase(1);
      typingPhase.enter(mockPlayer);

      expect(mockChallenge.start).toHaveBeenCalled();
    });

    test('フェーズ開始時にプロンプトが表示される', () => {
      typingPhase = new TypingPhase(1);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      typingPhase.enter(mockPlayer);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('=== Typing Challenge ==='));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Type the following text:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test text'));

      consoleSpy.mockRestore();
    });
  });

  describe('handleInput', () => {
    beforeEach(() => {
      typingPhase = new TypingPhase(1);
      typingPhase.enter(mockPlayer);
    });

    test('通常の文字入力がTypingChallengeに渡される', async () => {
      const result = await typingPhase.handleInput('a', mockPlayer);

      expect(mockChallenge.handleInput).toHaveBeenCalledWith('a');
      expect(result.nextPhase).toBeUndefined();
    });

    test('チャレンジ完了時に結果が表示される', async () => {
      const mockResult: TypingResult = {
        speedRating: 'Fast',
        accuracyRating: 'Perfect',
        totalRating: 150,
        timeTaken: 5000,
        accuracy: 100,
        isSuccess: true,
        forcedComplete: false,
      };

      (mockChallenge.isComplete as jest.Mock).mockReturnValue(true);
      (mockChallenge.getResult as jest.Mock).mockReturnValue(mockResult);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await typingPhase.handleInput('t', mockPlayer);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('=== Challenge Complete! ===')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Speed: Fast'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Accuracy: Perfect (100.0%)')
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Effect: 150%'));

      expect(result.data).toEqual({ result: mockResult });
      expect(result.nextPhase).toBe(PhaseTypes.TITLE);

      consoleSpy.mockRestore();
    });

    test('チャレンジ継続中は進捗が更新される', async () => {
      (mockChallenge.isComplete as jest.Mock).mockReturnValue(false);
      (mockChallenge.getProgress as jest.Mock).mockReturnValue({
        text: 'test text',
        input: 'te',
        errors: [],
      });
      (mockChallenge.getRemainingTime as jest.Mock).mockReturnValue(8.5);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await typingPhase.handleInput('e', mockPlayer);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Progress:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Time remaining: 8.5s'));

      consoleSpy.mockRestore();
    });

    test('Escキーで中断できる', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await typingPhase.handleInput('\x1b', mockPlayer);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('challenge cancelled'));
      expect(result.data).toEqual({ cancelled: true });
      expect(result.nextPhase).toBe(PhaseTypes.TITLE);

      consoleSpy.mockRestore();
    });

    test('Backspaceで文字を削除できる', async () => {
      await typingPhase.handleInput('\x7f', mockPlayer);
      expect(mockChallenge.handleInput).toHaveBeenCalledWith('\x7f');
    });
  });

  describe('プログレス表示', () => {
    beforeEach(() => {
      typingPhase = new TypingPhase(1);
      typingPhase.enter(mockPlayer);
    });

    test('正しい入力は緑色で表示される', async () => {
      (mockChallenge.isComplete as jest.Mock).mockReturnValue(false);
      (mockChallenge.getProgress as jest.Mock).mockReturnValue({
        text: 'hello world',
        input: 'hello',
        errors: [],
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await typingPhase.handleInput('o', mockPlayer);

      // 緑色のANSIエスケープコードを含むことを確認
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[32m'));

      consoleSpy.mockRestore();
    });

    test('エラーのある文字は赤色で表示される', async () => {
      (mockChallenge.isComplete as jest.Mock).mockReturnValue(false);
      (mockChallenge.getProgress as jest.Mock).mockReturnValue({
        text: 'hello world',
        input: 'hallo',
        errors: [1], // 2文字目がエラー
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await typingPhase.handleInput('o', mockPlayer);

      // 赤色のANSIエスケープコードを含むことを確認
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('\x1b[31m'));

      consoleSpy.mockRestore();
    });
  });

  describe('getPrompt', () => {
    test('タイピングフェーズ用のプロンプトを返す', () => {
      typingPhase = new TypingPhase(1);
      expect(typingPhase.getPrompt()).toBe('typing> ');
    });
  });

  describe('getAvailableCommands', () => {
    test('タイピング中は空の配列を返す', () => {
      typingPhase = new TypingPhase(1);
      expect(typingPhase.getAvailableCommands()).toEqual([]);
    });
  });
});
