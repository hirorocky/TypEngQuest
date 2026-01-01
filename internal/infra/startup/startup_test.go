// Package startup は初回起動時の初期化処理を担当します。

package startup

import (
	"testing"

	"hirorocky/type-battle/internal/infra/masterdata"
)

// createTestExternalData はテスト用の外部データを作成します。
func createTestExternalData() *masterdata.ExternalData {
	return &masterdata.ExternalData{
		CoreTypes: []masterdata.CoreTypeData{
			{
				ID:             "all_rounder",
				Name:           "オールラウンダー",
				AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
				StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
				PassiveSkillID: "ps_combo_master",
				MinDropLevel:   1,
			},
		},
		ModuleDefinitions: []masterdata.ModuleDefinitionData{
			{
				ID:          "physical_strike_lv1",
				Name:        "物理打撃Lv1",
				Icon:        "⚔️",
				Tags:        []string{"physical_low"},
				Description: "物理ダメージを与える基本攻撃",
				Effects: []masterdata.ModuleEffectData{
					{
						Target:      "enemy",
						HPFormula:   &masterdata.HPFormulaData{Base: 0, StatCoef: 1.0, StatRef: "STR"},
						Probability: 1.0,
					},
				},
			},
			{
				ID:          "fireball_lv1",
				Name:        "ファイアボールLv1",
				Icon:        "🔥",
				Tags:        []string{"magic_low"},
				Description: "魔法ダメージを与える基本魔法",
				Effects: []masterdata.ModuleEffectData{
					{
						Target:      "enemy",
						HPFormula:   &masterdata.HPFormulaData{Base: 0, StatCoef: 1.2, StatRef: "MAG"},
						Probability: 1.0,
					},
				},
			},
			{
				ID:          "heal_lv1",
				Name:        "ヒールLv1",
				Icon:        "💚",
				Tags:        []string{"heal_low"},
				Description: "HPを回復する基本回復魔法",
				Effects: []masterdata.ModuleEffectData{
					{
						Target:      "self",
						HPFormula:   &masterdata.HPFormulaData{Base: 0, StatCoef: 0.8, StatRef: "MAG"},
						Probability: 1.0,
					},
				},
			},
			{
				ID:          "attack_buff_lv1",
				Name:        "攻撃バフLv1",
				Icon:        "⬆️",
				Tags:        []string{"buff_low"},
				Description: "一時的に攻撃力を上昇させる",
				Effects: []masterdata.ModuleEffectData{
					{
						Target: "self",
						EffectColumn: &masterdata.EffectColumnData{
							Column:   "damage_bonus",
							Value:    10.0,
							Duration: 10.0,
						},
						Probability: 1.0,
					},
				},
			},
		},
		EnemyTypes: []masterdata.EnemyTypeData{
			{
				ID:              "slime",
				Name:            "スライム",
				BaseHP:          50,
				BaseAttackPower: 5,
			},
		},
		PassiveSkills: []masterdata.PassiveSkillData{
			{
				ID:          "ps_combo_master",
				Name:        "コンボマスター",
				Description: "連続タイピングでダメージ増加",
			},
		},
		FirstAgents: []masterdata.FirstAgentData{
			{
				ID:         "agent_first_1",
				CoreTypeID: "all_rounder",
				CoreLevel:  1,
				Modules: []masterdata.FirstAgentModuleData{
					{TypeID: "physical_strike_lv1"},
				},
			},
			{
				ID:         "agent_first_2",
				CoreTypeID: "all_rounder",
				CoreLevel:  1,
				Modules: []masterdata.FirstAgentModuleData{
					{TypeID: "heal_lv1"},
				},
			},
			{
				ID:         "agent_first_3",
				CoreTypeID: "all_rounder",
				CoreLevel:  1,
				Modules: []masterdata.FirstAgentModuleData{
					{TypeID: "attack_buff_lv1"},
				},
			},
		},
	}
}

// ==================================================
// Task 14.1: 新規ゲーム初期化テスト
// ==================================================

