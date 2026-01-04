// Package service はドメインサービスを提供します。
// 複数のドメインオブジェクトを組み合わせる純粋なビジネスロジックを配置します。
package service

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestCalculateStats_Basic はステータス計算の基本動作をテストします。
func TestCalculateStats_Basic(t *testing.T) {
	// コア特性を用意
	coreType := domain.CoreType{
		ID:   "test-type",
		Name: "テスト特性",
		StatWeights: map[string]float64{
			"STR": 1.0,
			"INT": 1.0,
			"WIL": 1.0,
			"LUK": 1.0,
		},
	}

	// レベル1でテスト
	stats := CalculateStats(1, coreType)

	// 基礎値(10) × レベル(1) × 重み(1.0) = 10
	if stats.STR != 10 {
		t.Errorf("STR expected 10, got %d", stats.STR)
	}
	if stats.INT != 10 {
		t.Errorf("INT expected 10, got %d", stats.INT)
	}
	if stats.WIL != 10 {
		t.Errorf("WIL expected 10, got %d", stats.WIL)
	}
	// LUKはレベルに依存せず、10 × 重み(1.0) = 10
	if stats.LUK != 10 {
		t.Errorf("LUK expected 10, got %d", stats.LUK)
	}
}

// TestCalculateStats_WithWeights は重み付きステータス計算をテストします。
func TestCalculateStats_WithWeights(t *testing.T) {
	coreType := domain.CoreType{
		ID:   "weighted-type",
		Name: "重み付き特性",
		StatWeights: map[string]float64{
			"STR": 1.5, // 50%増加
			"INT": 0.5, // 50%減少
			"WIL": 2.0, // 2倍
			"LUK": 0.5, // 50%（LUK基準値の影響）
		},
	}

	// レベル2でテスト
	stats := CalculateStats(2, coreType)

	// STR, INT, WIL: 基礎値(10) × レベル(2) × 重み
	// LUK: 基礎値(10) × 重み（レベル無関係）
	expected := map[string]int{
		"STR": 30, // 20 × 1.5 = 30
		"INT": 10, // 20 × 0.5 = 10
		"WIL": 40, // 20 × 2.0 = 40
		"LUK": 5,  // 10 × 0.5 = 5 (レベル無関係)
	}

	if stats.STR != expected["STR"] {
		t.Errorf("STR expected %d, got %d", expected["STR"], stats.STR)
	}
	if stats.INT != expected["INT"] {
		t.Errorf("INT expected %d, got %d", expected["INT"], stats.INT)
	}
	if stats.WIL != expected["WIL"] {
		t.Errorf("WIL expected %d, got %d", expected["WIL"], stats.WIL)
	}
	if stats.LUK != expected["LUK"] {
		t.Errorf("LUK expected %d, got %d", expected["LUK"], stats.LUK)
	}
}

// TestCalculateStats_HighLevel は高レベルでの計算をテストします。
func TestCalculateStats_HighLevel(t *testing.T) {
	coreType := domain.CoreType{
		ID:   "high-level-type",
		Name: "高レベルテスト",
		StatWeights: map[string]float64{
			"STR": 1.2,
			"INT": 0.8,
			"WIL": 1.0,
			"LUK": 1.0,
		},
	}

	// レベル10でテスト
	stats := CalculateStats(10, coreType)

	// STR, INT, WIL: 基礎値(10) × レベル(10) = 100
	// LUK: 基礎値(10) × 重み（レベル無関係）
	if stats.STR != 120 {
		t.Errorf("STR expected 120, got %d", stats.STR)
	}
	if stats.INT != 80 {
		t.Errorf("INT expected 80, got %d", stats.INT)
	}
	if stats.WIL != 100 {
		t.Errorf("WIL expected 100, got %d", stats.WIL)
	}
	// LUKはレベルに依存しない
	if stats.LUK != 10 {
		t.Errorf("LUK expected 10, got %d", stats.LUK)
	}
}

// TestCalculateStats_ZeroWeight はゼロ重みをテストします。
func TestCalculateStats_ZeroWeight(t *testing.T) {
	coreType := domain.CoreType{
		ID:   "zero-weight-type",
		Name: "ゼロ重み",
		StatWeights: map[string]float64{
			"STR": 0.0, // ゼロ
			"INT": 1.0,
			"WIL": 0.0,
			"LUK": 1.0,
		},
	}

	stats := CalculateStats(5, coreType)

	// ゼロ重みは0になる
	if stats.STR != 0 {
		t.Errorf("STR expected 0, got %d", stats.STR)
	}
	if stats.WIL != 0 {
		t.Errorf("WIL expected 0, got %d", stats.WIL)
	}
	// 通常重みは計算される
	// INT: 10 × 5 × 1.0 = 50
	if stats.INT != 50 {
		t.Errorf("INT expected 50, got %d", stats.INT)
	}
	// LUK: 10 × 1.0 = 10 (レベル無関係)
	if stats.LUK != 10 {
		t.Errorf("LUK expected 10, got %d", stats.LUK)
	}
}
