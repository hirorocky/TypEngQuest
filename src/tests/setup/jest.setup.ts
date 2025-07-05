/**
 * Jest のセットアップファイル
 * カスタムマッチャーやグローバル設定を定義
 */

// これをモジュールとして扱うためのexport
export {};

// グローバルなテストタイムアウトを設定
jest.setTimeout(10000);

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
});

// プロセスリスナーの警告を抑制
process.setMaxListeners(15);