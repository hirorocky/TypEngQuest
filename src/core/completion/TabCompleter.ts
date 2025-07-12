/**
 * Tab補完機能のメインクラス
 * 複数のCompletionProviderを管理し、統一的な補完機能を提供する
 */

import { CommandParser } from '../CommandParser';
import { Phase } from '../Phase';
import { World } from '../../world/World';
import { CompletionProvider } from './CompletionProvider';
import { CompletionContext } from './CompletionContext';

/**
 * Tab補完を管理するクラス
 */
export class TabCompleter {
  private providers: CompletionProvider[] = [];
  private commandParser: CommandParser;

  /**
   * TabCompleterを作成する
   * @param commandParser コマンドパーサー
   */
  constructor(commandParser: CommandParser) {
    this.commandParser = commandParser;
  }

  /**
   * 補完プロバイダーを追加する
   * @param provider 追加するプロバイダー
   */
  addProvider(provider: CompletionProvider): void {
    this.providers.push(provider);
    // 優先度順にソート（降順）
    this.providers.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * 補完プロバイダーを削除する
   * @param provider 削除するプロバイダー
   */
  removeProvider(provider: CompletionProvider): void {
    const index = this.providers.indexOf(provider);
    if (index !== -1) {
      this.providers.splice(index, 1);
    }
  }

  /**
   * Tab補完を実行する
   * @param line 入力行
   * @param currentPhase 現在のフェーズ
   * @param currentWorld 現在のワールド
   * @returns [補完候補の配列, 補完対象の文字列]
   */
  complete(line: string, currentPhase: Phase | null, currentWorld: World | null): [string[], string] {
    const context = new CompletionContext(
      line,
      this.commandParser,
      currentPhase,
      currentWorld
    );

    // 各プロバイダーから補完候補を収集
    const allCompletions = new Set<string>();
    
    for (const provider of this.providers) {
      if (provider.canComplete(context)) {
        const completions = provider.getCompletions(context);
        completions.forEach(completion => allCompletions.add(completion));
      }
    }

    const completionArray = Array.from(allCompletions).sort();

    // Node.js readline completerの仕様に従って返す
    if (context.isCommandCompletion()) {
      // コマンド補完の場合
      return [completionArray, context.currentArg];
    } else {
      // 引数補完の場合（現在は最後の引数のみを対象）
      return [completionArray, context.currentArg];
    }
  }

  /**
   * 文字列配列の共通プレフィックスを見つける
   * @param strings 文字列配列
   * @returns 共通プレフィックス
   */
  static findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (prefix.length > 0 && !strings[i].startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
    }
    return prefix;
  }
}