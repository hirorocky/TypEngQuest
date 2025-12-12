// Package app は BlitzTypingOperator TUIゲームのゲーム状態管理を提供します。
package app

import (
	"fmt"
	"log/slog"

	"hirorocky/type-battle/internal/achievement"
	"hirorocky/type-battle/internal/agent"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/enemy"
	"hirorocky/type-battle/internal/inventory"
	"hirorocky/type-battle/internal/loader"
	"hirorocky/type-battle/internal/persistence"
	"hirorocky/type-battle/internal/reward"
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
	coreTypeData := getDefaultCoreTypeData()
	moduleDefData := getDefaultModuleDefinitionData()
	passiveSkills := getDefaultPassiveSkills()

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

// ==================== デフォルトデータヘルパー ====================

// getDefaultCoreTypeData はデフォルトのコア特性データを返します。
func getDefaultCoreTypeData() []loader.CoreTypeData {
	return []loader.CoreTypeData{
		{
			ID:             "all_rounder",
			Name:           "オールラウンダー",
			AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
			StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
			PassiveSkillID: "balance_mastery",
			MinDropLevel:   1,
		},
		{
			ID:             "attacker",
			Name:           "攻撃バランス",
			AllowedTags:    []string{"physical_low", "physical_mid", "magic_low", "magic_mid"},
			StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.2, "SPD": 0.8, "LUK": 0.8},
			PassiveSkillID: "attack_boost",
			MinDropLevel:   1,
		},
		{
			ID:             "healer",
			Name:           "ヒーラー",
			AllowedTags:    []string{"heal_low", "heal_mid", "magic_low", "buff_low"},
			StatWeights:    map[string]float64{"STR": 0.8, "MAG": 1.4, "SPD": 0.9, "LUK": 0.9},
			PassiveSkillID: "heal_boost",
			MinDropLevel:   5,
		},
		{
			ID:             "tank",
			Name:           "タンク",
			AllowedTags:    []string{"physical_low", "buff_low", "buff_mid"},
			StatWeights:    map[string]float64{"STR": 1.1, "MAG": 0.7, "SPD": 0.7, "LUK": 1.5},
			PassiveSkillID: "defense_boost",
			MinDropLevel:   3,
		},
	}
}

// getDefaultModuleDefinitionData はデフォルトのモジュール定義データを返します。
func getDefaultModuleDefinitionData() []loader.ModuleDefinitionData {
	return []loader.ModuleDefinitionData{
		{ID: "mod_slash", Name: "斬撃", Category: "physical_attack", Level: 1, Tags: []string{"physical_low"}, BaseEffect: 10.0, StatReference: "STR", Description: "基本的な物理攻撃", MinDropLevel: 1},
		{ID: "mod_thrust", Name: "突き", Category: "physical_attack", Level: 1, Tags: []string{"physical_low"}, BaseEffect: 8.0, StatReference: "STR", Description: "素早い物理攻撃", MinDropLevel: 1},
		{ID: "mod_fireball", Name: "火球", Category: "magic_attack", Level: 1, Tags: []string{"magic_low", "fire"}, BaseEffect: 12.0, StatReference: "MAG", Description: "火属性の魔法攻撃", MinDropLevel: 1},
		{ID: "mod_ice", Name: "氷結", Category: "magic_attack", Level: 1, Tags: []string{"magic_low", "ice"}, BaseEffect: 11.0, StatReference: "MAG", Description: "氷属性の魔法攻撃", MinDropLevel: 1},
		{ID: "mod_heal", Name: "ヒール", Category: "heal", Level: 1, Tags: []string{"heal_low"}, BaseEffect: 15.0, StatReference: "MAG", Description: "基本的な回復魔法", MinDropLevel: 1},
		{ID: "mod_attack_up", Name: "攻撃力アップ", Category: "buff", Level: 1, Tags: []string{"buff_low"}, BaseEffect: 5.0, StatReference: "LUK", Description: "攻撃力を上昇させる", MinDropLevel: 1},
		{ID: "mod_defense_up", Name: "防御アップ", Category: "buff", Level: 1, Tags: []string{"buff_low"}, BaseEffect: 4.0, StatReference: "LUK", Description: "防御力を上昇させる", MinDropLevel: 1},
		// レベル2モジュール
		{ID: "mod_heavy_slash", Name: "強斬撃", Category: "physical_attack", Level: 2, Tags: []string{"physical_mid"}, BaseEffect: 20.0, StatReference: "STR", Description: "強力な物理攻撃", MinDropLevel: 5},
		{ID: "mod_blizzard", Name: "ブリザード", Category: "magic_attack", Level: 2, Tags: []string{"magic_mid", "ice"}, BaseEffect: 22.0, StatReference: "MAG", Description: "氷属性の範囲魔法", MinDropLevel: 5},
		{ID: "mod_cure", Name: "キュア", Category: "heal", Level: 2, Tags: []string{"heal_mid"}, BaseEffect: 30.0, StatReference: "MAG", Description: "中級回復魔法", MinDropLevel: 5},
	}
}

