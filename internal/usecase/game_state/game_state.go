// Package game_state はゲーム全体の状態管理を提供するユースケースです。
// プレイヤー情報、インベントリ、統計、実績、設定などを一元管理します。
package game_state

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/infra/masterdata"
	"hirorocky/type-battle/internal/usecase/achievement"
	"hirorocky/type-battle/internal/usecase/agent"
	"hirorocky/type-battle/internal/usecase/enemy"
	"hirorocky/type-battle/internal/usecase/reward"
)

// GameState はゲーム全体の状態を保持する構造体です。
// プレイヤー情報、インベントリ、統計、実績、設定などを含みます。
// セーブ/ロード時にはこの構造体がJSON形式で永続化されます。
type GameState struct {
	// MaxLevelReached は到達した最高レベルを表します。
	// 初期値は0で、レベル1クリア後に1になります。
	// 挑戦可能な最大レベルは MaxLevelReached + 1 です。
	MaxLevelReached int

	// player はプレイヤーの状態です。
	player *domain.PlayerModel

	// inventory はゲーム全体のインベントリマネージャーです。
	inventory *InventoryManager

	// agentManager はエージェント管理を担当します。
	agentManager *agent.AgentManager

	// statistics は統計情報を管理します。
	statistics *StatisticsManager

	// achievements は実績管理を担当します。
	achievements *achievement.AchievementManager

	// externalData は外部データファイルから読み込んだデータです。
	externalData *masterdata.ExternalData

	// settings はゲーム設定です。
	settings *Settings

	// rewardCalculator は報酬計算を担当します。
	rewardCalculator *reward.RewardCalculator

	// tempStorage は一時保管を担当します（インベントリ満杯時用）。
	tempStorage *reward.TempStorage

	// enemyGenerator は敵生成を担当します。
	enemyGenerator *enemy.EnemyGenerator

	// encounteredEnemies はエンカウントした敵のIDリストです（敵図鑑用）。
	encounteredEnemies []string
}

// NewGameState はデフォルト値で新しいGameStateを作成します。
// 初回起動時やセーブデータが存在しない場合に使用されます。
func NewGameState() *GameState {
	// インベントリマネージャーを作成
	invManager := NewInventoryManager()
	invManager.InitializeWithDefaults()

	// エージェントマネージャーを作成（エージェント・装備管理を一元化）
	agentMgr := agent.NewAgentManager(
		invManager.Cores(),
		invManager.Modules(),
	)
	agentMgr.InitializeWithDefaults()

	// 実績マネージャーを作成
	achievementMgr := achievement.NewAchievementManager()

	// 報酬計算用のデータを準備
	coreTypeData := GetDefaultCoreTypeData()
	moduleDefData := GetDefaultModuleDefinitionData()
	passiveSkills := GetDefaultPassiveSkills()

	// RewardCalculatorを作成
	rewardCalc := reward.NewRewardCalculator(coreTypeData, moduleDefData, passiveSkills)

	// EnemyGeneratorを作成（デフォルト敵タイプを使用）
	enemyGen := enemy.NewEnemyGenerator(nil)

	return &GameState{
		MaxLevelReached:  0,
		player:           domain.NewPlayer(),
		inventory:        invManager,
		agentManager:     agentMgr,
		statistics:       NewStatisticsManager(),
		achievements:     achievementMgr,
		externalData:     nil,
		settings:         NewSettings(),
		rewardCalculator: rewardCalc,
		tempStorage:      &reward.TempStorage{},
		enemyGenerator:   enemyGen,
	}
}

// Player はプレイヤーの状態を返します。
func (g *GameState) Player() *domain.PlayerModel {
	return g.player
}

// Inventory はインベントリマネージャーを返します。
func (g *GameState) Inventory() *InventoryManager {
	return g.inventory
}

// AgentManager はエージェントマネージャーを返します。
func (g *GameState) AgentManager() *agent.AgentManager {
	return g.agentManager
}

// Statistics は統計マネージャーを返します。
func (g *GameState) Statistics() *StatisticsManager {
	return g.statistics
}

// Achievements は実績マネージャーを返します。
func (g *GameState) Achievements() *achievement.AchievementManager {
	return g.achievements
}

// ExternalData は外部データを返します。
func (g *GameState) ExternalData() *masterdata.ExternalData {
	return g.externalData
}

