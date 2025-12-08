// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"hirorocky/type-battle/internal/persistence"
)

// GameStateData はGameStateから抽出された変換用データ構造です。
// 循環参照を避けるため、game_stateパッケージに依存しない独立した構造体として定義します。
// Requirements: 10.2
type GameStateData struct {
	// MaxLevelReached は到達した最高レベルです。
	MaxLevelReached int

	// EncounteredEnemies はエンカウント済み敵IDリストです。
	EncounteredEnemies []string

	// Statistics は統計情報です。
	Statistics *StatisticsData

	// Inventory はインベントリ情報です。
	Inventory *InventoryData

	// Player はプレイヤー情報です。
	Player *PlayerData

	// Achievements は実績情報です。
	Achievements *persistence.AchievementsSaveData

	// Settings は設定情報です。
	Settings *SettingsAdapterData
}

// StatisticsData は統計情報の変換用データ構造です。
type StatisticsData struct {
	TotalBattles         int
	Victories            int
	Defeats              int
	HighestWPM           float64
	AverageWPM           float64
	PerfectAccuracyCount int
	TotalCharactersTyped int
}

// InventoryData はインベントリ情報の変換用データ構造です。
type InventoryData struct {
	CoreInstances  []persistence.CoreInstanceSave
	ModuleCounts   map[string]int
	AgentInstances []persistence.AgentInstanceSave
	MaxCoreSlots   int
	MaxModuleSlots int
}

// PlayerData はプレイヤー情報の変換用データ構造です。
type PlayerData struct {
	EquippedAgentIDs [3]string
}

// SettingsAdapterData は設定情報の変換用データ構造です。
type SettingsAdapterData struct {
	KeyBindings map[string]string
}

// PersistenceAdapter はSaveData <-> GameState変換を担当するアダプターです。
// Requirements: 10.2, 12.1, 12.2, 12.3
type PersistenceAdapter struct{}

// NewPersistenceAdapter は新しいPersistenceAdapterを作成します。
func NewPersistenceAdapter() *PersistenceAdapter {
	return &PersistenceAdapter{}
}

// ToSaveData はGameStateDataからSaveDataに変換します。
// 後方互換性を維持しつつ、ID化最適化されたデータを出力します。
// Requirements: 10.2, 12.1
func (a *PersistenceAdapter) ToSaveData(data *GameStateData) *persistence.SaveData {
	saveData := persistence.NewSaveData()

	// 最高到達レベルと遭遇敵リスト
	saveData.Statistics.MaxLevelReached = data.MaxLevelReached
	saveData.Statistics.EncounteredEnemies = data.EncounteredEnemies

	// 統計情報
	if data.Statistics != nil {
		saveData.Statistics.TotalBattles = data.Statistics.TotalBattles
		saveData.Statistics.Victories = data.Statistics.Victories
		saveData.Statistics.Defeats = data.Statistics.Defeats
		saveData.Statistics.HighestWPM = data.Statistics.HighestWPM
		saveData.Statistics.AverageWPM = data.Statistics.AverageWPM
		saveData.Statistics.PerfectAccuracyCount = data.Statistics.PerfectAccuracyCount
		saveData.Statistics.TotalCharactersTyped = data.Statistics.TotalCharactersTyped
	}

	// インベントリ情報
	if data.Inventory != nil {
		saveData.Inventory.CoreInstances = data.Inventory.CoreInstances
		saveData.Inventory.ModuleCounts = data.Inventory.ModuleCounts
		saveData.Inventory.AgentInstances = data.Inventory.AgentInstances
		saveData.Inventory.MaxCoreSlots = data.Inventory.MaxCoreSlots
		saveData.Inventory.MaxModuleSlots = data.Inventory.MaxModuleSlots
	}

	// プレイヤー情報
	if data.Player != nil {
		saveData.Player.EquippedAgentIDs = data.Player.EquippedAgentIDs
	}

	// 実績情報
	if data.Achievements != nil {
		saveData.Achievements = data.Achievements
	}

	// 設定情報
	if data.Settings != nil {
		saveData.Settings.KeyBindings = data.Settings.KeyBindings
	}

	return saveData
}

// ExtractStateData はSaveDataから状態データを抽出します。
// 古い形式のセーブデータも適切に処理し、後方互換性を保証します。
// Requirements: 10.2, 12.2, 12.3
func (a *PersistenceAdapter) ExtractStateData(saveData *persistence.SaveData) *GameStateData {
	result := &GameStateData{
		EncounteredEnemies: []string{},
	}

	// 統計情報
	if saveData.Statistics != nil {
		result.MaxLevelReached = saveData.Statistics.MaxLevelReached
		result.EncounteredEnemies = saveData.Statistics.EncounteredEnemies
		result.Statistics = &StatisticsData{
			TotalBattles:         saveData.Statistics.TotalBattles,
			Victories:            saveData.Statistics.Victories,
			Defeats:              saveData.Statistics.Defeats,
			HighestWPM:           saveData.Statistics.HighestWPM,
			AverageWPM:           saveData.Statistics.AverageWPM,
			PerfectAccuracyCount: saveData.Statistics.PerfectAccuracyCount,
			TotalCharactersTyped: saveData.Statistics.TotalCharactersTyped,
		}
		// nilでない場合のみ代入（後方互換性のため）
		if saveData.Statistics.EncounteredEnemies != nil {
			result.EncounteredEnemies = saveData.Statistics.EncounteredEnemies
		}
	}

	// インベントリ情報
	if saveData.Inventory != nil {
		result.Inventory = &InventoryData{
			CoreInstances:  saveData.Inventory.CoreInstances,
			ModuleCounts:   saveData.Inventory.ModuleCounts,
			AgentInstances: saveData.Inventory.AgentInstances,
			MaxCoreSlots:   saveData.Inventory.MaxCoreSlots,
			MaxModuleSlots: saveData.Inventory.MaxModuleSlots,
		}
	}

	// プレイヤー情報
	if saveData.Player != nil {
		result.Player = &PlayerData{
			EquippedAgentIDs: saveData.Player.EquippedAgentIDs,
		}
	}

	// 実績情報
	if saveData.Achievements != nil {
		result.Achievements = saveData.Achievements
	}

	// 設定情報
	if saveData.Settings != nil {
		result.Settings = &SettingsAdapterData{
			KeyBindings: saveData.Settings.KeyBindings,
		}
	}

	return result
}
