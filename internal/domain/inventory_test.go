// Package inventory はインベントリ管理機能を提供します。
// コア、モジュール、エージェントの保管と管理を担当します。

package domain

import (
	"testing"
)

// newTestDamageModuleForInv はテスト用ダメージモジュールを作成するヘルパー関数です。
func newTestDamageModuleForInv(id, name string, tags []string, statCoef float64, statRef, description string) *ModuleModel {
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

// newTestHealModuleForInv はテスト用回復モジュールを作成するヘルパー関数です。
func newTestHealModuleForInv(id, name string, tags []string, statCoef float64, statRef, description string) *ModuleModel {
	return NewModuleFromType(ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "💚",
		Tags:        tags,
		Description: description,
		Effects: []ModuleEffect{
			{
				Target:      TargetSelf,
				HPFormula:   &HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "💚",
			},
		},
	}, nil)
}

// newTestBuffModuleForInv はテスト用バフモジュールを作成するヘルパー関数です。
func newTestBuffModuleForInv(id, name string, tags []string, description string) *ModuleModel {
	return NewModuleFromType(ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⬆️",
		Tags:        tags,
		Description: description,
		Effects: []ModuleEffect{
			{
				Target: TargetSelf,
				ColumnSpec: &EffectColumnSpec{
					Column:   ColDamageBonus,
					Value:    10.0,
					Duration: 10.0,
				},
				Probability: 1.0,
				Icon:        "⬆️",
			},
		},
	}, nil)
}

// ==================== コアインベントリテスト ====================

// TestCoreInventory_Add はコアの追加処理をテストします。

func TestCoreInventory_Add(t *testing.T) {
	inv := NewCoreInventory(10)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance", Name: "バランス構え"}
	core := NewCore("core_001", "攻撃バランスコア", 5, coreType, passiveSkill)

	err := inv.Add(core)
	if err != nil {
		t.Errorf("コアの追加に失敗: %v", err)
	}

	if inv.Count() != 1 {
		t.Errorf("期待されるコア数: 1, 実際: %d", inv.Count())
	}
}

// TestCoreInventory_AddOverCapacity はインベントリ上限チェックをテストします。

func TestCoreInventory_AddOverCapacity(t *testing.T) {
	inv := NewCoreInventory(1)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance", Name: "バランス構え"}

	core1 := NewCore("core_001", "攻撃バランスコア1", 5, coreType, passiveSkill)
	core2 := NewCore("core_002", "攻撃バランスコア2", 5, coreType, passiveSkill)

	err := inv.Add(core1)
	if err != nil {
		t.Errorf("1つ目のコア追加に失敗: %v", err)
	}

	err = inv.Add(core2)
	if err == nil {
		t.Error("上限を超えたコア追加がエラーにならなかった")
	}
}

// TestCoreInventory_Remove はコアの削除処理をテストします。

func TestCoreInventory_Remove(t *testing.T) {
	inv := NewCoreInventory(10)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance", Name: "バランス構え"}
	core := NewCore("core_001", "攻撃バランスコア", 5, coreType, passiveSkill)

	inv.Add(core)
	removed := inv.Remove("core_001")

	if removed == nil {
		t.Error("コアの削除に失敗")
	}
	if inv.Count() != 0 {
		t.Errorf("削除後のコア数: 期待 0, 実際 %d", inv.Count())
	}
}

// TestCoreInventory_List はコア一覧表示機能をテストします。

func TestCoreInventory_List(t *testing.T) {
	inv := NewCoreInventory(10)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance", Name: "バランス構え"}

	core1 := NewCore("core_001", "コア1", 5, coreType, passiveSkill)
	core2 := NewCore("core_002", "コア2", 10, coreType, passiveSkill)

	inv.Add(core1)
	inv.Add(core2)

	list := inv.List()
	if len(list) != 2 {
		t.Errorf("期待されるコア数: 2, 実際: %d", len(list))
	}
}

