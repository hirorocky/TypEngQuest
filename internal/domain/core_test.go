// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"math"
	"testing"
)

// floatEquals は2つの浮動小数点数がほぼ等しいかを判定します。
func floatEquals(a, b float64) bool {
	return math.Abs(a-b) < 1e-9
}

// TestStats_ゼロ値の確認 はStats構造体のゼロ値が正しいことを確認します。
func TestStats_ゼロ値の確認(t *testing.T) {
	stats := Stats{}

	if stats.STR != 0 {
		t.Errorf("STRのゼロ値が期待値と異なります: got %d, want 0", stats.STR)
	}
	if stats.MAG != 0 {
		t.Errorf("MAGのゼロ値が期待値と異なります: got %d, want 0", stats.MAG)
	}
	if stats.SPD != 0 {
		t.Errorf("SPDのゼロ値が期待値と異なります: got %d, want 0", stats.SPD)
	}
	if stats.LUK != 0 {
		t.Errorf("LUKのゼロ値が期待値と異なります: got %d, want 0", stats.LUK)
	}
}

// TestStats_値の設定 はStats構造体に値を設定できることを確認します。
func TestStats_値の設定(t *testing.T) {
	stats := Stats{
		STR: 10,
		MAG: 20,
		SPD: 15,
		LUK: 5,
	}

	if stats.STR != 10 {
		t.Errorf("STRの値が期待値と異なります: got %d, want 10", stats.STR)
	}
	if stats.MAG != 20 {
		t.Errorf("MAGの値が期待値と異なります: got %d, want 20", stats.MAG)
	}
	if stats.SPD != 15 {
		t.Errorf("SPDの値が期待値と異なります: got %d, want 15", stats.SPD)
	}
	if stats.LUK != 5 {
		t.Errorf("LUKの値が期待値と異なります: got %d, want 5", stats.LUK)
	}
}

// TestCoreType_フィールドの確認 はCoreType構造体のフィールドが正しく設定されることを確認します。
func TestCoreType_フィールドの確認(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	if coreType.ID != "attack_balance" {
		t.Errorf("IDが期待値と異なります: got %s, want attack_balance", coreType.ID)
	}
	if coreType.Name != "攻撃バランス" {
		t.Errorf("Nameが期待値と異なります: got %s, want 攻撃バランス", coreType.Name)
	}
	if coreType.StatWeights["STR"] != 1.2 {
		t.Errorf("StatWeights[STR]が期待値と異なります: got %f, want 1.2", coreType.StatWeights["STR"])
	}
	if coreType.PassiveSkillID != "balanced_stance" {
		t.Errorf("PassiveSkillIDが期待値と異なります: got %s, want balanced_stance", coreType.PassiveSkillID)
	}
	if len(coreType.AllowedTags) != 2 {
		t.Errorf("AllowedTagsの長さが期待値と異なります: got %d, want 2", len(coreType.AllowedTags))
	}
	if coreType.MinDropLevel != 1 {
		t.Errorf("MinDropLevelが期待値と異なります: got %d, want 1", coreType.MinDropLevel)
	}
}

// TestPassiveSkill_フィールドの確認 はPassiveSkill構造体のフィールドが正しく設定されることを確認します。
func TestPassiveSkill_フィールドの確認(t *testing.T) {
	skill := PassiveSkill{
		ID:          "balanced_stance",
		Name:        "バランススタンス",
		Description: "物理と魔法のダメージをバランスよく強化する",
	}

	if skill.ID != "balanced_stance" {
		t.Errorf("IDが期待値と異なります: got %s, want balanced_stance", skill.ID)
	}
	if skill.Name != "バランススタンス" {
		t.Errorf("Nameが期待値と異なります: got %s, want バランススタンス", skill.Name)
	}
	if skill.Description != "物理と魔法のダメージをバランスよく強化する" {
		t.Errorf("Descriptionが期待値と異なります: got %s", skill.Description)
	}
}

