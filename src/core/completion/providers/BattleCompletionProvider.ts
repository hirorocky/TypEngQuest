import { CompletionProvider } from '../CompletionProvider';
import { CompletionContext } from '../CompletionContext';
import { FileType } from '../../../world/FileNode';

/**
 * battleコマンド用の補完プロバイダー
 * モンスターファイル（バトル可能なファイル）のみを補完候補として提供する
 */
export class BattleCompletionProvider implements CompletionProvider {
  /**
   * このプロバイダーが補完を提供できるかどうかを判定する
   * @param context 補完コンテキスト
   * @returns battleコマンドの引数補完が必要な場合にtrue
   */
  canComplete(context: CompletionContext): boolean {
    // battleコマンドで、引数の補完の場合
    return context.command === 'battle' && context.hasArguments() && context.currentWorld !== null;
  }

  /**
   * 補完候補を取得する
   * @param context 補完コンテキスト
   * @returns バトル可能なファイルの補完候補の配列
   */
  getCompletions(context: CompletionContext): string[] {
    if (!context.currentWorld) {
      return [];
    }

    try {
      const fileSystem = context.currentWorld.getFileSystem();
      
      // 現在のディレクトリにあるすべてのファイルを取得
      const currentNode = fileSystem.currentNode;
      const allFiles = currentNode.children.filter((child: any) => child.isFile());
      
      // モンスターファイル（バトル可能なファイル）のみをフィルタ
      const monsterFiles = allFiles.filter((file: any) => file.fileType === FileType.MONSTER);
      
      // 現在の入力にマッチするファイルをフィルタ
      const prefix = context.currentArg.toLowerCase();
      const matchingFiles = monsterFiles
        .map((file: any) => file.name)
        .filter((name: string) => name.toLowerCase().startsWith(prefix));
      
      // マッチするものがない場合は全モンスターファイルを表示
      if (matchingFiles.length === 0) {
        return monsterFiles.map((file: any) => file.name);
      }
      
      return matchingFiles;
    } catch (_error) {
      return [];
    }
  }

  /**
   * プロバイダーの優先度を取得する
   * @returns 優先度（10） - 高い優先度でbattle専用の補完を提供
   */
  getPriority(): number {
    return 10;
  }
}