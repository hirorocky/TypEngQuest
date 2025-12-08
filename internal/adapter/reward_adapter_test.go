// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"testing"

	"hirorocky/type-battle/internal/battle"
)

// TestNewRewardAdapter は報酬アダプターの作成をテストします。
func TestNewRewardAdapter(t *testing.T) {
	adapter := NewRewardAdapter()
	if adapter == nil {
		t.Error("NewRewardAdapter() should return non-nil adapter")
	}
}

// TestConvertBattleStatsToRewardStats はバトル統計から報酬統計への変換をテストします。
func TestConvertBattleStatsToRewardStats(t *testing.T) {
	adapter := NewRewardAdapter()

	// バトル統計を作成
	battleStats := &battle.BattleStatistics{
		TotalWPM:         240.5,
		TotalAccuracy:    1.8,
		TotalTypingCount: 3,
		TotalDamageDealt: 500,
		TotalDamageTaken: 100,
		TotalHealAmount:  50,
	}

	// 変換
	result := adapter.ConvertBattleStatsToRewardStats(battleStats)

	if result == nil {
		t.Fatal("ConvertBattleStatsToRewardStats() should return non-nil result")
	}

	// 値の検証
	if result.TotalWPM != 240.5 {
		t.Errorf("TotalWPM: expected 240.5, got %f", result.TotalWPM)
	}
	if result.TotalAccuracy != 1.8 {
		t.Errorf("TotalAccuracy: expected 1.8, got %f", result.TotalAccuracy)
	}
	if result.TotalTypingCount != 3 {
		t.Errorf("TotalTypingCount: expected 3, got %d", result.TotalTypingCount)
	}
	if result.TotalDamageDealt != 500 {
		t.Errorf("TotalDamageDealt: expected 500, got %d", result.TotalDamageDealt)
	}
	if result.TotalDamageTaken != 100 {
		t.Errorf("TotalDamageTaken: expected 100, got %d", result.TotalDamageTaken)
	}
	if result.TotalHealAmount != 50 {
		t.Errorf("TotalHealAmount: expected 50, got %d", result.TotalHealAmount)
	}
}

// TestConvertBattleStatsToRewardStatsNil はnil入力の処理をテストします。
func TestConvertBattleStatsToRewardStatsNil(t *testing.T) {
	adapter := NewRewardAdapter()

	// nil入力
	result := adapter.ConvertBattleStatsToRewardStats(nil)

	if result == nil {
		t.Fatal("ConvertBattleStatsToRewardStats(nil) should return non-nil empty result")
	}

	// デフォルト値の確認
	if result.TotalWPM != 0 {
		t.Errorf("TotalWPM should be 0 for nil input, got %f", result.TotalWPM)
	}
	if result.TotalTypingCount != 0 {
		t.Errorf("TotalTypingCount should be 0 for nil input, got %d", result.TotalTypingCount)
	}
}

// TestConvertBattleStatsPackageFunction はパッケージレベル関数をテストします。
func TestConvertBattleStatsPackageFunction(t *testing.T) {
	// パッケージレベルの関数も利用可能であることを確認
	battleStats := &battle.BattleStatistics{
		TotalWPM:         100.0,
		TotalDamageDealt: 200,
	}

	result := ConvertBattleStatsToRewardStats(battleStats)

	if result == nil {
		t.Fatal("ConvertBattleStatsToRewardStats() package function should return non-nil result")
	}

	if result.TotalWPM != 100.0 {
		t.Errorf("TotalWPM: expected 100.0, got %f", result.TotalWPM)
	}
}
