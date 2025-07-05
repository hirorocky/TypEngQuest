import { jest } from '@jest/globals';
import { setImmediate, clearTimeout, setTimeout } from 'timers';

/**
 * シンプルで使いやすいモックヘルパー
 * Jest の最新機能を活用して、より簡潔に非同期処理をテスト
 */
export class SimplifiedMockHelper {
  private cleanupFunctions: Array<() => void | Promise<void>> = [];

  /**
   * 自動クリーンアップ機能付きモック
   * 登録されたクリーンアップ関数は restoreAll() で一括実行される
   */
  
  /**
   * プロセス終了をモック（自動クリーンアップ付き）
   */
  mockProcessExit() {
    const originalExit = process.exit;
    const mockExit = jest.fn();
    (process as any).exit = mockExit;
    
    this.cleanupFunctions.push(() => {
      (process as any).exit = originalExit;
    });
    
    return mockExit;
  }

  /**
   * タイマーをモック（自動クリーンアップ付き）
   */
  useFakeTimers() {
    jest.useFakeTimers();
    this.cleanupFunctions.push(() => {
      jest.useRealTimers();
    });
  }

  /**
   * 非同期タイマーを進める（改善版）
   * @param ms ミリ秒
   */
  async advanceTimersByTimeAsync(ms: number) {
    jest.advanceTimersByTime(ms);
    // マイクロタスクキューをフラッシュ
    await Promise.resolve();
    // さらに次のティックまで待つ
    await new Promise(resolve => setImmediate(resolve));
  }

  /**
   * シグナルハンドラーを一時的に無効化
   */
  disableSignalHandlers() {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    const originalListeners = new Map<NodeJS.Signals, Function[]>();
    
    signals.forEach(signal => {
      const listeners = process.listeners(signal);
      originalListeners.set(signal, listeners);
      process.removeAllListeners(signal);
    });
    
    this.cleanupFunctions.push(() => {
      originalListeners.forEach((listeners, signal) => {
        listeners.forEach(listener => process.on(signal, listener as any));
      });
    });
  }

  /**
   * ReadlineインターフェースをモックするためのビルダーAPI
   */
  createReadlineMock() {
    const events = new Map<string, Function[]>();
    
    const rlMock = {
      on: jest.fn((event: string, handler: Function) => {
        if (!events.has(event)) {
          events.set(event, []);
        }
        events.get(event)!.push(handler);
        return rlMock;
      }),
      once: jest.fn(),
      close: jest.fn(),
      prompt: jest.fn(),
      setPrompt: jest.fn(),
      removeAllListeners: jest.fn(),
      
      // テスト用ヘルパーメソッド
      simulateInput(input: string) {
        const handlers = events.get('line') || [];
        handlers.forEach(handler => handler(input));
      },
      
      simulateKeypress(key: string, keyInfo: any = { name: key }) {
        const handlers = events.get('keypress') || [];
        handlers.forEach(handler => handler(key, keyInfo));
      }
    };
    
    return rlMock;
  }

  /**
   * 全てのモックを一括でクリーンアップ
   */
  async restoreAll() {
    // 逆順で実行（後から登録したものから先にクリーンアップ）
    const functions = [...this.cleanupFunctions].reverse();
    this.cleanupFunctions = [];
    
    for (const cleanup of functions) {
      await cleanup();
    }
    
    // Jestのモックもクリア
    jest.clearAllMocks();
    jest.clearAllTimers();
  }
}

/**
 * テストケースで使いやすいヘルパー関数
 */
export function withMocks(testFn: (mocks: SimplifiedMockHelper) => Promise<void>) {
  return async () => {
    const mocks = new SimplifiedMockHelper();
    try {
      await testFn(mocks);
    } finally {
      await mocks.restoreAll();
    }
  };
}

/**
 * タイムアウト付きの非同期処理待機
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * イベントを待機するヘルパー
 */
export function waitForEvent<T>(
  emitter: NodeJS.EventEmitter,
  event: string,
  timeout: number = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeListener(event, handler);
      reject(new Error(`Timeout waiting for event '${event}' after ${timeout}ms`));
    }, timeout);
    
    const handler = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };
    
    emitter.once(event, handler);
  });
}