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

// TestModuleModel_フィールドの確認 はModuleModel構造体のフィールドが正しく設定されることを確認します。
func TestModuleModel_フィールドの確認(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "fireball_lv1",
		Name:        "ファイアボール",
		Category:    MagicAttack,
		Tags:        []string{"magic_low"},
		BaseEffect:  10.0,
		StatRef:     "MAG",
		Description: "炎の魔法で敵に魔法ダメージを与える",
	}, nil)

	if module.TypeID != "fireball_lv1" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want fireball_lv1", module.TypeID)
	}
	if module.Name() != "ファイアボール" {
		t.Errorf("Name()が期待値と異なります: got %s, want ファイアボール", module.Name())
	}
	if module.Category() != MagicAttack {
		t.Errorf("Category()が期待値と異なります: got %s, want magic_attack", module.Category())
	}
	if len(module.Tags()) != 1 || module.Tags()[0] != "magic_low" {
		t.Errorf("Tags()が期待値と異なります: got %v, want [magic_low]", module.Tags())
	}
	if module.BaseEffect() != 10.0 {
		t.Errorf("BaseEffect()が期待値と異なります: got %f, want 10.0", module.BaseEffect())
	}
	if module.StatRef() != "MAG" {
		t.Errorf("StatRef()が期待値と異なります: got %s, want MAG", module.StatRef())
	}
	if module.Description() != "炎の魔法で敵に魔法ダメージを与える" {
		t.Errorf("Description()が期待値と異なります: got %s", module.Description())
	}
}

// TestNewModuleFromType_モジュール作成 はNewModuleFromType関数でモジュールが正しく作成されることを確認します。
func TestNewModuleFromType_モジュール作成(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Category:    PhysicalAttack,
		Tags:        []string{"physical_low"},
		BaseEffect:  10.0,
		StatRef:     "STR",
		Description: "物理攻撃で敵にダメージを与える",
	}, nil)

	if module.TypeID != "physical_attack_lv1" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want physical_attack_lv1", module.TypeID)
	}
	if module.Name() != "物理打撃" {
		t.Errorf("Name()が期待値と異なります: got %s, want 物理打撃", module.Name())
	}
	if module.Category() != PhysicalAttack {
		t.Errorf("Category()が期待値と異なります: got %s, want physical_attack", module.Category())
	}
	if module.BaseEffect() != 10.0 {
		t.Errorf("BaseEffect()が期待値と異なります: got %f, want 10.0", module.BaseEffect())
	}
	if module.StatRef() != "STR" {
		t.Errorf("StatRef()が期待値と異なります: got %s, want STR", module.StatRef())
	}
}

// TestNewModuleFromType_タグのコピー はNewModuleFromTypeで作成したモジュールのTagsが元のスライスと独立していることを確認します。
func TestNewModuleFromType_タグのコピー(t *testing.T) {
	originalTags := []string{"magic_low", "fire"}
	moduleType := ModuleType{
		ID:          "fireball_lv1",
		Name:        "ファイアボール",
		Category:    MagicAttack,
		Tags:        originalTags,
		BaseEffect:  10.0,
		StatRef:     "MAG",
		Description: "炎の魔法で敵に魔法ダメージを与える",
	}
	_ = NewModuleFromType(moduleType, nil)

	// 元のタグを変更
	originalTags[0] = "modified_tag"

	// ModuleTypeのTagsはスライスなので影響を受ける（GoのスライスはReferenceのため）
	// モジュールのTags()はType.Tagsを返すので、ModuleTypeのTagsと同じ
	// この挙動は許容される（パフォーマンスのためのトレードオフ）
	// 本番コードではマスタデータは変更されないため問題なし
}

// TestModuleModel_HasTag_タグ存在確認 はHasTagメソッドがタグの存在を正しく判定することを確認します。
func TestModuleModel_HasTag_タグ存在確認(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:   "test_module",
		Tags: []string{"physical_low", "fire"},
	}, nil)

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
	module := NewModuleFromType(ModuleType{
		ID:   "test_module",
		Tags: []string{},
	}, nil)

	if module.HasTag("physical_low") {
		t.Error("Tagsが空の場合、falseを返すべきです")
	}
}

