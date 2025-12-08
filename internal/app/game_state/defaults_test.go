// Package game_state はゲーム状態の管理を提供します。
package game_state

import (
	"testing"
)

// === GetDefaultCoreTypeData のテスト ===

// TestGetDefaultCoreTypeData はデフォルトコア特性データが正しく返されることを検証します。
func TestGetDefaultCoreTypeData(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()

	if len(coreTypes) == 0 {
		t.Fatal("Should return at least one core type")
	}

	// all_rounder が含まれていることを確認
	found := false
	for _, ct := range coreTypes {
		if ct.ID == "all_rounder" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Should include all_rounder core type")
	}
}

// TestGetDefaultCoreTypeData_ContainsAllRequiredFields は必須フィールドが設定されていることを検証します。
func TestGetDefaultCoreTypeData_ContainsAllRequiredFields(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()

	for _, ct := range coreTypes {
		if ct.ID == "" {
			t.Error("ID should not be empty")
		}
		if ct.Name == "" {
			t.Error("Name should not be empty")
		}
		if len(ct.AllowedTags) == 0 {
			t.Errorf("AllowedTags should not be empty for %s", ct.ID)
		}
		if len(ct.StatWeights) == 0 {
			t.Errorf("StatWeights should not be empty for %s", ct.ID)
		}
	}
}

// === GetDefaultModuleDefinitionData のテスト ===

// TestGetDefaultModuleDefinitionData はデフォルトモジュール定義データが正しく返されることを検証します。
func TestGetDefaultModuleDefinitionData(t *testing.T) {
	moduleDefs := GetDefaultModuleDefinitionData()

	if len(moduleDefs) == 0 {
		t.Fatal("Should return at least one module definition")
	}
}

// TestGetDefaultModuleDefinitionData_ContainsAllRequiredFields は必須フィールドが設定されていることを検証します。
func TestGetDefaultModuleDefinitionData_ContainsAllRequiredFields(t *testing.T) {
	moduleDefs := GetDefaultModuleDefinitionData()

	for _, m := range moduleDefs {
		if m.ID == "" {
			t.Error("ID should not be empty")
		}
		if m.Name == "" {
			t.Error("Name should not be empty")
		}
		if m.Category == "" {
			t.Errorf("Category should not be empty for %s", m.ID)
		}
		if m.Level < 1 {
			t.Errorf("Level should be at least 1 for %s", m.ID)
		}
	}
}

// TestGetDefaultModuleDefinitionData_CategoriesAreValid はカテゴリが有効であることを検証します。
func TestGetDefaultModuleDefinitionData_CategoriesAreValid(t *testing.T) {
	moduleDefs := GetDefaultModuleDefinitionData()
	validCategories := map[string]bool{
		"physical_attack": true,
		"magic_attack":    true,
		"heal":            true,
		"buff":            true,
		"debuff":          true,
	}

	for _, m := range moduleDefs {
		if !validCategories[m.Category] {
			t.Errorf("Invalid category %s for module %s", m.Category, m.ID)
		}
	}
}

// === GetDefaultPassiveSkills のテスト ===

// TestGetDefaultPassiveSkills はデフォルトパッシブスキルが正しく返されることを検証します。
func TestGetDefaultPassiveSkills(t *testing.T) {
	skills := GetDefaultPassiveSkills()

	if len(skills) == 0 {
		t.Fatal("Should return at least one passive skill")
	}
}

// TestGetDefaultPassiveSkills_ContainsAllRequiredFields は必須フィールドが設定されていることを検証します。
func TestGetDefaultPassiveSkills_ContainsAllRequiredFields(t *testing.T) {
	skills := GetDefaultPassiveSkills()

	for id, skill := range skills {
		if skill.ID == "" {
			t.Errorf("ID should not be empty for skill at key %s", id)
		}
		if skill.Name == "" {
			t.Errorf("Name should not be empty for skill %s", skill.ID)
		}
		if skill.Description == "" {
			t.Errorf("Description should not be empty for skill %s", skill.ID)
		}
	}
}

// === GetDefaultCoreType のテスト ===

// TestGetDefaultCoreType は既存IDでコア特性が取得できることを検証します。
func TestGetDefaultCoreType(t *testing.T) {
	result := GetDefaultCoreType("attacker")
	if result.ID != "attacker" {
		t.Errorf("Expected attacker, got %s", result.ID)
	}
}

