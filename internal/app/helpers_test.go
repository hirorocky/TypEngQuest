// Package app は BlitzTypingOperator TUIゲームのヘルパー関数テストを提供します。
package app

import (
	"testing"

	"hirorocky/type-battle/internal/embedded"
)

// TestCreateStatsDataFromGameState は統計データ生成を検証します
func TestCreateStatsDataFromGameState(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	statsData := CreateStatsDataFromGameState(gs)
	if statsData == nil {
		t.Fatal("CreateStatsDataFromGameState() returned nil")
	}
}

// TestCreateStatsDataFromGameState_HasTypingStats はタイピング統計を含むことを検証します
func TestCreateStatsDataFromGameState_HasTypingStats(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	statsData := CreateStatsDataFromGameState(gs)

	// タイピング統計は初期状態でもゼロ値として存在
	if statsData.TypingStats.MaxWPM < 0 {
		t.Error("TypingStats.MaxWPM should not be negative")
	}
}

// TestCreateStatsDataFromGameState_HasBattleStats はバトル統計を含むことを検証します
func TestCreateStatsDataFromGameState_HasBattleStats(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	statsData := CreateStatsDataFromGameState(gs)

	// バトル統計は初期状態でもゼロ値として存在
	if statsData.BattleStats.TotalBattles < 0 {
		t.Error("BattleStats.TotalBattles should not be negative")
	}
}

// TestCreateSettingsDataFromGameState は設定データ生成を検証します
func TestCreateSettingsDataFromGameState(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	settingsData := CreateSettingsDataFromGameState(gs)
	if settingsData == nil {
		t.Fatal("CreateSettingsDataFromGameState() returned nil")
	}
}

// TestCreateDefaultEncyclopediaData は図鑑デフォルトデータ生成を検証します
func TestCreateDefaultEncyclopediaData(t *testing.T) {
	data := CreateDefaultEncyclopediaData()
	if data == nil {
		t.Fatal("CreateDefaultEncyclopediaData() returned nil")
	}
}

// TestCreateDefaultEncyclopediaData_HasCoreTypes はコアタイプを含むことを検証します
func TestCreateDefaultEncyclopediaData_HasCoreTypes(t *testing.T) {
	data := CreateDefaultEncyclopediaData()
	if len(data.AllCoreTypes) == 0 {
		t.Error("CreateDefaultEncyclopediaData() should have core types")
	}
}

// TestCreateDefaultEncyclopediaData_HasModuleTypes はモジュールタイプを含むことを検証します
func TestCreateDefaultEncyclopediaData_HasModuleTypes(t *testing.T) {
	data := CreateDefaultEncyclopediaData()
	if len(data.AllModuleTypes) == 0 {
		t.Error("CreateDefaultEncyclopediaData() should have module types")
	}
}

// TestCreateDefaultEncyclopediaData_HasEnemyTypes は敵タイプを含むことを検証します
func TestCreateDefaultEncyclopediaData_HasEnemyTypes(t *testing.T) {
	data := CreateDefaultEncyclopediaData()
	if len(data.AllEnemyTypes) == 0 {
		t.Error("CreateDefaultEncyclopediaData() should have enemy types")
	}
}

// TestCreateEncyclopediaDataFromGameState はGameStateからの図鑑データ生成を検証します
func TestCreateEncyclopediaDataFromGameState(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	data := CreateEncyclopediaDataFromGameState(gs)
	if data == nil {
		t.Fatal("CreateEncyclopediaDataFromGameState() returned nil")
	}
}

// TestConvertBattleStatsToRewardStats はバトル統計変換を検証します
func TestConvertBattleStatsToRewardStats(t *testing.T) {
	// nilの場合は空の統計を返す
	result := ConvertBattleStatsToRewardStats(nil)
	if result == nil {
		t.Fatal("ConvertBattleStatsToRewardStats(nil) returned nil")
	}
}
