// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"strings"
	"testing"

	"hirorocky/type-battle/internal/domain"
)

func TestChainEffectBadge_NewChainEffectBadge(t *testing.T) {
	effect := domain.NewChainEffect(domain.ChainEffectDamageBonus, 25.0)
	badge := NewChainEffectBadge(&effect)

	if badge == nil {
		t.Fatal("NewChainEffectBadge should return non-nil")
	}
}

func TestChainEffectBadge_NewChainEffectBadgeWithNil(t *testing.T) {
	badge := NewChainEffectBadge(nil)

	if badge == nil {
		t.Fatal("NewChainEffectBadge should return non-nil even for nil effect")
	}
}

func TestChainEffectBadge_GetCategoryIcon(t *testing.T) {
	tests := []struct {
		name       string
		effectType domain.ChainEffectType
		wantIcon   string
	}{
		{"attack_damage_amp", domain.ChainEffectDamageAmp, "🗡️"},
		{"attack_damage_bonus", domain.ChainEffectDamageBonus, "🗡️"},
		{"attack_armor_pierce", domain.ChainEffectArmorPierce, "🗡️"},
		{"attack_life_steal", domain.ChainEffectLifeSteal, "🗡️"},
		{"defense_damage_cut", domain.ChainEffectDamageCut, "🛡️"},
		{"defense_evasion", domain.ChainEffectEvasion, "🛡️"},
		{"defense_reflect", domain.ChainEffectReflect, "🛡️"},
		{"defense_regen", domain.ChainEffectRegen, "🛡️"},
		{"heal_amp", domain.ChainEffectHealAmp, "💚"},
		{"heal_bonus", domain.ChainEffectHealBonus, "💚"},
		{"heal_overheal", domain.ChainEffectOverheal, "💚"},
		{"typing_time_extend", domain.ChainEffectTimeExtend, "⌨️"},
		{"typing_auto_correct", domain.ChainEffectAutoCorrect, "⌨️"},
		{"recast_cooldown_reduce", domain.ChainEffectCooldownReduce, "⏱️"},
		{"effect_extend_buff", domain.ChainEffectBuffExtend, "🔄"},
		{"effect_extend_debuff", domain.ChainEffectDebuffExtend, "🔄"},
		{"effect_extend_buff_duration", domain.ChainEffectBuffDuration, "🔄"},
		{"effect_extend_debuff_duration", domain.ChainEffectDebuffDuration, "🔄"},
		{"special_double_cast", domain.ChainEffectDoubleCast, "✨"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			effect := domain.NewChainEffect(tt.effectType, 10.0)
			badge := NewChainEffectBadge(&effect)

			got := badge.GetCategoryIcon()
			if got != tt.wantIcon {
				t.Errorf("GetCategoryIcon() = %v, want %v", got, tt.wantIcon)
			}
		})
	}
}

func TestChainEffectBadge_Render(t *testing.T) {
	effect := domain.NewChainEffect(domain.ChainEffectDamageBonus, 25.0)
	badge := NewChainEffectBadge(&effect)

	result := badge.Render()

	// アイコンが含まれていることを確認
	if !strings.Contains(result, "🗡️") {
		t.Errorf("Render() should contain category icon, got %v", result)
	}
}

func TestChainEffectBadge_RenderWithValue(t *testing.T) {
	effect := domain.NewChainEffectWithTemplate(domain.ChainEffectDamageBonus, 25.0,
		"次の攻撃のダメージ+%.0f%%", "次攻撃ダメ+%.0f%%")
	badge := NewChainEffectBadge(&effect)

	result := badge.RenderWithValue()

	// ShortDescriptionが含まれていることを確認
	if !strings.Contains(result, "次攻撃ダメ") {
		t.Errorf("RenderWithValue() should contain short description, got %v", result)
	}
	if !strings.Contains(result, "25") {
		t.Errorf("RenderWithValue() should contain effect value, got %v", result)
	}
}

func TestChainEffectBadge_RenderNilEffect(t *testing.T) {
	badge := NewChainEffectBadge(nil)

	result := badge.Render()

	// 空文字または特定のプレースホルダーを返す
	if result != "" && !strings.Contains(result, "-") {
		t.Errorf("Render() for nil effect should return empty or placeholder, got %v", result)
	}
}

func TestChainEffectBadge_GetDescription(t *testing.T) {
	effect := domain.NewChainEffectWithTemplate(domain.ChainEffectDamageBonus, 25.0,
		"次の攻撃のダメージ+%.0f%%", "次攻撃ダメ+%.0f%%")
	badge := NewChainEffectBadge(&effect)

	desc := badge.GetDescription()

	if desc == "" {
		t.Error("GetDescription() should return non-empty string")
	}
	// 効果値が含まれていることを確認
	if !strings.Contains(desc, "25") {
		t.Errorf("GetDescription() should contain effect value, got %v", desc)
	}
}
