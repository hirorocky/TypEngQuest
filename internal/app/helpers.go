// Package app は BlitzTypingOperator TUIゲームのヘルパー関数を提供します。
// このファイルはtui/presenterパッケージへの委譲を提供し、後方互換性を維持します。
package app

import (
	"hirorocky/type-battle/internal/tui/presenter"
	"hirorocky/type-battle/internal/tui/screens"
	"hirorocky/type-battle/internal/usecase/battle"
	gamestate "hirorocky/type-battle/internal/usecase/game_state"
	"hirorocky/type-battle/internal/usecase/reward"
)

// CreateStatsDataFromGameState はGameStateから統計データを生成します。
// tui/presenter.CreateStatsData に委譲します。
func CreateStatsDataFromGameState(gs *gamestate.GameState) *screens.StatsData {
	return presenter.CreateStatsData(gs)
}

// CreateSettingsDataFromGameState はGameStateから設定データを生成します。
// tui/presenter.CreateSettingsData に委譲します。
func CreateSettingsDataFromGameState(gs *gamestate.GameState) *screens.SettingsData {
	return presenter.CreateSettingsData(gs)
}

// CreateDefaultEncyclopediaData は図鑑のデフォルトデータを作成します。
// tui/presenter.CreateDefaultEncyclopediaData に委譲します。
func CreateDefaultEncyclopediaData() *screens.EncyclopediaData {
	return presenter.CreateDefaultEncyclopediaData()
}

// CreateEncyclopediaDataFromGameState はGameStateから図鑑データを生成します。
// tui/presenter.CreateEncyclopediaData に委譲します。
func CreateEncyclopediaDataFromGameState(gs *gamestate.GameState) *screens.EncyclopediaData {
	return presenter.CreateEncyclopediaData(gs)
}

// ConvertBattleStatsToRewardStats はバトル統計を報酬用統計に変換します。
// バトル層のデータを報酬計算用のデータ型に変換します。
func ConvertBattleStatsToRewardStats(stats *battle.BattleStatistics) *reward.BattleStatistics {
	if stats == nil {
		return &reward.BattleStatistics{}
	}
	return &reward.BattleStatistics{
		TotalWPM:         stats.TotalWPM,
		TotalAccuracy:    stats.TotalAccuracy,
		TotalTypingCount: stats.TotalTypingCount,
		TotalDamageDealt: stats.TotalDamageDealt,
		TotalDamageTaken: stats.TotalDamageTaken,
		TotalHealAmount:  stats.TotalHealAmount,
	}
}
