// Package reward はドメイン型を使用した報酬計算のテストを提供します。
package reward

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// TestRewardCalculator_WithDomainTypes はドメイン型を使用した報酬計算をテストします。
func TestRewardCalculator_WithDomainTypes(t *testing.T) {
	// ドメイン型でコア特性を定義
	coreTypes := []domain.CoreType{
		{
			ID:             "all_rounder",
			Name:           "オールラウンダー",
			StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
			PassiveSkillID: "balance_mastery",
			AllowedTags:    []string{"physical_low", "magic_low"},
			MinDropLevel:   1,
		},
		{
			ID:             "attacker",
			Name:           "攻撃バランス",
			StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.2, "SPD": 0.8, "LUK": 0.8},
			PassiveSkillID: "attack_boost",
			AllowedTags:    []string{"physical_low", "physical_mid"},
			MinDropLevel:   5,
		},
	}

	// ModuleDropInfoでモジュール定義を定義
	moduleDefs := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			BaseEffect:   10.0,
			StatRef:      "STR",
			Description:  "基本的な物理攻撃",
			MinDropLevel: 1,
		},
		{
			ID:           "magic_lv1",
			Name:         "魔法攻撃Lv1",
			Category:     domain.MagicAttack,
			Level:        1,
			Tags:         []string{"magic_low"},
			BaseEffect:   12.0,
			StatRef:      "MAG",
			Description:  "基本的な魔法攻撃",
			MinDropLevel: 1,
		},
	}

	passiveSkills := map[string]domain.PassiveSkill{
		"balance_mastery": {ID: "balance_mastery", Name: "バランス", Description: "バランスの取れた能力"},
		"attack_boost":    {ID: "attack_boost", Name: "攻撃強化", Description: "攻撃力が上昇"},
	}

	// ドメイン型を直接使用するRewardCalculatorを作成
	calc := NewRewardCalculatorWithDomainTypes(coreTypes, moduleDefs, passiveSkills)

	if calc == nil {
		t.Fatal("NewRewardCalculatorWithDomainTypes returned nil")
	}

	// 報酬計算をテスト
	stats := &BattleStatistics{
		TotalWPM:         100.0,
		TotalAccuracy:    95.0,
		TotalTypingCount: 10,
	}

	result := calc.CalculateRewards(true, stats, 1)
	if result == nil {
		t.Fatal("CalculateRewards returned nil")
	}

	if !result.IsVictory {
		t.Error("Expected victory")
	}
}

// TestRewardCalculator_GetEligibleCoreTypesWithDomain はドメイン型のコア特性フィルタリングをテストします。
func TestRewardCalculator_GetEligibleCoreTypesWithDomain(t *testing.T) {
	coreTypes := []domain.CoreType{
		{ID: "type1", Name: "タイプ1", MinDropLevel: 1},
		{ID: "type2", Name: "タイプ2", MinDropLevel: 5},
		{ID: "type3", Name: "タイプ3", MinDropLevel: 10},
	}

	calc := NewRewardCalculatorWithDomainTypes(coreTypes, nil, nil)

	// レベル1では1種類のみドロップ可能
	eligible := calc.GetEligibleDomainCoreTypes(1)
	if len(eligible) != 1 {
		t.Errorf("Expected 1 eligible core type at level 1, got %d", len(eligible))
	}

	// レベル5では2種類ドロップ可能
	eligible = calc.GetEligibleDomainCoreTypes(5)
	if len(eligible) != 2 {
		t.Errorf("Expected 2 eligible core types at level 5, got %d", len(eligible))
	}

	// レベル10では全種類ドロップ可能
	eligible = calc.GetEligibleDomainCoreTypes(10)
	if len(eligible) != 3 {
		t.Errorf("Expected 3 eligible core types at level 10, got %d", len(eligible))
	}
}

// TestRewardCalculator_GetEligibleModuleTypesWithDomain はドメイン型のモジュールフィルタリングをテストします。
func TestRewardCalculator_GetEligibleModuleTypesWithDomain(t *testing.T) {
	moduleDefs := []ModuleDropInfo{
		{ID: "mod1", Name: "モジュール1", MinDropLevel: 1},
		{ID: "mod2", Name: "モジュール2", MinDropLevel: 5},
		{ID: "mod3", Name: "モジュール3", MinDropLevel: 10},
	}

	calc := NewRewardCalculatorWithDomainTypes(nil, moduleDefs, nil)

	// レベル1では1種類のみドロップ可能
	eligible := calc.GetEligibleDomainModuleTypes(1)
	if len(eligible) != 1 {
		t.Errorf("Expected 1 eligible module type at level 1, got %d", len(eligible))
	}

	// レベル5では2種類ドロップ可能
	eligible = calc.GetEligibleDomainModuleTypes(5)
	if len(eligible) != 2 {
		t.Errorf("Expected 2 eligible module types at level 5, got %d", len(eligible))
	}
}
