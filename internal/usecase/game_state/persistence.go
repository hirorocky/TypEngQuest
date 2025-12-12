// Package game_state はゲーム全体の状態管理を提供するユースケースです。
// このファイルはセーブ/ロードの変換ロジックを担当します。
package game_state

import (
	"fmt"
	"log/slog"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/infra/loader"
	"hirorocky/type-battle/internal/infra/persistence"
	"hirorocky/type-battle/internal/usecase/achievement"
	"hirorocky/type-battle/internal/usecase/agent"
	"hirorocky/type-battle/internal/usecase/enemy"
	"hirorocky/type-battle/internal/usecase/reward"
)

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
	for _, ag := range g.agentManager.GetAgents() {
		moduleIDs := make([]string, len(ag.Modules))
		for i, m := range ag.Modules {
			moduleIDs[i] = m.ID
		}
		agentInstances = append(agentInstances, persistence.AgentInstanceSave{
			ID: ag.ID,
			Core: persistence.CoreInstanceSave{
				ID:         ag.Core.ID,
				CoreTypeID: ag.Core.Type.ID,
				Level:      ag.Core.Level,
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
		passiveSkills = GetDefaultPassiveSkills() // パッシブスキルは現状デフォルトを使用
	} else {
		// 外部データがない場合はデフォルト値を使用
		coreTypeData = GetDefaultCoreTypeData()
		moduleDefData = GetDefaultModuleDefinitionData()
		passiveSkills = GetDefaultPassiveSkills()
	}

	// インベントリマネージャーを作成
	invManager := NewInventoryManager()

	// コアのIDマップを作成（エージェント復元時に使用）
	coreMap := make(map[string]*domain.CoreModel)

	// セーブデータからコアを再構築
	if data.Inventory != nil {
		for _, coreSave := range data.Inventory.CoreInstances {
			// コア特性を検索
			coreType := FindCoreType(coreTypeData, coreSave.CoreTypeID)
			passiveSkill := FindPassiveSkill(passiveSkills, coreSave.CoreTypeID)

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
			moduleDef := FindModuleDefinition(moduleDefData, moduleID)
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
			coreType := FindCoreType(coreTypeData, agentSave.Core.CoreTypeID)
			passiveSkill := FindPassiveSkill(passiveSkills, agentSave.Core.CoreTypeID)
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
				moduleDef := FindModuleDefinition(moduleDefData, moduleID)
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
		statsMgr.LoadFromSaveData(statsSaveData)
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
