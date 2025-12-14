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

// TestChainEffectType_攻撃強化カテゴリ定数の確認 は攻撃強化カテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_攻撃強化カテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"ダメージアンプ", ChainEffectDamageAmp, "damage_amp"},
		{"アーマーピアス", ChainEffectArmorPierce, "armor_pierce"},
		{"ライフスティール", ChainEffectLifeSteal, "life_steal"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_攻撃強化カテゴリDescription は攻撃強化カテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_攻撃強化カテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectDamageAmp, 25.0, "効果中の攻撃ダメージ+25%"},
		{ChainEffectArmorPierce, 0.0, "効果中の攻撃が防御バフ無視"},
		{ChainEffectLifeSteal, 10.0, "効果中の攻撃ダメージの10%回復"},
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

// TestNewChainEffect_攻撃強化カテゴリ は攻撃強化カテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_攻撃強化カテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectDamageAmp, 25.0, "効果中の攻撃ダメージ+25%"},
		{ChainEffectArmorPierce, 0.0, "効果中の攻撃が防御バフ無視"},
		{ChainEffectLifeSteal, 10.0, "効果中の攻撃ダメージの10%回復"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_防御強化カテゴリ定数の確認 は防御強化カテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_防御強化カテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"ダメージカット", ChainEffectDamageCut, "damage_cut"},
		{"イベイジョン", ChainEffectEvasion, "evasion"},
		{"リフレクト", ChainEffectReflect, "reflect"},
		{"リジェネ", ChainEffectRegen, "regen"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_防御強化カテゴリDescription は防御強化カテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_防御強化カテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectDamageCut, 25.0, "効果中の被ダメージ-25%"},
		{ChainEffectEvasion, 10.0, "効果中10%で攻撃回避"},
		{ChainEffectReflect, 50.0, "効果中被ダメージの50%反射"},
		{ChainEffectRegen, 1.0, "効果中毎秒HP1%回復"},
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

// TestNewChainEffect_防御強化カテゴリ は防御強化カテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_防御強化カテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectDamageCut, 25.0, "効果中の被ダメージ-25%"},
		{ChainEffectEvasion, 10.0, "効果中10%で攻撃回避"},
		{ChainEffectReflect, 50.0, "効果中被ダメージの50%反射"},
		{ChainEffectRegen, 1.0, "効果中毎秒HP1%回復"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_回復強化カテゴリ定数の確認 は回復強化カテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_回復強化カテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"ヒールアンプ", ChainEffectHealAmp, "heal_amp"},
		{"オーバーヒール", ChainEffectOverheal, "overheal"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_回復強化カテゴリDescription は回復強化カテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_回復強化カテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectHealAmp, 25.0, "効果中の回復量+25%"},
		{ChainEffectOverheal, 0.0, "効果中の超過回復を一時HPに"},
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

// TestNewChainEffect_回復強化カテゴリ は回復強化カテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_回復強化カテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectHealAmp, 25.0, "効果中の回復量+25%"},
		{ChainEffectOverheal, 0.0, "効果中の超過回復を一時HPに"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_タイピングカテゴリ定数の確認 はタイピングカテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_タイピングカテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"タイムエクステンド", ChainEffectTimeExtend, "time_extend"},
		{"オートコレクト", ChainEffectAutoCorrect, "auto_correct"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_タイピングカテゴリDescription はタイピングカテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_タイピングカテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectTimeExtend, 3.0, "効果中のタイピング制限時間+3秒"},
		{ChainEffectAutoCorrect, 2.0, "効果中ミス2回まで無視"},
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

// TestNewChainEffect_タイピングカテゴリ はタイピングカテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_タイピングカテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectTimeExtend, 3.0, "効果中のタイピング制限時間+3秒"},
		{ChainEffectAutoCorrect, 2.0, "効果中ミス2回まで無視"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_リキャストカテゴリ定数の確認 はリキャストカテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_リキャストカテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"クールダウンリデュース", ChainEffectCooldownReduce, "cooldown_reduce"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_リキャストカテゴリDescription はリキャストカテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_リキャストカテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectCooldownReduce, 20.0, "効果中発生した他エージェントのリキャスト時間20%短縮"},
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

