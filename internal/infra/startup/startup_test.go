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
				ID:            "physical_strike_lv1",
				Name:          "物理打撃Lv1",
				Category:      "physical_attack",
				Tags:          []string{"physical_low"},
				BaseEffect:    10.0,
				StatReference: "STR",
				Description:   "物理ダメージを与える基本攻撃",
			},
			{
				ID:            "fireball_lv1",
				Name:          "ファイアボールLv1",
				Category:      "magic_attack",
				Tags:          []string{"magic_low"},
				BaseEffect:    12.0,
				StatReference: "MAG",
				Description:   "魔法ダメージを与える基本魔法",
			},
			{
				ID:            "heal_lv1",
				Name:          "ヒールLv1",
				Category:      "heal",
				Tags:          []string{"heal_low"},
				BaseEffect:    8.0,
				StatReference: "MAG",
				Description:   "HPを回復する基本回復魔法",
			},
			{
				ID:            "attack_buff_lv1",
				Name:          "攻撃バフLv1",
				Category:      "buff",
				Tags:          []string{"buff_low"},
				BaseEffect:    5.0,
				StatReference: "SPD",
				Description:   "一時的に攻撃力を上昇させる",
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
		FirstAgent: &masterdata.FirstAgentData{
			ID:         "agent_first",
			CoreTypeID: "all_rounder",
			CoreLevel:  1,
			Modules: []masterdata.FirstAgentModuleData{
				{TypeID: "physical_strike_lv1", ChainEffectType: "damage_amp", ChainEffectValue: 1.2},
				{TypeID: "fireball_lv1"},
				{TypeID: "heal_lv1"},
				{TypeID: "attack_buff_lv1"},
			},
		},
	}
}

// ==================================================
// Task 14.1: 新規ゲーム初期化テスト
// ==================================================

func TestNewGameInitializer_CreateInitialAgent(t *testing.T) {
	initializer := NewNewGameInitializer(createTestExternalData())

	agent := initializer.CreateInitialAgent()
	if agent == nil {
		t.Fatal("初期エージェントが作成されるべきです")
	}

	// エージェントがコアを持つこと
	if agent.Core == nil {
		t.Error("初期エージェントはコアを持つべきです")
	}

	// エージェントが4つのモジュールを持つこと
	if len(agent.Modules) != 4 {
		t.Errorf("初期エージェントは4つのモジュールを持つべきです: got %d", len(agent.Modules))
	}

	// エージェントレベルがコアレベルと一致すること
	if agent.Level != agent.Core.Level {
		t.Error("エージェントレベルはコアレベルと一致するべきです")
	}

	// オールラウンダー特性であること（FirstAgentから作成）
	if agent.Core.Type.ID != "all_rounder" {
		t.Errorf("初期コアはオールラウンダー特性であるべきです: got %s", agent.Core.Type.ID)
	}
}

func TestNewGameInitializer_InitializeNewGame(t *testing.T) {

	initializer := NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()
	if saveData == nil {
		t.Fatal("新規ゲームデータが作成されるべきです")
	}

	// インベントリに初期コアが含まれている（エージェント合成で消費されるため0）
	// 初期エージェントが作成されていること（ID化された構造）
	if len(saveData.Inventory.AgentInstances) != 1 {
		t.Errorf("初期エージェントが1体存在するべきです: got %d", len(saveData.Inventory.AgentInstances))
	}

	// 初期エージェントが装備されていること（スロット0に装備）
	equippedCount := 0
	for _, id := range saveData.Player.EquippedAgentIDs {
		if id != "" {
			equippedCount++
		}
	}
	if equippedCount != 1 {
		t.Errorf("初期エージェントが1体装備されているべきです: got %d", equippedCount)
	}

	// 装備されているエージェントIDがインベントリのエージェントと一致すること
	equippedID := saveData.Player.EquippedAgentIDs[0]
	found := false
	for _, a := range saveData.Inventory.AgentInstances {
		if a.ID == equippedID {
			found = true
			break
		}
	}
	if !found {
		t.Error("装備エージェントIDがインベントリ内のエージェントと一致するべきです")
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

	agent := initializer.CreateInitialAgent()

	for i, module := range agent.Modules {
		if !module.IsCompatibleWithCore(agent.Core) {
			t.Errorf("モジュール%dはコアと互換性があるべきです", i)
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