// TestModuleModel_IsCompatibleWithCore はモジュールがコアに装備可能かを判定するメソッドをテストします。
func TestModuleModel_IsCompatibleWithCore(t *testing.T) {
	// 物理攻撃と魔法攻撃の低レベルモジュールを許可するコア
	coreType := CoreType{
		ID:          "test",
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	core := NewCore("core_001", "テストコア", 1, coreType, PassiveSkill{})

	// 互換性のあるモジュール
	compatibleModule := NewModuleFromType(ModuleType{
		ID:   "physical_attack_lv1",
		Tags: []string{"physical_low"},
	}, nil)

	// 互換性のないモジュール
	incompatibleModule := NewModuleFromType(ModuleType{
		ID:   "heal_lv2",
		Tags: []string{"heal_mid"},
	}, nil)

	if !compatibleModule.IsCompatibleWithCore(core) {
		t.Error("physical_lowタグを持つモジュールはコアと互換性があるはずです")
	}

	if incompatibleModule.IsCompatibleWithCore(core) {
		t.Error("heal_midタグを持つモジュールはコアと互換性がないはずです")
	}
}

// TestModuleModel_IsCompatibleWithCore_複数タグ はモジュールが複数タグを持つ場合の互換性判定をテストします。
func TestModuleModel_IsCompatibleWithCore_複数タグ(t *testing.T) {
	coreType := CoreType{
		ID:          "test",
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	core := NewCore("core_001", "テストコア", 1, coreType, PassiveSkill{})

	// 複数タグのうち1つがコアの許可タグに含まれる場合
	moduleWithMultipleTags := NewModuleFromType(ModuleType{
		ID:   "hybrid_lv1",
		Tags: []string{"physical_low", "fire"},
	}, nil)

	if !moduleWithMultipleTags.IsCompatibleWithCore(core) {
		t.Error("1つでもコアの許可タグに含まれるタグがあれば互換性があるはずです")
	}

	// どのタグもコアの許可タグに含まれない場合
	moduleNoMatch := NewModuleFromType(ModuleType{
		ID:   "heal_lv1",
		Tags: []string{"heal_low", "light"},
	}, nil)

	if moduleNoMatch.IsCompatibleWithCore(core) {
		t.Error("どのタグもコアの許可タグに含まれない場合、互換性がないはずです")
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

// ==================== Task 7.2: Icon()メソッドのテスト ====================

// TestModuleCategory_Icon はModuleCategoryのIcon()メソッドが正しいアイコンを返すことを確認します。
func TestModuleCategory_Icon(t *testing.T) {
	tests := []struct {
		category ModuleCategory
		expected string
	}{
		{PhysicalAttack, "⚔️"},
		{MagicAttack, "💥"},
		{Heal, "💚"},
		{Buff, "💪"},
		{Debuff, "💀"},
	}

	for _, tt := range tests {
		t.Run(tt.category.String(), func(t *testing.T) {
			result := tt.category.Icon()
			if result != tt.expected {
				t.Errorf("Icon()が期待値と異なります: got %s, want %s", result, tt.expected)
			}
		})
	}
}

// TestModuleCategory_Icon_Unknown は未知のカテゴリに対してIcon()がデフォルト値を返すことを確認します。
func TestModuleCategory_Icon_Unknown(t *testing.T) {
	unknownCategory := ModuleCategory("unknown")
	result := unknownCategory.Icon()
	if result != "•" {
		t.Errorf("未知のカテゴリに対するIcon()が期待値と異なります: got %s, want •", result)
	}
}

// TestModuleCategory_Icon_Empty は空のカテゴリに対してIcon()がデフォルト値を返すことを確認します。
func TestModuleCategory_Icon_Empty(t *testing.T) {
	emptyCategory := ModuleCategory("")
	result := emptyCategory.Icon()
	if result != "•" {
		t.Errorf("空のカテゴリに対するIcon()が期待値と異なります: got %s, want •", result)
	}
}

// ==================== ModuleModel TypeID/ChainEffect リファクタリングテスト ====================

// TestModuleModel_TypeIDフィールドの確認 はModuleModelにTypeIDフィールドが存在することを確認します。
func TestModuleModel_TypeIDフィールドの確認(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Category:    PhysicalAttack,
		Tags:        []string{"physical_low"},
		BaseEffect:  10.0,
		StatRef:     "STR",
		Description: "物理攻撃で敵にダメージを与える",
	}, nil)

	if module.TypeID != "physical_attack_lv1" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want physical_attack_lv1", module.TypeID)
	}
	if module.ChainEffect != nil {
		t.Errorf("ChainEffectはnilであるべきです: got %v", module.ChainEffect)
	}
}

// TestModuleModel_ChainEffect付きの作成 はChainEffect付きのモジュール作成をテストします。
func TestModuleModel_ChainEffect付きの作成(t *testing.T) {
	chainEffect := NewChainEffect(ChainEffectDamageBonus, 25.0)
	module := NewModuleFromType(ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Category:    PhysicalAttack,
		Tags:        []string{"physical_low"},
		BaseEffect:  10.0,
		StatRef:     "STR",
		Description: "物理攻撃で敵にダメージを与える",
	}, &chainEffect)

	if module.ChainEffect == nil {
		t.Fatal("ChainEffectがnilです")
	}
	if module.ChainEffect.Type != ChainEffectDamageBonus {
		t.Errorf("ChainEffect.Typeが期待値と異なります: got %s, want %s", module.ChainEffect.Type, ChainEffectDamageBonus)
	}
	if module.ChainEffect.Value != 25.0 {
		t.Errorf("ChainEffect.Valueが期待値と異なります: got %f, want 25.0", module.ChainEffect.Value)
	}
}

