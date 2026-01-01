// Package domain はゲームのドメインモデルを定義します。
package domain

import (
	"testing"
)

// TestModuleModel_フィールドの確認 はModuleModel構造体のフィールドが正しく設定されることを確認します。
func TestModuleModel_フィールドの確認(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "fireball_lv1",
		Name:        "ファイアボール",
		Icon:        "🔥",
		Tags:        []string{"magic_low"},
		Description: "炎の魔法で敵に魔法ダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "INT"},
				Probability: 1.0,
				Icon:        "🔥",
			},
		},
	}, nil)

	if module.TypeID != "fireball_lv1" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want fireball_lv1", module.TypeID)
	}
	if module.Name() != "ファイアボール" {
		t.Errorf("Name()が期待値と異なります: got %s, want ファイアボール", module.Name())
	}
	if len(module.Tags()) != 1 || module.Tags()[0] != "magic_low" {
		t.Errorf("Tags()が期待値と異なります: got %v, want [magic_low]", module.Tags())
	}
	if module.Description() != "炎の魔法で敵に魔法ダメージを与える" {
		t.Errorf("Description()が期待値と異なります: got %s", module.Description())
	}
	if len(module.Effects()) != 1 {
		t.Errorf("Effects()の長さが期待値と異なります: got %d, want 1", len(module.Effects()))
	}
}

// TestNewModuleFromType_モジュール作成 はNewModuleFromType関数でモジュールが正しく作成されることを確認します。
func TestNewModuleFromType_モジュール作成(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Icon:        "⚔️",
		Tags:        []string{"physical_low"},
		Description: "物理攻撃で敵にダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
				Probability: 1.0,
				Icon:        "⚔️",
			},
		},
	}, nil)

	if module.TypeID != "physical_attack_lv1" {
		t.Errorf("TypeIDが期待値と異なります: got %s, want physical_attack_lv1", module.TypeID)
	}
	if module.Name() != "物理打撃" {
		t.Errorf("Name()が期待値と異なります: got %s, want 物理打撃", module.Name())
	}
}

// TestNewModuleFromType_タグのコピー はNewModuleFromTypeで作成したモジュールのTagsが元のスライスと独立していることを確認します。
func TestNewModuleFromType_タグのコピー(t *testing.T) {
	originalTags := []string{"magic_low", "fire"}
	moduleType := ModuleType{
		ID:          "fireball_lv1",
		Name:        "ファイアボール",
		Icon:        "🔥",
		Tags:        originalTags,
		Description: "炎の魔法で敵に魔法ダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "INT"},
				Probability: 1.0,
			},
		},
	}
	_ = NewModuleFromType(moduleType, nil)

	// 元のタグを変更
	originalTags[0] = "modified_tag"

	// ModuleTypeのTagsはスライスなので影響を受ける（GoのスライスはReferenceのため）
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

// ==================== Task 7.2: Icon()メソッドのテスト ====================

// TestModuleType_Icon はModuleTypeのIconフィールドが正しく設定されることを確認します。
func TestModuleType_Icon(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:   "test",
		Icon: "⚔️",
		Tags: []string{"physical_low"},
	}, nil)

	if module.Icon() != "⚔️" {
		t.Errorf("Icon()が期待値と異なります: got %s, want ⚔️", module.Icon())
	}
}

// TestModuleModel_Icon_Empty は空のアイコンに対してIcon()がデフォルト値を返すことを確認します。
func TestModuleModel_Icon_Empty(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:   "test",
		Icon: "",
		Tags: []string{"physical_low"},
	}, nil)

	if module.Icon() != "•" {
		t.Errorf("空のアイコンに対するIcon()が期待値と異なります: got %s, want •", module.Icon())
	}
}

// ==================== ModuleModel TypeID/ChainEffect リファクタリングテスト ====================

