// Package reward はドロップ・報酬システムのテストを提供します。

package rewarding

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// newTestModule はテスト用ダメージモジュールを作成するヘルパー関数です。
func newTestModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⚔️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetEnemy,
				HPFormula:   &domain.HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "⚔️",
			},
		},
	}, nil)
}

// newTestModuleWithChainEffect はチェイン効果付きモジュールを作成するヘルパー関数です。
func newTestModuleWithChainEffect(id, name string, tags []string, statCoef float64, statRef, description string, chainEffect *domain.ChainEffect) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⚔️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetEnemy,
				HPFormula:   &domain.HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "⚔️",
			},
		},
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
	droppedModule := newTestModule("temp_module", "一時モジュール", []string{}, 10.0, "STR", "テスト")

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
	skillEffects := []ChainEffectDefinition{
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
	skillEffects := []ChainEffectDefinition{
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
	skillEffects := []ChainEffectDefinition{
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

// TestModuleDropInfo_ToDomainWithRandomChainEffect はチェイン効果付きドメイン変換をテストします。
func TestModuleDropInfo_ToDomainWithRandomChainEffect(t *testing.T) {
	dropInfo := ModuleDropInfo{
		ID:          "physical_lv1",
		Name:        "物理攻撃Lv1",
		Icon:        "⚔️",
		Tags:        []string{"physical_low"},
		Description: "テスト",
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetEnemy,
				HPFormula:   &domain.HPFormula{Base: 10.0, StatCoef: 1.0, StatRef: "STR"},
				Probability: 1.0,
			},
		},
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

// TestAddRewardsToInventory_WithChainEffect はチェイン効果付きモジュールがインベントリに追加されることをテストします。
func TestAddRewardsToInventory_WithChainEffect(t *testing.T) {
	// チェイン効果付きモジュールを作成
	effect := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25)
	module := newTestModuleWithChainEffect(
		"physical_lv1",
		"物理攻撃Lv1",
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
	skillEffects := []ChainEffectDefinition{
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

// ==================== タスク5.1: 確定ドロップの基本ロジックテスト ====================

// TestCalculateGuaranteedReward_EnemyWithDropCategory は敵にドロップカテゴリ設定がある場合に確定ドロップすることをテストします。
func TestCalculateGuaranteedReward_EnemyWithDropCategory(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			AllowedTags:  []string{"physical_low"},
			StatWeights:  map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		},
	}
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	calculator := NewRewardCalculator(coreTypes, moduleTypes, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 10,
	}

	// コアドロップ設定の敵タイプ
	enemyType := domain.EnemyType{
		ID:               "slime",
		Name:             "スライム",
		DropItemCategory: "core",
		DropItemTypeID:   "attack_balance",
	}

	result := calculator.CalculateGuaranteedReward(stats, 10, enemyType)

	if result == nil {
		t.Fatal("報酬結果がnilであってはならない")
	}
	if !result.IsVictory {
		t.Error("勝利フラグがtrueであるべき")
	}

	// 必ず1つのアイテムがドロップすること
	totalItems := len(result.DroppedCores) + len(result.DroppedModules)
	if totalItems != 1 {
		t.Errorf("確定ドロップで1つのアイテムがドロップすべき: got %d", totalItems)
	}

	// コアがドロップすること
	if len(result.DroppedCores) != 1 {
		t.Errorf("コアがドロップすべき: got %d cores", len(result.DroppedCores))
	}

	// ドロップしたコアがTypeIDに対応していること
	if len(result.DroppedCores) > 0 {
		core := result.DroppedCores[0]
		if core.Type.ID != "attack_balance" {
			t.Errorf("コアTypeIDが期待と異なる: got %s, want attack_balance", core.Type.ID)
		}
	}
}

// TestCalculateGuaranteedReward_ModuleDrop はモジュールドロップ設定の敵からモジュールがドロップすることをテストします。
func TestCalculateGuaranteedReward_ModuleDrop(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
			Effects: []domain.ModuleEffect{
				{Target: domain.TargetEnemy, Probability: 1.0},
			},
		},
	}

	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 10,
	}

	// モジュールドロップ設定の敵タイプ
	enemyType := domain.EnemyType{
		ID:               "goblin",
		Name:             "ゴブリン",
		DropItemCategory: "module",
		DropItemTypeID:   "physical_lv1",
	}

	result := calculator.CalculateGuaranteedReward(stats, 10, enemyType)

	// 必ず1つのアイテムがドロップすること
	totalItems := len(result.DroppedCores) + len(result.DroppedModules)
	if totalItems != 1 {
		t.Errorf("確定ドロップで1つのアイテムがドロップすべき: got %d", totalItems)
	}

	// モジュールがドロップすること
	if len(result.DroppedModules) != 1 {
		t.Errorf("モジュールがドロップすべき: got %d modules", len(result.DroppedModules))
	}

	// ドロップしたモジュールがTypeIDに対応していること
	if len(result.DroppedModules) > 0 {
		module := result.DroppedModules[0]
		if module.TypeID != "physical_lv1" {
			t.Errorf("モジュールTypeIDが期待と異なる: got %s, want physical_lv1", module.TypeID)
		}
	}
}

