// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// TestModuleCategory_定数の確認 はModuleCategory定数が正しく定義されていることを確認します。
func TestModuleCategory_定数の確認(t *testing.T) {
	tests := []struct {
		name     string
		category ModuleCategory
		expected string
	}{
		{"物理攻撃", PhysicalAttack, "physical_attack"},
		{"魔法攻撃", MagicAttack, "magic_attack"},
		{"回復", Heal, "heal"},
		{"バフ", Buff, "buff"},
		{"デバフ", Debuff, "debuff"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if string(tt.category) != tt.expected {
				t.Errorf("ModuleCategoryが期待値と異なります: got %s, want %s", tt.category, tt.expected)
			}
		})
	}
}

// TestModuleCategory_String はModuleCategoryのString()メソッドが正しい日本語名を返すことを確認します。
func TestModuleCategory_String(t *testing.T) {
	tests := []struct {
		category ModuleCategory
		expected string
	}{
		{PhysicalAttack, "物理攻撃"},
		{MagicAttack, "魔法攻撃"},
		{Heal, "回復"},
		{Buff, "バフ"},
		{Debuff, "デバフ"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			if tt.category.String() != tt.expected {
				t.Errorf("String()が期待値と異なります: got %s, want %s", tt.category.String(), tt.expected)
			}
		})
	}
}

// TestModuleCategory_DefaultStatRef はカテゴリ別のデフォルト参照ステータスが正しいことを確認します。
func TestModuleCategory_DefaultStatRef(t *testing.T) {
	tests := []struct {
		category ModuleCategory
		expected string
	}{
		{PhysicalAttack, "STR"}, // 物理攻撃はSTR参照
		{MagicAttack, "MAG"},    // 魔法攻撃はMAG参照
		{Heal, "MAG"},           // 回復はMAG参照
		{Buff, "SPD"},           // バフはSPD参照（効果時間に影響）
		{Debuff, "SPD"},         // デバフはSPD参照（効果時間に影響）
	}

	for _, tt := range tests {
		t.Run(string(tt.category), func(t *testing.T) {
			if tt.category.DefaultStatRef() != tt.expected {
				t.Errorf("DefaultStatRef()が期待値と異なります: got %s, want %s", tt.category.DefaultStatRef(), tt.expected)
			}
		})
	}
}

// TestModuleModel_フィールドの確認 はModuleModel構造体のフィールドが正しく設定されることを確認します。
func TestModuleModel_フィールドの確認(t *testing.T) {
	module := ModuleModel{
		ID:          "fireball_lv1",
		Name:        "ファイアボール",
		Category:    MagicAttack,
		Level:       1,
		Tags:        []string{"magic_low"},
		BaseEffect:  10.0,
		StatRef:     "MAG",
		Description: "炎の魔法で敵に魔法ダメージを与える",
	}

	if module.ID != "fireball_lv1" {
		t.Errorf("IDが期待値と異なります: got %s, want fireball_lv1", module.ID)
	}
	if module.Name != "ファイアボール" {
		t.Errorf("Nameが期待値と異なります: got %s, want ファイアボール", module.Name)
	}
	if module.Category != MagicAttack {
		t.Errorf("Categoryが期待値と異なります: got %s, want magic_attack", module.Category)
	}
	if module.Level != 1 {
		t.Errorf("Levelが期待値と異なります: got %d, want 1", module.Level)
	}
	if len(module.Tags) != 1 || module.Tags[0] != "magic_low" {
		t.Errorf("Tagsが期待値と異なります: got %v, want [magic_low]", module.Tags)
	}
	if module.BaseEffect != 10.0 {
		t.Errorf("BaseEffectが期待値と異なります: got %f, want 10.0", module.BaseEffect)
	}
	if module.StatRef != "MAG" {
		t.Errorf("StatRefが期待値と異なります: got %s, want MAG", module.StatRef)
	}
	if module.Description != "炎の魔法で敵に魔法ダメージを与える" {
		t.Errorf("Descriptionが期待値と異なります: got %s", module.Description)
	}
}