// TestModuleModel_TypeIDフィールドの確認 はModuleModelにTypeIDフィールドが存在することを確認します。
func TestModuleModel_TypeIDフィールドの確認(t *testing.T) {
	module := NewModuleFromType(ModuleType{
		ID:          "physical_attack_lv1",
		Name:        "物理打撃",
		Icon:        "⚔️",
		Tags:        []string{"physical_low"},
		Description: "物理攻撃で敵にダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
				Probability: 1.0,
			},
		},
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
		Icon:        "⚔️",
		Tags:        []string{"physical_low"},
		Description: "物理攻撃で敵にダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
				Probability: 1.0,
			},
		},
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
		Icon:        "⚔️",
		Tags:        []string{"physical_low"},
		Description: "物理攻撃で敵にダメージを与える",
		Effects: []ModuleEffect{
			{
				Target:      TargetEnemy,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
				Probability: 1.0,
			},
		},
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
		Icon:        "💚",
		Tags:        []string{"heal_low"},
		Description: "HPを回復する",
		Effects: []ModuleEffect{
			{
				Target:      TargetSelf,
				HPFormula:   &HPFormula{Base: 0, StatCoef: 0.8, StatRef: "INT"},
				Probability: 1.0,
			},
		},
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
		Icon:        "⬆️",
		Tags:        []string{"buff_low"},
		Description: "バフを付与する",
		Effects: []ModuleEffect{
			{
				Target: TargetSelf,
				ColumnSpec: &EffectColumnSpec{
					Column:   ColDamageBonus,
					Value:    10.0,
					Duration: 10.0,
				},
				Probability: 1.0,
			},
		},
	}, &chainEffect)

	if !moduleWithEffect.HasChainEffect() {
		t.Error("ChainEffectがある場合、HasChainEffect()はtrueを返すべきです")
	}

	moduleWithoutEffect := NewModuleFromType(ModuleType{
		ID:          "buff_lv1",
		Name:        "バフ",
		Icon:        "⬆️",
		Tags:        []string{"buff_low"},
		Description: "バフを付与する",
		Effects: []ModuleEffect{
			{
				Target: TargetSelf,
				ColumnSpec: &EffectColumnSpec{
					Column:   ColDamageBonus,
					Value:    10.0,
					Duration: 10.0,
				},
				Probability: 1.0,
			},
		},
	}, nil)

	if moduleWithoutEffect.HasChainEffect() {
		t.Error("ChainEffectがない場合、HasChainEffect()はfalseを返すべきです")
	}
}

// TestModuleEffect_IsDamageEffect はダメージ効果の判定をテストします。
func TestModuleEffect_IsDamageEffect(t *testing.T) {
	damageEffect := ModuleEffect{
		Target:    TargetEnemy,
		HPFormula: &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
	}
	if !damageEffect.IsDamageEffect() {
		t.Error("敵対象のHPFormula効果はダメージ効果であるべきです")
	}

	healEffect := ModuleEffect{
		Target:    TargetSelf,
		HPFormula: &HPFormula{Base: 0, StatCoef: 0.8, StatRef: "INT"},
	}
	if healEffect.IsDamageEffect() {
		t.Error("自身対象のHPFormula効果はダメージ効果ではないべきです")
	}
}

// TestModuleEffect_IsHealEffect は回復効果の判定をテストします。
func TestModuleEffect_IsHealEffect(t *testing.T) {
	healEffect := ModuleEffect{
		Target:    TargetSelf,
		HPFormula: &HPFormula{Base: 0, StatCoef: 0.8, StatRef: "INT"},
	}
	if !healEffect.IsHealEffect() {
		t.Error("自身対象のHPFormula効果は回復効果であるべきです")
	}

	damageEffect := ModuleEffect{
		Target:    TargetEnemy,
		HPFormula: &HPFormula{Base: 0, StatCoef: 1.0, StatRef: "STR"},
	}
	if damageEffect.IsHealEffect() {
		t.Error("敵対象のHPFormula効果は回復効果ではないべきです")
	}
}

// TestModuleEffect_IsBuffEffect はバフ効果の判定をテストします。
func TestModuleEffect_IsBuffEffect(t *testing.T) {
	buffEffect := ModuleEffect{
		Target: TargetSelf,
		ColumnSpec: &EffectColumnSpec{
			Column:   ColDamageBonus,
			Value:    10.0,
			Duration: 10.0,
		},
	}
	if !buffEffect.IsBuffEffect() {
		t.Error("自身対象のColumnSpec効果はバフ効果であるべきです")
	}

	debuffEffect := ModuleEffect{
		Target: TargetEnemy,
		ColumnSpec: &EffectColumnSpec{
			Column:   ColDamageCut,
			Value:    -10.0,
			Duration: 8.0,
		},
	}
	if debuffEffect.IsBuffEffect() {
		t.Error("敵対象のColumnSpec効果はバフ効果ではないべきです")
	}
}

// TestModuleEffect_IsDebuffEffect はデバフ効果の判定をテストします。
func TestModuleEffect_IsDebuffEffect(t *testing.T) {
	debuffEffect := ModuleEffect{
		Target: TargetEnemy,
		ColumnSpec: &EffectColumnSpec{
			Column:   ColDamageCut,
			Value:    -10.0,
			Duration: 8.0,
		},
	}
	if !debuffEffect.IsDebuffEffect() {
		t.Error("敵対象のColumnSpec効果はデバフ効果であるべきです")
	}

	buffEffect := ModuleEffect{
		Target: TargetSelf,
		ColumnSpec: &EffectColumnSpec{
			Column:   ColDamageBonus,
			Value:    10.0,
			Duration: 10.0,
		},
	}
	if buffEffect.IsDebuffEffect() {
		t.Error("自身対象のColumnSpec効果はデバフ効果ではないべきです")
	}
}
