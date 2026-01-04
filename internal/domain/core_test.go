// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// TestStats_ゼロ値の確認 はStats構造体のゼロ値が正しいことを確認します。
func TestStats_ゼロ値の確認(t *testing.T) {
	stats := Stats{}

	if stats.STR != 0 {
		t.Errorf("STRのゼロ値が期待値と異なります: got %d, want 0", stats.STR)
	}
	if stats.INT != 0 {
		t.Errorf("INTのゼロ値が期待値と異なります: got %d, want 0", stats.INT)
	}
	if stats.WIL != 0 {
		t.Errorf("WILのゼロ値が期待値と異なります: got %d, want 0", stats.WIL)
	}
	if stats.LUK != 0 {
		t.Errorf("LUKのゼロ値が期待値と異なります: got %d, want 0", stats.LUK)
	}
}

// TestStats_値の設定 はStats構造体に値を設定できることを確認します。
func TestStats_値の設定(t *testing.T) {
	stats := Stats{
		STR: 10,
		INT: 20,
		WIL: 15,
		LUK: 5,
	}

	if stats.STR != 10 {
		t.Errorf("STRの値が期待値と異なります: got %d, want 10", stats.STR)
	}
	if stats.INT != 20 {
		t.Errorf("INTの値が期待値と異なります: got %d, want 20", stats.INT)
	}
	if stats.WIL != 15 {
		t.Errorf("WILの値が期待値と異なります: got %d, want 15", stats.WIL)
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
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
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

	core := CoreModel{
		ID:           "core_001",
		Name:         "バランスコア",
		Level:        10,
		Type:         coreType,
		Stats:        Stats{STR: 12, INT: 10, WIL: 8, LUK: 10},
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
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(1, coreType)

	// 基礎値10 × レベル1 × 重み = 期待値
	// STR: 10 × 1 × 1.2 = 12
	// INT: 10 × 1 × 1.0 = 10
	// WIL: 10 × 1 × 0.8 = 8
	// LUK: 10 × 1.0 = 10（レベルに依存しない）
	if stats.STR != 12 {
		t.Errorf("STRが期待値と異なります: got %d, want 12", stats.STR)
	}
	if stats.INT != 10 {
		t.Errorf("INTが期待値と異なります: got %d, want 10", stats.INT)
	}
	if stats.WIL != 8 {
		t.Errorf("WILが期待値と異なります: got %d, want 8", stats.WIL)
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
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値
	// STR: 10 × 10 × 1.2 = 120
	// INT: 10 × 10 × 1.0 = 100
	// WIL: 10 × 10 × 0.8 = 80
	// LUK: 10 × 1.0 = 10（レベルに依存しない）
	if stats.STR != 120 {
		t.Errorf("STRが期待値と異なります: got %d, want 120", stats.STR)
	}
	if stats.INT != 100 {
		t.Errorf("INTが期待値と異なります: got %d, want 100", stats.INT)
	}
	if stats.WIL != 80 {
		t.Errorf("WILが期待値と異なります: got %d, want 80", stats.WIL)
	}
	if stats.LUK != 10 {
		t.Errorf("LUKが期待値と異なります: got %d, want 10", stats.LUK)
	}
}

// TestCalculateStats_ヒーラー特性 はヒーラー特性（INT特化）でステータスが正しく計算されることを確認します。
func TestCalculateStats_ヒーラー特性(t *testing.T) {
	coreType := CoreType{
		ID:             "healer",
		Name:           "ヒーラー",
		StatWeights:    map[string]float64{"STR": 0.5, "INT": 1.5, "WIL": 0.8, "LUK": 1.2},
		PassiveSkillID: "healing_aura",
		AllowedTags:    []string{"heal_mid", "heal_high"},
		MinDropLevel:   3,
	}

	stats := CalculateStats(5, coreType)

	// 基礎値10 × レベル5 × 重み = 期待値
	// STR: 10 × 5 × 0.5 = 25
	// INT: 10 × 5 × 1.5 = 75
	// WIL: 10 × 5 × 0.8 = 40
	// LUK: 10 × 1.2 = 12（レベルに依存しない）
	if stats.STR != 25 {
		t.Errorf("STRが期待値と異なります: got %d, want 25", stats.STR)
	}
	if stats.INT != 75 {
		t.Errorf("INTが期待値と異なります: got %d, want 75", stats.INT)
	}
	if stats.WIL != 40 {
		t.Errorf("WILが期待値と異なります: got %d, want 40", stats.WIL)
	}
	if stats.LUK != 12 {
		t.Errorf("LUKが期待値と異なります: got %d, want 12", stats.LUK)
	}
}

// TestCalculateStats_オールラウンダー特性 はオールラウンダー特性（均等）でステータスが正しく計算されることを確認します。
func TestCalculateStats_オールラウンダー特性(t *testing.T) {
	coreType := CoreType{
		ID:             "all_rounder",
		Name:           "オールラウンダー",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		PassiveSkillID: "versatile",
		AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
		MinDropLevel:   1,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値
	// STR, INT, WIL: 100
	// LUK: 10 × 1.0 = 10（レベルに依存しない）
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	if stats.INT != 100 {
		t.Errorf("INTが期待値と異なります: got %d, want 100", stats.INT)
	}
	if stats.WIL != 100 {
		t.Errorf("WILが期待値と異なります: got %d, want 100", stats.WIL)
	}
	if stats.LUK != 10 {
		t.Errorf("LUKが期待値と異なります: got %d, want 10", stats.LUK)
	}
}

// TestCalculateStats_パラディン特性 はパラディン特性でステータスが正しく計算されることを確認します。
func TestCalculateStats_パラディン特性(t *testing.T) {
	coreType := CoreType{
		ID:             "paladin",
		Name:           "パラディン",
		StatWeights:    map[string]float64{"STR": 1.0, "INT": 1.1, "WIL": 0.7, "LUK": 1.2},
		PassiveSkillID: "holy_protection",
		AllowedTags:    []string{"buff_mid", "heal_low"},
		MinDropLevel:   5,
	}

	stats := CalculateStats(10, coreType)

	// 基礎値10 × レベル10 × 重み = 期待値
	// STR: 10 × 10 × 1.0 = 100
	// INT: 10 × 10 × 1.1 = 110
	// WIL: 10 × 10 × 0.7 = 70
	// LUK: 10 × 1.2 = 12（レベルに依存しない）
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	if stats.INT != 110 {
		t.Errorf("INTが期待値と異なります: got %d, want 110", stats.INT)
	}
	if stats.WIL != 70 {
		t.Errorf("WILが期待値と異なります: got %d, want 70", stats.WIL)
	}
	if stats.LUK != 12 {
		t.Errorf("LUKが期待値と異なります: got %d, want 12", stats.LUK)
	}
}

// TestNewCore_コア作成 はNewCore関数でコアが正しく作成されることを確認します。
func TestNewCore_コア作成(t *testing.T) {
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
		INT: 20,
		WIL: 15,
		LUK: 5,
	}

	total := stats.Total()
	expected := 50

	if total != expected {
		t.Errorf("Totalが期待値と異なります: got %d, want %d", total, expected)
	}
}

// TestCalculateStats_レベル0 はレベル0の場合にSTR/INT/WILが0になることを確認します。
// LUKはレベルに依存しないため、0ではありません。
func TestCalculateStats_レベル0(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.5, "INT": 1.5, "WIL": 1.5, "LUK": 1.5},
	}

	stats := CalculateStats(0, coreType)

	// STR, INT, WILはレベル依存なので0
	if stats.STR != 0 || stats.INT != 0 || stats.WIL != 0 {
		t.Errorf("レベル0の場合、STR/INT/WILは0になるべきです: got STR=%d, INT=%d, WIL=%d",
			stats.STR, stats.INT, stats.WIL)
	}
	// LUKはレベルに依存しないので10 × 1.5 = 15
	if stats.LUK != 15 {
		t.Errorf("LUKはレベルに依存しません: got %d, want 15", stats.LUK)
	}
}

// TestCalculateStats_最大レベル はレベル100のコアでステータスが正しく計算されることを確認します。
func TestCalculateStats_最大レベル(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
	}

	stats := CalculateStats(100, coreType)

	// 基礎値10 × レベル100 × 重み1.0 = 1000
	if stats.STR != 1000 {
		t.Errorf("STRが期待値と異なります: got %d, want 1000", stats.STR)
	}
	// LUKはレベルに依存しないので10 × 1.0 = 10
	if stats.LUK != 10 {
		t.Errorf("LUKはレベルに依存しません: got %d, want 10", stats.LUK)
	}
}

