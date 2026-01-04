// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// newTestDamageModule はテスト用ダメージモジュールを作成するヘルパー関数です。
func newTestDamageModule(id, name string, tags []string, statCoef float64, statRef, description string) *ModuleModel {
	return NewModuleFromType(ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⚔️",
		Tags:        tags,
		Description: description,
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "⚔️",
			},
		},
	}, nil)
}

// TestAgentModel_フィールドの確認 はAgentModel構造体のフィールドが正しく設定されることを確認します。
func TestAgentModel_フィールドの確認(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	passiveSkill := PassiveSkill{
		ID:          "balanced_stance",
		Name:        "バランススタンス",
		Description: "物理と魔法のダメージをバランスよく強化する",
	}

	core := NewCore("core_001", "バランスコア", 10, coreType, passiveSkill)

	modules := []*ModuleModel{
		newTestDamageModule("mod_001", "物理打撃Lv1", []string{"physical_low"}, 1.0, "STR", "物理攻撃"),
		newTestDamageModule("mod_002", "ファイアボールLv1", []string{"magic_low"}, 1.0, "MAG", "魔法攻撃"),
		newTestDamageModule("mod_003", "物理打撃Lv1", []string{"physical_low"}, 1.0, "STR", "物理攻撃"),
		newTestDamageModule("mod_004", "ファイアボールLv1", []string{"magic_low"}, 1.0, "MAG", "魔法攻撃"),
	}

	agent := AgentModel{
		ID:        "agent_001",
		Core:      core,
		Modules:   modules,
		Level:     core.Level, // エージェントレベル = コアレベル
		BaseStats: core.Stats, // 基礎ステータス = コアのステータス
	}

	if agent.ID != "agent_001" {
		t.Errorf("IDが期待値と異なります: got %s, want agent_001", agent.ID)
	}
	if agent.Core.ID != "core_001" {
		t.Errorf("Core.IDが期待値と異なります: got %s, want core_001", agent.Core.ID)
	}
	if len(agent.Modules) != 4 {
		t.Errorf("Modulesの長さが期待値と異なります: got %d, want 4", len(agent.Modules))
	}
	if agent.Level != 10 {
		t.Errorf("Levelが期待値と異なります: got %d, want 10", agent.Level)
	}
	if agent.BaseStats.STR != 120 {
		t.Errorf("BaseStats.STRが期待値と異なります: got %d, want 120", agent.BaseStats.STR)
	}
}

// TestAgentModel_レベル等価制約 はエージェントのレベルがコアのレベルと一致することを確認します。

func TestAgentModel_レベル等価制約(t *testing.T) {
	tests := []struct {
		name      string
		coreLevel int
	}{
		{"レベル1のコア", 1},
		{"レベル10のコア", 10},
		{"レベル50のコア", 50},
		{"レベル100のコア", 100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			coreType := CoreType{
				ID:          "test",
				StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
				AllowedTags: []string{"physical_low"},
			}
			passiveSkill := PassiveSkill{ID: "test_skill"}
			core := NewCore("core_test", "テストコア", tt.coreLevel, coreType, passiveSkill)

			modules := []*ModuleModel{
				newTestDamageModule("mod_001", "テストモジュール1", []string{"physical_low"}, 1.0, "STR", "テスト"),
				newTestDamageModule("mod_002", "テストモジュール2", []string{"physical_low"}, 1.0, "STR", "テスト"),
				newTestDamageModule("mod_003", "テストモジュール3", []string{"physical_low"}, 1.0, "STR", "テスト"),
				newTestDamageModule("mod_004", "テストモジュール4", []string{"physical_low"}, 1.0, "STR", "テスト"),
			}

			agent := NewAgent("agent_test", core, modules)

			if agent.Level != tt.coreLevel {
				t.Errorf("エージェントのレベルがコアのレベルと一致しません: got %d, want %d", agent.Level, tt.coreLevel)
			}
		})
	}
}

