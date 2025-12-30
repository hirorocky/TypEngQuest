// Package integration_test は統合テストを提供します。

package integration_test

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
)

// newTestModule はテスト用モジュールを作成するヘルパー関数です。
func newTestModule(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Category:    category,
		Tags:        tags,
		BaseEffect:  baseEffect,
		StatRef:     statRef,
		Description: description,
	}, nil)
}

// ==================================================
// Task 15.1: ドメインモデル単体テスト
// ==================================================

func TestCoreModel_StatsCalculation(t *testing.T) {

	coreType := domain.CoreType{
		ID:   "test_type",
		Name: "テスト特性",
		StatWeights: map[string]float64{
			"STR": 1.2,
			"MAG": 0.8,
			"SPD": 1.0,
			"LUK": 1.0,
		},
		PassiveSkillID: "test_passive",
		AllowedTags:    []string{"physical_low"},
		MinDropLevel:   1,
	}

	passiveSkill := domain.PassiveSkill{
		ID:          "test_passive",
		Name:        "テストスキル",
		Description: "テスト説明",
	}

	core := domain.NewCore("core_1", "テストコア", 5, coreType, passiveSkill)

	// ステータス計算: 基礎値(10) × レベル(5) × 重み
	// STR: 10 × 5 × 1.2 = 60
	// MAG: 10 × 5 × 0.8 = 40
	// SPD: 10 × 5 × 1.0 = 50
	// LUK: 10 × 5 × 1.0 = 50
	if core.Stats.STR != 60 {
		t.Errorf("STR expected 60, got %d", core.Stats.STR)
	}
	if core.Stats.MAG != 40 {
		t.Errorf("MAG expected 40, got %d", core.Stats.MAG)
	}
	if core.Stats.SPD != 50 {
		t.Errorf("SPD expected 50, got %d", core.Stats.SPD)
	}
	if core.Stats.LUK != 50 {
		t.Errorf("LUK expected 50, got %d", core.Stats.LUK)
	}
}