// TestCoreModel_フィールドの確認 はCoreModel構造体のフィールドが正しく設定されることを確認します。
func TestCoreModel_フィールドの確認(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	passiveSkill := PassiveSkill{
		ID:          "balanced_stance",
		Name:        "バランススタンス",
		Description: "物理と魔法のダメージをバランスよく強化する",
	}

	core := CoreModel{
		ID:           "core_001",
		Name:         "バランスコア",
		Level:        10,
		Type:         coreType,
		Stats:        Stats{STR: 12, MAG: 10, SPD: 8, LUK: 10},
		PassiveSkill: passiveSkill,
		AllowedTags:  []string{"physical_low", "magic_low"},
	}

	if core.ID != "core_001" {
		t.Errorf("IDが期待値と異なります: got %s, want core_001", core.ID)
	}
	if core.Name != "バランスコア" {
		t.Errorf("Nameが期待値と異なります: got %s, want バランスコア", core.Name)
	}
	if core.Level != 10 {
		t.Errorf("Levelが期待値と異なります: got %d, want 10", core.Level)
	}
	if core.Type.ID != "attack_balance" {
		t.Errorf("Type.IDが期待値と異なります: got %s, want attack_balance", core.Type.ID)
	}
	if core.Stats.STR != 12 {
		t.Errorf("Stats.STRが期待値と異なります: got %d, want 12", core.Stats.STR)
	}
	if core.PassiveSkill.ID != "balanced_stance" {
		t.Errorf("PassiveSkill.IDが期待値と異なります: got %s, want balanced_stance", core.PassiveSkill.ID)
	}
	if len(core.AllowedTags) != 2 {
		t.Errorf("AllowedTagsの長さが期待値と異なります: got %d, want 2", len(core.AllowedTags))
	}
}

// TestCalculateStats_レベル1での計算 はレベル1のコアでステータスが正しく計算されることを確認します。
// ステータス計算式: 基礎値(10) × レベル × ステータス重み
func TestCalculateStats_レベル1での計算(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(1, coreType)

	// 基礎値10 × レベル1 × 重み = 期待値
	// STR: 10 × 1 × 1.2 = 12
	// MAG: 10 × 1 × 1.0 = 10
	// SPD: 10 × 1 × 0.8 = 8
	// LUK: 10 × 1 × 1.0 = 10
	if stats.STR != 12 {
		t.Errorf("STRが期待値と異なります: got %d, want 12", stats.STR)
	}
	if stats.MAG != 10 {
		t.Errorf("MAGが期待値と異なります: got %d, want 10", stats.MAG)
	}
	if stats.SPD != 8 {
		t.Errorf("SPDが期待値と異なります: got %d, want 8", stats.SPD)
	}
	if stats.LUK != 10 {
		t.Errorf("LUKが期待値と異なります: got %d, want 10", stats.LUK)
	}
}

// TestCalculateStats_レベル10での計算 はレベル10のコアでステータスが正しく計算されることを確認します。
func TestCalculateStats_レベル10での計算(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値
	// STR: 10 × 10 × 1.2 = 120
	// MAG: 10 × 10 × 1.0 = 100
	// SPD: 10 × 10 × 0.8 = 80
	// LUK: 10 × 10 × 1.0 = 100
	if stats.STR != 120 {
		t.Errorf("STRが期待値と異なります: got %d, want 120", stats.STR)
	}
	if stats.MAG != 100 {
		t.Errorf("MAGが期待値と異なります: got %d, want 100", stats.MAG)
	}
	if stats.SPD != 80 {
		t.Errorf("SPDが期待値と異なります: got %d, want 80", stats.SPD)
	}
	if stats.LUK != 100 {
		t.Errorf("LUKが期待値と異なります: got %d, want 100", stats.LUK)
	}
}

// TestCalculateStats_ヒーラー特性 はヒーラー特性（MAG特化）でステータスが正しく計算されることを確認します。
func TestCalculateStats_ヒーラー特性(t *testing.T) {
	coreType := CoreType{
		ID:             "healer",
		Name:           "ヒーラー",
		StatWeights:    map[string]float64{"STR": 0.5, "MAG": 1.5, "SPD": 0.8, "LUK": 1.2},
		PassiveSkillID: "healing_aura",
		AllowedTags:    []string{"heal_mid", "heal_high"},
		MinDropLevel:   3,
	}

	stats := CalculateStats(5, coreType)

	// 基礎値10 × レベル5 × 重み = 期待値
	// STR: 10 × 5 × 0.5 = 25
	// MAG: 10 × 5 × 1.5 = 75
	// SPD: 10 × 5 × 0.8 = 40
	// LUK: 10 × 5 × 1.2 = 60
	if stats.STR != 25 {
		t.Errorf("STRが期待値と異なります: got %d, want 25", stats.STR)
	}
	if stats.MAG != 75 {
		t.Errorf("MAGが期待値と異なります: got %d, want 75", stats.MAG)
	}
	if stats.SPD != 40 {
		t.Errorf("SPDが期待値と異なります: got %d, want 40", stats.SPD)
	}
	if stats.LUK != 60 {
		t.Errorf("LUKが期待値と異なります: got %d, want 60", stats.LUK)
	}
}

