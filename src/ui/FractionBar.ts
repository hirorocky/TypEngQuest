/**
 * 分数を□と■で視覚的に表現するユーティリティ
 */

/**
 * 分子と分母を受け取り、□と■で分数を表現する
 * @param numerator 分子
 * @param denominator 分母
 * @returns 分数のビジュアル表現（10個の四角で構成）
 */
export function createFractionBar(numerator: number, denominator: number): string {
  // 入力検証
  if (denominator === 0) {
    throw new Error('分母は0にできません');
  }

  if (numerator < 0 || denominator < 0) {
    throw new Error('負の値は使用できません');
  }

  // 10個の四角で表現
  const totalSquares = 10;

  // 分数の値を計算して、塗りつぶす四角の数を決定
  const fraction = numerator / denominator;
  const filledSquares = Math.min(Math.round(fraction * totalSquares), totalSquares);
  const emptySquares = totalSquares - filledSquares;

  // ■（塗りつぶし）と□（空）を組み合わせて文字列を作成
  const filled = '■'.repeat(filledSquares);
  const empty = '□'.repeat(emptySquares);

  return filled + empty;
}

/**
 * 分数バーを詳細情報付きで表示する
 * @param numerator 分子
 * @param denominator 分母
 * @returns 分数の詳細表示文字列
 */
export function createDetailedFractionBar(numerator: number, denominator: number): string {
  const bar = createFractionBar(numerator, denominator);
  const percentage = Math.round((numerator / denominator) * 100);

  return `${bar} (${numerator}/${denominator} = ${percentage}%)`;
}
