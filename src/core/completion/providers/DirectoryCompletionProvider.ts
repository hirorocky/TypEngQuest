/**
 * ディレクトリ・ファイル補完プロバイダー
 * cdコマンドのディレクトリ補完、openコマンドのファイル・ディレクトリ補完を提供する
 */

import { CompletionProvider } from '../CompletionProvider';
import { CompletionContext } from '../CompletionContext';

/**
 * ディレクトリ名・ファイル名の補完を提供するプロバイダー
 */
export class DirectoryCompletionProvider implements CompletionProvider {
  /**
   * このプロバイダーが補完を提供できるかどうかを判定する
   * @param context 補完コンテキスト
   * @returns ディレクトリ補完が必要な場合はtrue
   */
  canComplete(context: CompletionContext): boolean {
    // コマンドがcd、openで、引数の補完の場合
    const supportedCommands = ['cd', 'open'];
    return supportedCommands.includes(context.command) && context.hasArguments() && context.currentWorld !== null;
  }

  /**
   * 補完候補を取得する
   * @param context 補完コンテキスト
   * @returns 補完候補の配列
   */
  getCompletions(context: CompletionContext): string[] {
    if (!context.currentWorld) {
      return [];
    }

    try {
      const fileSystem = context.currentWorld.getFileSystem();
      
      if (context.command === 'cd') {
        // cdコマンドの場合はディレクトリのみ
        const directories = fileSystem.getDirectoryCompletions(context.currentArg);
        
        // マッチするディレクトリがない場合は全ディレクトリを表示
        if (directories.length === 0) {
          return fileSystem.getDirectoryCompletions('');
        }

        return directories;
      } else if (context.command === 'open') {
        // openコマンドの場合はファイルとディレクトリ
        const files = fileSystem.getFileCompletions(context.currentArg);
        const directories = fileSystem.getDirectoryCompletions(context.currentArg);
        const combined = [...files, ...directories];
        
        // マッチするものがない場合は全ファイルとディレクトリを表示
        if (combined.length === 0) {
          return [...fileSystem.getFileCompletions(''), ...fileSystem.getDirectoryCompletions('')];
        }

        return combined;
      }
      
      return [];
    } catch (_error) {
      return [];
    }
  }

  /**
   * プロバイダーの優先度を取得する
   * @returns 優先度（5）
   */
  getPriority(): number {
    return 5;
  }
}