// getDefaultPassiveSkills はデフォルトのパッシブスキルを返します。
func getDefaultPassiveSkills() map[string]domain.PassiveSkill {
	return map[string]domain.PassiveSkill{
		"balanced_stats": {
			ID:          "balanced_stats",
			Name:        "バランス",
			Description: "全ステータスにバランスよくボーナス",
		},
		"attack_boost": {
			ID:          "attack_boost",
			Name:        "攻撃ブースト",
			Description: "攻撃力にボーナスを得る",
		},
		"heal_boost": {
			ID:          "heal_boost",
			Name:        "回復ブースト",
			Description: "回復効果にボーナスを得る",
		},
		"defense_boost": {
			ID:          "defense_boost",
			Name:        "防御ブースト",
			Description: "防御力にボーナスを得る",
		},
	}
}

// ==================== セーブ/ロード変換関数 ====================

// ToSaveData はGameStateをセーブデータに変換します。
// ID化最適化により、フルオブジェクトではなくID参照を保存します。
func (g *GameState) ToSaveData() *persistence.SaveData {
	saveData := persistence.NewSaveData()

	// 最高到達レベル
	saveData.Statistics.MaxLevelReached = g.MaxLevelReached

	// コアをID化して保存
	coreInstances := make([]persistence.CoreInstanceSave, 0)
	for _, core := range g.inventory.GetCores() {
		coreInstances = append(coreInstances, persistence.CoreInstanceSave{
			ID:         core.ID,
			CoreTypeID: core.Type.ID,
			Level:      core.Level,
		})
	}
	saveData.Inventory.CoreInstances = coreInstances

	// モジュールをカウント化して保存
	moduleCounts := make(map[string]int)
	for _, module := range g.inventory.GetModules() {
		moduleCounts[module.ID]++
	}
	saveData.Inventory.ModuleCounts = moduleCounts

	// エージェントを保存（コア情報を直接埋め込み）
	agentInstances := make([]persistence.AgentInstanceSave, 0)
	for _, agent := range g.agentManager.GetAgents() {
		moduleIDs := make([]string, len(agent.Modules))
		for i, m := range agent.Modules {
			moduleIDs[i] = m.ID
		}
		agentInstances = append(agentInstances, persistence.AgentInstanceSave{
			ID: agent.ID,
			Core: persistence.CoreInstanceSave{
				ID:         agent.Core.ID,
				CoreTypeID: agent.Core.Type.ID,
				Level:      agent.Core.Level,
			},
			ModuleIDs: moduleIDs,
		})
	}
	saveData.Inventory.AgentInstances = agentInstances

	saveData.Inventory.MaxCoreSlots = g.inventory.Cores().MaxSlots()
	saveData.Inventory.MaxModuleSlots = g.inventory.Modules().MaxSlots()

	// 装備中のエージェントIDをスロット番号順に取得
	var equippedIDs [agent.MaxEquipmentSlots]string
	for slot := 0; slot < agent.MaxEquipmentSlots; slot++ {
		if equippedAgent := g.agentManager.GetEquippedAgentAt(slot); equippedAgent != nil {
			equippedIDs[slot] = equippedAgent.ID
		}
		// nilの場合は空文字列のまま
	}
	saveData.Player.EquippedAgentIDs = equippedIDs

	// 統計
	stats := g.statistics
	saveData.Statistics.TotalBattles = stats.Battle().TotalBattles
	saveData.Statistics.Victories = stats.Battle().Wins
	saveData.Statistics.Defeats = stats.Battle().Losses
	saveData.Statistics.HighestWPM = float64(stats.Typing().MaxWPM)
	saveData.Statistics.AverageWPM = stats.GetAverageWPM()
	saveData.Statistics.PerfectAccuracyCount = stats.Typing().PerfectAccuracyCount
	saveData.Statistics.TotalCharactersTyped = stats.Typing().TotalCharacters
	saveData.Statistics.EncounteredEnemies = g.encounteredEnemies

	// 実績（ドメイン型を経由してセーブデータ型に変換）
	saveData.Achievements = persistence.AchievementStateToSaveData(g.achievements.GetUnlockedIDs())

	// 設定
	saveData.Settings.KeyBindings = g.settings.Keybinds()

	return saveData
}

