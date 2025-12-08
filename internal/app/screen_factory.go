// Package app は BlitzTypingOperator TUIゲームの画面生成機能を提供します。
package app

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/screens"
)

// InventoryProvider は画面に必要なインベントリ操作を提供するインターフェースです。
type InventoryProvider interface {
	GetCores() []*domain.CoreModel
	GetModules() []*domain.ModuleModel
	GetAgents() []*domain.AgentModel
	GetEquippedAgents() []*domain.AgentModel
	AddAgent(agent *domain.AgentModel) error
	RemoveCore(id string) error
	RemoveModule(id string) error
	EquipAgent(slot int, agent *domain.AgentModel) error
	UnequipAgent(slot int) error
}

// ScreenFactory は画面インスタンスを生成します。
// GameStateから必要なデータを取得して各画面を初期化します。
type ScreenFactory struct {
	gameState *GameState
}

// NewScreenFactory は新しいScreenFactoryを作成します。
func NewScreenFactory(gs *GameState) *ScreenFactory {
	return &ScreenFactory{
		gameState: gs,
	}
}

// CreateHomeScreen はホーム画面を作成します。
func (f *ScreenFactory) CreateHomeScreen(maxLevelReached int, invProvider InventoryProvider) *screens.HomeScreen {
	return screens.NewHomeScreen(maxLevelReached, invProvider)
}

// CreateBattleSelectScreen はバトル選択画面を作成します。
func (f *ScreenFactory) CreateBattleSelectScreen(maxLevelReached int, invProvider InventoryProvider) *screens.BattleSelectScreen {
	return screens.NewBattleSelectScreen(maxLevelReached, invProvider)
}

// CreateAgentManagementScreen はエージェント管理画面を作成します。
func (f *ScreenFactory) CreateAgentManagementScreen(invProvider InventoryProvider) *screens.AgentManagementScreen {
	return screens.NewAgentManagementScreen(invProvider)
}

// CreateEncyclopediaScreen は図鑑画面を作成します。
func (f *ScreenFactory) CreateEncyclopediaScreen() *screens.EncyclopediaScreen {
	encycData := createEncyclopediaDataFromGameState(f.gameState)
	return screens.NewEncyclopediaScreen(encycData)
}

// CreateStatsAchievementsScreen は統計・実績画面を作成します。
func (f *ScreenFactory) CreateStatsAchievementsScreen() *screens.StatsAchievementsScreen {
	statsData := createStatsDataFromGameState(f.gameState)
	return screens.NewStatsAchievementsScreen(statsData)
}

// CreateSettingsScreen は設定画面を作成します。
func (f *ScreenFactory) CreateSettingsScreen() *screens.SettingsScreen {
	settingsData := createSettingsDataFromGameState(f.gameState)
	return screens.NewSettingsScreen(settingsData)
}
