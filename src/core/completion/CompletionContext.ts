/**
 * 補完コンテキストクラス
 * 補完に必要な情報を整理して渡すためのコンテキスト
 */

import { CommandParser } from '../CommandParser';
import { Phase } from '../Phase';
import { World } from '../../world/World';

/**
 * 補完実行時のコンテキスト情報
 */
export class CompletionContext {
  /**
   * 入力行全体
   */
  readonly inputLine: string;

  /**
   * 入力をスペースで分割した部分
   */
  readonly parts: string[];

  /**
   * コマンド（最初の部分）
   */
  readonly command: string;

  /**
   * 現在の引数（補完対象）
   */
  readonly currentArg: string;

  /**
   * コマンドパーサー
   */
  readonly commandParser: CommandParser;

  /**
   * 現在のフェーズ
   */
  readonly currentPhase: Phase | null;

  /**
   * 現在のワールド
   */
  readonly currentWorld: World | null;

  /**
   * CompletionContextを作成する
   * @param inputLine 入力行全体
   * @param commandParser コマンドパーサー
   * @param currentPhase 現在のフェーズ
   * @param currentWorld 現在のワールド
   */
  constructor(
    inputLine: string,
    commandParser: CommandParser,
    currentPhase: Phase | null,
    currentWorld: World | null
  ) {
    this.inputLine = inputLine.trim();
    this.parts = this.inputLine.split(' ');
    this.command = this.parts[0] || '';
    this.currentArg = this.parts[this.parts.length - 1] || '';
    this.commandParser = commandParser;
    this.currentPhase = currentPhase;
    this.currentWorld = currentWorld;
  }

  /**
   * コマンドの引数があるかどうか
   * @returns 引数がある場合はtrue
   */
  hasArguments(): boolean {
    return this.parts.length > 1;
  }

  /**
   * 補完対象がコマンド名かどうか
   * @returns コマンド名の補完の場合はtrue
   */
  isCommandCompletion(): boolean {
    return this.parts.length <= 1;
  }

  /**
   * 引数の数を取得する（コマンド名を除く）
   * @returns 引数の数
   */
  getArgumentCount(): number {
    return Math.max(0, this.parts.length - 1);
  }
}