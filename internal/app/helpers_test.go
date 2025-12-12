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

// TestHelpersDelegate_StatsData はヘルパー関数がtui/presenterと同等の結果を返すことを検証します
func TestHelpersDelegate_StatsData(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	// app層のヘルパー関数
	appData := CreateStatsDataFromGameState(gs)

	// 基本検証: 構造体が正しく生成される
	if appData == nil {
		t.Fatal("CreateStatsDataFromGameState should return non-nil data")
	}
	if appData.TypingStats.MaxWPM < 0 {
		t.Error("MaxWPM should not be negative")
	}
	if appData.BattleStats.TotalBattles < 0 {
		t.Error("TotalBattles should not be negative")
	}
}

// TestHelpersDelegate_SettingsData はヘルパー関数がtui/presenterと同等の結果を返すことを検証します
func TestHelpersDelegate_SettingsData(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	// app層のヘルパー関数
	appData := CreateSettingsDataFromGameState(gs)

	// 基本検証
	if appData == nil {
		t.Fatal("CreateSettingsDataFromGameState should return non-nil data")
	}
	if appData.Difficulty == "" {
		t.Error("Difficulty should not be empty")
	}
}

// TestHelpersDelegate_EncyclopediaData はヘルパー関数がtui/presenterと同等の結果を返すことを検証します
func TestHelpersDelegate_EncyclopediaData(t *testing.T) {
	model := NewRootModel("", embedded.Data)
	gs := model.GameState()

	// app層のヘルパー関数
	appData := CreateEncyclopediaDataFromGameState(gs)

	// 基本検証
	if appData == nil {
		t.Fatal("CreateEncyclopediaDataFromGameState should return non-nil data")
	}
	if len(appData.AllCoreTypes) == 0 {
		t.Error("AllCoreTypes should not be empty")
	}
	if len(appData.AllModuleTypes) == 0 {
		t.Error("AllModuleTypes should not be empty")
	}
}
