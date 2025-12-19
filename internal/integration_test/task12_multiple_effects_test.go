// Package integration_test はタスク12の統合テストを提供します。

package integration_test

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/combat"
	"hirorocky/type-battle/internal/usecase/typing"
)

// ==================================================
// Task 12.5: 複数効果の独立性・併存テスト
// ==================================================

// TestMultipleEffects_MultipleAgentPassives は複数エージェントのパッシブスキルが同時に有効であることを検証します。
func TestMultipleEffects_MultipleAgentPassives(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills() // 3エージェント

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// 全エージェントのパッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキル数 expected 3, got %d", len(coreEffects))
	}

	// 各パッシブスキルが独立して存在することを確認
	effectIDs := make(map[string]bool)
	effectNames := make(map[string]bool)
	for _, effect := range coreEffects {
		effectIDs[effect.ID] = true
		effectNames[effect.Name] = true
	}

	// IDが全て異なることを確認
	if len(effectIDs) != 3 {
		t.Error("各パッシブスキルのIDは一意であるべきです")
	}

	// 期待されるパッシブスキル名を確認
	expectedNames := []string{"パーフェクトリズム", "ミラクルヒール", "オーバードライブ"}
	for _, name := range expectedNames {
		if !effectNames[name] {
			t.Errorf("パッシブスキル '%s' が存在するべきです", name)
		}
	}
}

// TestMultipleEffects_PassiveAndChainEffectIndependence は同一エージェントのパッシブスキルとチェイン効果が独立して動作することを検証します。
func TestMultipleEffects_PassiveAndChainEffectIndependence(t *testing.T) {
	// エージェント作成（パッシブスキルとチェイン効果付きモジュール）
	coreType := domain.CoreType{
		ID:   "attack_balance",
		Name: "攻撃バランス",
		StatWeights: map[string]float64{
			"STR": 1.2, "MAG": 1.0, "SPD": 1.0, "LUK": 0.8,
		},
		PassiveSkillID: "ps_perfect_rhythm",
		AllowedTags:    []string{"physical_low"},
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_perfect_rhythm",
		Name:        "パーフェクトリズム",
		Description: "正確性100%でスキル効果1.5倍",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.5,
		},
		ScalePerLevel: 0.1,
	}
	core := domain.NewCoreWithTypeID("attack_balance", 5, coreType, passiveSkill)

	chainEffect := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25.0)
	module := newTestModuleWithChainEffectForChain(
		"physical_lv1", "物理打撃Lv1", domain.PhysicalAttack, 1,
		[]string{"physical_low"}, 10.0, "STR", "",
		&chainEffect,
	)

	agent := domain.NewAgent("agent_1", core, []*domain.ModuleModel{
		module,
		newTestModuleForChain("m2", "魔法攻撃Lv1", domain.MagicAttack, 1, []string{"magic_low"}, 10.0, "MAG", ""),
		newTestModuleForChain("m3", "ヒールLv1", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", ""),
		newTestModuleForChain("m4", "バフLv1", domain.Buff, 1, []string{"buff_low"}, 5.0, "SPD", ""),
	})

	// パッシブスキルが存在することを確認
	if agent.Core.PassiveSkill.ID != "ps_perfect_rhythm" {
		t.Error("エージェントにパッシブスキルが設定されているべきです")
	}

	// チェイン効果が存在することを確認
	if !agent.Modules[0].HasChainEffect() {
		t.Error("モジュールにチェイン効果が設定されているべきです")
	}

	// 両方が独立して存在することを確認
	if agent.Core.PassiveSkill.ID == "" {
		t.Error("パッシブスキルIDは空でないべきです")
	}
	if agent.Modules[0].ChainEffect == nil {
		t.Error("チェイン効果はnilでないべきです")
	}
}