// TestCoreInventory_FilterByType は特性によるフィルタリングをテストします。

func TestCoreInventory_FilterByType(t *testing.T) {
	inv := NewCoreInventory(10)
	attackType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	healerType := CoreType{
		ID:          "healer",
		Name:        "ヒーラー",
		StatWeights: map[string]float64{"STR": 0.5, "MAG": 1.5, "SPD": 0.8, "LUK": 1.2},
		AllowedTags: []string{"heal_low", "heal_mid"},
	}
	passiveSkill := PassiveSkill{ID: "test", Name: "テスト"}

	inv.Add(NewCore("core_001", "攻撃コア", 5, attackType, passiveSkill))
	inv.Add(NewCore("core_002", "ヒーラーコア", 5, healerType, passiveSkill))

	filtered := inv.FilterByType("attack_balance")
	if len(filtered) != 1 {
		t.Errorf("フィルタ後のコア数: 期待 1, 実際 %d", len(filtered))
	}
	if filtered[0].Type.ID != "attack_balance" {
		t.Error("フィルタされたコアの特性が正しくない")
	}
}

// TestCoreInventory_FilterByLevel はレベルによるフィルタリングをテストします。

func TestCoreInventory_FilterByLevel(t *testing.T) {
	inv := NewCoreInventory(10)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "test", Name: "テスト"}

	inv.Add(NewCore("core_001", "コア1", 5, coreType, passiveSkill))
	inv.Add(NewCore("core_002", "コア2", 10, coreType, passiveSkill))
	inv.Add(NewCore("core_003", "コア3", 15, coreType, passiveSkill))

	filtered := inv.FilterByLevelRange(5, 10)
	if len(filtered) != 2 {
		t.Errorf("フィルタ後のコア数: 期待 2, 実際 %d", len(filtered))
	}
}

// TestCoreInventory_SortByLevel はレベルによるソートをテストします。

func TestCoreInventory_SortByLevel(t *testing.T) {
	inv := NewCoreInventory(10)
	coreType := CoreType{
		ID:          "attack_balance",
		Name:        "攻撃バランス",
		StatWeights: map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "test", Name: "テスト"}

	inv.Add(NewCore("core_001", "コア1", 10, coreType, passiveSkill))
	inv.Add(NewCore("core_002", "コア2", 5, coreType, passiveSkill))
	inv.Add(NewCore("core_003", "コア3", 15, coreType, passiveSkill))

	sorted := inv.SortByLevel(true) // 昇順
	if sorted[0].Level != 5 || sorted[1].Level != 10 || sorted[2].Level != 15 {
		t.Error("レベル昇順ソートが正しくない")
	}

	sortedDesc := inv.SortByLevel(false) // 降順
	if sortedDesc[0].Level != 15 || sortedDesc[1].Level != 10 || sortedDesc[2].Level != 5 {
		t.Error("レベル降順ソートが正しくない")
	}
}

// ==================== モジュールインベントリテスト ====================

// TestModuleInventory_Add はモジュールの追加処理をテストします。

func TestModuleInventory_Add(t *testing.T) {
	inv := NewModuleInventory(20)
	module := newTestDamageModuleForInv(
		"module_001", "物理打撃Lv1",
		[]string{"physical_low"}, 1.0, "STR", "基本的な物理攻撃",
	)

	err := inv.Add(module)
	if err != nil {
		t.Errorf("モジュールの追加に失敗: %v", err)
	}

	if inv.Count() != 1 {
		t.Errorf("期待されるモジュール数: 1, 実際: %d", inv.Count())
	}
}

// TestModuleInventory_AddOverCapacity はモジュールインベントリ上限チェックをテストします。
func TestModuleInventory_AddOverCapacity(t *testing.T) {
	inv := NewModuleInventory(1)
	module1 := newTestDamageModuleForInv("module_001", "モジュール1", []string{"physical_low"}, 1.0, "STR", "説明")
	module2 := newTestDamageModuleForInv("module_002", "モジュール2", []string{"physical_low"}, 1.0, "STR", "説明")

	inv.Add(module1)
	err := inv.Add(module2)
	if err == nil {
		t.Error("上限を超えたモジュール追加がエラーにならなかった")
	}
}

