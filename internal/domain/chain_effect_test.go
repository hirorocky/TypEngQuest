// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// TestChainEffectType_定数の確認 はChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"ダメージボーナス", ChainEffectDamageBonus, "damage_bonus"},
		{"回復ボーナス", ChainEffectHealBonus, "heal_bonus"},
		{"バフ延長", ChainEffectBuffExtend, "buff_extend"},
		{"デバフ延長", ChainEffectDebuffExtend, "debuff_extend"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffect_フィールドの確認 はChainEffect構造体のフィールドが正しく設定されることを確認します。
func TestChainEffect_フィールドの確認(t *testing.T) {
	effect := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}

	if effect.Type != ChainEffectDamageBonus {
		t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, ChainEffectDamageBonus)
	}
	if effect.Value != 25.0 {
		t.Errorf("Valueが期待値と異なります: got %f, want 25.0", effect.Value)
	}
	if effect.Description != "攻撃ダメージ+25%" {
		t.Errorf("Descriptionが期待値と異なります: got %s, want 攻撃ダメージ+25%%", effect.Description)
	}
}

// TestChainEffect_Equals_等価なチェイン効果 は同一のチェイン効果が等価と判定されることを確認します。
func TestChainEffect_Equals_等価なチェイン効果(t *testing.T) {
	effect1 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}
	effect2 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}

	if !effect1.Equals(effect2) {
		t.Error("同一のチェイン効果は等価であるべきです")
	}
}

// TestChainEffect_Equals_異なるType は異なるTypeのチェイン効果が非等価と判定されることを確認します。
func TestChainEffect_Equals_異なるType(t *testing.T) {
	effect1 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}
	effect2 := ChainEffect{
		Type:        ChainEffectHealBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}

	if effect1.Equals(effect2) {
		t.Error("異なるTypeのチェイン効果は非等価であるべきです")
	}
}

// TestChainEffect_Equals_異なるValue は異なるValueのチェイン効果が非等価と判定されることを確認します。
func TestChainEffect_Equals_異なるValue(t *testing.T) {
	effect1 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}
	effect2 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       30.0,
		Description: "攻撃ダメージ+25%",
	}

	if effect1.Equals(effect2) {
		t.Error("異なるValueのチェイン効果は非等価であるべきです")
	}
}

// TestChainEffect_Equals_異なるDescription は異なるDescriptionのチェイン効果が非等価と判定されることを確認します。
func TestChainEffect_Equals_異なるDescription(t *testing.T) {
	effect1 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+25%",
	}
	effect2 := ChainEffect{
		Type:        ChainEffectDamageBonus,
		Value:       25.0,
		Description: "攻撃ダメージ+30%",
	}

	if effect1.Equals(effect2) {
		t.Error("異なるDescriptionのチェイン効果は非等価であるべきです")
	}
}

// TestChainEffectType_Description はチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_Description(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectDamageBonus, 25.0, "次の攻撃のダメージ+25%"},
		{ChainEffectHealBonus, 20.0, "次の回復量+20%"},
		{ChainEffectBuffExtend, 5.0, "バフ効果時間+5秒"},
		{ChainEffectDebuffExtend, 3.0, "デバフ効果時間+3秒"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			result := tt.effectType.GenerateDescription(tt.value)
			if result != tt.expected {
				t.Errorf("説明が期待値と異なります: got %s, want %s", result, tt.expected)
			}
		})
	}
}

// TestChainEffectType_Description_未知のタイプ は未知のタイプに対してデフォルトの説明が返されることを確認します。
func TestChainEffectType_Description_未知のタイプ(t *testing.T) {
	unknownType := ChainEffectType("unknown")
	result := unknownType.GenerateDescription(10.0)
	expected := "チェイン効果"
	if result != expected {
		t.Errorf("未知のタイプに対する説明が期待値と異なります: got %s, want %s", result, expected)
	}
}

// TestNewChainEffect はNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect(t *testing.T) {
	effect := NewChainEffect(ChainEffectDamageBonus, 25.0)

	if effect.Type != ChainEffectDamageBonus {
		t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, ChainEffectDamageBonus)
	}
	if effect.Value != 25.0 {
		t.Errorf("Valueが期待値と異なります: got %f, want 25.0", effect.Value)
	}
	// Descriptionが自動生成されていることを確認
	expectedDesc := "次の攻撃のダメージ+25%"
	if effect.Description != expectedDesc {
		t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, expectedDesc)
	}
}

// TestChainEffect_イミュータブル性 はChainEffectがイミュータブルであることを確認します。
// 注: Goでは値型構造体は本質的にイミュータブルですが、ポインタ経由での変更がないことを確認
func TestChainEffect_イミュータブル性(t *testing.T) {
	effect := NewChainEffect(ChainEffectHealBonus, 15.0)
	originalValue := effect.Value

	// 値のコピーを作成
	effectCopy := effect
	effectCopy.Value = 999.0

	// 元のeffectは変更されていないはず
	if effect.Value != originalValue {
		t.Errorf("元のChainEffectが変更されています: got %f, want %f", effect.Value, originalValue)
	}
}

// TestChainEffect_Equalsのゼロ値 はゼロ値同士が等価と判定されることを確認します。
func TestChainEffect_Equalsのゼロ値(t *testing.T) {
	effect1 := ChainEffect{}
	effect2 := ChainEffect{}

	if !effect1.Equals(effect2) {
		t.Error("ゼロ値同士は等価であるべきです")
	}
}