// TestNewModule_モジュール作成 はNewModule関数でモジュールが正しく作成されることを確認します。
func TestNewModule_モジュール作成(t *testing.T) {
	module := NewModule(
		"physical_attack_lv1",
		"物理打撃",
		PhysicalAttack,
		1,
		[]string{"physical_low"},
		10.0,
		"STR",
		"物理攻撃で敵にダメージを与える",
	)

	if module.ID != "physical_attack_lv1" {
		t.Errorf("IDが期待値と異なります: got %s, want physical_attack_lv1", module.ID)
	}
	if module.Name != "物理打撃" {
		t.Errorf("Nameが期待値と異なります: got %s, want 物理打撃", module.Name)
	}
	if module.Category != PhysicalAttack {
		t.Errorf("Categoryが期待値と異なります: got %s, want physical_attack", module.Category)
	}
	if module.Level != 1 {
		t.Errorf("Levelが期待値と異なります: got %d, want 1", module.Level)
	}
	if module.BaseEffect != 10.0 {
		t.Errorf("BaseEffectが期待値と異なります: got %f, want 10.0", module.BaseEffect)
	}
	if module.StatRef != "STR" {
		t.Errorf("StatRefが期待値と異なります: got %s, want STR", module.StatRef)
	}
}

// TestNewModule_タグのコピー はNewModuleで作成したモジュールのTagsが元のスライスと独立していることを確認します。
func TestNewModule_タグのコピー(t *testing.T) {
	originalTags := []string{"magic_low", "fire"}
	module := NewModule(
		"fireball_lv1",
		"ファイアボール",
		MagicAttack,
		1,
		originalTags,
		10.0,
		"MAG",
		"炎の魔法で敵に魔法ダメージを与える",
	)

	// 元のタグを変更
	originalTags[0] = "modified_tag"

	// モジュールのTagsは影響を受けないはず
	if module.Tags[0] != "magic_low" {
		t.Errorf("ModuleModelのTagsが変更されています: got %s, want magic_low", module.Tags[0])
	}
}

// TestModuleModel_HasTag_タグ存在確認 はHasTagメソッドがタグの存在を正しく判定することを確認します。
func TestModuleModel_HasTag_タグ存在確認(t *testing.T) {
	module := ModuleModel{
		ID:   "test_module",
		Tags: []string{"physical_low", "fire"},
	}

	if !module.HasTag("physical_low") {
		t.Error("physical_lowタグが存在するはずですがfalseが返されました")
	}
	if !module.HasTag("fire") {
		t.Error("fireタグが存在するはずですがfalseが返されました")
	}
	if module.HasTag("magic_low") {
		t.Error("magic_lowタグは存在しないはずですがtrueが返されました")
	}
}

// TestModuleModel_HasTag_空タグリスト はTagsが空の場合に常にfalseを返すことを確認します。
func TestModuleModel_HasTag_空タグリスト(t *testing.T) {
	module := ModuleModel{
		ID:   "test_module",
		Tags: []string{},
	}

	if module.HasTag("physical_low") {
		t.Error("Tagsが空の場合、falseを返すべきです")
	}
}

// TestModuleModel_IsCompatibleWithCore はモジュールがコアに装備可能かを判定するメソッドをテストします。
func TestModuleModel_IsCompatibleWithCore(t *testing.T) {
	// 物理攻撃と魔法攻撃の低レベルモジュールを許可するコア
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{"physical_low", "magic_low"},
	}

	// 互換性のあるモジュール
	compatibleModule := ModuleModel{
		ID:   "physical_attack_lv1",
		Tags: []string{"physical_low"},
	}

	// 互換性のないモジュール
	incompatibleModule := ModuleModel{
		ID:   "heal_lv2",
		Tags: []string{"heal_mid"},
	}

	if !compatibleModule.IsCompatibleWithCore(&core) {
		t.Error("physical_lowタグを持つモジュールはコアと互換性があるはずです")
	}

	if incompatibleModule.IsCompatibleWithCore(&core) {
		t.Error("heal_midタグを持つモジュールはコアと互換性がないはずです")
	}
}