// TestNewAgent_エージェント作成 はNewAgent関数でエージェントが正しく作成されることを確認します。
func TestNewAgent_エージェント作成(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	passiveSkill := PassiveSkill{
		ID:          "balanced_stance",
		Name:        "バランススタンス",
		Description: "物理と魔法のダメージをバランスよく強化する",
	}

	core := NewCore("core_001", "バランスコア", 10, coreType, passiveSkill)

	modules := []*ModuleModel{
		newTestDamageModule("mod_001", "物理打撃Lv1", []string{"physical_low"}, 1.0, "STR", "物理攻撃"),
		newTestDamageModule("mod_002", "ファイアボールLv1", []string{"magic_low"}, 1.0, "MAG", "魔法攻撃"),
		newTestDamageModule("mod_003", "物理打撃Lv1", []string{"physical_low"}, 1.0, "STR", "物理攻撃"),
		newTestDamageModule("mod_004", "ファイアボールLv1", []string{"magic_low"}, 1.0, "MAG", "魔法攻撃"),
	}

	agent := NewAgent("agent_001", core, modules)

	if agent.ID != "agent_001" {
		t.Errorf("IDが期待値と異なります: got %s, want agent_001", agent.ID)
	}
	if agent.Level != 10 {
		t.Errorf("Levelが期待値と異なります（コアレベルと同じはず）: got %d, want 10", agent.Level)
	}
	// 基礎ステータスはコアから導出される
	// STR: 10 × 10 × 1.2 = 120
	if agent.BaseStats.STR != 120 {
		t.Errorf("BaseStats.STRが期待値と異なります: got %d, want 120", agent.BaseStats.STR)
	}
}

// TestNewAgent_モジュール数制約 はNewAgent関数がモジュール数を検証することを確認します。
// エージェントは必ず4個のモジュールを装備する必要があります
func TestNewAgent_モジュール数確認(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := PassiveSkill{ID: "test_skill"}
	core := NewCore("core_test", "テストコア", 5, coreType, passiveSkill)

	modules := []*ModuleModel{
		newTestDamageModule("mod_001", "テストモジュール1", []string{"physical_low"}, 1.0, "STR", "テスト"),
		newTestDamageModule("mod_002", "テストモジュール2", []string{"physical_low"}, 1.0, "STR", "テスト"),
		newTestDamageModule("mod_003", "テストモジュール3", []string{"physical_low"}, 1.0, "STR", "テスト"),
		newTestDamageModule("mod_004", "テストモジュール4", []string{"physical_low"}, 1.0, "STR", "テスト"),
	}

	agent := NewAgent("agent_test", core, modules)

	// 4個のモジュールが装備されていることを確認
	if len(agent.Modules) != 4 {
		t.Errorf("Modulesの長さが4でありません: got %d, want 4", len(agent.Modules))
	}
}

// TestAgentModel_基礎ステータス算出 は基礎ステータスがコアから正しく導出されることを確認します。

func TestAgentModel_基礎ステータス算出(t *testing.T) {
	tests := []struct {
		name        string
		coreType    CoreType
		coreLevel   int
		expectedSTR int
		expectedINT int
		expectedWIL int
		expectedLUK int
	}{
		{
			name: "攻撃バランス型",
			coreType: CoreType{
				ID:          "attack_balance",
				StatWeights: map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
				AllowedTags: []string{"physical_low"},
			},
			coreLevel:   10,
			expectedSTR: 120, // 10 × 10 × 1.2
			expectedINT: 100, // 10 × 10 × 1.0
			expectedWIL: 80,  // 10 × 10 × 0.8
			expectedLUK: 10,  // 10 × 1.0 (LUKはレベルに依存しない)
		},
		{
			name: "ヒーラー型",
			coreType: CoreType{
				ID:          "healer",
				StatWeights: map[string]float64{"STR": 0.5, "INT": 1.5, "WIL": 0.8, "LUK": 1.2},
				AllowedTags: []string{"heal_low"},
			},
			coreLevel:   10,
			expectedSTR: 50,  // 10 × 10 × 0.5
			expectedINT: 150, // 10 × 10 × 1.5
			expectedWIL: 80,  // 10 × 10 × 0.8
			expectedLUK: 12,  // 10 × 1.2 (LUKはレベルに依存しない)
		},
		{
			name: "オールラウンダー型",
			coreType: CoreType{
				ID:          "all_rounder",
				StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
				AllowedTags: []string{"physical_low"},
			},
			coreLevel:   5,
			expectedSTR: 50, // 10 × 5 × 1.0
			expectedINT: 50, // 10 × 5 × 1.0
			expectedWIL: 50, // 10 × 5 × 1.0
			expectedLUK: 10, // 10 × 1.0 (LUKはレベルに依存しない)
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			passiveSkill := PassiveSkill{ID: "test_skill"}
			core := NewCore("core_test", "テストコア", tt.coreLevel, tt.coreType, passiveSkill)

			modules := make([]*ModuleModel, 4)
			for i := 0; i < 4; i++ {
				modules[i] = newTestDamageModule("mod", "テスト", []string{"physical_low"}, 1.0, "STR", "テスト")
			}

			agent := NewAgent("agent_test", core, modules)

			if agent.BaseStats.STR != tt.expectedSTR {
				t.Errorf("BaseStats.STRが期待値と異なります: got %d, want %d", agent.BaseStats.STR, tt.expectedSTR)
			}
			if agent.BaseStats.INT != tt.expectedINT {
				t.Errorf("BaseStats.INTが期待値と異なります: got %d, want %d", agent.BaseStats.INT, tt.expectedINT)
			}
			if agent.BaseStats.WIL != tt.expectedWIL {
				t.Errorf("BaseStats.WILが期待値と異なります: got %d, want %d", agent.BaseStats.WIL, tt.expectedWIL)
			}
			if agent.BaseStats.LUK != tt.expectedLUK {
				t.Errorf("BaseStats.LUKが期待値と異なります: got %d, want %d", agent.BaseStats.LUK, tt.expectedLUK)
			}
		})
	}
}