// TestCalculateStats_重み未設定 は重みが設定されていないステータスが0になることを確認します。
func TestCalculateStats_重み未設定(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		StatWeights: map[string]float64{"STR": 1.0}, // INT, WIL, LUK は未設定
	}

	stats := CalculateStats(10, coreType)

	// STRは設定あり: 10 × 10 × 1.0 = 100
	if stats.STR != 100 {
		t.Errorf("STRが期待値と異なります: got %d, want 100", stats.STR)
	}
	// INT, WIL, LUKは未設定のため0（重み0.0扱い）
	if stats.INT != 0 {
		t.Errorf("INTは未設定のため0になるべきです: got %d", stats.INT)
	}
	if stats.WIL != 0 {
		t.Errorf("WILは未設定のため0になるべきです: got %d", stats.WIL)
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
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
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

// ==================== CoreModel TypeIDベースリファクタリングテスト ====================

// TestCoreModel_TypeIDフィールドの確認 はCoreModelにTypeIDフィールドが存在することを確認します。
func TestCoreModel_TypeIDフィールドの確認(t *testing.T) {
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

	core := NewCoreWithTypeID("attack_balance", 10, coreType, passiveSkill)

	if core.TypeID != "attack_balance" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want attack_balance", core.TypeID)
	}
	if core.Level != 10 {
		t.Errorf("Levelが期待値と異なります: got %d, want 10", core.Level)
	}
	// Nameはデフォルトで "Type.Name Lv.Level" 形式
	expectedName := "攻撃バランス Lv.10"
	if core.Name != expectedName {
		t.Errorf("Nameが期待値と異なります: got %s, want %s", core.Name, expectedName)
	}
}

