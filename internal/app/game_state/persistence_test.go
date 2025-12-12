// Package game_state はゲーム状態の管理を提供します。
package game_state

import (
	"testing"

	"hirorocky/type-battle/internal/infra/savedata"
)

// === ToSaveData のテスト ===

// TestGameState_ToSaveData はGameStateからセーブデータへの変換が正しく動作することを検証します。
func TestGameState_ToSaveData(t *testing.T) {
	gs := NewGameState()
	gs.MaxLevelReached = 5

	saveData := gs.ToSaveData()
	if saveData == nil {
		t.Fatal("ToSaveData() returned nil")
	}

	if saveData.Statistics.MaxLevelReached != 5 {
		t.Errorf("MaxLevelReached should be 5, got %d", saveData.Statistics.MaxLevelReached)
	}
}

// TestGameState_ToSaveData_EmptyState は空の状態からのセーブデータ変換を検証します。
func TestGameState_ToSaveData_EmptyState(t *testing.T) {
	gs := NewGameState()

	saveData := gs.ToSaveData()

	if saveData.Version == "" {
		t.Error("Version should not be empty")
	}
	if saveData.Player == nil {
		t.Error("Player should not be nil")
	}
	if saveData.Inventory == nil {
		t.Error("Inventory should not be nil")
	}
	if saveData.Statistics == nil {
		t.Error("Statistics should not be nil")
	}
	if saveData.Achievements == nil {
		t.Error("Achievements should not be nil")
	}
	if saveData.Settings == nil {
		t.Error("Settings should not be nil")
	}
}

// TestGameState_ToSaveData_WithEncounteredEnemies はエンカウント敵リストが保存されることを検証します。
func TestGameState_ToSaveData_WithEncounteredEnemies(t *testing.T) {
	gs := NewGameState()
	gs.AddEncounteredEnemy("enemy_001")
	gs.AddEncounteredEnemy("enemy_002")

	saveData := gs.ToSaveData()

	if len(saveData.Statistics.EncounteredEnemies) != 2 {
		t.Errorf("Expected 2 encountered enemies, got %d", len(saveData.Statistics.EncounteredEnemies))
	}
}

// === GameStateFromSaveData のテスト ===

// TestGameStateFromSaveData は基本的なセーブデータからの復元を検証します。
func TestGameStateFromSaveData(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Statistics.MaxLevelReached = 10

	gs := GameStateFromSaveData(saveData)
	if gs == nil {
		t.Fatal("GameStateFromSaveData() returned nil")
	}

	if gs.MaxLevelReached != 10 {
		t.Errorf("MaxLevelReached should be 10, got %d", gs.MaxLevelReached)
	}
}

// TestGameStateFromSaveData_RestoresPlayer はプレイヤー情報の復元を検証します。
func TestGameStateFromSaveData_RestoresPlayer(t *testing.T) {
	saveData := savedata.NewSaveData()

	gs := GameStateFromSaveData(saveData)

	if gs.Player() == nil {
		t.Fatal("Player should not be nil")
	}
}

// TestGameStateFromSaveData_RestoresSettings は設定の復元を検証します。
func TestGameStateFromSaveData_RestoresSettings(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Settings.KeyBindings = map[string]string{
		"action1": "key1",
	}

	gs := GameStateFromSaveData(saveData)

	if gs.Settings() == nil {
		t.Fatal("Settings should not be nil")
	}
	if gs.Settings().Keybinds()["action1"] != "key1" {
		t.Error("Keybind should be restored")
	}
}

// TestGameStateFromSaveData_RestoresStatistics は統計の復元を検証します。
func TestGameStateFromSaveData_RestoresStatistics(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Statistics.TotalBattles = 100
	saveData.Statistics.Victories = 80
	saveData.Statistics.Defeats = 20
	saveData.Statistics.HighestWPM = 120.5

	gs := GameStateFromSaveData(saveData)

	if gs.Statistics().Battle().TotalBattles != 100 {
		t.Errorf("TotalBattles should be 100, got %d", gs.Statistics().Battle().TotalBattles)
	}
	if gs.Statistics().Battle().Wins != 80 {
		t.Errorf("Wins should be 80, got %d", gs.Statistics().Battle().Wins)
	}
	if gs.Statistics().Battle().Losses != 20 {
		t.Errorf("Losses should be 20, got %d", gs.Statistics().Battle().Losses)
	}
	if gs.Statistics().Typing().MaxWPM != 120 {
		t.Errorf("MaxWPM should be 120, got %d", gs.Statistics().Typing().MaxWPM)
	}
}

// TestGameStateFromSaveData_RestoresEncounteredEnemies はエンカウント敵リストの復元を検証します。
func TestGameStateFromSaveData_RestoresEncounteredEnemies(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Statistics.EncounteredEnemies = []string{"enemy_001", "enemy_002"}

	gs := GameStateFromSaveData(saveData)

	enemies := gs.GetEncounteredEnemies()
	if len(enemies) != 2 {
		t.Errorf("Expected 2 enemies, got %d", len(enemies))
	}
	if enemies[0] != "enemy_001" || enemies[1] != "enemy_002" {
		t.Error("Encountered enemies not properly restored")
	}
}