// TestCalculateStats_オールラウンダー特性 はオールラウンダー特性（均等）でステータスが正しく計算されることを確認します。
func TestCalculateStats_オールラウンダー特性(t *testing.T) {
	coreType := CoreType{
		ID:             "all_rounder",
		Name:           "オールラウンダー",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		PassiveSkillID: "versatile",
		AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値（全て100）
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	if stats.MAG != 100 {
		t.Errorf("MAGが期待値と異なります: got %d, want 100", stats.MAG)
	}
	if stats.SPD != 100 {
		t.Errorf("SPDが期待値と異なります: got %d, want 100", stats.SPD)
	}
	if stats.LUK != 100 {
		t.Errorf("LUKが期待値と異なります: got %d, want 100", stats.LUK)
	}
}

// TestCalculateStats_パラディン特性 はパラディン特性でステータスが正しく計算されることを確認します。
func TestCalculateStats_パラディン特性(t *testing.T) {
	coreType := CoreType{
		ID:             "paladin",
		Name:           "パラディン",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.1, "SPD": 0.7, "LUK": 1.2},
		PassiveSkillID: "holy_protection",
		AllowedTags:    []string{"buff_mid", "heal_low"},
		MinDropLevel:   5,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値
	// STR: 10 × 10 × 1.0 = 100
	// MAG: 10 × 10 × 1.1 = 110
	// SPD: 10 × 10 × 0.7 = 70
	// LUK: 10 × 10 × 1.2 = 120
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	if stats.MAG != 110 {
		t.Errorf("MAGが期待値と異なります: got %d, want 110", stats.MAG)
	}
	if stats.SPD != 70 {
		t.Errorf("SPDが期待値と異なります: got %d, want 70", stats.SPD)
	}
	if stats.LUK != 120 {
		t.Errorf("LUKが期待値と異なります: got %d, want 120", stats.LUK)
	}
}

// TestNewCore_コア作成 はNewCore関数でコアが正しく作成されることを確認します。
func TestNewCore_コア作成(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.0, "SPD": 0.8, "LUK": 1.0},
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

	if core.ID != "core_001" {
		t.Errorf("IDが期待値と異なります: got %s, want core_001", core.ID)
	}
	if core.Name != "バランスコア" {
		t.Errorf("Nameが期待値と異なります: got %s, want バランスコア", core.Name)
	}
	if core.Level != 10 {
		t.Errorf("Levelが期待値と異なります: got %d, want 10", core.Level)
	}

	// ステータスが自動計算されていることを確認
	// STR: 10 × 10 × 1.2 = 120
	if core.Stats.STR != 120 {
		t.Errorf("Stats.STRが期待値と異なります: got %d, want 120", core.Stats.STR)
	}

	// AllowedTagsがCoreTypeからコピーされていることを確認
	if len(core.AllowedTags) != 2 {
		t.Errorf("AllowedTagsの長さが期待値と異なります: got %d, want 2", len(core.AllowedTags))
	}
}

// TestCoreModel_IsTagAllowed_許可タグ はIsTagAllowedメソッドが許可タグを正しく判定することを確認します。
func TestCoreModel_IsTagAllowed_許可タグ(t *testing.T) {
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{"physical_low", "magic_low"},
	}

	if !core.IsTagAllowed("physical_low") {
		t.Error("physical_lowは許可タグのはずですがfalseが返されました")
	}
	if !core.IsTagAllowed("magic_low") {
		t.Error("magic_lowは許可タグのはずですがfalseが返されました")
	}
}

// TestCoreModel_IsTagAllowed_非許可タグ はIsTagAllowedメソッドが非許可タグを正しく拒否することを確認します。
func TestCoreModel_IsTagAllowed_非許可タグ(t *testing.T) {
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{"physical_low", "magic_low"},
	}

	if core.IsTagAllowed("heal_mid") {
		t.Error("heal_midは非許可タグのはずですがtrueが返されました")
	}
	if core.IsTagAllowed("buff_high") {
		t.Error("buff_highは非許可タグのはずですがtrueが返されました")
	}
}