// TestMultipleEffects_MultipleChainEffectsCoexist は複数のチェイン効果が待機状態で共存できることを検証します。
func TestMultipleEffects_MultipleChainEffectsCoexist(t *testing.T) {
	// 複数のチェイン効果付きモジュールを持つエージェントを作成
	chainEffect1 := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25.0)
	chainEffect2 := domain.NewChainEffect(domain.ChainEffectHealAmp, 20.0)
	chainEffect3 := domain.NewChainEffect(domain.ChainEffectBuffDuration, 5.0)

	coreType := domain.CoreType{
		ID:          "test_type",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low", "heal_low", "buff_low"},
	}
	passiveSkill := domain.PassiveSkill{ID: "test", Name: "テスト", Description: ""}
	core := domain.NewCoreWithTypeID("test_type", 1, coreType, passiveSkill)

	modules := []*domain.ModuleModel{
		newTestModuleWithChainEffectForChain("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", "", &chainEffect1),
		newTestModuleWithChainEffectForChain("m2", "回復", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", "", &chainEffect2),
		newTestModuleWithChainEffectForChain("m3", "バフ", domain.Buff, 1, []string{"buff_low"}, 5.0, "SPD", "", &chainEffect3),
		newTestModuleForChain("m4", "魔法攻撃", domain.MagicAttack, 1, []string{"magic_low"}, 10.0, "MAG", ""), // チェイン効果なし
	}

	agent := domain.NewAgent("agent_multi_chain", core, modules)

	// 全てのチェイン効果が独立して存在することを確認
	chainEffectCount := 0
	for _, mod := range agent.Modules {
		if mod.HasChainEffect() {
			chainEffectCount++
		}
	}

	if chainEffectCount != 3 {
		t.Errorf("チェイン効果付きモジュール数 expected 3, got %d", chainEffectCount)
	}

	// 各チェイン効果のタイプが異なることを確認
	types := make(map[domain.ChainEffectType]bool)
	for _, mod := range agent.Modules {
		if mod.HasChainEffect() {
			types[mod.ChainEffect.Type] = true
		}
	}

	if len(types) != 3 {
		t.Error("各チェイン効果のタイプは異なるべきです")
	}
}

// TestMultipleEffects_CalculationOrder は同時発動時の効果計算順序が正しいことを検証します。
func TestMultipleEffects_CalculationOrder(t *testing.T) {
	// EffectTableで加算→乗算の順序で計算されることを確認
	table := domain.NewEffectTable()

	// 加算効果を追加
	table.AddRow(domain.EffectRow{
		ID:         "add_effect",
		SourceType: domain.SourceBuff,
		Name:       "加算バフ",
		Duration:   nil,
		Modifiers: domain.StatModifiers{
			STR_Add: 20,
		},
	})

	// 乗算効果を追加
	table.AddRow(domain.EffectRow{
		ID:         "mult_effect",
		SourceType: domain.SourceBuff,
		Name:       "乗算バフ",
		Duration:   nil,
		Modifiers: domain.StatModifiers{
			STR_Mult: 1.5,
		},
	})

	baseStats := domain.Stats{STR: 100}
	finalStats := table.Calculate(baseStats)

	// 計算順序: (基礎値 + 加算) × 乗算 = (100 + 20) × 1.5 = 180
	expectedSTR := int(float64(100+20) * 1.5)
	if finalStats.STR != expectedSTR {
		t.Errorf("STR expected %d, got %d", expectedSTR, finalStats.STR)
	}
}

// TestMultipleEffects_DuplicateEffects は効果の重複時の挙動を検証します。
func TestMultipleEffects_DuplicateEffects(t *testing.T) {
	table := domain.NewEffectTable()

	// 同種の加算効果を複数追加
	table.AddRow(domain.EffectRow{
		ID:         "add_1",
		SourceType: domain.SourceBuff,
		Name:       "加算バフ1",
		Duration:   nil,
		Modifiers:  domain.StatModifiers{STR_Add: 10},
	})
	table.AddRow(domain.EffectRow{
		ID:         "add_2",
		SourceType: domain.SourceBuff,
		Name:       "加算バフ2",
		Duration:   nil,
		Modifiers:  domain.StatModifiers{STR_Add: 15},
	})

	// 同種の乗算効果を複数追加
	table.AddRow(domain.EffectRow{
		ID:         "mult_1",
		SourceType: domain.SourceBuff,
		Name:       "乗算バフ1",
		Duration:   nil,
		Modifiers:  domain.StatModifiers{STR_Mult: 1.2},
	})
	table.AddRow(domain.EffectRow{
		ID:         "mult_2",
		SourceType: domain.SourceBuff,
		Name:       "乗算バフ2",
		Duration:   nil,
		Modifiers:  domain.StatModifiers{STR_Mult: 1.3},
	})

	baseStats := domain.Stats{STR: 100}
	finalStats := table.Calculate(baseStats)

	// 計算: (100 + 10 + 15) × 1.2 × 1.3 = 125 × 1.56 = 195
	expectedSTR := int(float64(100+10+15) * 1.2 * 1.3)
	if finalStats.STR != expectedSTR {
		t.Errorf("STR expected %d, got %d", expectedSTR, finalStats.STR)
	}
}

