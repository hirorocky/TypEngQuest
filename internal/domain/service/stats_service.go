// Package service はドメインサービスを提供します。
// 複数のドメインオブジェクトを組み合わせる純粋なビジネスロジックを配置します。
package service

import "hirorocky/type-battle/internal/domain"

// CalculateStats はコアレベルとコア特性からステータス値を計算します。
// STR, INT, WIL: 基礎値(10) × レベル × ステータス重み
// LUK: 基礎値(10) × ステータス重み（レベルの影響を受けない）
// 結果は整数に切り捨てられます。
func CalculateStats(level int, coreType domain.CoreType) domain.Stats {
	// 各ステータスの重みを取得（未設定の場合はデフォルト1.0）
	strWeight := getWeight(coreType.StatWeights, "STR")
	intWeight := getWeight(coreType.StatWeights, "INT")
	wilWeight := getWeight(coreType.StatWeights, "WIL")
	lukWeight := getWeight(coreType.StatWeights, "LUK")

	// 計算式: 基礎値 × レベル × 重み
	baseValue := float64(domain.BaseStatValue * level)

	return domain.Stats{
		STR: int(baseValue * strWeight),
		INT: int(baseValue * intWeight),
		WIL: int(baseValue * wilWeight),
		LUK: int(float64(domain.BaseStatValue) * lukWeight), // LUKはレベルに依存しない
	}
}

// getWeight はステータス重みを取得し、未設定の場合はデフォルト値1.0を返します。
func getWeight(weights map[string]float64, stat string) float64 {
	if w, ok := weights[stat]; ok {
		return w
	}
	return 1.0
}