// TestAgentModel_Modules はエージェントから指定インデックスのモジュールを直接取得できることを確認します。
func TestAgentModel_Modules(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := PassiveSkill{ID: "test_skill"}
	core := NewCore("core_test", "テストコア", 5, coreType, passiveSkill)

	modules := []*ModuleModel{
		newTestDamageModule("mod_001", "モジュール1", []string{"physical_low"}, 1.0, "STR", "テスト"),
		newTestDamageModule("mod_002", "モジュール2", []string{"physical_low"}, 1.5, "STR", "テスト"),
		newTestDamageModule("mod_003", "モジュール3", []string{"physical_low"}, 2.0, "STR", "テスト"),
		newTestDamageModule("mod_004", "モジュール4", []string{"physical_low"}, 2.5, "STR", "テスト"),
	}

	agent := NewAgent("agent_test", core, modules)

	// 正常系: 各インデックスのモジュールを取得（直接アクセス）
	for i := 0; i < 4; i++ {
		module := agent.Modules[i]
		if module == nil {
			t.Errorf("インデックス%dのモジュールがnilです", i)
			continue
		}
		if module.TypeID != modules[i].TypeID {
			t.Errorf("インデックス%dのモジュールTypeIDが異なります: got %s, want %s", i, module.TypeID, modules[i].TypeID)
		}
	}

	// モジュール数の確認
	if len(agent.Modules) != 4 {
		t.Errorf("モジュール数が4でありません: got %d, want 4", len(agent.Modules))
	}
}

// TestAgentModel_モジュールの独立性 はNewAgentで作成したエージェントのModulesが元のスライスと独立していることを確認します。
func TestAgentModel_モジュールの独立性(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := PassiveSkill{ID: "test_skill"}
	core := NewCore("core_test", "テストコア", 5, coreType, passiveSkill)

	originalModules := []*ModuleModel{
		newTestDamageModule("mod_001", "モジュール1", []string{"physical_low"}, 1.0, "STR", "テスト"),
		newTestDamageModule("mod_002", "モジュール2", []string{"physical_low"}, 1.5, "STR", "テスト"),
		newTestDamageModule("mod_003", "モジュール3", []string{"physical_low"}, 2.0, "STR", "テスト"),
		newTestDamageModule("mod_004", "モジュール4", []string{"physical_low"}, 2.5, "STR", "テスト"),
	}

	agent := NewAgent("agent_test", core, originalModules)

	// 元のスライスを変更
	originalModules[0] = newTestDamageModule("mod_changed", "変更済み", []string{"physical_low"}, 9.9, "STR", "変更")

	// エージェントのモジュールは影響を受けないはず
	if agent.Modules[0].TypeID == "mod_changed" {
		t.Error("AgentModelのModulesが元のスライスの変更の影響を受けています")
	}
}