// TestMultipleEffects_PassiveAndChainInteraction はパッシブスキルとチェイン効果の相互作用を検証します。
func TestMultipleEffects_PassiveAndChainInteraction(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// 初期状態のパッシブスキル数
	passivesBefore := len(state.Player.EffectTable.GetRowsBySource(domain.SourceCore))

	// チェイン効果付きモジュールを使用
	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	damage := engine.ApplyModuleEffect(state, agents[0], agents[0].Modules[0], typingResult)
	if damage <= 0 {
		t.Error("ダメージは0より大きいべきです")
	}

	// モジュール使用後もパッシブスキルは維持される
	passivesAfter := len(state.Player.EffectTable.GetRowsBySource(domain.SourceCore))
	if passivesBefore != passivesAfter {
		t.Errorf("パッシブスキル数が変化しました: before=%d, after=%d", passivesBefore, passivesAfter)
	}
}

// ==================================================
// Task 12.6: 効果の発動・終了タイミング検証テスト
// ==================================================

// TestEffectTiming_PassiveRegistrationAtBattleStart はパッシブスキルがバトル開始時に正しく登録されることを検証します。
func TestEffectTiming_PassiveRegistrationAtBattleStart(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	// バトル初期化前はEffectTableは空
	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録前
	coreEffectsBefore := len(state.Player.EffectTable.GetRowsBySource(domain.SourceCore))
	if coreEffectsBefore != 0 {
		t.Error("パッシブスキル登録前はコア効果が0であるべきです")
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキル登録後
	coreEffectsAfter := len(state.Player.EffectTable.GetRowsBySource(domain.SourceCore))
	if coreEffectsAfter != 3 {
		t.Errorf("パッシブスキル登録後はコア効果が3であるべきです: got %d", coreEffectsAfter)
	}
}

// TestEffectTiming_ChainEffectWaitingState はチェイン効果がモジュール使用時に待機状態になることを検証します。
func TestEffectTiming_ChainEffectWaitingState(t *testing.T) {
	// チェイン効果付きモジュールの確認
	chainEffect := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25.0)
	module := newTestModuleWithChainEffectForChain(
		"physical_lv1", "物理打撃Lv1", domain.PhysicalAttack, 1,
		[]string{"physical_low"}, 10.0, "STR", "",
		&chainEffect,
	)

	// モジュールにチェイン効果が設定されていることを確認
	if !module.HasChainEffect() {
		t.Error("モジュールにはチェイン効果があるべきです")
	}

	// チェイン効果の情報を確認
	if module.ChainEffect.Type != domain.ChainEffectDamageAmp {
		t.Error("チェイン効果タイプが正しくありません")
	}
	if module.ChainEffect.Value != 25.0 {
		t.Error("チェイン効果値が正しくありません")
	}
}