// TestModuleInventory_Remove はモジュールの削除処理をテストします。

func TestModuleInventory_Remove(t *testing.T) {
	inv := NewModuleInventory(20)
	module := newTestDamageModuleForInv("module_001", "物理打撃Lv1", []string{"physical_low"}, 1.0, "STR", "説明")

	inv.Add(module)
	removed := inv.RemoveByTypeID("module_001")

	if removed == nil {
		t.Error("モジュールの削除に失敗")
	}
	if inv.Count() != 0 {
		t.Errorf("削除後のモジュール数: 期待 0, 実際 %d", inv.Count())
	}
}

// TestModuleInventory_FilterByDamageEffect はダメージ効果によるフィルタリングをテストします。
func TestModuleInventory_FilterByDamageEffect(t *testing.T) {
	inv := NewModuleInventory(20)
	inv.Add(newTestDamageModuleForInv("m1", "物理打撃", []string{"physical_low"}, 1.0, "STR", ""))
	inv.Add(newTestDamageModuleForInv("m2", "ファイアボール", []string{"magic_low"}, 1.2, "MAG", ""))
	inv.Add(newTestHealModuleForInv("m3", "ヒール", []string{"heal_low"}, 0.8, "MAG", ""))

	filtered := inv.FilterByDamageEffect()
	if len(filtered) != 2 {
		t.Errorf("フィルタ後のモジュール数: 期待 2, 実際 %d", len(filtered))
	}
}

// ==================== エージェントインベントリテスト ====================

// TestAgentInventory_Add はエージェントの追加処理をテストします。
func TestAgentInventory_Add(t *testing.T) {
	inv := NewAgentInventory(20)
	coreType := CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
	}
	passiveSkill := PassiveSkill{ID: "adaptability", Name: "適応力"}
	core := NewCore("core_001", "オールラウンダーコア", 5, coreType, passiveSkill)

	modules := []*ModuleModel{
		newTestDamageModuleForInv("m1", "物理打撃", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModuleForInv("m2", "ファイアボール", []string{"magic_low"}, 1.2, "MAG", ""),
		newTestHealModuleForInv("m3", "ヒール", []string{"heal_low"}, 0.8, "MAG", ""),
		newTestBuffModuleForInv("m4", "攻撃バフ", []string{"buff_low"}, ""),
	}

	agent := NewAgent("agent_001", core, modules)
	err := inv.Add(agent)

	if err != nil {
		t.Errorf("エージェントの追加に失敗: %v", err)
	}
	if inv.Count() != 1 {
		t.Errorf("期待されるエージェント数: 1, 実際: %d", inv.Count())
	}
}

// TestAgentInventory_AddOverCapacity はエージェント保有上限チェックをテストします。

func TestAgentInventory_AddOverCapacity(t *testing.T) {
	inv := NewAgentInventory(1) // テスト用に上限1
	coreType := CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	passiveSkill := PassiveSkill{ID: "test", Name: "テスト"}
	core := NewCore("core_001", "コア", 5, coreType, passiveSkill)
	modules := []*ModuleModel{
		newTestDamageModuleForInv("m1", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModuleForInv("m2", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModuleForInv("m3", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
		newTestDamageModuleForInv("m4", "モジュール", []string{"physical_low"}, 1.0, "STR", ""),
	}

	agent1 := NewAgent("agent_001", core, modules)
	agent2 := NewAgent("agent_002", core, modules)

	inv.Add(agent1)
	err := inv.Add(agent2)
	if err == nil {
		t.Error("上限を超えたエージェント追加がエラーにならなかった")
	}
}
