// Package reward はドロップ・報酬システムのテストを提供します。

package rewarding

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// newTestModule はテスト用モジュールを作成するヘルパー関数です。
func newTestModule(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Category:    category,
		Level:       level,
		Tags:        tags,
		BaseEffect:  baseEffect,
		StatRef:     statRef,
		Description: description,
	}, nil)
}

// newTestModuleWithChainEffect はチェイン効果付きモジュールを作成するヘルパー関数です。
func newTestModuleWithChainEffect(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string, chainEffect *domain.ChainEffect) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Category:    category,
		Level:       level,
		Tags:        tags,
		BaseEffect:  baseEffect,
		StatRef:     statRef,
		Description: description,
	}, chainEffect)
}

// TestBattleReward_Victory_ShowsRewardScreen は勝利時に報酬画面を表示することをテストします。
func TestBattleReward_Victory_ShowsRewardScreen(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.5,
		TotalAccuracy:    0.95,
		ClearTime:        2*time.Minute + 30*time.Second,
		TotalTypingCount: 15,
	}

	result := calculator.CreateRewardResult(true, stats, 10)

	if !result.IsVictory {
		t.Error("勝利時にIsVictoryがtrueであるべき")
	}
	if result.Stats == nil {
		t.Error("統計情報が設定されるべき")
	}
	if !result.ShowRewardScreen {
		t.Error("勝利時は報酬画面を表示すべき")
	}
}

// TestBattleReward_Victory_ShowsStatistics は勝利時にバトル統計を表示することをテストします。
func TestBattleReward_Victory_ShowsStatistics(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.5,
		TotalAccuracy:    0.95,
		ClearTime:        2*time.Minute + 30*time.Second,
		TotalTypingCount: 15,
	}

	result := calculator.CreateRewardResult(true, stats, 10)

	if result.Stats.TotalWPM != 80.5 {
		t.Errorf("WPMが期待値と異なる: got %f, want %f", result.Stats.TotalWPM, 80.5)
	}
	if result.Stats.TotalAccuracy != 0.95 {
		t.Errorf("正確性が期待値と異なる: got %f, want %f", result.Stats.TotalAccuracy, 0.95)
	}
	if result.Stats.ClearTime != 2*time.Minute+30*time.Second {
		t.Errorf("クリアタイムが期待値と異なる: got %v", result.Stats.ClearTime)
	}
}

// TestBattleReward_Defeat_NoRewardScreen は敗北時に報酬画面を表示しないことをテストします。
func TestBattleReward_Defeat_NoRewardScreen(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	stats := &BattleStatistics{
		TotalWPM:      50.0,
		TotalAccuracy: 0.80,
		ClearTime:     3 * time.Minute,
	}

	result := calculator.CreateRewardResult(false, stats, 10)

	if result.IsVictory {
		t.Error("敗北時にIsVictoryがfalseであるべき")
	}
	if result.ShowRewardScreen {
		t.Error("敗北時は報酬画面を表示すべきでない")
	}
	if len(result.DroppedCores) > 0 || len(result.DroppedModules) > 0 {
		t.Error("敗北時はドロップがないべき")
	}
}

// TestCoreDrop_Judgment はコアドロップ判定が正しく動作することをテストします。
func TestCoreDrop_Judgment(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "test_core",
			Name:         "テストコア",
			MinDropLevel: 1,
			AllowedTags:  []string{"test"},
			StatWeights:  map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		},
	}
	calculator := NewRewardCalculator(coreTypes, nil, nil)

	// ドロップ率100%で確認
	calculator.SetCoreDropRate(1.0)

	droppedCore := calculator.RollCoreDrop(10)

	if droppedCore == nil {
		t.Error("ドロップ率100%でコアがドロップすべき")
	}
}