// GameStateFromSaveData はセーブデータからGameStateを生成します。
// ID化最適化されたセーブデータからオブジェクトを再構築します。
// externalDataが提供されている場合はそれを使用し、なければデフォルト値を使用します。
func GameStateFromSaveData(data *persistence.SaveData, externalData ...*loader.ExternalData) *GameState {
	// マスタデータを取得
	var coreTypeData []loader.CoreTypeData
	var moduleDefData []loader.ModuleDefinitionData
	var passiveSkills map[string]domain.PassiveSkill

	if len(externalData) > 0 && externalData[0] != nil {
		// 外部データが提供されている場合はそれを使用
		coreTypeData = externalData[0].CoreTypes
		moduleDefData = externalData[0].ModuleDefinitions
		passiveSkills = getDefaultPassiveSkills() // パッシブスキルは現状デフォルトを使用
	} else {
		// 外部データがない場合はデフォルト値を使用
		coreTypeData = getDefaultCoreTypeData()
		moduleDefData = getDefaultModuleDefinitionData()
		passiveSkills = getDefaultPassiveSkills()
	}

	// インベントリマネージャーを作成
	invManager := NewInventoryManager()

	// コアのIDマップを作成（エージェント復元時に使用）
	coreMap := make(map[string]*domain.CoreModel)

	// セーブデータからコアを再構築
	if data.Inventory != nil {
		for _, coreSave := range data.Inventory.CoreInstances {
			// コア特性を検索
			coreType := findCoreType(coreTypeData, coreSave.CoreTypeID)
			passiveSkill := findPassiveSkill(passiveSkills, coreSave.CoreTypeID)

			// コアを再構築（ステータスは自動計算される）
			core := domain.NewCore(
				coreSave.ID,
				coreType.Name+" Lv."+fmt.Sprintf("%d", coreSave.Level),
				coreSave.Level,
				coreType.ToDomain(),
				passiveSkill,
			)
			coreMap[coreSave.ID] = core
			if err := invManager.AddCore(core); err != nil {
				slog.Error("コア追加に失敗",
					slog.String("core_id", core.ID),
					slog.String("core_type", core.Type.ID),
					slog.Any("error", err),
				)
			}
		}

		// モジュールを再構築
		for moduleID, count := range data.Inventory.ModuleCounts {
			moduleDef := findModuleDefinition(moduleDefData, moduleID)
			if moduleDef != nil {
				for i := 0; i < count; i++ {
					module := moduleDef.ToDomain()
					if err := invManager.AddModule(module); err != nil {
						slog.Error("モジュール追加に失敗",
							slog.String("module_id", module.ID),
							slog.String("module_name", module.Name),
							slog.Any("error", err),
						)
					}
				}
			}
		}
	}

	// エージェントマネージャーを作成
	agentMgr := agent.NewAgentManager(
		invManager.Cores(),
		invManager.Modules(),
	)

	// セーブデータからエージェントを再構築（コア情報は各エージェントに埋め込まれている）
	if data.Inventory != nil {
		for _, agentSave := range data.Inventory.AgentInstances {
			// エージェント内のコア情報からコアを再構築
			coreType := findCoreType(coreTypeData, agentSave.Core.CoreTypeID)
			passiveSkill := findPassiveSkill(passiveSkills, agentSave.Core.CoreTypeID)
			core := domain.NewCore(
				agentSave.Core.ID,
				coreType.Name+" Lv."+fmt.Sprintf("%d", agentSave.Core.Level),
				agentSave.Core.Level,
				coreType.ToDomain(),
				passiveSkill,
			)

			// モジュールを再構築
			modules := make([]*domain.ModuleModel, 0, len(agentSave.ModuleIDs))
			for _, moduleID := range agentSave.ModuleIDs {
				moduleDef := findModuleDefinition(moduleDefData, moduleID)
				if moduleDef != nil {
					modules = append(modules, moduleDef.ToDomain())
				}
			}

			// エージェントを再構築
			agentModel := domain.NewAgent(agentSave.ID, core, modules)
			if err := agentMgr.AddAgent(agentModel); err != nil {
				slog.Error("エージェント追加に失敗",
					slog.String("agent_id", agentModel.ID),
					slog.Any("error", err),
				)
			}
		}
	}

	// 装備エージェントを復元（スロット番号を保持して復元）
	player := domain.NewPlayer()
	if data.Player != nil {
		for slot, agentID := range data.Player.EquippedAgentIDs {
			if agentID != "" {
				if err := agentMgr.EquipAgent(slot, agentID, player); err != nil {
					slog.Error("エージェント装備に失敗",
						slog.Int("slot", slot),
						slog.String("agent_id", agentID),
						slog.Any("error", err),
					)
				}
			}
		}
	}

	// 実績マネージャーを作成（セーブデータ型からドメイン型に変換してロード）
	achievementMgr := achievement.NewAchievementManager()
	if data.Achievements != nil {
		unlockedIDs := persistence.SaveDataToAchievementState(data.Achievements)
		achievementMgr.LoadFromUnlockedIDs(unlockedIDs)
	}

	// 統計マネージャーを作成して復元
	statsMgr := NewStatisticsManager()
	if data.Statistics != nil {
		statsSaveData := &StatisticsSaveData{
			TotalBattles:         data.Statistics.TotalBattles,
			Victories:            data.Statistics.Victories,
			Defeats:              data.Statistics.Defeats,
			MaxLevelReached:      data.Statistics.MaxLevelReached,
			HighestWPM:           data.Statistics.HighestWPM,
			AverageWPM:           data.Statistics.AverageWPM,
			PerfectAccuracyCount: data.Statistics.PerfectAccuracyCount,
			TotalCharactersTyped: data.Statistics.TotalCharactersTyped,
		}
		statsMgr.loadFromSaveData(statsSaveData)
	}

	// 設定を復元
	settings := NewSettings()
	if data.Settings != nil && data.Settings.KeyBindings != nil {
		for action, key := range data.Settings.KeyBindings {
			settings.SetKeybind(action, key)
		}
	}

	// RewardCalculatorを作成
	rewardCalc := reward.NewRewardCalculator(coreTypeData, moduleDefData, passiveSkills)

	// EnemyGeneratorを作成
	enemyGen := enemy.NewEnemyGenerator(nil)

	// 最高到達レベルとエンカウント敵リストを取得
	maxLevelReached := 0
	var encounteredEnemies []string
	if data.Statistics != nil {
		maxLevelReached = data.Statistics.MaxLevelReached
		encounteredEnemies = data.Statistics.EncounteredEnemies
	}

	return &GameState{
		MaxLevelReached:    maxLevelReached,
		player:             player,
		inventory:          invManager,
		agentManager:       agentMgr,
		statistics:         statsMgr,
		achievements:       achievementMgr,
		externalData:       nil,
		settings:           settings,
		rewardCalculator:   rewardCalc,
		tempStorage:        &reward.TempStorage{},
		enemyGenerator:     enemyGen,
		encounteredEnemies: encounteredEnemies,
	}
}

