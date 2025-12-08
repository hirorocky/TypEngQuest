// Package adapter はデータ変換ロジックを集約するアダプター層を提供します。
package adapter

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/screens"
)

// ==================== 入力データ型定義 ====================

// StatsSourceData は統計データ変換用の入力データ構造です。
// GameStateから抽出したデータをこの構造体に詰めて変換します。
type StatsSourceData struct {
	TypingStats  TypingSourceStats
	BattleStats  BattleSourceStats
	Achievements []AchievementSourceData
}

// TypingSourceStats はタイピング統計の入力データです。
type TypingSourceStats struct {
	MaxWPM               int
	AverageWPM           float64
	PerfectAccuracyCount int
	TotalCharacters      int
}

// BattleSourceStats はバトル統計の入力データです。
type BattleSourceStats struct {
	TotalBattles    int
	Wins            int
	Losses          int
	MaxLevelReached int
}

// AchievementSourceData は実績の入力データです。
type AchievementSourceData struct {
	ID          string
	Name        string
	Description string
	Achieved    bool
}

// EncyclopediaSourceData は図鑑データ変換用の入力データ構造です。
type EncyclopediaSourceData struct {
	AllCoreTypes        []domain.CoreType
	AllModuleTypes      []ModuleTypeSourceInfo
	AllEnemyTypes       []domain.EnemyType
	AcquiredCoreTypes   []string
	AcquiredModuleTypes []string
	EncounteredEnemies  []string
}

// ModuleTypeSourceInfo はモジュールタイプの入力データです。
type ModuleTypeSourceInfo struct {
	ID          string
	Name        string
	Category    domain.ModuleCategory
	Level       int
	Description string
}

// SettingsSourceData は設定データ変換用の入力データ構造です。
type SettingsSourceData struct {
	Keybinds    map[string]string
	SoundVolume int
	Difficulty  string
}

// ==================== ScreenAdapter ====================

// ScreenAdapter はGameState -> 各種ScreenData変換を担当するアダプターです。
// Requirements: 10.3
type ScreenAdapter struct{}

// NewScreenAdapter は新しいScreenAdapterを作成します。
func NewScreenAdapter() *ScreenAdapter {
	return &ScreenAdapter{}
}

// ToStatsData はStatsSourceDataからStatsDataに変換します。
// Requirements: 10.3
func (a *ScreenAdapter) ToStatsData(input *StatsSourceData) *screens.StatsData {
	if input == nil {
		return &screens.StatsData{
			Achievements: []screens.AchievementData{},
		}
	}

	// 実績データを変換
	achievementData := make([]screens.AchievementData, 0, len(input.Achievements))
	for _, ach := range input.Achievements {
		achievementData = append(achievementData, screens.AchievementData{
			ID:          ach.ID,
			Name:        ach.Name,
			Description: ach.Description,
			Achieved:    ach.Achieved,
		})
	}

	return &screens.StatsData{
		TypingStats: screens.TypingStatsData{
			MaxWPM:               input.TypingStats.MaxWPM,
			AverageWPM:           input.TypingStats.AverageWPM,
			PerfectAccuracyCount: input.TypingStats.PerfectAccuracyCount,
			TotalCharacters:      input.TypingStats.TotalCharacters,
		},
		BattleStats: screens.BattleStatsData{
			TotalBattles:    input.BattleStats.TotalBattles,
			Wins:            input.BattleStats.Wins,
			Losses:          input.BattleStats.Losses,
			MaxLevelReached: input.BattleStats.MaxLevelReached,
		},
		Achievements: achievementData,
	}
}

// ToEncyclopediaData はEncyclopediaSourceDataからEncyclopediaDataに変換します。
// Requirements: 10.3
func (a *ScreenAdapter) ToEncyclopediaData(input *EncyclopediaSourceData) *screens.EncyclopediaData {
	if input == nil {
		return &screens.EncyclopediaData{
			AllCoreTypes:        []domain.CoreType{},
			AllModuleTypes:      []screens.ModuleTypeInfo{},
			AllEnemyTypes:       []domain.EnemyType{},
			AcquiredCoreTypes:   []string{},
			AcquiredModuleTypes: []string{},
			EncounteredEnemies:  []string{},
		}
	}

	// モジュールタイプ情報を変換
	moduleTypes := make([]screens.ModuleTypeInfo, 0, len(input.AllModuleTypes))
	for _, mt := range input.AllModuleTypes {
		moduleTypes = append(moduleTypes, screens.ModuleTypeInfo{
			ID:          mt.ID,
			Name:        mt.Name,
			Category:    mt.Category,
			Level:       mt.Level,
			Description: mt.Description,
		})
	}

	return &screens.EncyclopediaData{
		AllCoreTypes:        input.AllCoreTypes,
		AllModuleTypes:      moduleTypes,
		AllEnemyTypes:       input.AllEnemyTypes,
		AcquiredCoreTypes:   input.AcquiredCoreTypes,
		AcquiredModuleTypes: input.AcquiredModuleTypes,
		EncounteredEnemies:  input.EncounteredEnemies,
	}
}

// ToSettingsData はSettingsSourceDataからSettingsDataに変換します。
// Requirements: 10.3
func (a *ScreenAdapter) ToSettingsData(input *SettingsSourceData) *screens.SettingsData {
	if input == nil {
		return &screens.SettingsData{
			Keybinds: make(map[string]string),
		}
	}

	// キーバインドをコピー（元データの変更を防ぐ）
	keybinds := make(map[string]string)
	for k, v := range input.Keybinds {
		keybinds[k] = v
	}

	return &screens.SettingsData{
		Keybinds:    keybinds,
		SoundVolume: input.SoundVolume,
		Difficulty:  input.Difficulty,
	}
}