// TestModuleModel_IsCompatibleWithCore_複数タグ はモジュールが複数タグを持つ場合の互換性判定をテストします。
func TestModuleModel_IsCompatibleWithCore_複数タグ(t *testing.T) {
	core := CoreModel{
		ID:          "core_001",
		AllowedTags: []string{"physical_low", "magic_low"},
	}

	// 複数タグのうち1つがコアの許可タグに含まれる場合
	moduleWithMultipleTags := ModuleModel{
		ID:   "hybrid_lv1",
		Tags: []string{"physical_low", "fire"},
	}

	if !moduleWithMultipleTags.IsCompatibleWithCore(&core) {
		t.Error("1つでもコアの許可タグに含まれるタグがあれば互換性があるはずです")
	}

	// どのタグもコアの許可タグに含まれない場合
	moduleNoMatch := ModuleModel{
		ID:   "heal_lv1",
		Tags: []string{"heal_low", "light"},
	}

	if moduleNoMatch.IsCompatibleWithCore(&core) {
		t.Error("どのタグもコアの許可タグに含まれない場合、互換性がないはずです")
	}
}

// TestModuleCategory_IsAttack は攻撃系カテゴリかどうかを判定するメソッドをテストします。
func TestModuleCategory_IsAttack(t *testing.T) {
	if !PhysicalAttack.IsAttack() {
		t.Error("PhysicalAttackは攻撃系のはずです")
	}
	if !MagicAttack.IsAttack() {
		t.Error("MagicAttackは攻撃系のはずです")
	}
	if Heal.IsAttack() {
		t.Error("Healは攻撃系ではないはずです")
	}
	if Buff.IsAttack() {
		t.Error("Buffは攻撃系ではないはずです")
	}
	if Debuff.IsAttack() {
		t.Error("Debuffは攻撃系ではないはずです")
	}
}

// TestModuleCategory_IsSupport はサポート系カテゴリかどうかを判定するメソッドをテストします。
func TestModuleCategory_IsSupport(t *testing.T) {
	if PhysicalAttack.IsSupport() {
		t.Error("PhysicalAttackはサポート系ではないはずです")
	}
	if MagicAttack.IsSupport() {
		t.Error("MagicAttackはサポート系ではないはずです")
	}
	if !Heal.IsSupport() {
		t.Error("Healはサポート系のはずです")
	}
	if !Buff.IsSupport() {
		t.Error("Buffはサポート系のはずです")
	}
	if !Debuff.IsSupport() {
		t.Error("Debuffはサポート系のはずです")
	}
}

// TestModuleCategory_TargetsEnemy は敵をターゲットにするカテゴリかどうかを判定するメソッドをテストします。
func TestModuleCategory_TargetsEnemy(t *testing.T) {
	if !PhysicalAttack.TargetsEnemy() {
		t.Error("PhysicalAttackは敵をターゲットにするはずです")
	}
	if !MagicAttack.TargetsEnemy() {
		t.Error("MagicAttackは敵をターゲットにするはずです")
	}
	if Heal.TargetsEnemy() {
		t.Error("Healは敵をターゲットにしないはずです")
	}
	if Buff.TargetsEnemy() {
		t.Error("Buffは敵をターゲットにしないはずです")
	}
	if !Debuff.TargetsEnemy() {
		t.Error("Debuffは敵をターゲットにするはずです")
	}
}