// SetMaxCoreSlots はコアの最大スロット数を設定します。
func (inv *InventoryManager) SetMaxCoreSlots(slots int) {
	inv.cores = inventory.NewCoreInventory(slots)
}

// SetMaxModuleSlots はモジュールの最大スロット数を設定します。
func (inv *InventoryManager) SetMaxModuleSlots(slots int) {
	inv.modules = inventory.NewModuleInventory(slots)
}

// ==================== ID化セーブデータ復元ヘルパー ====================

// findCoreType はコア特性リストから指定IDのコア特性を検索します。
// 見つからない場合はデフォルトのオールラウンダーを返します。
func findCoreType(coreTypes []loader.CoreTypeData, coreTypeID string) loader.CoreTypeData {
	for _, ct := range coreTypes {
		if ct.ID == coreTypeID {
			return ct
		}
	}
	// デフォルト（最初のコア特性またはオールラウンダー）
	if len(coreTypes) > 0 {
		return coreTypes[0]
	}
	return loader.CoreTypeData{
		ID:             "all_rounder",
		Name:           "オールラウンダー",
		AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		PassiveSkillID: "balance_mastery",
		MinDropLevel:   1,
	}
}

// findPassiveSkill はパッシブスキルマップから指定コア特性に対応するスキルを検索します。
// 見つからない場合はデフォルトのパッシブスキルを返します。
func findPassiveSkill(passiveSkills map[string]domain.PassiveSkill, coreTypeID string) domain.PassiveSkill {
	// コア特性IDに対応するパッシブスキルIDを取得
	skillID := coreTypeID + "_skill"
	if skill, ok := passiveSkills[skillID]; ok {
		return skill
	}
	// コア特性のパッシブスキルIDで検索
	for _, skill := range passiveSkills {
		if skill.ID == coreTypeID || skill.ID == skillID {
			return skill
		}
	}
	// デフォルト
	return domain.PassiveSkill{
		ID:          "default_skill",
		Name:        "バランス",
		Description: "バランスの取れた能力",
	}
}

// findModuleDefinition はモジュール定義リストから指定IDのモジュール定義を検索します。
// 見つからない場合はnilを返します。
func findModuleDefinition(moduleDefs []loader.ModuleDefinitionData, moduleID string) *loader.ModuleDefinitionData {
	for i := range moduleDefs {
		if moduleDefs[i].ID == moduleID {
			return &moduleDefs[i]
		}
	}
	return nil
}