// TestStats_Total はStats構造体の合計値を計算できることを確認します。
func TestStats_Total(t *testing.T) {
	stats := Stats{
		STR: 10,
		MAG: 20,
		SPD: 15,
		LUK: 5,
	}

	total := stats.Total()
	expected := 50

	if total != expected {
		t.Errorf("Totalが期待値と異なります: got %d, want %d", total, expected)
	}
}

// TestCalculateStats_レベル0 はレベル0の場合にステータスが全て0になることを確認します。
func TestCalculateStats_レベル0(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.5, "MAG": 1.5, "SPD": 1.5, "LUK": 1.5},
	}

	stats := CalculateStats(0, coreType)

	if stats.STR != 0 || stats.MAG != 0 || stats.SPD != 0 || stats.LUK != 0 {
		t.Errorf("レベル0の場合、全ステータスは0になるべきです: got STR=%d, MAG=%d, SPD=%d, LUK=%d",
			stats.STR, stats.MAG, stats.SPD, stats.LUK)
	}
}

// TestCalculateStats_最大レベル はレベル100のコアでステータスが正しく計算されることを確認します。
func TestCalculateStats_最大レベル(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
	}

	stats := CalculateStats(100, coreType)

	// 基礎値10 × レベル100 × 重み1.0 = 1000
	if stats.STR != 1000 {
		t.Errorf("STRが期待値と異なります: got %d, want 1000", stats.STR)
	}
}

// TestCalculateStats_重み未設定 は重みが設定されていないステータスが0になることを確認します。
func TestCalculateStats_重み未設定(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0}, // MAG, SPD, LUK は未設定
	}

	stats := CalculateStats(10, coreType)

	// STRは設定あり: 10 × 10 × 1.0 = 100
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	// MAG, SPD, LUKは未設定のため0（重み0.0扱い）
	if stats.MAG != 0 {
		t.Errorf("MAGは未設定のため0になるべきです: got %d", stats.MAG)
	}
	if stats.SPD != 0 {
		t.Errorf("SPDは未設定のため0になるべきです: got %d", stats.SPD)
	}
	if stats.LUK != 0 {
		t.Errorf("LUKは未設定のため0になるべきです: got %d", stats.LUK)
	}
}

// TestCoreModel_IsTagAllowed_空リスト はAllowedTagsが空の場合に常にfalseを返すことを確認します。
func TestCoreModel_IsTagAllowed_空リスト(t *testing.T) {
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{},
	}

	if core.IsTagAllowed("physical_low") {
		t.Error("AllowedTagsが空の場合、falseを返すべきです")
	}
}

// TestCoreModel_IsTagAllowed_空文字タグ は空文字のタグに対して正しく判定することを確認します。
func TestCoreModel_IsTagAllowed_空文字タグ(t *testing.T) {
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{"physical_low", ""},
	}

	// 空文字がAllowedTagsに含まれている場合
	if !core.IsTagAllowed("") {
		t.Error("空文字タグがAllowedTagsに含まれているため、trueを返すべきです")
	}

	// 許可タグを持たない場合
	core2 := CoreModel{
		ID:          "core_002",
		AllowedTags: []string{"physical_low"},
	}
	if core2.IsTagAllowed("") {
		t.Error("空文字タグがAllowedTagsに含まれていないため、falseを返すべきです")
	}
}

// TestNewCore_AllowedTagsの独立性 はNewCoreで作成したコアのAllowedTagsが元のCoreTypeと独立していることを確認します。
func TestNewCore_AllowedTagsの独立性(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"tag1", "tag2"},
	}

	passiveSkill := PassiveSkill{ID: "test_skill"}

	core := NewCore("core_001", "テストコア", 1, coreType, passiveSkill)

	// 元のAllowedTagsを変更
	coreType.AllowedTags[0] = "modified_tag"

	// CoreModelのAllowedTagsは影響を受けないはず
	if core.AllowedTags[0] != "tag1" {
		t.Errorf("CoreModelのAllowedTagsが変更されています: got %s, want tag1", core.AllowedTags[0])
	}
}