// TestCalculateGuaranteedReward_PanicOnMissingDropConfig はドロップ設定がない場合にpanicすることをテストします。
func TestCalculateGuaranteedReward_PanicOnMissingDropConfig(t *testing.T) {
	calculator := NewRewardCalculator(nil, nil, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 10,
	}

	// ドロップ設定がない敵タイプ
	enemyType := domain.EnemyType{
		ID:               "unknown_enemy",
		Name:             "不明な敵",
		DropItemCategory: "", // 空
		DropItemTypeID:   "", // 空
	}

	defer func() {
		if r := recover(); r == nil {
			t.Error("ドロップ設定がない場合にpanicすべき")
		}
	}()

	calculator.CalculateGuaranteedReward(stats, 10, enemyType)
}

// TestCalculateGuaranteedReward_PanicOnInvalidTypeID は不正なTypeIDの場合にpanicすることをテストします。
func TestCalculateGuaranteedReward_PanicOnInvalidTypeID(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			StatWeights:  map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		},
	}

	calculator := NewRewardCalculator(coreTypes, nil, nil)

	stats := &BattleStatistics{
		TotalWPM:         80.0,
		TotalAccuracy:    0.95,
		TotalTypingCount: 10,
	}

	// 存在しないTypeID
	enemyType := domain.EnemyType{
		ID:               "unknown_enemy",
		Name:             "不明な敵",
		DropItemCategory: "core",
		DropItemTypeID:   "non_existent_core",
	}

	defer func() {
		if r := recover(); r == nil {
			t.Error("存在しないTypeIDの場合にpanicすべき")
		}
	}()

	calculator.CalculateGuaranteedReward(stats, 10, enemyType)
}

// ==================== タスク5.2: コアドロップの品質計算テスト ====================

// TestRollCoreDropWithTypeID_GeneratesCorrectType は指定したTypeIDのコアが生成されることをテストします。
func TestRollCoreDropWithTypeID_GeneratesCorrectType(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			AllowedTags:  []string{"physical_low"},
			StatWeights:  map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 0.8, "LUK": 1.0},
		},
		{
			ID:           "healer",
			Name:         "ヒーラー",
			MinDropLevel: 3,
			AllowedTags:  []string{"heal_low"},
			StatWeights:  map[string]float64{"STR": 0.5, "INT": 1.5, "WIL": 0.8, "LUK": 1.2},
		},
	}

	calculator := NewRewardCalculator(coreTypes, nil, nil)

	// attack_balance を指定
	core := calculator.RollCoreDropWithTypeID("attack_balance", 10)

	if core == nil {
		t.Fatal("コアがnilであってはならない")
	}
	if core.Type.ID != "attack_balance" {
		t.Errorf("コアTypeIDが期待と異なる: got %s, want attack_balance", core.Type.ID)
	}
	if core.Type.Name != "攻撃バランス" {
		t.Errorf("コアType.Nameが期待と異なる: got %s, want 攻撃バランス", core.Type.Name)
	}
	// core.Nameはレベルを含む表示用名前
	expectedName := "攻撃バランス Lv.10"
	if core.Name != expectedName {
		t.Errorf("コア名が期待と異なる: got %s, want %s", core.Name, expectedName)
	}
}

// TestRollCoreDropWithTypeID_LevelEqualsEnemyLevel はコアレベルが敵レベルと同じであることをテストします。
func TestRollCoreDropWithTypeID_LevelEqualsEnemyLevel(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			StatWeights:  map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		},
	}

	calculator := NewRewardCalculator(coreTypes, nil, nil)

	// 様々なレベルでテスト
	testLevels := []int{1, 5, 10, 20, 50, 100}
	for _, enemyLevel := range testLevels {
		core := calculator.RollCoreDropWithTypeID("attack_balance", enemyLevel)
		if core == nil {
			t.Fatal("コアがnilであってはならない")
		}

		if core.Level != enemyLevel {
			t.Errorf("コアレベルは敵レベルと同じであるべき: got %d, expected %d", core.Level, enemyLevel)
		}
	}
}

