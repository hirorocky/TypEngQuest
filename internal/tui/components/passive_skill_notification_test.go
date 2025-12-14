// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"strings"
	"testing"

	"hirorocky/type-battle/internal/domain"
)

func createTestPassiveSkill() domain.PassiveSkill {
	return domain.PassiveSkill{
		ID:          "test_passive",
		Name:        "テストスキル",
		Description: "テスト効果を付与する",
		BaseModifiers: domain.StatModifiers{
			STR_Mult:        1.1,
			DamageReduction: 0.1,
		},
		ScalePerLevel: 0.1,
	}
}

func TestPassiveSkillNotification_NewPassiveSkillNotification(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	if notification == nil {
		t.Fatal("NewPassiveSkillNotification should return non-nil")
	}
}

func TestPassiveSkillNotification_NewPassiveSkillNotificationWithNil(t *testing.T) {
	notification := NewPassiveSkillNotification(nil, 5)

	if notification == nil {
		t.Fatal("NewPassiveSkillNotification should return non-nil even for nil skill")
	}
}

func TestPassiveSkillNotification_GetName(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	name := notification.GetName()
	if name != "テストスキル" {
		t.Errorf("GetName() = %v, want テストスキル", name)
	}
}

func TestPassiveSkillNotification_GetNameWithNil(t *testing.T) {
	notification := NewPassiveSkillNotification(nil, 5)

	name := notification.GetName()
	if name != "" {
		t.Errorf("GetName() for nil skill = %v, want empty string", name)
	}
}

func TestPassiveSkillNotification_GetDescription(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	desc := notification.GetDescription()
	if desc != "テスト効果を付与する" {
		t.Errorf("GetDescription() = %v, want テスト効果を付与する", desc)
	}
}

func TestPassiveSkillNotification_GetEffectModifiers(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	modifiers := notification.GetEffectModifiers()

	// レベル5なので: 1.0 + (1.1-1.0) * (1 + 0.1 * (5-1)) = 1.0 + 0.1 * 1.4 = 1.14
	expectedSTRMult := 1.14
	if modifiers.STR_Mult < expectedSTRMult-0.01 || modifiers.STR_Mult > expectedSTRMult+0.01 {
		t.Errorf("GetEffectModifiers().STR_Mult = %v, want approximately %v", modifiers.STR_Mult, expectedSTRMult)
	}
}

func TestPassiveSkillNotification_RenderCompact(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	result := notification.RenderCompact()

	// スキル名が含まれていることを確認
	if !strings.Contains(result, "テストスキル") {
		t.Errorf("RenderCompact() should contain skill name, got %v", result)
	}
}

func TestPassiveSkillNotification_RenderDetail(t *testing.T) {
	skill := createTestPassiveSkill()
	notification := NewPassiveSkillNotification(&skill, 5)

	result := notification.RenderDetail(40)

	// スキル名と説明が含まれていることを確認
	if !strings.Contains(result, "テストスキル") {
		t.Errorf("RenderDetail() should contain skill name, got %v", result)
	}
	if !strings.Contains(result, "テスト効果") {
		t.Errorf("RenderDetail() should contain description, got %v", result)
	}
}

func TestPassiveSkillNotification_RenderNilSkill(t *testing.T) {
	notification := NewPassiveSkillNotification(nil, 5)

	result := notification.RenderCompact()

	// nilの場合は空文字列または特定のプレースホルダー
	if result != "" && !strings.Contains(result, "-") && !strings.Contains(result, "None") {
		t.Errorf("RenderCompact() for nil skill should return empty or placeholder, got %v", result)
	}
}

func TestPassiveSkillNotification_HasActiveEffects(t *testing.T) {
	tests := []struct {
		name       string
		skill      *domain.PassiveSkill
		wantActive bool
	}{
		{
			name:       "with_skill",
			skill:      &domain.PassiveSkill{ID: "test", Name: "Test"},
			wantActive: true,
		},
		{
			name:       "nil_skill",
			skill:      nil,
			wantActive: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			notification := NewPassiveSkillNotification(tt.skill, 5)
			got := notification.HasActiveEffects()
			if got != tt.wantActive {
				t.Errorf("HasActiveEffects() = %v, want %v", got, tt.wantActive)
			}
		})
	}
}

func TestPassiveSkillNotification_RenderEffectsList(t *testing.T) {
	skill := domain.PassiveSkill{
		ID:          "multi_effect",
		Name:        "複合スキル",
		Description: "複数の効果を付与",
		BaseModifiers: domain.StatModifiers{
			STR_Mult:        1.1,
			MAG_Add:         5,
			DamageReduction: 0.05,
			CritRate:        0.1,
		},
		ScalePerLevel: 0.05,
	}
	notification := NewPassiveSkillNotification(&skill, 3)

	result := notification.RenderEffectsList()

	// 効果リストが返されることを確認
	if len(result) == 0 {
		t.Error("RenderEffectsList() should return non-empty list for skill with effects")
	}
}