// TestBaseStatValue はBaseStatValue定数が正しい値であることを確認します。
func TestBaseStatValue(t *testing.T) {
	if BaseStatValue != 10 {
		t.Errorf("BaseStatValueが期待値と異なります: got %d, want 10", BaseStatValue)
	}
}

// ==================== PassiveSkill効果量計算テスト ====================

// TestPassiveSkill_拡張フィールドの確認 はPassiveSkill拡張フィールドが正しく設定されることを確認します。
func TestPassiveSkill_拡張フィールドの確認(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		BaseModifiers: StatModifiers{
			CDReduction: 0.1,
		},
		ScalePerLevel: 0.02,
	}

	if skill.ID != "ps_buff_extender" {
		t.Errorf("IDが期待値と異なります: got %s, want ps_buff_extender", skill.ID)
	}
	if skill.BaseModifiers.CDReduction != 0.1 {
		t.Errorf("BaseModifiers.CDReductionが期待値と異なります: got %f, want 0.1", skill.BaseModifiers.CDReduction)
	}
	if skill.ScalePerLevel != 0.02 {
		t.Errorf("ScalePerLevelが期待値と異なります: got %f, want 0.02", skill.ScalePerLevel)
	}
}

// TestPassiveSkill_CalculateModifiers_レベル1 はレベル1での効果量計算をテストします。
func TestPassiveSkill_CalculateModifiers_レベル1(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		BaseModifiers: StatModifiers{
			CDReduction: 0.1,
			STR_Add:     10,
		},
		ScalePerLevel: 0.5, // 50%増加/レベル
	}

	modifiers := skill.CalculateModifiers(1)

	// レベル1: 基礎値のまま（レベル1からのスケールはなし）
	if modifiers.CDReduction != 0.1 {
		t.Errorf("CDReductionが期待値と異なります: got %f, want 0.1", modifiers.CDReduction)
	}
	if modifiers.STR_Add != 10 {
		t.Errorf("STR_Addが期待値と異なります: got %d, want 10", modifiers.STR_Add)
	}
}

// TestPassiveSkill_CalculateModifiers_レベル5 はレベル5での効果量計算をテストします。
func TestPassiveSkill_CalculateModifiers_レベル5(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_buff_extender",
		Name:        "バフエクステンダー",
		Description: "バフ効果時間+50%",
		BaseModifiers: StatModifiers{
			CDReduction: 0.1,
			STR_Add:     10,
		},
		ScalePerLevel: 0.5, // 50%増加/レベル（レベル1からの差分）
	}

	modifiers := skill.CalculateModifiers(5)

	// レベル5: 基礎値 × (1 + 0.5 × (5-1)) = 基礎値 × 3.0
	// CDReduction: 0.1 × 3.0 = 0.3
	// STR_Add: 10 × 3.0 = 30
	if !floatEquals(modifiers.CDReduction, 0.3) {
		t.Errorf("CDReductionが期待値と異なります: got %f, want 0.3", modifiers.CDReduction)
	}
	if modifiers.STR_Add != 30 {
		t.Errorf("STR_Addが期待値と異なります: got %d, want 30", modifiers.STR_Add)
	}
}

// TestPassiveSkill_CalculateModifiers_レベル10 はレベル10での効果量計算をテストします。
func TestPassiveSkill_CalculateModifiers_レベル10(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_damage_amp",
		Name:        "ダメージアンプ",
		Description: "攻撃ダメージ+10%",
		BaseModifiers: StatModifiers{
			STR_Mult: 1.1, // 10%増加
			MAG_Add:  5,
		},
		ScalePerLevel: 0.1, // 10%増加/レベル
	}

	modifiers := skill.CalculateModifiers(10)

	// レベル10: 基礎値 × (1 + 0.1 × (10-1)) = 基礎値 × 1.9
	// STR_Mult: 1.1はそのまま（乗算は1.0からのオフセットとして計算）
	// オフセット0.1 × 1.9 = 0.19、結果 = 1.0 + 0.19 = 1.19
	expectedSTRMult := 1.0 + (0.1 * 1.9)
	if !floatEquals(modifiers.STR_Mult, expectedSTRMult) {
		t.Errorf("STR_Multが期待値と異なります: got %f, want %f", modifiers.STR_Mult, expectedSTRMult)
	}

	// MAG_Add: 5 × 1.9 = 9（整数部分）
	if modifiers.MAG_Add != 9 {
		t.Errorf("MAG_Addが期待値と異なります: got %d, want 9", modifiers.MAG_Add)
	}
}

