// Package screens はTUIゲームの画面を提供します。
package screens

import "hirorocky/type-battle/internal/domain"

// ==================== 共有型定義 ====================

// EncyclopediaTestData は図鑑データです。
type EncyclopediaTestData struct {
	AllCoreTypes        []domain.CoreType
	AllModuleTypes      []ModuleTypeInfo
	AllEnemyTypes       []domain.EnemyType
	AcquiredCoreTypes   []string
	AcquiredModuleTypes []string
	EncounteredEnemies  []string
}

// ModuleTypeInfo はモジュールタイプ情報です。
type ModuleTypeInfo struct {
	ID          string
	Name        string
	Category    domain.ModuleCategory
	Level       int
	Description string
}

// SettingsData は設定データです。
type SettingsData struct {
	Keybinds    map[string]string
	SoundVolume int
	Difficulty  string
}

// TypingStatsData はタイピング統計データです。
type TypingStatsData struct {
	MaxWPM               int
	AverageWPM           float64
	PerfectAccuracyCount int
	TotalCharacters      int
}

// BattleStatsData はバトル統計データです。
type BattleStatsData struct {
	TotalBattles    int
	Wins            int
	Losses          int
	MaxLevelReached int
}

// AchievementData は実績データです。
type AchievementData struct {
	ID          string
	Name        string
	Description string
	Achieved    bool
}

// StatsTestData は統計データです。
type StatsTestData struct {
	TypingStats  TypingStatsData
	BattleStats  BattleStatsData
	Achievements []AchievementData
}