// TestModuleCategory_TargetsPlayer はプレイヤーをターゲットにするカテゴリかどうかを判定するメソッドをテストします。
func TestModuleCategory_TargetsPlayer(t *testing.T) {
	if PhysicalAttack.TargetsPlayer() {
		t.Error("PhysicalAttackはプレイヤーをターゲットにしないはずです")
	}
	if MagicAttack.TargetsPlayer() {
		t.Error("MagicAttackはプレイヤーをターゲットにしないはずです")
	}
	if !Heal.TargetsPlayer() {
		t.Error("Healはプレイヤーをターゲットにするはずです")
	}
	if !Buff.TargetsPlayer() {
		t.Error("Buffはプレイヤーをターゲットにするはずです")
	}
	if Debuff.TargetsPlayer() {
		t.Error("Debuffはプレイヤーをターゲットにしないはずです")
	}
}

// TestModuleModel_GetCategoryTag はモジュールのカテゴリタグを取得するメソッドをテストします。
func TestModuleModel_GetCategoryTag(t *testing.T) {
	tests := []struct {
		name     string
		category ModuleCategory
		level    int
		expected string
	}{
		{"物理攻撃Lv1", PhysicalAttack, 1, "physical_low"},
		{"物理攻撃Lv2", PhysicalAttack, 2, "physical_mid"},
		{"物理攻撃Lv3", PhysicalAttack, 3, "physical_high"},
		{"魔法攻撃Lv1", MagicAttack, 1, "magic_low"},
		{"魔法攻撃Lv2", MagicAttack, 2, "magic_mid"},
		{"魔法攻撃Lv3", MagicAttack, 3, "magic_high"},
		{"回復Lv1", Heal, 1, "heal_low"},
		{"回復Lv2", Heal, 2, "heal_mid"},
		{"回復Lv3", Heal, 3, "heal_high"},
		{"バフLv1", Buff, 1, "buff_low"},
		{"バフLv2", Buff, 2, "buff_mid"},
		{"デバフLv1", Debuff, 1, "debuff_low"},
		{"デバフLv2", Debuff, 2, "debuff_mid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			module := ModuleModel{
				Category: tt.category,
				Level:    tt.level,
			}
			if module.GetCategoryTag() != tt.expected {
				t.Errorf("GetCategoryTag()が期待値と異なります: got %s, want %s", module.GetCategoryTag(), tt.expected)
			}
		})
	}
}

// TestModuleCategory_Unknown_String は未知のカテゴリに対してString()が適切な値を返すことを確認します。
func TestModuleCategory_Unknown_String(t *testing.T) {
	unknownCategory := ModuleCategory("unknown")
	result := unknownCategory.String()
	if result != "不明" {
		t.Errorf("未知のカテゴリに対するString()が期待値と異なります: got %s, want 不明", result)
	}
}

// TestModuleCategory_Unknown_DefaultStatRef は未知のカテゴリに対してDefaultStatRef()が適切な値を返すことを確認します。
func TestModuleCategory_Unknown_DefaultStatRef(t *testing.T) {
	unknownCategory := ModuleCategory("unknown")
	result := unknownCategory.DefaultStatRef()
	if result != "STR" {
		t.Errorf("未知のカテゴリに対するDefaultStatRef()が期待値と異なります: got %s, want STR", result)
	}
}

// TestGetLevelSuffix はレベルに応じた接尾辞が正しく返されることを確認します。
func TestGetLevelSuffix(t *testing.T) {
	tests := []struct {
		level    int
		expected string
	}{
		{1, "low"},
		{2, "mid"},
		{3, "high"},
		{4, "high"}, // 3以上はすべてhigh
		{10, "high"},
		{0, "low"},  // 0以下はlow
		{-1, "low"}, // 負の値はlow
	}

	for _, tt := range tests {
		t.Run(string(rune(tt.level)), func(t *testing.T) {
			result := GetLevelSuffix(tt.level)
			if result != tt.expected {
				t.Errorf("GetLevelSuffix(%d)が期待値と異なります: got %s, want %s", tt.level, result, tt.expected)
			}
		})
	}
}