func TestCoreModel_TagAllowance(t *testing.T) {
	// コア特性とモジュールタグの互換性チェック
	coreType := domain.CoreType{
		ID:          "test_type",
		Name:        "テスト特性",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト", Description: ""}
	core := domain.NewCore("core_1", "テストコア", 1, coreType, passiveSkill)

	// 許可されたタグ
	if !core.IsTagAllowed("physical_low") {
		t.Error("physical_low should be allowed")
	}
	if !core.IsTagAllowed("magic_low") {
		t.Error("magic_low should be allowed")
	}

	// 許可されていないタグ
	if core.IsTagAllowed("heal_low") {
		t.Error("heal_low should not be allowed")
	}
}

func TestModuleModel_CategoryAndTags(t *testing.T) {

	module := newTestModule(
		"module_1",
		"物理打撃Lv1",
		domain.PhysicalAttack,
		1,
		[]string{"physical_low"},
		10.0,
		"STR",
		"物理ダメージを与える",
	)

	// カテゴリチェック
	if module.Category() != domain.PhysicalAttack {
		t.Errorf("Category expected PhysicalAttack, got %v", module.Category())
	}

	// タグチェック
	if !module.HasTag("physical_low") {
		t.Error("Module should have physical_low tag")
	}
	if module.HasTag("magic_low") {
		t.Error("Module should not have magic_low tag")
	}
}

func TestModuleModel_CoreCompatibility(t *testing.T) {
	// モジュールとコアの互換性テスト
	coreType := domain.CoreType{
		ID:          "test_type",
		AllowedTags: []string{"physical_low", "magic_low"},
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト", Description: ""}
	core := domain.NewCore("core_1", "テストコア", 1, coreType, passiveSkill)

	// 互換性のあるモジュール
	compatibleModule := newTestModule(
		"module_1", "物理打撃Lv1", domain.PhysicalAttack, 1,
		[]string{"physical_low"}, 10.0, "STR", "物理攻撃",
	)
	if !compatibleModule.IsCompatibleWithCore(core) {
		t.Error("Module should be compatible with core")
	}

	// 互換性のないモジュール
	incompatibleModule := newTestModule(
		"module_2", "ヒールLv2", domain.Heal, 2,
		[]string{"heal_mid"}, 15.0, "MAG", "回復",
	)
	if incompatibleModule.IsCompatibleWithCore(core) {
		t.Error("Module should not be compatible with core")
	}
}

func TestAgentModel_LevelEqualsCore(t *testing.T) {

	coreType := domain.CoreType{
		ID:          "test_type",
		AllowedTags: []string{"physical_low", "magic_low", "heal_low", "buff_low"},
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト", Description: ""}
	core := domain.NewCore("core_1", "テストコア", 10, coreType, passiveSkill)

	modules := []*domain.ModuleModel{
		newTestModule("m1", "物理打撃Lv1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", ""),
		newTestModule("m2", "ファイアボールLv1", domain.MagicAttack, 1, []string{"magic_low"}, 10.0, "MAG", ""),
		newTestModule("m3", "ヒールLv1", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		newTestModule("m4", "バフLv1", domain.Buff, 1, []string{"buff_low"}, 5.0, "SPD", ""),
	}

	agent := domain.NewAgent("agent_1", core, modules)

	// エージェントレベル = コアレベル
	if agent.Level != core.Level {
		t.Errorf("Agent level expected %d, got %d", core.Level, agent.Level)
	}

	// 基礎ステータスがコアから導出される
	if agent.BaseStats.STR != core.Stats.STR {
		t.Error("Agent BaseStats.STR should equal Core.Stats.STR")
	}
}

func TestEnemyModel_PhaseChange(t *testing.T) {
	// 敵モデルのフェーズ変化テスト
	enemy := domain.NewEnemy(
		"enemy_1",
		"テスト敵",
		5,
		100,
		10,
		2000,
		domain.EnemyType{ID: "test", Name: "テスト"},
	)

	// 初期フェーズは通常
	if enemy.Phase != domain.PhaseNormal {
		t.Error("Initial phase should be Normal")
	}

	// HP 50%超ではフェーズ変化しない
	enemy.HP = 60
	if enemy.ShouldTransitionToEnhanced() {
		t.Error("Should not transition when HP > 50%")
	}

	// HP 50%以下でフェーズ変化可能
	enemy.HP = 50
	if !enemy.ShouldTransitionToEnhanced() {
		t.Error("Should transition when HP <= 50%")
	}

	// フェーズ変化を実行
	enemy.TransitionToEnhanced()
	if enemy.Phase != domain.PhaseEnhanced {
		t.Error("Phase should be Enhanced after transition")
	}

	// 既にEnhancedなら再度変化しない
	if enemy.ShouldTransitionToEnhanced() {
		t.Error("Should not transition twice")
	}
}

func TestEffectTable_Aggregate(t *testing.T) {
	table := domain.NewEffectTable()

	// バフを追加
	table.AddBuff("攻撃UP", 5.0, map[domain.EffectColumn]float64{
		domain.ColDamageBonus: 10,
	})

	// 乗算バフを追加
	table.AddBuff("攻撃UP×", 5.0, map[domain.EffectColumn]float64{
		domain.ColDamageMultiplier: 1.2,
	})

	ctx := domain.NewEffectContext(100, 100, 50, 100)
	result := table.Aggregate(ctx)

	// DamageBonus: 10, DamageMultiplier: 1.2
	if result.DamageBonus != 10 {
		t.Errorf("DamageBonus expected 10, got %d", result.DamageBonus)
	}
	if result.DamageMultiplier != 1.2 {
		t.Errorf("DamageMultiplier expected 1.2, got %f", result.DamageMultiplier)
	}
}

func TestEffectTable_UpdateDurations(t *testing.T) {
	// 効果テーブルの時間経過テスト
	table := domain.NewEffectTable()

	table.AddBuff("短時間バフ", 3.0, map[domain.EffectColumn]float64{
		domain.ColDamageBonus: 10,
	})

	// 時間経過
	table.UpdateDurations(2.0)
	if len(table.Entries) != 1 {
		t.Error("Buff should still exist after 2 seconds")
	}

	// さらに時間経過で削除
	table.UpdateDurations(2.0)
	if len(table.Entries) != 0 {
		t.Error("Buff should be removed after duration expires")
	}
}

func TestEffectTable_PermanentEffects(t *testing.T) {
	// 永続効果のテスト（パッシブスキル）
	table := domain.NewEffectTable()

	// 永続効果（Duration = nil）
	table.AddEntry(domain.EffectEntry{
		SourceType: domain.SourcePassive,
		SourceID:   "core_passive",
		Name:       "コア特性",
		Duration:   nil, // 永続
		Values: map[domain.EffectColumn]float64{
			domain.ColDamageBonus: 20,
		},
	})

	// 時間経過しても削除されない
	table.UpdateDurations(100.0)
	if len(table.Entries) != 1 {
		t.Error("Permanent effects should not be removed")
	}
}
