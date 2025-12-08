// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"testing"

	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/persistence"
)

// TestAdapterLayerIntegration はアダプター層全体の統合テストです。
// 各アダプターが連携して動作することを確認します。
func TestAdapterLayerIntegration(t *testing.T) {
	// 各アダプターを作成
	persistenceAdapter := NewPersistenceAdapter()
	screenAdapter := NewScreenAdapter()
	rewardAdapter := NewRewardAdapter()

	if persistenceAdapter == nil || screenAdapter == nil || rewardAdapter == nil {
		t.Fatal("All adapters should be created successfully")
	}
}

// TestPersistenceAdapterRoundTrip は永続化アダプターの往復変換をテストします。
func TestPersistenceAdapterRoundTrip(t *testing.T) {
	adapter := NewPersistenceAdapter()

	// 元データを作成
	originalData := &GameStateData{
		MaxLevelReached:    10,
		EncounteredEnemies: []string{"goblin", "orc", "dragon"},
		Statistics: &StatisticsData{
			TotalBattles: 50,
			Victories:    40,
			Defeats:      10,
			HighestWPM:   150.0,
			AverageWPM:   100.0,
		},
	}

	// SaveDataに変換
	saveData := adapter.ToSaveData(originalData)

	// 復元
	restoredData := adapter.ExtractStateData(saveData)

	// 値の検証
	if restoredData.MaxLevelReached != originalData.MaxLevelReached {
		t.Errorf("MaxLevelReached mismatch: expected %d, got %d",
			originalData.MaxLevelReached, restoredData.MaxLevelReached)
	}

	if len(restoredData.EncounteredEnemies) != len(originalData.EncounteredEnemies) {
		t.Errorf("EncounteredEnemies count mismatch: expected %d, got %d",
			len(originalData.EncounteredEnemies), len(restoredData.EncounteredEnemies))
	}

	if restoredData.Statistics.TotalBattles != originalData.Statistics.TotalBattles {
		t.Errorf("TotalBattles mismatch: expected %d, got %d",
			originalData.Statistics.TotalBattles, restoredData.Statistics.TotalBattles)
	}
}

// TestScreenAdapterDataConversion は画面アダプターのデータ変換をテストします。
func TestScreenAdapterDataConversion(t *testing.T) {
	adapter := NewScreenAdapter()

	// 統計データの変換
	statsInput := &StatsSourceData{
		TypingStats: TypingSourceStats{MaxWPM: 100},
		BattleStats: BattleSourceStats{TotalBattles: 10},
	}
	statsResult := adapter.ToStatsData(statsInput)
	if statsResult.TypingStats.MaxWPM != 100 {
		t.Errorf("StatsData conversion failed")
	}

	// 図鑑データの変換
	encInput := &EncyclopediaSourceData{
		AllCoreTypes: []domain.CoreType{{ID: "test"}},
	}
	encResult := adapter.ToEncyclopediaData(encInput)
	if len(encResult.AllCoreTypes) != 1 {
		t.Errorf("EncyclopediaData conversion failed")
	}

	// 設定データの変換
	settingsInput := &SettingsSourceData{
		Keybinds:    map[string]string{"test": "t"},
		SoundVolume: 50,
		Difficulty:  "normal",
	}
	settingsResult := adapter.ToSettingsData(settingsInput)
	if settingsResult.SoundVolume != 50 {
		t.Errorf("SettingsData conversion failed")
	}
}

// TestRewardAdapterConversion は報酬アダプターの変換をテストします。
func TestRewardAdapterConversion(t *testing.T) {
	adapter := NewRewardAdapter()

	battleStats := &battle.BattleStatistics{
		TotalWPM:         200.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 2,
		TotalDamageDealt: 300,
		TotalDamageTaken: 50,
		TotalHealAmount:  25,
	}

	result := adapter.ConvertBattleStatsToRewardStats(battleStats)

	if result.TotalWPM != battleStats.TotalWPM {
		t.Errorf("TotalWPM mismatch")
	}
	if result.TotalDamageDealt != battleStats.TotalDamageDealt {
		t.Errorf("TotalDamageDealt mismatch")
	}
}

// TestBackwardCompatibilityWithEmptySaveData は空のセーブデータの後方互換性をテストします。
func TestBackwardCompatibilityWithEmptySaveData(t *testing.T) {
	adapter := NewPersistenceAdapter()

	// 空のセーブデータ（古いバージョンからのマイグレーションを想定）
	emptySaveData := &persistence.SaveData{}

	// パニックせずに処理できることを確認
	result := adapter.ExtractStateData(emptySaveData)

	if result == nil {
		t.Fatal("Should handle empty save data gracefully")
	}

	// デフォルト値が設定されていることを確認
	if result.MaxLevelReached != 0 {
		t.Errorf("Empty save data should have MaxLevelReached = 0")
	}
}
