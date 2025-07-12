/**
 * コマンド補完プロバイダー
 * グローバルコマンドとフェーズ固有コマンドの補完を提供する
 */

import { CompletionProvider } from '../CompletionProvider';
import { CompletionContext } from '../CompletionContext';

/**
 * コマンド名の補完を提供するプロバイダー
 */
export class CommandCompletionProvider implements CompletionProvider {
  /**
   * このプロバイダーが補完を提供できるかどうかを判定する
   * @param context 補完コンテキスト
   * @returns コマンド補完の場合はtrue
   */
  canComplete(context: CompletionContext): boolean {
    // 最初の単語（コマンド）を補完する場合のみ
    return context.isCommandCompletion();
  }

  /**
   * 補完候補を取得する
   * @param context 補完コンテキスト
   * @returns 補完候補の配列
   */
  getCompletions(context: CompletionContext): string[] {
    const input = context.currentArg.toLowerCase();
    
    // グローバルコマンドを取得
    const globalCompletions = context.commandParser.getCompletions(context.currentArg);
    
    // フェーズ固有のコマンドを取得
    const phaseCompletions = context.currentPhase
      ? context.currentPhase
          .getAvailableCommands()
          .filter(cmd => cmd.toLowerCase().startsWith(input))
      : [];

    // 重複を除去してマージ
    const allCompletions = [...new Set([...globalCompletions, ...phaseCompletions])];

    // マッチするものがない場合は全コマンドを表示
    if (allCompletions.length === 0) {
      return this.getAllAvailableCommands(context);
    }

    return allCompletions;
  }

  /**
   * プロバイダーの優先度を取得する
   * @returns 優先度（10）
   */
  getPriority(): number {
    return 10;
  }

  /**
   * 利用可能な全コマンドを取得する
   * @param context 補完コンテキスト
   * @returns 全コマンドの配列
   */
  private getAllAvailableCommands(context: CompletionContext): string[] {
    const globalCommands = context.commandParser.getAvailableCommands();
    const phaseCommands = context.currentPhase
      ? context.currentPhase.getAvailableCommands()
      : [];
    return [...new Set([...globalCommands, ...phaseCommands])].sort();
  }
}