// TestCoreDrop_LevelInRange はコアレベルが敵レベル±範囲内であることをテストします。
func TestCoreDrop_LevelInRange(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "test_core",
			Name:         "テストコア",
			MinDropLevel: 1,
			AllowedTags:  []string{"test"},
			StatWeights:  map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		},
	}
	calculator := NewRewardCalculator(coreTypes, nil, nil)
	calculator.SetCoreDropRate(1.0)

	enemyLevel := 20
	levelRange := calculator.GetCoreLevelRange()

	// 複数回テストして範囲内であることを確認
	for i := 0; i < 50; i++ {
		droppedCore := calculator.RollCoreDrop(enemyLevel)
		if droppedCore == nil {
			continue
		}

		minLevel := enemyLevel - levelRange
		if minLevel < 1 {
			minLevel = 1
		}
		maxLevel := enemyLevel + levelRange

		if droppedCore.Level < minLevel || droppedCore.Level > maxLevel {
			t.Errorf("コアレベルが範囲外: got %d, want %d-%d", droppedCore.Level, minLevel, maxLevel)
		}
	}
}

// TestCoreDrop_MinDropLevel は特性別ドロップ最低敵レベル制限をテストします。
func TestCoreDrop_MinDropLevel(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "common_core",
			Name:         "一般コア",
			MinDropLevel: 1,
			AllowedTags:  []string{"test"},
			StatWeights:  map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		},
		{
			ID:           "rare_core",
			Name:         "レアコア",
			MinDropLevel: 10,
			AllowedTags:  []string{"test"},
			StatWeights:  map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		},
		{
			ID:           "epic_core",
			Name:         "エピックコア",
			MinDropLevel: 20,
			AllowedTags:  []string{"test"},
			StatWeights:  map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		},
	}
	calculator := NewRewardCalculator(coreTypes, nil, nil)
	calculator.SetCoreDropRate(1.0)

	// レベル5の敵からはMinDropLevel <= 5のコアのみドロップ可能
	eligibleTypes := calculator.GetEligibleCoreTypes(5)
	if len(eligibleTypes) != 1 {
		t.Errorf("レベル5では1種類のコアのみがドロップ可能: got %d", len(eligibleTypes))
	}
	if eligibleTypes[0].ID != "common_core" {
		t.Errorf("レベル5ではcommon_coreのみドロップ可能: got %s", eligibleTypes[0].ID)
	}

	// レベル15の敵からはMinDropLevel <= 15のコアがドロップ可能
	eligibleTypes = calculator.GetEligibleCoreTypes(15)
	if len(eligibleTypes) != 2 {
		t.Errorf("レベル15では2種類のコアがドロップ可能: got %d", len(eligibleTypes))
	}
}

// TestCoreDrop_InitialCoreTypes は初期コア特性のドロップ最低敵レベルをテストします。
func TestCoreDrop_InitialCoreTypes(t *testing.T) {
	// cores.jsonから読み込まれる初期設定を再現
	coreTypes := []domain.CoreType{
		{ID: "attack_balance", Name: "攻撃バランス", MinDropLevel: 1},
		{ID: "all_rounder", Name: "オールラウンダー", MinDropLevel: 1},
		{ID: "healer", Name: "ヒーラー", MinDropLevel: 3},
		{ID: "paladin", Name: "パラディン", MinDropLevel: 5},
	}
	calculator := NewRewardCalculator(coreTypes, nil, nil)

	// レベル1では2種類
	eligibleTypes := calculator.GetEligibleCoreTypes(1)
	if len(eligibleTypes) != 2 {
		t.Errorf("レベル1では2種類のコアがドロップ可能: got %d", len(eligibleTypes))
	}

	// レベル3では3種類
	eligibleTypes = calculator.GetEligibleCoreTypes(3)
	if len(eligibleTypes) != 3 {
		t.Errorf("レベル3では3種類のコアがドロップ可能: got %d", len(eligibleTypes))
	}

	// レベル5では4種類
	eligibleTypes = calculator.GetEligibleCoreTypes(5)
	if len(eligibleTypes) != 4 {
		t.Errorf("レベル5では4種類のコアがドロップ可能: got %d", len(eligibleTypes))
	}
}

// TestModuleDrop_Judgment はモジュールドロップ判定が正しく動作することをテストします。
func TestModuleDrop_Judgment(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "test_module",
			Name:         "テストモジュール",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
	}
	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	// ドロップ率100%で確認
	calculator.SetModuleDropRate(1.0)

	droppedModules := calculator.RollModuleDrop(10, 2)

	if len(droppedModules) == 0 {
		t.Error("ドロップ率100%でモジュールがドロップすべき")
	}
}