// TestNewChainEffect_リキャストカテゴリ はリキャストカテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_リキャストカテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectCooldownReduce, 20.0, "効果中発生した他エージェントのリキャスト時間20%短縮"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_効果延長カテゴリ定数の確認 は効果延長カテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_効果延長カテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"バフデュレーション", ChainEffectBuffDuration, "buff_duration"},
		{"デバフデュレーション", ChainEffectDebuffDuration, "debuff_duration"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_効果延長カテゴリDescription は効果延長カテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_効果延長カテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectBuffDuration, 5.0, "効果中のバフスキル効果時間+5秒"},
		{ChainEffectDebuffDuration, 5.0, "効果中のデバフスキル効果時間+5秒"},
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

// TestNewChainEffect_効果延長カテゴリ は効果延長カテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_効果延長カテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectBuffDuration, 5.0, "効果中のバフスキル効果時間+5秒"},
		{ChainEffectDebuffDuration, 5.0, "効果中のデバフスキル効果時間+5秒"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_特殊カテゴリ定数の確認 は特殊カテゴリのChainEffectType定数が正しく定義されていることを確認します。
func TestChainEffectType_特殊カテゴリ定数の確認(t *testing.T) {
	tests := []struct {
		name       string
		effectType ChainEffectType
		expected   string
	}{
		{"ダブルキャスト", ChainEffectDoubleCast, "double_cast"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.effectType) != tt.expected {
				t.Errorf("ChainEffectTypeが期待値と異なります: got %s, want %s", tt.effectType, tt.expected)
			}
		})
	}
}