// === 往復変換（Round-trip）のテスト ===

// TestGameState_RoundTrip はGameState→SaveData→GameStateの往復変換を検証します。
func TestGameState_RoundTrip(t *testing.T) {
	original := NewGameState()
	original.MaxLevelReached = 15
	original.AddEncounteredEnemy("boss_001")
	original.RecordBattleVictory(5)

	// ToSaveData
	saveData := original.ToSaveData()

	// FromSaveData
	restored := GameStateFromSaveData(saveData)

	// 検証
	if restored.MaxLevelReached != original.MaxLevelReached {
		t.Errorf("MaxLevelReached mismatch: expected %d, got %d",
			original.MaxLevelReached, restored.MaxLevelReached)
	}

	originalEnemies := original.GetEncounteredEnemies()
	restoredEnemies := restored.GetEncounteredEnemies()
	if len(restoredEnemies) != len(originalEnemies) {
		t.Errorf("Encountered enemies count mismatch: expected %d, got %d",
			len(originalEnemies), len(restoredEnemies))
	}
}

// === 後方互換性のテスト ===

// TestGameStateFromSaveData_BackwardCompatibility_NilInventory はInventoryがnilの場合の処理を検証します。
func TestGameStateFromSaveData_BackwardCompatibility_NilInventory(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Inventory = nil

	gs := GameStateFromSaveData(saveData)
	if gs == nil {
		t.Fatal("Should handle nil Inventory gracefully")
	}
}

// TestGameStateFromSaveData_BackwardCompatibility_NilPlayer はPlayerがnilの場合の処理を検証します。
func TestGameStateFromSaveData_BackwardCompatibility_NilPlayer(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Player = nil

	gs := GameStateFromSaveData(saveData)
	if gs == nil {
		t.Fatal("Should handle nil Player gracefully")
	}
	if gs.Player() == nil {
		t.Fatal("Player should be created even if SaveData.Player is nil")
	}
}

// TestGameStateFromSaveData_BackwardCompatibility_NilStatistics はStatisticsがnilの場合の処理を検証します。
func TestGameStateFromSaveData_BackwardCompatibility_NilStatistics(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Statistics = nil

	gs := GameStateFromSaveData(saveData)
	if gs == nil {
		t.Fatal("Should handle nil Statistics gracefully")
	}
	if gs.Statistics() == nil {
		t.Fatal("Statistics should be created even if SaveData.Statistics is nil")
	}
}

// TestGameStateFromSaveData_BackwardCompatibility_NilSettings はSettingsがnilの場合の処理を検証します。
func TestGameStateFromSaveData_BackwardCompatibility_NilSettings(t *testing.T) {
	saveData := savedata.NewSaveData()
	saveData.Settings = nil

	gs := GameStateFromSaveData(saveData)
	if gs == nil {
		t.Fatal("Should handle nil Settings gracefully")
	}
	if gs.Settings() == nil {
		t.Fatal("Settings should be created even if SaveData.Settings is nil")
	}
}

// === ヘルパー関数のテスト ===

// TestFindCoreType は既存のコア特性を検索できることを検証します。
func TestFindCoreType(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()

	result := FindCoreType(coreTypes, "all_rounder")
	if result.ID != "all_rounder" {
		t.Errorf("Expected all_rounder, got %s", result.ID)
	}
}

// TestFindCoreType_NotFound は存在しないIDの場合にデフォルトが返されることを検証します。
func TestFindCoreType_NotFound(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()

	result := FindCoreType(coreTypes, "nonexistent")
	// デフォルト（最初のコア特性）が返される
	if result.ID != "all_rounder" {
		t.Errorf("Expected default (all_rounder), got %s", result.ID)
	}
}

// TestFindPassiveSkill はパッシブスキルを検索できることを検証します。
func TestFindPassiveSkill(t *testing.T) {
	passiveSkills := GetDefaultPassiveSkills()

	result := FindPassiveSkill(passiveSkills, "attack_boost")
	if result.ID != "attack_boost" {
		t.Errorf("Expected attack_boost, got %s", result.ID)
	}
}

// TestFindModuleDefinition はモジュール定義を検索できることを検証します。
func TestFindModuleDefinition(t *testing.T) {
	moduleDefs := GetDefaultModuleDefinitionData()

	result := FindModuleDefinition(moduleDefs, "mod_slash")
	if result == nil {
		t.Fatal("Expected to find mod_slash")
	}
	if result.ID != "mod_slash" {
		t.Errorf("Expected mod_slash, got %s", result.ID)
	}
}

// TestFindModuleDefinition_NotFound は存在しないIDの場合にnilが返されることを検証します。
func TestFindModuleDefinition_NotFound(t *testing.T) {
	moduleDefs := GetDefaultModuleDefinitionData()

	result := FindModuleDefinition(moduleDefs, "nonexistent")
	if result != nil {
		t.Error("Expected nil for nonexistent module")
	}
}