// TestModuleDrop_MinDropLevel はカテゴリ×レベル別ドロップ最低敵レベル制限をテストします。
func TestModuleDrop_MinDropLevel(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
		{
			ID:           "physical_lv2",
			Name:         "物理攻撃Lv2",
			Category:     domain.PhysicalAttack,
			Level:        2,
			Tags:         []string{"physical_mid"},
			MinDropLevel: 10,
		},
		{
			ID:           "physical_lv3",
			Name:         "物理攻撃Lv3",
			Category:     domain.PhysicalAttack,
			Level:        3,
			Tags:         []string{"physical_high"},
			MinDropLevel: 20,
		},
	}
	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	// レベル5の敵からはMinDropLevel <= 5のモジュールのみドロップ可能
	eligibleTypes := calculator.GetEligibleModuleTypes(5)
	if len(eligibleTypes) != 1 {
		t.Errorf("レベル5では1種類のモジュールのみがドロップ可能: got %d", len(eligibleTypes))
	}

	// レベル15の敵からはMinDropLevel <= 15のモジュールがドロップ可能
	eligibleTypes = calculator.GetEligibleModuleTypes(15)
	if len(eligibleTypes) != 2 {
		t.Errorf("レベル15では2種類のモジュールがドロップ可能: got %d", len(eligibleTypes))
	}

	// レベル25の敵からは全モジュールがドロップ可能
	eligibleTypes = calculator.GetEligibleModuleTypes(25)
	if len(eligibleTypes) != 3 {
		t.Errorf("レベル25では3種類のモジュールがドロップ可能: got %d", len(eligibleTypes))
	}
}

// TestModuleDrop_HighLevelProgression は高レベルモジュールの段階的ドロップ設定をテストします。
func TestModuleDrop_HighLevelProgression(t *testing.T) {
	// modules.jsonから読み込まれる設定を再現
	moduleTypes := []ModuleDropInfo{
		{ID: "physical_lv1", Name: "物理打撃Lv1", MinDropLevel: 1},
		{ID: "physical_lv2", Name: "物理打撃Lv2", MinDropLevel: 10},
		{ID: "physical_lv3", Name: "物理打撃Lv3", MinDropLevel: 20},
		{ID: "magic_lv1", Name: "ファイアボールLv1", MinDropLevel: 1},
		{ID: "magic_lv2", Name: "ファイアボールLv2", MinDropLevel: 10},
		{ID: "magic_lv3", Name: "ファイアボールLv3", MinDropLevel: 20},
	}
	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	// Lv1モジュールは敵Lv1以上でドロップ
	eligibleLv1 := calculator.GetEligibleModuleTypes(1)
	for _, m := range eligibleLv1 {
		if m.MinDropLevel > 1 {
			t.Errorf("レベル1で不正なモジュールがドロップ可能: %s", m.ID)
		}
	}

	// 高レベルほど高レベルの敵からのみドロップ
	for level := 1; level <= 30; level += 5 {
		eligible := calculator.GetEligibleModuleTypes(level)
		for _, m := range eligible {
			if m.MinDropLevel > level {
				t.Errorf("レベル%dでMinDropLevel=%dのモジュールがドロップ可能になっている", level, m.MinDropLevel)
			}
		}
	}
}

// TestInventoryFull_Warning はインベントリ満杯時に警告を表示することをテストします。
func TestInventoryFull_Warning(t *testing.T) {
	coreInv := domain.NewCoreInventory(2)
	moduleInv := domain.NewModuleInventory(2)

	// インベントリを満杯にする
	core1 := domain.NewCore("core1", "コア1", 1, domain.CoreType{}, domain.PassiveSkill{})
	core2 := domain.NewCore("core2", "コア2", 1, domain.CoreType{}, domain.PassiveSkill{})
	coreInv.Add(core1)
	coreInv.Add(core2)

	calculator := NewRewardCalculator(nil, nil, nil)

	// 満杯チェック
	warning := calculator.CheckInventoryFull(coreInv, moduleInv)

	if warning.CoreInventoryFull != true {
		t.Error("コアインベントリが満杯の場合、警告が出るべき")
	}
	if warning.WarningMessage == "" {
		t.Error("警告メッセージが設定されるべき")
	}
}

