// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestNewScreenAdapter は画面データアダプターの作成をテストします。
func TestNewScreenAdapter(t *testing.T) {
	adapter := NewScreenAdapter()
	if adapter == nil {
		t.Error("NewScreenAdapter() should return non-nil adapter")
	}
}

// TestScreenAdapterToStatsData はStatsDataへの変換をテストします。
func TestScreenAdapterToStatsData(t *testing.T) {
	adapter := NewScreenAdapter()

	// 入力データを作成
	input := &StatsSourceData{
		TypingStats: TypingSourceStats{
			MaxWPM:               120,
			AverageWPM:           80.5,
			PerfectAccuracyCount: 10,
			TotalCharacters:      5000,
		},
		BattleStats: BattleSourceStats{
			TotalBattles:    50,
			Wins:            40,
			Losses:          10,
			MaxLevelReached: 15,
		},
		Achievements: []AchievementSourceData{
			{ID: "first_blood", Name: "初戦", Description: "最初のバトルに勝利", Achieved: true},
			{ID: "speedster", Name: "スピードスター", Description: "WPM100達成", Achieved: false},
		},
	}

	result := adapter.ToStatsData(input)

	if result == nil {
		t.Fatal("ToStatsData() should return non-nil result")
	}

	// タイピング統計の検証
	if result.TypingStats.MaxWPM != 120 {
		t.Errorf("MaxWPM: expected 120, got %d", result.TypingStats.MaxWPM)
	}
	if result.TypingStats.AverageWPM != 80.5 {
		t.Errorf("AverageWPM: expected 80.5, got %f", result.TypingStats.AverageWPM)
	}

	// バトル統計の検証
	if result.BattleStats.TotalBattles != 50 {
		t.Errorf("TotalBattles: expected 50, got %d", result.BattleStats.TotalBattles)
	}
	if result.BattleStats.MaxLevelReached != 15 {
		t.Errorf("MaxLevelReached: expected 15, got %d", result.BattleStats.MaxLevelReached)
	}

	// 実績の検証
	if len(result.Achievements) != 2 {
		t.Errorf("Achievements count: expected 2, got %d", len(result.Achievements))
	}
}

// TestScreenAdapterToEncyclopediaData はEncyclopediaDataへの変換をテストします。
func TestScreenAdapterToEncyclopediaData(t *testing.T) {
	adapter := NewScreenAdapter()

	// 入力データを作成
	input := &EncyclopediaSourceData{
		AllCoreTypes: []domain.CoreType{
			{ID: "attacker", Name: "攻撃特化"},
			{ID: "healer", Name: "回復特化"},
		},
		AllModuleTypes: []ModuleTypeSourceInfo{
			{ID: "physical_lv1", Name: "物理攻撃Lv1", Category: domain.PhysicalAttack, Level: 1},
		},
		AllEnemyTypes: []domain.EnemyType{
			{ID: "goblin", Name: "ゴブリン"},
		},
		AcquiredCoreTypes:   []string{"attacker"},
		AcquiredModuleTypes: []string{"physical_lv1"},
		EncounteredEnemies:  []string{"goblin"},
	}

	result := adapter.ToEncyclopediaData(input)

	if result == nil {
		t.Fatal("ToEncyclopediaData() should return non-nil result")
	}

	if len(result.AllCoreTypes) != 2 {
		t.Errorf("AllCoreTypes count: expected 2, got %d", len(result.AllCoreTypes))
	}
	if len(result.AcquiredCoreTypes) != 1 {
		t.Errorf("AcquiredCoreTypes count: expected 1, got %d", len(result.AcquiredCoreTypes))
	}
}

// TestScreenAdapterToSettingsData はSettingsDataへの変換をテストします。
func TestScreenAdapterToSettingsData(t *testing.T) {
	adapter := NewScreenAdapter()

	// 入力データを作成
	input := &SettingsSourceData{
		Keybinds:    map[string]string{"attack": "a", "heal": "h"},
		SoundVolume: 80,
		Difficulty:  "normal",
	}

	result := adapter.ToSettingsData(input)

	if result == nil {
		t.Fatal("ToSettingsData() should return non-nil result")
	}

	if result.SoundVolume != 80 {
		t.Errorf("SoundVolume: expected 80, got %d", result.SoundVolume)
	}
	if result.Difficulty != "normal" {
		t.Errorf("Difficulty: expected 'normal', got '%s'", result.Difficulty)
	}
	if len(result.Keybinds) != 2 {
		t.Errorf("Keybinds count: expected 2, got %d", len(result.Keybinds))
	}
}

// TestScreenAdapterNilInput はnil入力の処理をテストします。
func TestScreenAdapterNilInput(t *testing.T) {
	adapter := NewScreenAdapter()

	// nil入力でもパニックしないことを確認
	statsResult := adapter.ToStatsData(nil)
	if statsResult == nil {
		t.Error("ToStatsData(nil) should return non-nil empty result")
	}

	encResult := adapter.ToEncyclopediaData(nil)
	if encResult == nil {
		t.Error("ToEncyclopediaData(nil) should return non-nil empty result")
	}

	settingsResult := adapter.ToSettingsData(nil)
	if settingsResult == nil {
		t.Error("ToSettingsData(nil) should return non-nil empty result")
	}
}