// TestPassiveSkill_CalculateModifiers_ゼロレベル はレベル0またはそれ以下での計算をテストします。
func TestPassiveSkill_CalculateModifiers_ゼロレベル(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_test",
		Name:        "テストスキル",
		Description: "テスト",
		BaseModifiers: StatModifiers{
			STR_Add: 10,
		},
		ScalePerLevel: 0.5,
	}

	// レベル0はレベル1として扱う
	modifiers := skill.CalculateModifiers(0)

	if modifiers.STR_Add != 10 {
		t.Errorf("レベル0はレベル1として扱われるべきです: got %d, want 10", modifiers.STR_Add)
	}
}

// TestPassiveSkill_CalculateModifiers_ゼロスケール はスケールが0の場合をテストします。
func TestPassiveSkill_CalculateModifiers_ゼロスケール(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_fixed",
		Name:        "固定効果スキル",
		Description: "レベルに関係なく固定効果",
		BaseModifiers: StatModifiers{
			CritRate: 0.05,
		},
		ScalePerLevel: 0.0, // スケールなし
	}

	modifiers := skill.CalculateModifiers(10)

	// スケールが0なので、レベルに関係なく基礎値のまま
	if modifiers.CritRate != 0.05 {
		t.Errorf("CritRateが期待値と異なります: got %f, want 0.05", modifiers.CritRate)
	}
}

// TestPassiveSkill_CalculateModifiers_全フィールド は全フィールドがスケールされることをテストします。
func TestPassiveSkill_CalculateModifiers_全フィールド(t *testing.T) {
	skill := PassiveSkill{
		ID:          "ps_full",
		Name:        "フルスキル",
		Description: "全効果テスト",
		BaseModifiers: StatModifiers{
			STR_Add:         10,
			MAG_Add:         10,
			SPD_Add:         10,
			LUK_Add:         10,
			STR_Mult:        1.1,
			MAG_Mult:        1.1,
			SPD_Mult:        1.1,
			LUK_Mult:        1.1,
			CDReduction:     0.1,
			TypingTimeExt:   1.0,
			DamageReduction: 0.1,
			CritRate:        0.05,
			PhysicalEvade:   0.1,
			MagicEvade:      0.1,
		},
		ScalePerLevel: 1.0, // 100%増加/レベル
	}

	modifiers := skill.CalculateModifiers(3)

	// レベル3: 基礎値 × (1 + 1.0 × (3-1)) = 基礎値 × 3.0
	scale := 3.0

	// 加算フィールドは整数に切り捨て
	expectedAdd := int(10 * scale)
	if modifiers.STR_Add != expectedAdd {
		t.Errorf("STR_Addが期待値と異なります: got %d, want %d", modifiers.STR_Add, expectedAdd)
	}
	if modifiers.MAG_Add != expectedAdd {
		t.Errorf("MAG_Addが期待値と異なります: got %d, want %d", modifiers.MAG_Add, expectedAdd)
	}
	if modifiers.SPD_Add != expectedAdd {
		t.Errorf("SPD_Addが期待値と異なります: got %d, want %d", modifiers.SPD_Add, expectedAdd)
	}
	if modifiers.LUK_Add != expectedAdd {
		t.Errorf("LUK_Addが期待値と異なります: got %d, want %d", modifiers.LUK_Add, expectedAdd)
	}

	// 乗算フィールドはオフセットをスケール
	expectedMult := 1.0 + (0.1 * scale)
	if !floatEquals(modifiers.STR_Mult, expectedMult) {
		t.Errorf("STR_Multが期待値と異なります: got %f, want %f", modifiers.STR_Mult, expectedMult)
	}
	if !floatEquals(modifiers.MAG_Mult, expectedMult) {
		t.Errorf("MAG_Multが期待値と異なります: got %f, want %f", modifiers.MAG_Mult, expectedMult)
	}

	// 特殊効果フィールド
	expectedCDReduction := 0.1 * scale
	if !floatEquals(modifiers.CDReduction, expectedCDReduction) {
		t.Errorf("CDReductionが期待値と異なります: got %f, want %f", modifiers.CDReduction, expectedCDReduction)
	}
}
