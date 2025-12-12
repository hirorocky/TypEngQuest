// Package game_state はゲーム状態の管理を提供します。
// GameState構造体本体とアクセサメソッドを定義します。
package game_state

import (
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/loader"
	"hirorocky/type-battle/internal/usecase/achievement"
	"hirorocky/type-battle/internal/usecase/agent"
	"hirorocky/type-battle/internal/usecase/enemy"
	"hirorocky/type-battle/internal/usecase/inventory"
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
	externalData *loader.ExternalData

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
		externalData:     nil, // 必要に応じてLoaderで読み込む
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
func (g *GameState) ExternalData() *loader.ExternalData {
	return g.externalData
}

// SetExternalData は外部データを設定します。
func (g *GameState) SetExternalData(data *loader.ExternalData) {
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
func (g *GameState) UpdateEnemyGenerator(enemyTypes []loader.EnemyTypeData) {
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
		false, // ノーダメージフラグは別途管理
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

// ==================== InventoryManager ====================
// InventoryManagerはgame_stateパッケージで使用するためここで定義します。
// これはappパッケージのInventoryManagerと同様の機能を持ちます。

// InventoryManager はコアとモジュールのインベントリを管理します。
type InventoryManager struct {
	cores   *inventory.CoreInventory
	modules *inventory.ModuleInventory
}

// NewInventoryManager は新しいInventoryManagerを作成します。
func NewInventoryManager() *InventoryManager {
	return &InventoryManager{
		cores:   inventory.NewCoreInventory(100),   // デフォルト最大100コア
		modules: inventory.NewModuleInventory(200), // デフォルト最大200モジュール
	}
}

// InitializeWithDefaults はデフォルトのコアとモジュールを初期化します。
func (inv *InventoryManager) InitializeWithDefaults() {
	// デフォルト初期化（必要に応じてコアやモジュールを追加）
}

// Cores はコアインベントリを返します。
func (inv *InventoryManager) Cores() *inventory.CoreInventory {
	return inv.cores
}

// Modules はモジュールインベントリを返します。
func (inv *InventoryManager) Modules() *inventory.ModuleInventory {
	return inv.modules
}

// GetCores は全コアのリストを返します。
func (inv *InventoryManager) GetCores() []*domain.CoreModel {
	return inv.cores.List()
}

// GetModules は全モジュールのリストを返します。
func (inv *InventoryManager) GetModules() []*domain.ModuleModel {
	return inv.modules.List()
}

// AddCore はコアをインベントリに追加します。
func (inv *InventoryManager) AddCore(core *domain.CoreModel) error {
	return inv.cores.Add(core)
}

// AddModule はモジュールをインベントリに追加します。
func (inv *InventoryManager) AddModule(module *domain.ModuleModel) error {
	return inv.modules.Add(module)
}

// SetMaxCoreSlots はコアの最大スロット数を設定します。
func (inv *InventoryManager) SetMaxCoreSlots(slots int) {
	inv.cores = inventory.NewCoreInventory(slots)
}

// SetMaxModuleSlots はモジュールの最大スロット数を設定します。
func (inv *InventoryManager) SetMaxModuleSlots(slots int) {
	inv.modules = inventory.NewModuleInventory(slots)
}

// ==================== StatisticsManager ====================
// StatisticsManagerはgame_stateパッケージで使用するためここで定義します。

// BattleStats はバトル統計を保持する構造体です。
type BattleStats struct {
	TotalBattles         int
	Wins                 int
	Losses               int
	TotalEnemiesDefeated int
}

// TypingStats はタイピング統計を保持する構造体です。
type TypingStats struct {
	MaxWPM               int
	TotalWPM             float64
	TotalTypingCount     int
	TotalCharacters      int
	CorrectCharacters    int
	MissedCharacters     int
	PerfectAccuracyCount int
}

// StatisticsManager は統計情報を管理します。
type StatisticsManager struct {
	battle           BattleStats
	typing           TypingStats
	totalDamageDealt int
	totalDamageTaken int
	totalHealAmount  int
}

// NewStatisticsManager は新しいStatisticsManagerを作成します。
func NewStatisticsManager() *StatisticsManager {
	return &StatisticsManager{}
}

// Battle はバトル統計を返します。
func (s *StatisticsManager) Battle() *BattleStats {
	return &s.battle
}

// Typing はタイピング統計を返します。
func (s *StatisticsManager) Typing() *TypingStats {
	return &s.typing
}

// RecordBattleResult はバトル結果を記録します。
func (s *StatisticsManager) RecordBattleResult(victory bool, level int) {
	s.battle.TotalBattles++
	if victory {
		s.battle.Wins++
		s.battle.TotalEnemiesDefeated++
	} else {
		s.battle.Losses++
	}
}

// RecordTypingResult はタイピング結果を記録します。
func (s *StatisticsManager) RecordTypingResult(wpm int, accuracy float64, characters int, correct int, missed int) {
	s.typing.TotalTypingCount++
	s.typing.TotalWPM += float64(wpm)
	if wpm > s.typing.MaxWPM {
		s.typing.MaxWPM = wpm
	}
	s.typing.TotalCharacters += characters
	s.typing.CorrectCharacters += correct
	s.typing.MissedCharacters += missed
	if accuracy >= 1.0 {
		s.typing.PerfectAccuracyCount++
	}
}

// RecordDamageDealt は与えたダメージを記録します。
func (s *StatisticsManager) RecordDamageDealt(damage int) {
	s.totalDamageDealt += damage
}

// RecordDamageTaken は受けたダメージを記録します。
func (s *StatisticsManager) RecordDamageTaken(damage int) {
	s.totalDamageTaken += damage
}

// RecordHealing は回復量を記録します。
func (s *StatisticsManager) RecordHealing(heal int) {
	s.totalHealAmount += heal
}

// RecordTypingStats はタイピング統計を記録します。
func (s *StatisticsManager) RecordTypingStats(wpm float64, accuracy float64) {
	s.typing.TotalTypingCount++
	s.typing.TotalWPM += wpm
	if int(wpm) > s.typing.MaxWPM {
		s.typing.MaxWPM = int(wpm)
	}
}

// GetAverageWPM は平均WPMを返します。
func (s *StatisticsManager) GetAverageWPM() float64 {
	if s.typing.TotalTypingCount == 0 {
		return 0
	}
	return s.typing.TotalWPM / float64(s.typing.TotalTypingCount)
}

// GetAccuracyRate は正確性率を返します。
func (s *StatisticsManager) GetAccuracyRate() float64 {
	total := s.typing.CorrectCharacters + s.typing.MissedCharacters
	if total == 0 {
		return 0
	}
	return float64(s.typing.CorrectCharacters) / float64(total)
}

// StatisticsSaveData はセーブ用の統計データです。
type StatisticsSaveData struct {
	TotalBattles         int
	Victories            int
	Defeats              int
	MaxLevelReached      int
	HighestWPM           float64
	AverageWPM           float64
	PerfectAccuracyCount int
	TotalCharactersTyped int
}

// LoadFromSaveData はセーブデータから統計を復元します。
func (s *StatisticsManager) LoadFromSaveData(data *StatisticsSaveData) {
	s.battle.TotalBattles = data.TotalBattles
	s.battle.Wins = data.Victories
	s.battle.Losses = data.Defeats
	s.typing.MaxWPM = int(data.HighestWPM)
	s.typing.TotalCharacters = data.TotalCharactersTyped
	s.typing.PerfectAccuracyCount = data.PerfectAccuracyCount
	// 平均WPMから逆算（概算）
	if data.AverageWPM > 0 {
		s.typing.TotalTypingCount = 1
		s.typing.TotalWPM = data.AverageWPM
	}
}

// ==================== Settings ====================
// Settingsはgame_stateパッケージで使用するためここで定義します。

// Settings はゲーム設定を保持する構造体です。
type Settings struct {
	keybinds map[string]string
}

// NewSettings は新しいSettingsを作成します。
func NewSettings() *Settings {
	return &Settings{
		keybinds: make(map[string]string),
	}
}

// Keybinds はキーバインド設定を返します。
func (s *Settings) Keybinds() map[string]string {
	return s.keybinds
}

// SetKeybind はキーバインドを設定します。
func (s *Settings) SetKeybind(action, key string) {
	s.keybinds[action] = key
}