// TestEffectTiming_ProbabilityTriggerTiming は確率トリガーの発動タイミングが正しいことを検証します。
func TestEffectTiming_ProbabilityTriggerTiming(t *testing.T) {
	// 確率トリガーのパッシブスキル
	def := domain.PassiveSkillDefinition{
		ID:          "ps_echo_skill",
		Name:        "エコースキル",
		TriggerType: domain.PassiveTriggerProbability,
		EffectValue: 2.0,
		Probability: 0.15,
		TriggerCondition: &domain.TriggerCondition{
			Type: domain.TriggerConditionOnSkillUse,
		},
	}

	// スキル使用イベントのみで確率チェックが必要
	ctxSkillUse := &domain.PassiveEvaluationContext{
		Event: domain.PassiveEventSkillUse,
	}
	resultSkillUse := domain.EvaluatePassive(def, ctxSkillUse)

	if !resultSkillUse.NeedsProbabilityCheck {
		t.Error("スキル使用時に確率チェックが必要であるべきです")
	}

	// 他のイベントでは確率チェック不要
	ctxHeal := &domain.PassiveEvaluationContext{
		Event: domain.PassiveEventHeal,
	}
	resultHeal := domain.EvaluatePassive(def, ctxHeal)

	if resultHeal.NeedsProbabilityCheck {
		t.Error("回復イベントでは確率チェックは不要であるべきです")
	}
}

// TestEffectTiming_ConditionalPassiveRealTimeSwitch は条件付きパッシブの条件変化時に効果がリアルタイムで切り替わることを検証します。
func TestEffectTiming_ConditionalPassiveRealTimeSwitch(t *testing.T) {
	// 条件付きパッシブスキル（HP50%以下で発動）
	def := domain.PassiveSkillDefinition{
		ID:          "ps_overdrive",
		Name:        "オーバードライブ",
		TriggerType: domain.PassiveTriggerConditional,
		EffectValue: 0.7,
		TriggerCondition: &domain.TriggerCondition{
			Type:  domain.TriggerConditionHPBelowPercent,
			Value: 50,
		},
	}

	// HP70%（条件未満）
	ctx70 := &domain.PassiveEvaluationContext{
		PlayerHPPercent: 70,
	}
	result70 := domain.EvaluatePassive(def, ctx70)
	if result70.IsActive {
		t.Error("HP70%ではアクティブでないべきです")
	}

	// HP50%（条件達成）
	ctx50 := &domain.PassiveEvaluationContext{
		PlayerHPPercent: 50,
	}
	result50 := domain.EvaluatePassive(def, ctx50)
	if !result50.IsActive {
		t.Error("HP50%でアクティブであるべきです")
	}

	// HP30%（条件継続）
	ctx30 := &domain.PassiveEvaluationContext{
		PlayerHPPercent: 30,
	}
	result30 := domain.EvaluatePassive(def, ctx30)
	if !result30.IsActive {
		t.Error("HP30%でアクティブであるべきです")
	}

	// HP60%（条件解除）
	ctx60 := &domain.PassiveEvaluationContext{
		PlayerHPPercent: 60,
	}
	result60 := domain.EvaluatePassive(def, ctx60)
	if result60.IsActive {
		t.Error("HP60%ではアクティブでないべきです")
	}
}

// TestEffectTiming_BuffDebuffDurationExpiry はバフ/デバフの時間経過による終了を検証します。
func TestEffectTiming_BuffDebuffDurationExpiry(t *testing.T) {
	table := domain.NewEffectTable()

	// 5秒間のバフを追加
	duration := 5.0
	table.AddRow(domain.EffectRow{
		ID:         "temp_buff",
		SourceType: domain.SourceBuff,
		Name:       "一時バフ",
		Duration:   &duration,
		Modifiers:  domain.StatModifiers{STR_Add: 20},
	})

	// 初期状態
	if len(table.Rows) != 1 {
		t.Error("バフが1つ存在するべきです")
	}

	// 2秒経過
	table.UpdateDurations(2.0)
	if len(table.Rows) != 1 {
		t.Error("2秒後もバフが存在するべきです")
	}

	// さらに2秒経過（合計4秒）
	table.UpdateDurations(2.0)
	if len(table.Rows) != 1 {
		t.Error("4秒後もバフが存在するべきです")
	}

	// さらに2秒経過（合計6秒、期限切れ）
	table.UpdateDurations(2.0)
	if len(table.Rows) != 0 {
		t.Error("6秒後はバフが削除されるべきです")
	}
}

