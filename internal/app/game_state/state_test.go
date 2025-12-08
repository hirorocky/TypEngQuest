// Package game_state はゲーム状態の管理を提供します。
package game_state

import (
	"testing"
)

// === GameState 構造体のテスト ===

// TestNewGameState は新しいGameStateが正しく初期化されることを検証します。
func TestNewGameState(t *testing.T) {
	gs := NewGameState()
	if gs == nil {
		t.Fatal("NewGameState() returned nil")
	}
}

// TestGameState_HasMaxLevelReached はGameStateが到達最高レベルを保持することを検証します。
func TestGameState_HasMaxLevelReached(t *testing.T) {
	gs := NewGameState()
	// 初期値は0であるべき
	if gs.MaxLevelReached < 0 {
		t.Errorf("MaxLevelReached should not be negative, got %d", gs.MaxLevelReached)
	}
}

// TestGameState_Player はPlayerアクセサが正しく動作することを検証します。
func TestGameState_Player(t *testing.T) {
	gs := NewGameState()
	if gs.Player() == nil {
		t.Fatal("Player() should not return nil")
	}
}

// TestGameState_Inventory はInventoryアクセサが正しく動作することを検証します。
func TestGameState_Inventory(t *testing.T) {
	gs := NewGameState()
	if gs.Inventory() == nil {
		t.Fatal("Inventory() should not return nil")
	}
}

// TestGameState_AgentManager はAgentManagerアクセサが正しく動作することを検証します。
func TestGameState_AgentManager(t *testing.T) {
	gs := NewGameState()
	if gs.AgentManager() == nil {
		t.Fatal("AgentManager() should not return nil")
	}
}

// TestGameState_Statistics はStatisticsアクセサが正しく動作することを検証します。
func TestGameState_Statistics(t *testing.T) {
	gs := NewGameState()
	if gs.Statistics() == nil {
		t.Fatal("Statistics() should not return nil")
	}
}

// TestGameState_Achievements はAchievementsアクセサが正しく動作することを検証します。
func TestGameState_Achievements(t *testing.T) {
	gs := NewGameState()
	if gs.Achievements() == nil {
		t.Fatal("Achievements() should not return nil")
	}
}

// TestGameState_Settings はSettingsアクセサが正しく動作することを検証します。
func TestGameState_Settings(t *testing.T) {
	gs := NewGameState()
	if gs.Settings() == nil {
		t.Fatal("Settings() should not return nil")
	}
}

// TestGameState_ExternalData はExternalDataのsetter/getterが正しく動作することを検証します。
func TestGameState_ExternalData(t *testing.T) {
	gs := NewGameState()
	// 初期値はnil
	if gs.ExternalData() != nil {
		t.Error("ExternalData() should return nil initially")
	}
}

// TestGameState_EnemyGenerator はEnemyGeneratorアクセサが正しく動作することを検証します。
func TestGameState_EnemyGenerator(t *testing.T) {
	gs := NewGameState()
	if gs.EnemyGenerator() == nil {
		t.Fatal("EnemyGenerator() should not return nil")
	}
}

// TestGameState_RewardCalculator はRewardCalculatorアクセサが正しく動作することを検証します。
func TestGameState_RewardCalculator(t *testing.T) {
	gs := NewGameState()
	if gs.RewardCalculator() == nil {
		t.Fatal("RewardCalculator() should not return nil")
	}
}

// TestGameState_TempStorage はTempStorageアクセサが正しく動作することを検証します。
func TestGameState_TempStorage(t *testing.T) {
	gs := NewGameState()
	if gs.TempStorage() == nil {
		t.Fatal("TempStorage() should not return nil")
	}
}

// TestGameState_RecordBattleVictory はバトル勝利の記録が正しく動作することを検証します。
func TestGameState_RecordBattleVictory(t *testing.T) {
	gs := NewGameState()
	gs.RecordBattleVictory(1)

	if gs.MaxLevelReached != 1 {
		t.Errorf("MaxLevelReached should be 1, got %d", gs.MaxLevelReached)
	}

	// 更に高いレベルで勝利
	gs.RecordBattleVictory(3)
	if gs.MaxLevelReached != 3 {
		t.Errorf("MaxLevelReached should be 3, got %d", gs.MaxLevelReached)
	}

	// 低いレベルで勝利（MaxLevelReachedは変わらない）
	gs.RecordBattleVictory(2)
	if gs.MaxLevelReached != 3 {
		t.Errorf("MaxLevelReached should still be 3, got %d", gs.MaxLevelReached)
	}
}

// TestGameState_AddEncounteredEnemy はエンカウント敵の記録が正しく動作することを検証します。
func TestGameState_AddEncounteredEnemy(t *testing.T) {
	gs := NewGameState()

	// 敵を追加
	gs.AddEncounteredEnemy("enemy_001")
	enemies := gs.GetEncounteredEnemies()
	if len(enemies) != 1 || enemies[0] != "enemy_001" {
		t.Errorf("Expected [enemy_001], got %v", enemies)
	}

	// 同じ敵を追加（重複しない）
	gs.AddEncounteredEnemy("enemy_001")
	enemies = gs.GetEncounteredEnemies()
	if len(enemies) != 1 {
		t.Errorf("Duplicate enemy should not be added, got %v", enemies)
	}

	// 空文字列は無視される
	gs.AddEncounteredEnemy("")
	enemies = gs.GetEncounteredEnemies()
	if len(enemies) != 1 {
		t.Errorf("Empty enemy ID should be ignored, got %v", enemies)
	}
}

// TestGameState_GetEquippedAgents は装備中エージェント取得が正しく動作することを検証します。
func TestGameState_GetEquippedAgents(t *testing.T) {
	gs := NewGameState()
	agents := gs.GetEquippedAgents()
	// 初期状態では空（または初期化されたエージェント）
	if agents == nil {
		t.Fatal("GetEquippedAgents() should not return nil")
	}
}
