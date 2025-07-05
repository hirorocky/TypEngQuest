import { jest } from '@jest/globals';

/**
 * 統合テスト用のモックヘルパークラス
 * readlineやプロセス関連のモックを管理する
 */
export class MockHelper {
  private originalProcessExit: typeof process.exit;
  private originalProcessStdin: typeof process.stdin;
  private processExitMock: jest.MockedFunction<typeof process.exit>;
  private activeTimers?: NodeJS.Timeout[];
  private stdinMocks: {
    on: jest.MockedFunction<any>;
    setRawMode: jest.MockedFunction<any>;
    resume: jest.MockedFunction<any>;
    pause: jest.MockedFunction<any>;
  };

  constructor() {
    this.originalProcessExit = process.exit;
    this.originalProcessStdin = process.stdin;
    this.processExitMock = jest.fn() as jest.MockedFunction<typeof process.exit>;
    this.stdinMocks = {
      on: jest.fn(),
      setRawMode: jest.fn(),
      resume: jest.fn(),
      pause: jest.fn()
    };
  }

  /**
   * process.exitをモックする
   * テスト中にプロセスが終了しないようにする
   */
  public mockProcessExit(): void {
    // process.exitをモック関数で置き換え
    (process as any).exit = this.processExitMock;
  }

  /**
   * process.stdinをモックする
   * readlineの入力処理をテスト可能にする
   */
  public mockProcessStdin(): void {
    // process.stdinの主要メソッドをモック
    (process.stdin as any).on = this.stdinMocks.on;
    (process.stdin as any).setRawMode = this.stdinMocks.setRawMode;
    (process.stdin as any).resume = this.stdinMocks.resume;
    (process.stdin as any).pause = this.stdinMocks.pause;
  }

  /**
   * readlineモジュールをモックする
   * @returns モック化されたreadlineインターフェース
   */
  public createReadlineMock() {
    const mockInterface = {
      question: jest.fn(),
      close: jest.fn(),
      on: jest.fn(),
      setPrompt: jest.fn(),
      prompt: jest.fn(),
      write: jest.fn()
    };

    const mockReadline = {
      createInterface: jest.fn().mockReturnValue(mockInterface),
      Interface: jest.fn().mockImplementation(() => mockInterface)
    };

    return { mockReadline, mockInterface };
  }

  /**
   * タイマー関連をモックする
   * setTimeout、setIntervalなどをモック化
   */
  public mockTimers(): void {
    jest.useFakeTimers();
  }

  /**
   * 入力イベントをシミュレートする
   * @param input シミュレートする入力文字列
   */
  public simulateInput(input: string): void {
    const dataCallback = this.stdinMocks.on.mock.calls
      .find((call: any) => call[0] === 'data')?.[1];
    
    if (dataCallback) {
      dataCallback(Buffer.from(input));
    }
  }

  /**
   * キーボードイベントをシミュレートする
   * @param key シミュレートするキー
   */
  public simulateKeyPress(key: string): void {
    const keyCallback = this.stdinMocks.on.mock.calls
      .find((call: any) => call[0] === 'keypress')?.[1];
    
    if (keyCallback) {
      keyCallback(key, { name: key });
    }
  }

  /**
   * 非同期の入力待機をシミュレートする
   * @param input 入力する文字列
   * @param delay 遅延時間（ミリ秒）
   */
  public async simulateDelayedInput(input: string, delay: number = 100): Promise<void> {
    // Jestのフェイクタイマーを使用している場合は、タイマーを進める
    if (jest.isMockFunction(setTimeout)) {
      const promise = new Promise<void>(resolve => {
        setTimeout(() => {
          this.simulateInput(input + '\n');
          resolve();
        }, delay);
      });
      
      // タイマーを進める
      jest.advanceTimersByTime(delay);
      
      return promise;
    } else {
      // リアルタイマーの場合
      return new Promise(resolve => {
        const timerId = setTimeout(() => {
          this.simulateInput(input + '\n');
          resolve();
        }, delay);
        
        // タイマーIDを保存して、必要に応じてクリアできるようにする
        if (!this.activeTimers) {
          this.activeTimers = [];
        }
        this.activeTimers.push(timerId);
      });
    }
  }

  /**
   * process.exitが呼ばれたかチェックする
   * @param expectedCode 期待する終了コード（オプション）
   * @returns process.exitが呼ばれたかどうか
   */
  public wasProcessExitCalled(expectedCode?: number): boolean {
    if (expectedCode !== undefined) {
      return this.processExitMock.mock.calls.some(call => call[0] === expectedCode);
    }
    return this.processExitMock.mock.calls.length > 0;
  }

  /**
   * stdinのsetRawModeが呼ばれたかチェックする
   * @param expectedMode 期待するモード（true/false）
   * @returns setRawModeが期待するモードで呼ばれたかどうか
   */
  public wasSetRawModeCalled(expectedMode?: boolean): boolean {
    if (expectedMode !== undefined) {
      return this.stdinMocks.setRawMode.mock.calls.some((call: any) => call[0] === expectedMode);
    }
    return this.stdinMocks.setRawMode.mock.calls.length > 0;
  }

  /**
   * 全てのモックをリセットする
   */
  public resetAllMocks(): void {
    this.processExitMock.mockReset();
    Object.values(this.stdinMocks).forEach(mock => mock.mockReset());
  }

  /**
   * 全てのモックを復元する
   */
  public restoreAllMocks(): void {
    // アクティブなタイマーをクリア
    if (this.activeTimers) {
      this.activeTimers.forEach(timerId => clearTimeout(timerId));
      this.activeTimers = [];
    }
    
    // 元のprocess.exitを復元
    (process as any).exit = this.originalProcessExit;
    
    // 元のprocess.stdinを復元
    Object.assign(process.stdin, this.originalProcessStdin);
    
    // タイマーを復元
    jest.clearAllTimers();
    jest.useRealTimers();
    
    // 全てのモックをリセット
    this.resetAllMocks();
  }
}