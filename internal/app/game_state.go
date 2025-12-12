// Package app は BlitzTypingOperator TUIゲームのゲーム状態管理を提供します。
// このファイルはusecase/game_stateパッケージへの委譲とセーブ/ロード変換を担当します。
package app

import (
	"hirorocky/type-battle/internal/infra/loader"
	"hirorocky/type-battle/internal/infra/persistence"
	gamestate "hirorocky/type-battle/internal/usecase/game_state"
)

// GameState はusecase/game_state.GameStateの型エイリアスです。
// app層では構造体を再定義せず、usecase層の型を直接使用します。
type GameState = gamestate.GameState

// InventoryManager はusecase/game_state.InventoryManagerの型エイリアスです。
type InventoryManager = gamestate.InventoryManager

// StatisticsManager はusecase/game_state.StatisticsManagerの型エイリアスです。
type StatisticsManager = gamestate.StatisticsManager

// TypingStatistics はusecase/game_state.TypingStatisticsの型エイリアスです。
type TypingStatistics = gamestate.TypingStatistics

// BattleStatisticsData はusecase/game_state.BattleStatisticsDataの型エイリアスです。
type BattleStatisticsData = gamestate.BattleStatisticsData

// StatisticsSaveData はusecase/game_state.StatisticsSaveDataの型エイリアスです。
type StatisticsSaveData = gamestate.StatisticsSaveData

// Settings はusecase/game_state.Settingsの型エイリアスです。
type Settings = gamestate.Settings

// Difficulty はusecase/game_state.Difficultyの型エイリアスです。
type Difficulty = gamestate.Difficulty

// 難易度定数のエイリアス
const (
	DifficultyEasy   = gamestate.DifficultyEasy
	DifficultyNormal = gamestate.DifficultyNormal
	DifficultyHard   = gamestate.DifficultyHard
)

// DefaultKeybinds はデフォルトのキーバインド設定です。
var DefaultKeybinds = gamestate.DefaultKeybinds

// NewGameState はデフォルト値で新しいGameStateを作成します。
// usecase/game_stateパッケージの関数に委譲します。
func NewGameState() *GameState {
	return gamestate.NewGameState()
}

// NewInventoryManager は新しいInventoryManagerを作成します。
func NewInventoryManager() *InventoryManager {
	return gamestate.NewInventoryManager()
}

// NewStatisticsManager は新しいStatisticsManagerを作成します。
func NewStatisticsManager() *StatisticsManager {
	return gamestate.NewStatisticsManager()
}

// NewSettings はデフォルト値で新しいSettingsを作成します。
func NewSettings() *Settings {
	return gamestate.NewSettings()
}

// ==================== セーブ/ロード変換関数 ====================
// セーブ/ロード変換はusecase/game_stateパッケージに実装されています。
// app層は後方互換性のためにこれらの関数を公開します。

// ToSaveData はGameStateをセーブデータに変換します。
// usecase/game_stateパッケージの関数に委譲します。
func ToSaveData(gs *GameState) *persistence.SaveData {
	return gs.ToSaveData()
}

// GameStateFromSaveData はセーブデータからGameStateを生成します。
// usecase/game_stateパッケージの関数に委譲します。
func GameStateFromSaveData(data *persistence.SaveData, externalData ...*loader.ExternalData) *GameState {
	return gamestate.GameStateFromSaveData(data, externalData...)
}