// SetExternalData は外部データを設定します。
func (g *GameState) SetExternalData(data *masterdata.ExternalData) {
	g.externalData = data
}

// Settings は設定を返します。
func (g *GameState) Settings() *Settings {
	return g.settings
}

// EnemyGenerator は敵生成器を返します。
func (g *GameState) EnemyGenerator() *enemy.EnemyGenerator {
	return g.enemyGenerator
}

// UpdateEnemyGenerator は外部データで敵生成器を更新します。
func (g *GameState) UpdateEnemyGenerator(enemyTypes []masterdata.EnemyTypeData) {
	if len(enemyTypes) > 0 {
		g.enemyGenerator = enemy.NewEnemyGenerator(enemyTypes)
	}
}

// RecordBattleVictory はバトル勝利を記録します。
func (g *GameState) RecordBattleVictory(level int) {
	g.statistics.RecordBattleResult(true, level)
	if level > g.MaxLevelReached {
		g.MaxLevelReached = level
	}

	// 実績チェック
	g.checkAchievements()
}

// RecordBattleDefeat はバトル敗北を記録します。
func (g *GameState) RecordBattleDefeat(level int) {
	g.statistics.RecordBattleResult(false, level)
}

// RecordTypingResult はタイピング結果を記録します。
func (g *GameState) RecordTypingResult(wpm int, accuracy float64, characters int, correct int, missed int) {
	g.statistics.RecordTypingResult(wpm, accuracy, characters, correct, missed)

	// 実績チェック
	g.checkAchievements()
}

// checkAchievements は実績の達成状況をチェックします。
func (g *GameState) checkAchievements() {
	stats := g.statistics

	// タイピング実績をチェック
	g.achievements.CheckTypingAchievements(
		float64(stats.Typing().MaxWPM),
		g.statistics.GetAccuracyRate(),
	)

	// バトル実績をチェック
	g.achievements.CheckBattleAchievements(
		stats.Battle().TotalEnemiesDefeated,
		g.MaxLevelReached,
		false,
	)
}

// CheckBattleAchievementsWithNoDamage はノーダメージ判定付きでバトル実績をチェックします。
func (g *GameState) CheckBattleAchievementsWithNoDamage(noDamage bool) {
	stats := g.statistics

	// タイピング実績をチェック
	g.achievements.CheckTypingAchievements(
		float64(stats.Typing().MaxWPM),
		g.statistics.GetAccuracyRate(),
	)

	// バトル実績をチェック（ノーダメージ判定付き）
	g.achievements.CheckBattleAchievements(
		stats.Battle().TotalEnemiesDefeated,
		g.MaxLevelReached,
		noDamage,
	)
}

// AddEncounteredEnemy は敵をエンカウント済みとして記録します（敵図鑑用）。
func (g *GameState) AddEncounteredEnemy(enemyID string) {
	// 空のIDは無視
	if enemyID == "" {
		return
	}
	// 重複チェック
	for _, id := range g.encounteredEnemies {
		if id == enemyID {
			return
		}
	}
	g.encounteredEnemies = append(g.encounteredEnemies, enemyID)
}

// GetEncounteredEnemies はエンカウント済みの敵IDリストを返します。
func (g *GameState) GetEncounteredEnemies() []string {
	return g.encounteredEnemies
}

// GetEquippedAgents は装備中のエージェント一覧を返します。
func (g *GameState) GetEquippedAgents() []*domain.AgentModel {
	return g.agentManager.GetEquippedAgents()
}

// PreparePlayerForBattle はプレイヤーをバトル用に準備します。
func (g *GameState) PreparePlayerForBattle() {
	agents := g.GetEquippedAgents()
	g.player.RecalculateHP(agents)
	g.player.PrepareForBattle()
}

// RewardCalculator は報酬計算を返します。
func (g *GameState) RewardCalculator() *reward.RewardCalculator {
	return g.rewardCalculator
}

// TempStorage は一時保管を返します。
func (g *GameState) TempStorage() *reward.TempStorage {
	return g.tempStorage
}

// AddRewardsToInventory は報酬をインベントリに追加します。
func (g *GameState) AddRewardsToInventory(result *reward.RewardResult) *reward.InventoryWarning {
	return g.rewardCalculator.AddRewardsToInventory(
		result,
		g.inventory.Cores(),
		g.inventory.Modules(),
		g.tempStorage,
	)
}