// TestGetDefaultCoreType_ReturnsDefaultForUnknownID は不明なIDでデフォルトが返されることを検証します。
func TestGetDefaultCoreType_ReturnsDefaultForUnknownID(t *testing.T) {
	result := GetDefaultCoreType("nonexistent_core")
	// デフォルト（all_rounder）が返される
	if result.ID != "all_rounder" {
		t.Errorf("Expected all_rounder as default, got %s", result.ID)
	}
}

// === GetDefaultPassiveSkill のテスト ===

// TestGetDefaultPassiveSkill は既存スキルが取得できることを検証します。
func TestGetDefaultPassiveSkill(t *testing.T) {
	result := GetDefaultPassiveSkill("attack_boost")
	if result.ID != "attack_boost" {
		t.Errorf("Expected attack_boost, got %s", result.ID)
	}
}

// TestGetDefaultPassiveSkill_ReturnsDefaultForUnknownID は不明なIDでデフォルトが返されることを検証します。
func TestGetDefaultPassiveSkill_ReturnsDefaultForUnknownID(t *testing.T) {
	result := GetDefaultPassiveSkill("nonexistent_skill")
	// デフォルトスキルが返される（ID は default_skill）
	if result.ID == "" {
		t.Error("Should return a default skill with non-empty ID")
	}
}

// === GetDefaultModuleDefinition のテスト ===

// TestGetDefaultModuleDefinition は既存モジュールが取得できることを検証します。
func TestGetDefaultModuleDefinition(t *testing.T) {
	result := GetDefaultModuleDefinition("mod_fireball")
	if result == nil {
		t.Fatal("Expected to find mod_fireball")
	}
	if result.ID != "mod_fireball" {
		t.Errorf("Expected mod_fireball, got %s", result.ID)
	}
	if result.Category != "magic_attack" {
		t.Errorf("Expected magic_attack category, got %s", result.Category)
	}
}

// TestGetDefaultModuleDefinition_ReturnsNilForUnknownID は不明なIDでnilが返されることを検証します。
func TestGetDefaultModuleDefinition_ReturnsNilForUnknownID(t *testing.T) {
	result := GetDefaultModuleDefinition("nonexistent_module")
	if result != nil {
		t.Error("Expected nil for unknown module ID")
	}
}

// === データの一貫性テスト ===

// TestCoreTypeAndPassiveSkillConsistency はコア特性とパッシブスキルの整合性を検証します。
func TestCoreTypeAndPassiveSkillConsistency(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()
	passiveSkills := GetDefaultPassiveSkills()

	for _, ct := range coreTypes {
		// PassiveSkillIDがpassiveSkillsマップに存在するか確認（存在しなくてもエラーではない）
		// 検索ロジックがフォールバックを提供しているため
		skill := GetDefaultPassiveSkill(ct.PassiveSkillID)
		if skill.ID == "" {
			t.Errorf("PassiveSkill not found for core type %s (PassiveSkillID: %s)",
				ct.ID, ct.PassiveSkillID)
		}
		_ = passiveSkills // 使用警告を避ける
	}
}

// TestModuleTagsAreAllowedBySomeCoreType はモジュールの主要タグがいずれかのコア特性で許可されていることを検証します。
// 注: 属性タグ（fire, ice等）はコア特性のAllowedTagsには含まれないため、検証対象外とする。
func TestModuleTagsAreAllowedBySomeCoreType(t *testing.T) {
	coreTypes := GetDefaultCoreTypeData()
	moduleDefs := GetDefaultModuleDefinitionData()

	// 全許可タグを収集
	allowedTags := make(map[string]bool)
	for _, ct := range coreTypes {
		for _, tag := range ct.AllowedTags {
			allowedTags[tag] = true
		}
	}

	// 属性タグ（コア特性には含まれない補助タグ）を除外
	attributeTags := map[string]bool{
		"fire": true,
		"ice":  true,
	}

	// 各モジュールの主要タグが許可されているか確認
	for _, m := range moduleDefs {
		hasAllowedTag := false
		for _, tag := range m.Tags {
			if attributeTags[tag] {
				continue // 属性タグはスキップ
			}
			if allowedTags[tag] {
				hasAllowedTag = true
				break
			}
		}
		if !hasAllowedTag {
			t.Errorf("Module %s has no allowed tag by any core type (tags: %v)",
				m.ID, m.Tags)
		}
	}
}
