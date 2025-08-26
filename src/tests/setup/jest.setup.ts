/**
 * Jest のセットアップファイル
 * カスタムマッチャーやグローバル設定を定義
 */

// これをモジュールとして扱うためのexport
export {};

// グローバルなテストタイムアウトを設定
jest.setTimeout(10000);

// Jest環境でのprocess.stdin問題を回避
// テスト環境ではstdinを使用しないように設定
const mockStdin = {
  isTTY: false,
  setRawMode: jest.fn(),
  removeAllListeners: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  off: jest.fn(),
  removeListener: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn()
};

// process.stdinをMockで置き換える（テスト環境のみ）
Object.defineProperty(process, 'stdin', {
  value: mockStdin,
  writable: false,
  configurable: true
});

// blessed ライブラリの出力を抑制
const originalWrite = process.stdout.write;
process.stdout.write = function(chunk: any, ...args: any[]) {
  // ANSI制御文字や blessed の出力をフィルタ
  if (typeof chunk === 'string' && (
    chunk.includes('[2J') ||  // 画面クリア
    chunk.includes('[0f') ||  // カーソル位置
    chunk.includes('[~]$') || // プロンプト文字
    chunk.match(/^\[.*\].*\$/) // その他のプロンプト系
  )) {
    return true;
  }
  return originalWrite.call(this, chunk, ...args);
};

// カスタムマッチャーの追加
expect.extend({
  /**
   * フェーズが期待値と一致することを確認
   */
  toBeInPhase(game: any, expectedPhase: string) {
    const currentPhase = game.getCurrentPhase();
    const pass = currentPhase === expectedPhase;
    
    return {
      pass,
      message: () => pass
        ? `期待通りフェーズは ${expectedPhase} です`
        : `フェーズが ${currentPhase} ですが、${expectedPhase} であるべきです`
    };
  },
  
  /**
   * コマンド結果が成功であることを確認
   */
  toBeSuccessfulCommand(result: any) {
    const pass = result && result.success === true;
    
    return {
      pass,
      message: () => pass
        ? 'コマンドは成功しました'
        : `コマンドが失敗しました: ${result?.message || '不明なエラー'}`
    };
  }
});

// TypeScript用の型定義
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInPhase(expectedPhase: string): R;
      toBeSuccessfulCommand(): R;
    }
  }
}

// グローバルなクリーンアップ
afterEach(() => {
  // 全てのタイマーをクリア
  jest.clearAllTimers();
  
  // 全てのモックをクリア
  jest.clearAllMocks();
  
  // process.stdin関連の処理はJest環境では完全にスキップ
  // Jest環境では process.stdin の操作は必要ない
});

// プロセスリスナーの警告を抑制
process.setMaxListeners(15);