// TestInventoryFull_TempStorage は一時保管機能をテストします。
func TestInventoryFull_TempStorage(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	// ドロップしたアイテムを一時保管
	droppedCore := domain.NewCore("temp_core", "一時コア", 10, domain.CoreType{}, domain.PassiveSkill{})
	droppedModule := newTestModule("temp_module", "一時モジュール", domain.PhysicalAttack, 1, []string{}, 10.0, "STR", "テスト")

	storage := calculator.CreateTempStorage()
	storage.AddCore(droppedCore)
	storage.AddModule(droppedModule)

	if len(storage.Cores) != 1 {
		t.Errorf("一時保管コア数が期待と異なる: got %d, want 1", len(storage.Cores))
	}
	if len(storage.Modules) != 1 {
		t.Errorf("一時保管モジュール数が期待と異なる: got %d, want 1", len(storage.Modules))
	}

	// 後日受け取り
	retrievedCores := storage.RetrieveCores()
	if len(retrievedCores) != 1 {
		t.Errorf("受け取りコア数が期待と異なる: got %d, want 1", len(retrievedCores))
	}
	if len(storage.Cores) != 0 {
		t.Error("受け取り後は一時保管が空になるべき")
	}
}

// TestInventoryFull_PromptDiscard は不要アイテム破棄促進をテストします。
func TestInventoryFull_PromptDiscard(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	coreInv := domain.NewCoreInventory(2)
	core1 := domain.NewCore("core1", "コア1", 1, domain.CoreType{}, domain.PassiveSkill{})
	core2 := domain.NewCore("core2", "コア2", 1, domain.CoreType{}, domain.PassiveSkill{})
	coreInv.Add(core1)
	coreInv.Add(core2)

	moduleInv := domain.NewModuleInventory(10)

	warning := calculator.CheckInventoryFull(coreInv, moduleInv)

	if !warning.SuggestDiscard {
		t.Error("満杯時は破棄を促すべき")
	}
}

// ==================== チェイン効果ランダム決定テスト ====================

// TestChainEffectPool_CreateFromSkillEffects はチェイン効果プールの作成をテストします。
func TestChainEffectPool_CreateFromSkillEffects(t *testing.T) {
	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
		{
			ID:         "damage_cut",
			Name:       "ダメージカット",
			Category:   "defense",
			EffectType: domain.ChainEffectDamageCut,
			MinValue:   10,
			MaxValue:   30,
		},
	}

	pool := NewChainEffectPool(skillEffects)

	if pool == nil {
		t.Fatal("チェイン効果プールがnilであってはならない")
	}
	if len(pool.Effects) != 2 {
		t.Errorf("チェイン効果数が期待と異なる: got %d, want 2", len(pool.Effects))
	}
}

// TestChainEffectPool_GenerateRandomEffect はランダムなチェイン効果生成をテストします。
func TestChainEffectPool_GenerateRandomEffect(t *testing.T) {
	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
	}

	pool := NewChainEffectPool(skillEffects)

	// 複数回生成して値が範囲内であることを確認
	for i := 0; i < 50; i++ {
		effect := pool.GenerateRandomEffect()
		if effect == nil {
			continue // nilチェイン効果もあり得る
		}
		if effect.Value < 10 || effect.Value > 30 {
			t.Errorf("効果値が範囲外: got %.0f, want 10-30", effect.Value)
		}
		if effect.Type != domain.ChainEffectDamageAmp {
			t.Errorf("効果タイプが期待と異なる: got %s, want %s", effect.Type, domain.ChainEffectDamageAmp)
		}
	}
}

// TestChainEffectPool_GenerateWithNilProbability はチェイン効果なしの確率をテストします。
func TestChainEffectPool_GenerateWithNilProbability(t *testing.T) {
	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
	}

	pool := NewChainEffectPool(skillEffects)

	// nilチェイン効果確率を100%に設定
	pool.SetNoEffectProbability(1.0)

	for i := 0; i < 10; i++ {
		effect := pool.GenerateRandomEffect()
		if effect != nil {
			t.Error("nil確率100%でチェイン効果がnilであるべき")
		}
	}

	// nil確率を0%に設定
	pool.SetNoEffectProbability(0.0)

	foundNonNil := false
	for i := 0; i < 10; i++ {
		effect := pool.GenerateRandomEffect()
		if effect != nil {
			foundNonNil = true
			break
		}
	}
	if !foundNonNil {
		t.Error("nil確率0%でチェイン効果が生成されるべき")
	}
}