func TestNewGameInitializer_CreateInitialAgents(t *testing.T) {
	initializer := NewNewGameInitializer(createTestExternalData())

	agents := initializer.CreateInitialAgents()
	if agents == nil {
		t.Fatal("初期エージェントが作成されるべきです")
	}

	// 3体のエージェントが作成されること
	if len(agents) != 3 {
		t.Fatalf("初期エージェントは3体作成されるべきです: got %d", len(agents))
	}

	for i, agent := range agents {
		// エージェントがコアを持つこと
		if agent.Core == nil {
			t.Errorf("初期エージェント%dはコアを持つべきです", i+1)
		}

		// エージェントが1つのモジュールを持つこと
		if len(agent.Modules) != 1 {
			t.Errorf("初期エージェント%dは1つのモジュールを持つべきです: got %d", i+1, len(agent.Modules))
		}

		// エージェントレベルがコアレベルと一致すること
		if agent.Level != agent.Core.Level {
			t.Errorf("エージェント%dのレベルはコアレベルと一致するべきです", i+1)
		}

		// オールラウンダー特性であること
		if agent.Core.Type.ID != "all_rounder" {
			t.Errorf("初期エージェント%dのコアはオールラウンダー特性であるべきです: got %s", i+1, agent.Core.Type.ID)
		}
	}
}

func TestNewGameInitializer_InitializeNewGame(t *testing.T) {

	initializer := NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()
	if saveData == nil {
		t.Fatal("新規ゲームデータが作成されるべきです")
	}

	// インベントリに初期コアが含まれている（エージェント合成で消費されるため0）
	// 初期エージェントが3体作成されていること（ID化された構造）
	if len(saveData.Inventory.AgentInstances) != 3 {
		t.Errorf("初期エージェントが3体存在するべきです: got %d", len(saveData.Inventory.AgentInstances))
	}

	// 初期エージェントが3体装備されていること
	equippedCount := 0
	for _, id := range saveData.Player.EquippedAgentIDs {
		if id != "" {
			equippedCount++
		}
	}
	if equippedCount != 3 {
		t.Errorf("初期エージェントが3体装備されているべきです: got %d", equippedCount)
	}

	// 装備されているエージェントIDがインベントリのエージェントと一致すること
	for _, equippedID := range saveData.Player.EquippedAgentIDs {
		if equippedID == "" {
			continue
		}
		found := false
		for _, a := range saveData.Inventory.AgentInstances {
			if a.ID == equippedID {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("装備エージェントID %s がインベントリ内のエージェントと一致するべきです", equippedID)
		}
	}
}

func TestNewGameInitializer_InitialStats(t *testing.T) {
	// 新規ゲーム開始時の統計情報がリセットされていること
	initializer := NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()

	if saveData.Statistics.TotalBattles != 0 {
		t.Error("総バトル数は0であるべきです")
	}
	if saveData.Statistics.Victories != 0 {
		t.Error("勝利数は0であるべきです")
	}
	if saveData.Statistics.MaxLevelReached != 0 {
		t.Error("到達最高レベルは0であるべきです")
	}
}

func TestNewGameInitializer_InitialAchievements(t *testing.T) {
	// 新規ゲーム開始時の実績がリセットされていること
	initializer := NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()

	if len(saveData.Achievements.Unlocked) != 0 {
		t.Error("解除済み実績は空であるべきです")
	}
}

func TestInitialAgent_ModulesCompatibleWithCore(t *testing.T) {
	// 初期エージェントのモジュールがコアと互換性があること
	initializer := NewNewGameInitializer(createTestExternalData())

	agents := initializer.CreateInitialAgents()

	for agentIdx, agent := range agents {
		for i, module := range agent.Modules {
			if !module.IsCompatibleWithCore(agent.Core) {
				t.Errorf("エージェント%dのモジュール%dはコアと互換性があるべきです", agentIdx+1, i)
			}
		}
	}
}

func TestNewGameInitializer_MultipleCalls(t *testing.T) {
	// 複数回呼び出しても毎回新しいセーブデータオブジェクトが作成されること
	initializer := NewNewGameInitializer(createTestExternalData())

	saveData1 := initializer.InitializeNewGame()
	saveData2 := initializer.InitializeNewGame()

	// 別のセーブデータオブジェクトが作成されていること
	if saveData1 == saveData2 {
		t.Error("異なる呼び出しで異なるセーブデータオブジェクトが作成されるべきです")
	}

	// 両方のセーブデータにエージェントが含まれていること
	if len(saveData1.Inventory.AgentInstances) == 0 {
		t.Error("saveData1にエージェントが含まれているべきです")
	}
	if len(saveData2.Inventory.AgentInstances) == 0 {
		t.Error("saveData2にエージェントが含まれているべきです")
	}

	// FirstAgentは固定IDを返すため、エージェントIDは同じ
	// （これは新しい設計の正しい動作）
}