// TestRollCoreDropWithTypeID_InvalidTypeID は存在しないTypeIDでnilを返すことをテストします。
func TestRollCoreDropWithTypeID_InvalidTypeID(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			StatWeights:  map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		},
	}

	calculator := NewRewardCalculator(coreTypes, nil, nil)

	core := calculator.RollCoreDropWithTypeID("non_existent_core", 10)

	if core != nil {
		t.Error("存在しないTypeIDの場合はnilを返すべき")
	}
}

// TestRollCoreDropWithTypeID_LevelOne は敵レベル1の場合にレベル1のコアが生成されることをテストします。
func TestRollCoreDropWithTypeID_LevelOne(t *testing.T) {
	coreTypes := []domain.CoreType{
		{
			ID:           "attack_balance",
			Name:         "攻撃バランス",
			MinDropLevel: 1,
			StatWeights:  map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		},
	}

	calculator := NewRewardCalculator(coreTypes, nil, nil)

	// 敵レベル1の場合
	for i := 0; i < 10; i++ {
		core := calculator.RollCoreDropWithTypeID("attack_balance", 1)
		if core == nil {
			t.Fatal("コアがnilであってはならない")
		}
		if core.Level != 1 {
			t.Errorf("敵レベル1の場合はコアレベルも1であるべき: got %d", core.Level)
		}
	}
}

// ==================== タスク5.3: モジュールドロップの品質計算テスト ====================

// TestRollModuleDropWithTypeID_GeneratesCorrectType は指定したTypeIDのモジュールが生成されることをテストします。
func TestRollModuleDropWithTypeID_GeneratesCorrectType(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			Icon:         "⚔️",
			MinDropLevel: 1,
		},
		{
			ID:           "heal_lv1",
			Name:         "応急手当",
			Icon:         "💚",
			MinDropLevel: 1,
		},
	}

	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	// physical_lv1 を指定
	module := calculator.RollModuleDropWithTypeID("physical_lv1", 10)

	if module == nil {
		t.Fatal("モジュールがnilであってはならない")
	}
	if module.TypeID != "physical_lv1" {
		t.Errorf("モジュールTypeIDが期待と異なる: got %s, want physical_lv1", module.TypeID)
	}
	if module.Name() != "物理攻撃Lv1" {
		t.Errorf("モジュール名が期待と異なる: got %s, want 物理攻撃Lv1", module.Name())
	}
}

// TestRollModuleDropWithTypeID_ChainEffectWithPool はチェイン効果プールがある場合にチェイン効果が付与されることをテストします。
func TestRollModuleDropWithTypeID_ChainEffectWithPool(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	skillEffects := []ChainEffectDefinition{
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
	calculator.SetChainEffectPool(pool)

	module := calculator.RollModuleDropWithTypeID("physical_lv1", 10)

	if module == nil {
		t.Fatal("モジュールがnilであってはならない")
	}
	if !module.HasChainEffect() {
		t.Error("チェイン効果プールがある場合はチェイン効果が付与されるべき")
	}
}

// TestRollModuleDropWithTypeID_HighLevelBetterChainEffect は高レベル敵ほど高品質チェイン効果の確率が上がることをテストします。
func TestRollModuleDropWithTypeID_HighLevelBetterChainEffect(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	skillEffects := []ChainEffectDefinition{
		{
			ID:         "damage_amp",
			Name:       "ダメージアンプ",
			Category:   "attack",
			EffectType: domain.ChainEffectDamageAmp,
			MinValue:   10,
			MaxValue:   50,
		},
	}

	pool := NewChainEffectPool(skillEffects)
	pool.SetNoEffectProbability(0.0) // チェイン効果を必ず付与

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetChainEffectPool(pool)

	// 低レベル敵（レベル10）のチェイン効果値の平均
	lowLevelSum := 0.0
	lowLevelCount := 100
	for i := 0; i < lowLevelCount; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 10)
		if module != nil && module.HasChainEffect() {
			lowLevelSum += module.ChainEffect.Value
		}
	}
	lowLevelAvg := lowLevelSum / float64(lowLevelCount)

	// 高レベル敵（レベル100）のチェイン効果値の平均
	highLevelSum := 0.0
	highLevelCount := 100
	for i := 0; i < highLevelCount; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 100)
		if module != nil && module.HasChainEffect() {
			highLevelSum += module.ChainEffect.Value
		}
	}
	highLevelAvg := highLevelSum / float64(highLevelCount)

	// 高レベル敵からのモジュールのチェイン効果値の平均が高いことを確認
	if highLevelAvg <= lowLevelAvg {
		t.Errorf("高レベル敵からのモジュールのチェイン効果値の平均が低レベル敵より高くなるべき: lowLevelAvg=%.2f, highLevelAvg=%.2f", lowLevelAvg, highLevelAvg)
	}
}