// TestModuleDrop_WithChainEffect はモジュールドロップ時にチェイン効果が付与されることをテストします。
func TestModuleDrop_WithChainEffect(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
	}

	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
	}

	pool := NewChainEffectPool(skillEffects)
	pool.SetNoEffectProbability(0.0) // チェイン効果を必ず付与

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetModuleDropRate(1.0)
	calculator.SetChainEffectPool(pool)

	droppedModules := calculator.RollModuleDrop(10, 2)

	if len(droppedModules) == 0 {
		t.Fatal("モジュールがドロップすべき")
	}

	for _, module := range droppedModules {
		if !module.HasChainEffect() {
			t.Error("nil確率0%でモジュールにチェイン効果が付与されるべき")
		}
	}
}

// TestModuleDrop_ChainEffectValueInRange はチェイン効果の値が範囲内であることをテストします。
func TestModuleDrop_ChainEffectValueInRange(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
	}

	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   15,
			MaxValue:   25,
		},
	}

	pool := NewChainEffectPool(skillEffects)
	pool.SetNoEffectProbability(0.0)

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetModuleDropRate(1.0)
	calculator.SetChainEffectPool(pool)

	// 複数回テストして値が範囲内であることを確認
	for i := 0; i < 50; i++ {
		droppedModules := calculator.RollModuleDrop(10, 1)
		if len(droppedModules) == 0 {
			continue
		}

		for _, module := range droppedModules {
			if module.ChainEffect == nil {
				continue
			}
			if module.ChainEffect.Value < 15 || module.ChainEffect.Value > 25 {
				t.Errorf("チェイン効果値が範囲外: got %.0f, want 15-25", module.ChainEffect.Value)
			}
		}
	}
}

// TestModuleDropInfo_ToDomainWithRandomChainEffect はチェイン効果付きドメイン変換をテストします。
func TestModuleDropInfo_ToDomainWithRandomChainEffect(t *testing.T) {
	dropInfo := ModuleDropInfo{
		ID:          "physical_lv1",
		Name:        "物理攻撃Lv1",
		Category:    domain.PhysicalAttack,
		Level:       1,
		Tags:        []string{"physical_low"},
		BaseEffect:  10.0,
		StatRef:     "STR",
		Description: "テスト",
	}

	effect := domain.NewChainEffect(domain.ChainEffectDamageAmp, 20)

	module := dropInfo.ToDomainWithChainEffect(&effect)

	if module == nil {
		t.Fatal("モジュールがnilであってはならない")
	}
	if module.ChainEffect == nil {
		t.Error("チェイン効果が設定されるべき")
	}
	if module.ChainEffect.Type != domain.ChainEffectDamageAmp {
		t.Errorf("チェイン効果タイプが期待と異なる: got %s, want %s", module.ChainEffect.Type, domain.ChainEffectDamageAmp)
	}
	if module.ChainEffect.Value != 20 {
		t.Errorf("チェイン効果値が期待と異なる: got %.0f, want 20", module.ChainEffect.Value)
	}
}

// ==================== タスク11.2: モジュール入手処理更新テスト ====================

// TestCalculateRewards_WithChainEffectPool はCalculateRewardsがチェイン効果プールを使用することをテストします。
func TestCalculateRewards_WithChainEffectPool(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
	}

	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
	}

	pool := NewChainEffectPool(skillEffects)
	pool.SetNoEffectProbability(0.0)

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetModuleDropRate(1.0)
	calculator.SetChainEffectPool(pool)

	stats := &BattleStatistics{
		TotalWPM:         80.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 10,
	}

	result := calculator.CalculateRewards(true, stats, 10)

	if result == nil {
		t.Fatal("報酬結果がnilであってはならない")
	}
	if len(result.DroppedModules) == 0 {
		t.Fatal("モジュールがドロップすべき")
	}

	// ドロップしたモジュールにチェイン効果が付与されていることを確認
	for _, module := range result.DroppedModules {
		if !module.HasChainEffect() {
			t.Error("nil確率0%でモジュールにチェイン効果が付与されるべき")
		}
	}
}