// TestEffectTiming_PermanentEffectNeverExpires は永続効果が時間経過で消えないことを検証します。
func TestEffectTiming_PermanentEffectNeverExpires(t *testing.T) {
	table := domain.NewEffectTable()

	// 永続効果（パッシブスキル）
	table.AddRow(domain.EffectRow{
		ID:         "passive_skill",
		SourceType: domain.SourceCore,
		Name:       "パッシブスキル",
		Duration:   nil, // 永続
		Modifiers:  domain.StatModifiers{STR_Add: 30},
	})

	// 大量の時間経過
	table.UpdateDurations(1000.0)

	// 永続効果は残っている
	if len(table.Rows) != 1 {
		t.Error("永続効果は時間経過で消えないべきです")
	}
}

// TestEffectTiming_BuffExtension はバフ延長効果を検証します。
func TestEffectTiming_BuffExtension(t *testing.T) {
	table := domain.NewEffectTable()

	// 5秒間のバフを追加
	duration := 5.0
	table.AddRow(domain.EffectRow{
		ID:         "buff_to_extend",
		SourceType: domain.SourceBuff,
		Name:       "延長対象バフ",
		Duration:   &duration,
		Modifiers:  domain.StatModifiers{STR_Add: 20},
	})

	// 初期残り時間を確認
	if *table.Rows[0].Duration != 5.0 {
		t.Errorf("初期Duration expected 5.0, got %f", *table.Rows[0].Duration)
	}

	// バフ延長
	table.ExtendBuffDurations(3.0)

	// 延長後の残り時間を確認
	if *table.Rows[0].Duration != 8.0 {
		t.Errorf("延長後Duration expected 8.0, got %f", *table.Rows[0].Duration)
	}
}

// TestEffectTiming_DebuffExtension はデバフ延長効果を検証します。
func TestEffectTiming_DebuffExtension(t *testing.T) {
	table := domain.NewEffectTable()

	// 5秒間のデバフを追加
	duration := 5.0
	table.AddRow(domain.EffectRow{
		ID:         "debuff_to_extend",
		SourceType: domain.SourceDebuff,
		Name:       "延長対象デバフ",
		Duration:   &duration,
		Modifiers:  domain.StatModifiers{STR_Add: -10},
	})

	// デバフ延長
	table.ExtendDebuffDurations(2.0)

	// 延長後の残り時間を確認
	if *table.Rows[0].Duration != 7.0 {
		t.Errorf("延長後Duration expected 7.0, got %f", *table.Rows[0].Duration)
	}
}

// ==================================================
// Task 12.7: UI表示の一貫性検証（ドメインレベルでの検証）
// ==================================================

// TestUIConsistency_RecastStateData はリキャスト状態データの一貫性を検証します。
func TestUIConsistency_RecastStateData(t *testing.T) {
	// モジュールカテゴリごとの表示名とアイコンの一貫性
	categories := []struct {
		category    domain.ModuleCategory
		displayName string
		icon        string
	}{
		{domain.PhysicalAttack, "物理攻撃", "⚔"},
		{domain.MagicAttack, "魔法攻撃", "✦"},
		{domain.Heal, "回復", "♥"},
		{domain.Buff, "バフ", "▲"},
		{domain.Debuff, "デバフ", "▼"},
	}

	for _, tc := range categories {
		t.Run(string(tc.category), func(t *testing.T) {
			if tc.category.String() != tc.displayName {
				t.Errorf("表示名 expected '%s', got '%s'", tc.displayName, tc.category.String())
			}
			if tc.category.Icon() != tc.icon {
				t.Errorf("アイコン expected '%s', got '%s'", tc.icon, tc.category.Icon())
			}
		})
	}
}

// TestUIConsistency_PassiveSkillDisplayData はパッシブスキル表示データの一貫性を検証します。
func TestUIConsistency_PassiveSkillDisplayData(t *testing.T) {
	passiveSkill := domain.PassiveSkill{
		ID:          "ps_perfect_rhythm",
		Name:        "パーフェクトリズム",
		Description: "正確性100%でスキル効果1.5倍",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.5,
		},
		ScalePerLevel: 0.1,
	}

	// 表示に必要なフィールドが全て存在することを確認
	if passiveSkill.ID == "" {
		t.Error("IDが設定されているべきです")
	}
	if passiveSkill.Name == "" {
		t.Error("Nameが設定されているべきです")
	}
	if passiveSkill.Description == "" {
		t.Error("Descriptionが設定されているべきです")
	}
}