// TestRollModuleDropWithTypeID_AlwaysHasChainEffect はモジュールに必ずチェイン効果がつくことをテストします。
func TestRollModuleDropWithTypeID_AlwaysHasChainEffect(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	skillEffects := []ChainEffectDefinition{
		{
			ID:           "damage_amp",
			Name:         "ダメージアンプ",
			Category:     "attack",
			EffectType:   domain.ChainEffectDamageAmp,
			MinValue:     10,
			MaxValue:     30,
			MinDropLevel: 1,
		},
	}

	pool := NewChainEffectPool(skillEffects)

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetChainEffectPool(pool)

	// 低レベル敵（レベル1）でも100%チェイン効果がつく
	for i := 0; i < 10; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 1)
		if module == nil {
			t.Error("モジュールがnilであるべきではない")
			continue
		}
		if !module.HasChainEffect() {
			t.Error("モジュールには必ずチェイン効果がつくべき")
		}
	}

	// 高レベル敵（レベル100）でも100%チェイン効果がつく
	for i := 0; i < 10; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 100)
		if module == nil {
			t.Error("モジュールがnilであるべきではない")
			continue
		}
		if !module.HasChainEffect() {
			t.Error("モジュールには必ずチェイン効果がつくべき")
		}
	}
}

// TestRollModuleDropWithTypeID_ChainEffectLevelFiltering はチェイン効果のMinDropLevelでフィルタリングされることをテストします。
func TestRollModuleDropWithTypeID_ChainEffectLevelFiltering(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	skillEffects := []ChainEffectDefinition{
		{
			ID:           "damage_bonus",
			Name:         "ダメージボーナス",
			Category:     "attack",
			EffectType:   domain.ChainEffectDamageBonus,
			MinValue:     10,
			MaxValue:     50,
			MinDropLevel: 1, // レベル1からドロップ
		},
		{
			ID:           "double_cast",
			Name:         "ダブルキャスト",
			Category:     "special",
			EffectType:   domain.ChainEffectDoubleCast,
			MinValue:     10,
			MaxValue:     25,
			MinDropLevel: 10, // レベル10からドロップ
		},
	}

	pool := NewChainEffectPool(skillEffects)

	calculator := NewRewardCalculator(nil, moduleTypes, nil)
	calculator.SetChainEffectPool(pool)

	// レベル1の敵からはdamage_bonusのみドロップ可能
	for i := 0; i < 20; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 1)
		if module == nil || !module.HasChainEffect() {
			t.Error("モジュールにはチェイン効果があるべき")
			continue
		}
		if module.ChainEffect.Type != domain.ChainEffectDamageBonus {
			t.Errorf("レベル1の敵からはdamage_bonusのみドロップすべき: got %s", module.ChainEffect.Type)
		}
	}

	// レベル10以上の敵からは両方ドロップ可能
	foundDamageBonus := false
	foundDoubleCast := false
	for i := 0; i < 100; i++ {
		module := calculator.RollModuleDropWithTypeID("physical_lv1", 10)
		if module == nil || !module.HasChainEffect() {
			t.Error("モジュールにはチェイン効果があるべき")
			continue
		}
		if module.ChainEffect.Type == domain.ChainEffectDamageBonus {
			foundDamageBonus = true
		}
		if module.ChainEffect.Type == domain.ChainEffectDoubleCast {
			foundDoubleCast = true
		}
	}
	if !foundDamageBonus || !foundDoubleCast {
		t.Errorf("レベル10以上の敵からは両方のチェイン効果がドロップすべき: foundDamageBonus=%v, foundDoubleCast=%v", foundDamageBonus, foundDoubleCast)
	}
}

// TestRollModuleDropWithTypeID_InvalidTypeID は存在しないTypeIDでnilを返すことをテストします。
func TestRollModuleDropWithTypeID_InvalidTypeID(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	module := calculator.RollModuleDropWithTypeID("non_existent_module", 10)

	if module != nil {
		t.Error("存在しないTypeIDの場合はnilを返すべき")
	}
}

// TestRollModuleDropWithTypeID_NoChainEffectPool はチェイン効果プールがない場合にチェイン効果なしのモジュールが生成されることをテストします。
func TestRollModuleDropWithTypeID_NoChainEffectPool(t *testing.T) {
	moduleTypes := []ModuleDropInfo{
		{
			ID:           "physical_lv1",
			Name:         "物理攻撃Lv1",
			MinDropLevel: 1,
		},
	}

	// チェイン効果プールなし
	calculator := NewRewardCalculator(nil, moduleTypes, nil)

	module := calculator.RollModuleDropWithTypeID("physical_lv1", 10)

	if module == nil {
		t.Fatal("モジュールがnilであってはならない")
	}
	if module.HasChainEffect() {
		t.Error("チェイン効果プールがない場合はチェイン効果がnilであるべき")
	}
}