// TestAddRewardsToInventory_WithChainEffect はチェイン効果付きモジュールがインベントリに追加されることをテストします。
func TestAddRewardsToInventory_WithChainEffect(t *testing.T) {
	// チェイン効果付きモジュールを作成
	effect := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25)
	module := newTestModuleWithChainEffect(
		"physical_lv1",
		"物理攻撃Lv1",
		domain.PhysicalAttack,
		1,
		[]string{"physical_low"},
		10.0,
		"STR",
		"テスト",
		&effect,
	)

	// 報酬結果を作成
	result := &RewardResult{
		IsVictory:      true,
		DroppedModules: []*domain.ModuleModel{module},
	}

	// インベントリを作成
	moduleInv := domain.NewModuleInventory(10)
	coreInv := domain.NewCoreInventory(10)
	tempStorage := &TempStorage{}

	// インベントリに追加
	warning := AddRewardsToInventory(result, coreInv, moduleInv, tempStorage)

	if warning.ModuleInventoryFull {
		t.Error("インベントリは満杯でないはず")
	}

	// インベントリにモジュールが追加されたことを確認
	if moduleInv.Count() != 1 {
		t.Errorf("モジュール数が期待と異なる: got %d, want 1", moduleInv.Count())
	}

	// 追加されたモジュールのチェイン効果を確認
	modules := moduleInv.List()
	if len(modules) != 1 {
		t.Fatal("モジュールがインベントリに追加されるべき")
	}

	addedModule := modules[0]
	if !addedModule.HasChainEffect() {
		t.Error("追加されたモジュールにチェイン効果が保持されるべき")
	}
	if addedModule.ChainEffect.Type != domain.ChainEffectDamageAmp {
		t.Errorf("チェイン効果タイプが期待と異なる: got %s, want %s", addedModule.ChainEffect.Type, domain.ChainEffectDamageAmp)
	}
	if addedModule.ChainEffect.Value != 25 {
		t.Errorf("チェイン効果値が期待と異なる: got %.0f, want 25", addedModule.ChainEffect.Value)
	}
}

// TestChainEffectPool_MultipleEffectTypes は複数のチェイン効果タイプからランダム選択されることをテストします。
func TestChainEffectPool_MultipleEffectTypes(t *testing.T) {
	skillEffects := []SkillEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   30,
		},
		{
			ID:         "damage_cut",
			Name:       "ダメージカット",
			Category:   "defense",
			EffectType: domain.ChainEffectDamageCut,
			MinValue:   10,
			MaxValue:   30,
		},
		{
			ID:         "heal_amp",
			Name:       "ヒールアンプ",
			Category:   "heal",
			EffectType: domain.ChainEffectHealAmp,
			MinValue:   15,
			MaxValue:   35,
		},
	}

	pool := NewChainEffectPool(skillEffects)
	pool.SetNoEffectProbability(0.0)

	// 複数回生成して複数タイプが選択されることを確認
	typeCounts := make(map[domain.ChainEffectType]int)

	for i := 0; i < 100; i++ {
		effect := pool.GenerateRandomEffect()
		if effect != nil {
			typeCounts[effect.Type]++
		}
	}

	// 最低2種類は選択されているはず（確率的に）
	if len(typeCounts) < 2 {
		t.Errorf("複数のチェイン効果タイプが選択されるべき: got %d types", len(typeCounts))
	}
}

// TestChainEffectPool_EmptyEffects は空のチェイン効果プールでnilが返ることをテストします。
func TestChainEffectPool_EmptyEffects(t *testing.T) {
	pool := NewChainEffectPool(nil)

	effect := pool.GenerateRandomEffect()

	if effect != nil {
		t.Error("空のプールではnilが返るべき")
	}
}

// TestModuleDrop_NoChainEffectPool はチェイン効果プールなしでドロップした場合をテストします。
func TestModuleDrop_NoChainEffectPool(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Category:     domain.PhysicalAttack,
			Level:        1,
			Tags:         []string{"physical_low"},
			MinDropLevel: 1,
		},
	}

	// チェイン効果プールなしでCalculator作成
	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetModuleDropRate(1.0)

	droppedModules := calculator.RollModuleDrop(10, 2)

	if len(droppedModules) == 0 {
		t.Fatal("モジュールがドロップすべき")
	}

	// チェイン効果プールなしではチェイン効果なし
	for _, module := range droppedModules {
		if module.HasChainEffect() {
			t.Error("チェイン効果プールなしではチェイン効果がnilであるべき")
		}
	}
}
