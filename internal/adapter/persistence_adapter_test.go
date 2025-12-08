// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"testing"

	"hirorocky/type-battle/internal/persistence"
)

// TestNewPersistenceAdapter は永続化アダプターの作成をテストします。
func TestNewPersistenceAdapter(t *testing.T) {
	adapter := NewPersistenceAdapter()
	if adapter == nil {
		t.Error("NewPersistenceAdapter() should return non-nil adapter")
	}
}

// TestPersistenceAdapterToSaveData はGameStateからSaveDataへの変換をテストします。
func TestPersistenceAdapterToSaveData(t *testing.T) {
	adapter := NewPersistenceAdapter()

	// GameStateProviderを使用して変換をテスト
	mockData := &GameStateData{
		MaxLevelReached:    5,
		EncounteredEnemies: []string{"goblin", "orc"},
	}

	saveData := adapter.ToSaveData(mockData)

	if saveData == nil {
		t.Fatal("ToSaveData() should return non-nil SaveData")
	}

	if saveData.Statistics.MaxLevelReached != 5 {
		t.Errorf("MaxLevelReached: expected 5, got %d", saveData.Statistics.MaxLevelReached)
	}

	if len(saveData.Statistics.EncounteredEnemies) != 2 {
		t.Errorf("EncounteredEnemies count: expected 2, got %d", len(saveData.Statistics.EncounteredEnemies))
	}
}

// TestPersistenceAdapterFromSaveData はSaveDataからデータ復元をテストします。
func TestPersistenceAdapterFromSaveData(t *testing.T) {
	adapter := NewPersistenceAdapter()

	// SaveDataを作成
	saveData := persistence.NewSaveData()
	saveData.Statistics.MaxLevelReached = 10
	saveData.Statistics.EncounteredEnemies = []string{"dragon"}
	saveData.Statistics.TotalBattles = 20
	saveData.Statistics.Victories = 15
	saveData.Statistics.Defeats = 5

	// 変換
	result := adapter.ExtractStateData(saveData)

	if result == nil {
		t.Fatal("ExtractStateData() should return non-nil result")
	}

	if result.MaxLevelReached != 10 {
		t.Errorf("MaxLevelReached: expected 10, got %d", result.MaxLevelReached)
	}

	if len(result.EncounteredEnemies) != 1 || result.EncounteredEnemies[0] != "dragon" {
		t.Errorf("EncounteredEnemies: expected [dragon], got %v", result.EncounteredEnemies)
	}
}

// TestPersistenceAdapterBackwardCompatibility は後方互換性をテストします。
func TestPersistenceAdapterBackwardCompatibility(t *testing.T) {
	adapter := NewPersistenceAdapter()

	// 古い形式のセーブデータをシミュレート（nilフィールドを含む）
	saveData := &persistence.SaveData{}

	// nilでもパニックしないことを確認
	result := adapter.ExtractStateData(saveData)

	if result == nil {
		t.Fatal("ExtractStateData() should handle nil fields gracefully")
	}

	// デフォルト値を確認
	if result.MaxLevelReached != 0 {
		t.Errorf("MaxLevelReached should be 0 for empty save data, got %d", result.MaxLevelReached)
	}
}