// TestChainEffectType_特殊カテゴリDescription は特殊カテゴリのチェイン効果種別ごとの説明テンプレートが正しいことを確認します。
func TestChainEffectType_特殊カテゴリDescription(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		{ChainEffectDoubleCast, 10.0, "効果中10%でスキル2回発動"},
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

// TestNewChainEffect_特殊カテゴリ は特殊カテゴリのNewChainEffect関数でチェイン効果が正しく作成されることを確認します。
func TestNewChainEffect_特殊カテゴリ(t *testing.T) {
	tests := []struct {
		effectType   ChainEffectType
		value        float64
		expectedDesc string
	}{
		{ChainEffectDoubleCast, 10.0, "効果中10%でスキル2回発動"},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			effect := NewChainEffect(tt.effectType, tt.value)
			if effect.Type != tt.effectType {
				t.Errorf("Typeが期待値と異なります: got %s, want %s", effect.Type, tt.effectType)
			}
			if effect.Value != tt.value {
				t.Errorf("Valueが期待値と異なります: got %f, want %f", effect.Value, tt.value)
			}
			if effect.Description != tt.expectedDesc {
				t.Errorf("Descriptionが期待値と異なります: got %s, want %s", effect.Description, tt.expectedDesc)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_攻撃強化 は攻撃強化カテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_攻撃強化(t *testing.T) {
	attackTypes := []ChainEffectType{
		ChainEffectDamageAmp,
		ChainEffectArmorPierce,
		ChainEffectLifeSteal,
	}

	for _, effectType := range attackTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryAttack {
				t.Errorf("%s はattackカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_防御強化 は防御強化カテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_防御強化(t *testing.T) {
	defenseTypes := []ChainEffectType{
		ChainEffectDamageCut,
		ChainEffectEvasion,
		ChainEffectReflect,
		ChainEffectRegen,
	}

	for _, effectType := range defenseTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryDefense {
				t.Errorf("%s はdefenseカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_回復強化 は回復強化カテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_回復強化(t *testing.T) {
	healTypes := []ChainEffectType{
		ChainEffectHealAmp,
		ChainEffectOverheal,
	}

	for _, effectType := range healTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryHeal {
				t.Errorf("%s はhealカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_タイピング はタイピングカテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_タイピング(t *testing.T) {
	typingTypes := []ChainEffectType{
		ChainEffectTimeExtend,
		ChainEffectAutoCorrect,
	}

	for _, effectType := range typingTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryTyping {
				t.Errorf("%s はtypingカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_リキャスト はリキャストカテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_リキャスト(t *testing.T) {
	recastTypes := []ChainEffectType{
		ChainEffectCooldownReduce,
	}

	for _, effectType := range recastTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryRecast {
				t.Errorf("%s はrecastカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_効果延長 は効果延長カテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_効果延長(t *testing.T) {
	effectExtendTypes := []ChainEffectType{
		ChainEffectBuffDuration,
		ChainEffectDebuffDuration,
	}

	for _, effectType := range effectExtendTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategoryEffectExtend {
				t.Errorf("%s はeffect_extendカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_特殊 は特殊カテゴリの判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_特殊(t *testing.T) {
	specialTypes := []ChainEffectType{
		ChainEffectDoubleCast,
	}

	for _, effectType := range specialTypes {
		t.Run(string(effectType), func(t *testing.T) {
			if effectType.Category() != ChainEffectCategorySpecial {
				t.Errorf("%s はspecialカテゴリであるべきです", effectType)
			}
		})
	}
}

// TestChainEffectType_カテゴリ判定_レガシー はレガシー効果タイプのカテゴリ判定が正しいことを確認します。
func TestChainEffectType_カテゴリ判定_レガシー(t *testing.T) {
	// 元々あった4種類のチェイン効果はそれぞれ適切なカテゴリに分類される
	tests := []struct {
		effectType ChainEffectType
		category   ChainEffectCategory
	}{
		{ChainEffectDamageBonus, ChainEffectCategoryAttack},
		{ChainEffectHealBonus, ChainEffectCategoryHeal},
		{ChainEffectBuffExtend, ChainEffectCategoryEffectExtend},
		{ChainEffectDebuffExtend, ChainEffectCategoryEffectExtend},
	}

	for _, tt := range tests {
		t.Run(string(tt.effectType), func(t *testing.T) {
			if tt.effectType.Category() != tt.category {
				t.Errorf("%s は%sカテゴリであるべきです", tt.effectType, tt.category)
			}
		})
	}
}

// TestChainEffectType_全19種類のDescription確認 は全チェイン効果タイプのGenerateDescriptionが正しく動作することを確認します。
func TestChainEffectType_全19種類のDescription確認(t *testing.T) {
	tests := []struct {
		effectType ChainEffectType
		value      float64
		expected   string
	}{
		// レガシー（タスク1.1で実装済み）
		{ChainEffectDamageBonus, 25.0, "次の攻撃のダメージ+25%"},
		{ChainEffectHealBonus, 20.0, "次の回復量+20%"},
		{ChainEffectBuffExtend, 5.0, "バフ効果時間+5秒"},
		{ChainEffectDebuffExtend, 3.0, "デバフ効果時間+3秒"},
		// 攻撃強化カテゴリ
		{ChainEffectDamageAmp, 25.0, "効果中の攻撃ダメージ+25%"},
		{ChainEffectArmorPierce, 0.0, "効果中の攻撃が防御バフ無視"},
		{ChainEffectLifeSteal, 10.0, "効果中の攻撃ダメージの10%回復"},
		// 防御強化カテゴリ
		{ChainEffectDamageCut, 25.0, "効果中の被ダメージ-25%"},
		{ChainEffectEvasion, 10.0, "効果中10%で攻撃回避"},
		{ChainEffectReflect, 50.0, "効果中被ダメージの50%反射"},
		{ChainEffectRegen, 1.0, "効果中毎秒HP1%回復"},
		// 回復強化カテゴリ
		{ChainEffectHealAmp, 25.0, "効果中の回復量+25%"},
		{ChainEffectOverheal, 0.0, "効果中の超過回復を一時HPに"},
		// タイピングカテゴリ
		{ChainEffectTimeExtend, 3.0, "効果中のタイピング制限時間+3秒"},
		{ChainEffectAutoCorrect, 2.0, "効果中ミス2回まで無視"},
		// リキャストカテゴリ
		{ChainEffectCooldownReduce, 20.0, "効果中発生した他エージェントのリキャスト時間20%短縮"},
		// 効果延長カテゴリ
		{ChainEffectBuffDuration, 5.0, "効果中のバフスキル効果時間+5秒"},
		{ChainEffectDebuffDuration, 5.0, "効果中のデバフスキル効果時間+5秒"},
		// 特殊カテゴリ
		{ChainEffectDoubleCast, 10.0, "効果中10%でスキル2回発動"},
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

// TestChainEffectCategory_定数確認 はChainEffectCategory定数が正しく定義されていることを確認します。
func TestChainEffectCategory_定数確認(t *testing.T) {
	tests := []struct {
		name     string
		category ChainEffectCategory
		expected string
	}{
		{"攻撃強化", ChainEffectCategoryAttack, "attack"},
		{"防御強化", ChainEffectCategoryDefense, "defense"},
		{"回復強化", ChainEffectCategoryHeal, "heal"},
		{"タイピング", ChainEffectCategoryTyping, "typing"},
		{"リキャスト", ChainEffectCategoryRecast, "recast"},
		{"効果延長", ChainEffectCategoryEffectExtend, "effect_extend"},
		{"特殊", ChainEffectCategorySpecial, "special"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.category) != tt.expected {
				t.Errorf("ChainEffectCategoryが期待値と異なります: got %s, want %s", tt.category, tt.expected)
			}
		})
	}
}