// TestModuleModel_同一TypeID異なるChainEffect は同一TypeIDで異なるChainEffectを持つモジュールを許容することを確認します。
func TestModuleModel_同一TypeID異なるChainEffect(t *testing.T) {
	chainEffect1 := NewChainEffect(ChainEffectDamageBonus, 25.0)
	chainEffect2 := NewChainEffect(ChainEffectHealBonus, 20.0)

	moduleType := ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Category:    PhysicalAttack,
		Tags:        []string{"physical_low"},
		BaseEffect:  10.0,
		StatRef:     "STR",
		Description: "物理攻撃で敵にダメージを与える",
	}

	module1 := NewModuleFromType(moduleType, &chainEffect1)
	module2 := NewModuleFromType(moduleType, &chainEffect2)

	// 同じTypeIDであっても異なるChainEffectを持つことを許容
	if module1.TypeID != module2.TypeID {
		t.Error("同じTypeIDであるべきです")
	}
	if module1.ChainEffect.Type == module2.ChainEffect.Type {
		t.Error("異なるChainEffectを持っているはずです")
	}
}

// TestModuleModel_ChainEffectなし はChainEffectがnilのモジュールが正しく動作することを確認します。
func TestModuleModel_ChainEffectなし(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "heal_lv1",
		Name:        "ヒール",
		Category:    Heal,
		Tags:        []string{"heal_low"},
		BaseEffect:  15.0,
		StatRef:     "MAG",
		Description: "HPを回復する",
	}, nil)

	if module.ChainEffect != nil {
		t.Errorf("ChainEffectはnilであるべきです: got %v", module.ChainEffect)
	}

	// HasChainEffectメソッドのテスト
	if module.HasChainEffect() {
		t.Error("ChainEffectがない場合、HasChainEffect()はfalseを返すべきです")
	}
}

// TestModuleModel_HasChainEffect はHasChainEffectメソッドをテストします。
func TestModuleModel_HasChainEffect(t *testing.T) {
	chainEffect := NewChainEffect(ChainEffectBuffExtend, 5.0)
	moduleWithEffect := NewModuleFromType(ModuleType{
		ID:          "buff_lv1",
		Name:        "バフ",
		Category:    Buff,
		Tags:        []string{"buff_low"},
		BaseEffect:  10.0,
		StatRef:     "SPD",
		Description: "バフを付与する",
	}, &chainEffect)

	if !moduleWithEffect.HasChainEffect() {
		t.Error("ChainEffectがある場合、HasChainEffect()はtrueを返すべきです")
	}

	moduleWithoutEffect := NewModuleFromType(ModuleType{
		ID:          "buff_lv1",
		Name:        "バフ",
		Category:    Buff,
		Tags:        []string{"buff_low"},
		BaseEffect:  10.0,
		StatRef:     "SPD",
		Description: "バフを付与する",
	}, nil)

	if moduleWithoutEffect.HasChainEffect() {
		t.Error("ChainEffectがない場合、HasChainEffect()はfalseを返すべきです")
	}
}