// TestCoreModel_Equals_同一性判定 はEqualsメソッドがTypeIDとLevelで同一性を判定することを確認します。
func TestCoreModel_Equals_同一性判定(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance"}

	core1 := NewCoreWithTypeID("attack_balance", 10, coreType, passiveSkill)
	core2 := NewCoreWithTypeID("attack_balance", 10, coreType, passiveSkill)
	core3 := NewCoreWithTypeID("attack_balance", 5, coreType, passiveSkill)
	core4 := NewCoreWithTypeID("healer", 10, coreType, passiveSkill)

	if !core1.Equals(core2) {
		t.Error("同じTypeIDとLevelのコアは等価であるべきです")
	}

	if core1.Equals(core3) {
		t.Error("異なるLevelのコアは等価でないべきです")
	}

	if core1.Equals(core4) {
		t.Error("異なるTypeIDのコアは等価でないべきです")
	}
}

// TestCoreModel_Equals_nilチェック はEqualsメソッドがnilを正しく処理することを確認します。
func TestCoreModel_Equals_nilチェック(t *testing.T) {
	coreType := CoreType{
		ID:          "attack_balance",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
	}
	passiveSkill := PassiveSkill{ID: "test"}
	core := NewCoreWithTypeID("attack_balance", 10, coreType, passiveSkill)

	if core.Equals(nil) {
		t.Error("nilとの比較はfalseを返すべきです")
	}
}

// TestCoreModel_ステータス再計算 はNewCoreWithTypeIDでステータスが正しく計算されることを確認します。
func TestCoreModel_ステータス再計算(t *testing.T) {
	coreType := CoreType{
		ID:             "attack_balance",
		Name:           "攻撃バランス",
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		PassiveSkillID: "balanced_stance",
		AllowedTags:    []string{"physical_low", "magic_low"},
	}
	passiveSkill := PassiveSkill{ID: "balanced_stance"}

	core := NewCoreWithTypeID("attack_balance", 10, coreType, passiveSkill)

	// ステータスがTypeIDとLevelから正しく計算されていることを確認
	// STR: 10 × 10 × 1.2 = 120
	if core.Stats.STR != 120 {
		t.Errorf("Stats.STRが期待値と異なります: got %d, want 120", core.Stats.STR)
	}
}
