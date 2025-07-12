/**
 * 補完プロバイダーインターフェース
 * 各種補完機能を統一的に扱うためのインターフェース
 */

import { CompletionContext } from './CompletionContext';

/**
 * 補完プロバイダーのインターフェース
 */
export interface CompletionProvider {
  /**
   * このプロバイダーが補完を提供できるかどうかを判定する
   * @param context 補完コンテキスト
   * @returns 補完を提供できる場合はtrue
   */
  canComplete(context: CompletionContext): boolean;

  /**
   * 補完候補を取得する
   * @param context 補完コンテキスト
   * @returns 補完候補の配列
   */
  getCompletions(context: CompletionContext): string[];

  /**
   * プロバイダーの優先度を取得する
   * 数値が大きいほど優先度が高い
   * @returns 優先度
   */
  getPriority(): number;
}