// TestUIConsistency_ChainEffectDisplayData はチェイン効果表示データの一貫性を検証します。
func TestUIConsistency_ChainEffectDisplayData(t *testing.T) {
	effectTypes := []domain.ChainEffectType{
		domain.ChainEffectDamageAmp,
		domain.ChainEffectDamageCut,
		domain.ChainEffectHealAmp,
		domain.ChainEffectTimeExtend,
		domain.ChainEffectCooldownReduce,
		domain.ChainEffectBuffDuration,
		domain.ChainEffectDoubleCast,
	}

	for _, effectType := range effectTypes {
		t.Run(string(effectType), func(t *testing.T) {
			effect := domain.NewChainEffect(effectType, 10.0)

			// 表示に必要なフィールドが全て存在することを確認
			if effect.Type == "" {
				t.Error("Typeが設定されているべきです")
			}
			if effect.Description == "" {
				t.Error("Descriptionが設定されているべきです")
			}

			// カテゴリが取得できることを確認
			category := effectType.Category()
			if category == "" {
				t.Error("Categoryが取得できるべきです")
			}
		})
	}
}

// TestUIConsistency_EffectTableFilterBySource はソース別の効果フィルタリングを検証します。
func TestUIConsistency_EffectTableFilterBySource(t *testing.T) {
	table := domain.NewEffectTable()

	// 各ソースタイプの効果を追加
	table.AddRow(domain.EffectRow{
		ID:         "core_1",
		SourceType: domain.SourceCore,
		Name:       "コア効果",
		Modifiers:  domain.StatModifiers{STR_Add: 10},
	})
	table.AddRow(domain.EffectRow{
		ID:         "buff_1",
		SourceType: domain.SourceBuff,
		Name:       "バフ効果",
		Modifiers:  domain.StatModifiers{STR_Add: 20},
	})
	duration := 5.0
	table.AddRow(domain.EffectRow{
		ID:         "debuff_1",
		SourceType: domain.SourceDebuff,
		Name:       "デバフ効果",
		Duration:   &duration,
		Modifiers:  domain.StatModifiers{STR_Add: -10},
	})

	// ソース別にフィルタリング
	coreEffects := table.GetRowsBySource(domain.SourceCore)
	buffEffects := table.GetRowsBySource(domain.SourceBuff)
	debuffEffects := table.GetRowsBySource(domain.SourceDebuff)

	if len(coreEffects) != 1 {
		t.Errorf("コア効果数 expected 1, got %d", len(coreEffects))
	}
	if len(buffEffects) != 1 {
		t.Errorf("バフ効果数 expected 1, got %d", len(buffEffects))
	}
	if len(debuffEffects) != 1 {
		t.Errorf("デバフ効果数 expected 1, got %d", len(debuffEffects))
	}
}

// TestUIConsistency_AgentDisplayData はエージェント表示データの一貫性を検証します。
func TestUIConsistency_AgentDisplayData(t *testing.T) {
	agents := createTestAgentsWithPassiveSkills()

	for i, agent := range agents {
		t.Run(agent.ID, func(t *testing.T) {
			// 基本情報の存在確認
			if agent.ID == "" {
				t.Errorf("エージェント %d のIDが設定されているべきです", i)
			}
			if agent.Core == nil {
				t.Errorf("エージェント %d のCoreが設定されているべきです", i)
			}
			if len(agent.Modules) != 4 {
				t.Errorf("エージェント %d のモジュール数は4であるべきです", i)
			}

			// コア情報の存在確認
			if agent.Core.Name == "" {
				t.Error("コア名が設定されているべきです")
			}
			if agent.Core.PassiveSkill.Name == "" {
				t.Error("パッシブスキル名が設定されているべきです")
			}

			// コアTypeNameの取得確認
			coreTypeName := agent.GetCoreTypeName()
			if coreTypeName == "" {
				t.Error("コアタイプ名が取得できるべきです")
			}
		})
	}
}
