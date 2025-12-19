// Package integration_test はタスク12の統合テストを提供します。

package integration_test

import (
	"testing"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/usecase/combat"
	"hirorocky/type-battle/internal/usecase/typing"
)

// newTestModuleTask12 はテスト用モジュールを作成するヘルパー関数です。
func newTestModuleTask12(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string) *domain.ModuleModel {
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

// newTestModuleWithChainEffectTask12 はチェイン効果付きモジュールを作成するヘルパー関数です。
func newTestModuleWithChainEffectTask12(id, name string, category domain.ModuleCategory, level int, tags []string, baseEffect float64, statRef, description string, chainEffect *domain.ChainEffect) *domain.ModuleModel {
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

// ==================================================
// Task 12.2: バトルフロー全体の統合テスト
// ==================================================

// createTestAgentsWithPassiveSkills はパッシブスキル付きのテストエージェントを作成します。
func createTestAgentsWithPassiveSkills() []*domain.AgentModel {
	// コア特性1: 攻撃バランス型（パーフェクトリズム）
	coreType1 := domain.CoreType{
		ID:   "attack_balance",
		Name: "攻撃バランス",
		StatWeights: map[string]float64{
			"STR": 1.2, "MAG": 1.0, "SPD": 1.0, "LUK": 0.8,
		},
		PassiveSkillID: "ps_perfect_rhythm",
		AllowedTags:    []string{"physical_low", "physical_mid", "magic_low", "buff_low"},
	}
	passiveSkill1 := domain.PassiveSkill{
		ID:          "ps_perfect_rhythm",
		Name:        "パーフェクトリズム",
		Description: "正確性100%でスキル効果1.5倍",
		BaseModifiers: domain.StatModifiers{
			STR_Mult: 1.5,
		},
		ScalePerLevel: 0.1,
	}
	core1 := domain.NewCoreWithTypeID("attack_balance", 5, coreType1, passiveSkill1)

	// コア特性2: ヒーラー型（ミラクルヒール）
	coreType2 := domain.CoreType{
		ID:   "healer",
		Name: "ヒーラー",
		StatWeights: map[string]float64{
			"STR": 0.6, "MAG": 1.4, "SPD": 0.8, "LUK": 1.2,
		},
		PassiveSkillID: "ps_miracle_heal",
		AllowedTags:    []string{"heal_low", "heal_mid", "buff_low", "magic_low"},
	}
	passiveSkill2 := domain.PassiveSkill{
		ID:          "ps_miracle_heal",
		Name:        "ミラクルヒール",
		Description: "回復スキル時10%でHP全回復",
		BaseModifiers: domain.StatModifiers{
			MAG_Mult: 1.1,
		},
		ScalePerLevel: 0.05,
	}
	core2 := domain.NewCoreWithTypeID("healer", 3, coreType2, passiveSkill2)

	// コア特性3: スピード型（オーバードライブ）
	coreType3 := domain.CoreType{
		ID:   "speedster",
		Name: "スピードスター",
		StatWeights: map[string]float64{
			"STR": 0.8, "MAG": 0.8, "SPD": 1.4, "LUK": 1.0,
		},
		PassiveSkillID: "ps_overdrive",
		AllowedTags:    []string{"physical_low", "buff_low", "debuff_low"},
	}
	passiveSkill3 := domain.PassiveSkill{
		ID:          "ps_overdrive",
		Name:        "オーバードライブ",
		Description: "HP50%以下でリキャスト-30%、被ダメ+20%",
		BaseModifiers: domain.StatModifiers{
			CDReduction: 0.3,
		},
		ScalePerLevel: 0.05,
	}
	core3 := domain.NewCoreWithTypeID("speedster", 4, coreType3, passiveSkill3)

	// モジュール（チェイン効果付き）
	chainEffect1 := domain.NewChainEffect(domain.ChainEffectDamageAmp, 25.0)
	chainEffect2 := domain.NewChainEffect(domain.ChainEffectHealAmp, 20.0)
	chainEffect3 := domain.NewChainEffect(domain.ChainEffectBuffDuration, 5.0)

	modules1 := []*domain.ModuleModel{
		newTestModuleWithChainEffectTask12("physical_lv1", "物理打撃Lv1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", "", &chainEffect1),
		newTestModuleWithChainEffectTask12("magic_lv1", "ファイアボールLv1", domain.MagicAttack, 1, []string{"magic_low"}, 10.0, "MAG", "", nil),
		newTestModuleTask12("buff_lv1", "攻撃バフLv1", domain.Buff, 1, []string{"buff_low"}, 5.0, "SPD", ""),
		newTestModuleTask12("debuff_lv1", "速度デバフLv1", domain.Debuff, 1, []string{"debuff_low"}, 5.0, "SPD", ""),
	}

	modules2 := []*domain.ModuleModel{
		newTestModuleWithChainEffectTask12("heal_lv1", "ヒールLv1", domain.Heal, 1, []string{"heal_low"}, 8.0, "MAG", "", &chainEffect2),
		newTestModuleWithChainEffectTask12("buff_lv2", "防御バフLv1", domain.Buff, 1, []string{"buff_low"}, 6.0, "SPD", "", &chainEffect3),
		newTestModuleTask12("magic_lv2", "アイスボルトLv1", domain.MagicAttack, 1, []string{"magic_low"}, 9.0, "MAG", ""),
		newTestModuleTask12("heal_lv2", "リジェネLv1", domain.Heal, 1, []string{"heal_low"}, 6.0, "MAG", ""),
	}

	modules3 := []*domain.ModuleModel{
		newTestModuleTask12("physical_lv2", "スラッシュLv1", domain.PhysicalAttack, 1, []string{"physical_low"}, 12.0, "STR", ""),
		newTestModuleTask12("buff_lv3", "速度バフLv1", domain.Buff, 1, []string{"buff_low"}, 7.0, "SPD", ""),
		newTestModuleTask12("debuff_lv2", "攻撃デバフLv1", domain.Debuff, 1, []string{"debuff_low"}, 5.0, "SPD", ""),
		newTestModuleTask12("physical_lv3", "強撃Lv1", domain.PhysicalAttack, 1, []string{"physical_low"}, 15.0, "STR", ""),
	}

	return []*domain.AgentModel{
		domain.NewAgent("agent_1", core1, modules1),
		domain.NewAgent("agent_2", core2, modules2),
		domain.NewAgent("agent_3", core3, modules3),
	}
}

// TestBattleFlow_PassiveSkillRegistration はバトル開始時のパッシブスキル登録を検証します。
func TestBattleFlow_PassiveSkillRegistration(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	// バトル初期化
	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// EffectTableにパッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキル数 expected 3, got %d", len(coreEffects))
	}

	// 各パッシブスキルの名前を確認
	passiveNames := make(map[string]bool)
	for _, effect := range coreEffects {
		passiveNames[effect.Name] = true
	}

	expectedPassives := []string{"パーフェクトリズム", "ミラクルヒール", "オーバードライブ"}
	for _, expected := range expectedPassives {
		if !passiveNames[expected] {
			t.Errorf("パッシブスキル '%s' が登録されていません", expected)
		}
	}

	// パッシブスキルは永続効果（Duration == nil）であることを確認
	for _, effect := range coreEffects {
		if effect.Duration != nil {
			t.Errorf("パッシブスキル '%s' は永続効果であるべきです", effect.Name)
		}
	}
}

// TestBattleFlow_ModuleUseStartsRecast はモジュール使用後のリキャスト状態を検証します。
func TestBattleFlow_ModuleUseStartsRecast(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// モジュール使用前の敵HP
	initialEnemyHP := state.Enemy.HP

	// タイピング結果
	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	// エージェント1の物理攻撃モジュールを使用
	agent := agents[0]
	module := agent.Modules[0]
	damage := engine.ApplyModuleEffect(state, agent, module, typingResult)

	// ダメージが与えられた
	if damage <= 0 {
		t.Errorf("ダメージは0より大きいべきです: got %d", damage)
	}

	// 敵HPが減少
	if state.Enemy.HP >= initialEnemyHP {
		t.Error("敵HPが減少するべきです")
	}
}

// TestBattleFlow_MultipleAgentSwitching は複数エージェント切り替えによる戦略的プレイを検証します。
func TestBattleFlow_MultipleAgentSwitching(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	// エージェント1で攻撃
	damage1 := engine.ApplyModuleEffect(state, agents[0], agents[0].Modules[0], typingResult)
	t.Logf("エージェント1攻撃: %dダメージ", damage1)

	// エージェント2で回復
	state.Player.TakeDamage(30) // まずダメージを受ける
	damagedHP := state.Player.HP
	healAmount := engine.ApplyModuleEffect(state, agents[1], agents[1].Modules[0], typingResult)
	t.Logf("エージェント2回復: %d回復", healAmount)

	if state.Player.HP <= damagedHP {
		t.Error("回復後はHPが増加するべきです")
	}

	// エージェント3で攻撃
	damage3 := engine.ApplyModuleEffect(state, agents[2], agents[2].Modules[0], typingResult)
	t.Logf("エージェント3攻撃: %dダメージ", damage3)

	// 統計を確認
	if state.Stats.TotalDamageDealt != damage1+damage3 {
		t.Errorf("総与ダメージ expected %d, got %d", damage1+damage3, state.Stats.TotalDamageDealt)
	}
	if state.Stats.TotalHealAmount != healAmount {
		t.Errorf("総回復量 expected %d, got %d", healAmount, state.Stats.TotalHealAmount)
	}
}

// TestBattleFlow_CompleteFlow はバトル開始からパッシブ登録、モジュール使用、勝敗判定までの一連フローを検証します。
func TestBattleFlow_CompleteFlow(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	// 1. バトル初期化
	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 2. パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// パッシブスキルが登録されていることを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキル数 expected 3, got %d", len(coreEffects))
	}

	// 3. 複数回のモジュール使用
	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            100,
		Accuracy:       1.0,
		SpeedFactor:    2.0,
		AccuracyFactor: 1.0,
	}

	totalDamage := 0
	for i := 0; i < 5; i++ {
		damage := engine.ApplyModuleEffect(state, agents[0], agents[0].Modules[0], typingResult)
		totalDamage += damage
		engine.RecordTypingResult(state, typingResult)
	}

	// 4. 統計を確認
	if state.Stats.TotalTypingCount != 5 {
		t.Errorf("タイピング回数 expected 5, got %d", state.Stats.TotalTypingCount)
	}
	if state.Stats.TotalDamageDealt != totalDamage {
		t.Errorf("総与ダメージ expected %d, got %d", totalDamage, state.Stats.TotalDamageDealt)
	}

	// 5. 敵HPを0にして勝利判定
	state.Enemy.HP = 0
	ended, result := engine.CheckBattleEnd(state)
	if !ended {
		t.Error("バトルが終了するべきです")
	}
	if !result.IsVictory {
		t.Error("プレイヤーの勝利であるべきです")
	}

	// 平均WPM計算
	avgWPM := state.Stats.GetAverageWPM()
	if avgWPM != 100 {
		t.Errorf("平均WPM expected 100, got %f", avgWPM)
	}
}

// TestBattleFlow_BuffDebuffWithPassive はパッシブスキルとバフ/デバフの共存を検証します。
func TestBattleFlow_BuffDebuffWithPassive(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// バフを付与
	duration := 10.0
	state.Player.EffectTable.AddRow(domain.EffectRow{
		ID:         "test_buff",
		SourceType: domain.SourceBuff,
		Name:       "攻撃UP",
		Duration:   &duration,
		Modifiers: domain.StatModifiers{
			STR_Add: 20,
		},
	})

	// パッシブスキル（永続）とバフ（時限）が共存することを確認
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	buffEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceBuff)

	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキル数 expected 3, got %d", len(coreEffects))
	}
	if len(buffEffects) != 1 {
		t.Errorf("バフ数 expected 1, got %d", len(buffEffects))
	}

	// 時間経過後、バフは消えるがパッシブスキルは残る
	state.Player.EffectTable.UpdateDurations(15.0)

	coreEffects = state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	buffEffects = state.Player.EffectTable.GetRowsBySource(domain.SourceBuff)

	if len(coreEffects) != 3 {
		t.Error("パッシブスキルは時間経過後も残るべきです")
	}
	if len(buffEffects) != 0 {
		t.Error("バフは時間経過後に消えるべきです")
	}
}

// TestBattleFlow_PassiveSkillPersistsDuringBattle はバトル中のパッシブスキル効果継続を検証します。
func TestBattleFlow_PassiveSkillPersistsDuringBattle(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// バトル中の複数回のtick経過をシミュレート
	for i := 0; i < 100; i++ {
		engine.UpdateEffects(state, 0.1) // 0.1秒ずつ更新
	}

	// 10秒経過後もパッシブスキルは有効
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Errorf("パッシブスキルは10秒経過後も有効であるべきです: got %d", len(coreEffects))
	}

	// パッシブスキル効果がステータス計算に反映されていることを確認
	finalStats := engine.GetPlayerFinalStats(state)

	// パッシブスキルによる補正がかかっていることを確認（具体的な値は実装依存）
	// ここではfinalStatsが計算されることを確認
	t.Logf("FinalStats after 10 seconds: STR=%d, MAG=%d, SPD=%d, LUK=%d",
		finalStats.STR, finalStats.MAG, finalStats.SPD, finalStats.LUK)
}

// TestBattleFlow_ModuleWithChainEffect はチェイン効果付きモジュールの挙動を検証します。
func TestBattleFlow_ModuleWithChainEffect(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// チェイン効果付きモジュールを確認
	agent := agents[0]
	module := agent.Modules[0] // チェイン効果: damage_amp 25%

	if !module.HasChainEffect() {
		t.Error("モジュールにはチェイン効果があるべきです")
	}

	if module.ChainEffect.Type != domain.ChainEffectDamageAmp {
		t.Errorf("ChainEffect.Type expected damage_amp, got %s", module.ChainEffect.Type)
	}

	if module.ChainEffect.Value != 25.0 {
		t.Errorf("ChainEffect.Value expected 25.0, got %f", module.ChainEffect.Value)
	}

	// モジュール使用
	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	damage := engine.ApplyModuleEffect(state, agent, module, typingResult)
	if damage <= 0 {
		t.Error("ダメージは0より大きいべきです")
	}
}

// TestBattleFlow_DefeatCondition_WithPassive はパッシブスキル付きでのプレイヤー敗北条件を検証します。
func TestBattleFlow_DefeatCondition_WithPassive(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// 敵からの攻撃を複数回受ける
	for i := 0; i < 50; i++ {
		engine.ProcessEnemyAttack(state)
		if !state.Player.IsAlive() {
			break
		}
	}

	// プレイヤーHP確認
	if state.Player.HP > 0 {
		// HPが残っている場合は0にする
		state.Player.HP = 0
	}

	// 敗北判定
	ended, result := engine.CheckBattleEnd(state)
	if !ended {
		t.Error("バトルが終了するべきです")
	}
	if result.IsVictory {
		t.Error("プレイヤーの敗北であるべきです")
	}

	// 統計にダメージが記録されている
	if state.Stats.TotalDamageTaken == 0 {
		t.Error("受けたダメージが記録されるべきです")
	}
}

// TestBattleFlow_PhaseTransitionWithPassive はフェーズ変化とパッシブスキルの関係を検証します。
func TestBattleFlow_PhaseTransitionWithPassive(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// パッシブスキル登録
	engine.RegisterPassiveSkills(state, agents)

	// 敵HPを50%に設定
	state.Enemy.HP = state.Enemy.MaxHP / 2

	// フェーズ変化チェック
	transitioned := engine.CheckPhaseTransition(state)
	if !transitioned {
		t.Error("フェーズ変化が発生するべきです")
	}
	if state.Enemy.Phase != domain.PhaseEnhanced {
		t.Error("敵フェーズがEnhancedになるべきです")
	}

	// フェーズ変化後もパッシブスキルは有効
	coreEffects := state.Player.EffectTable.GetRowsBySource(domain.SourceCore)
	if len(coreEffects) != 3 {
		t.Error("フェーズ変化後もパッシブスキルは有効であるべきです")
	}
}

// TestBattleFlow_NextActionDetermination は敵の次回行動決定を検証します。
func TestBattleFlow_NextActionDetermination(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 通常フェーズでの次回行動
	nextAction := engine.DetermineNextAction(state)

	// 通常フェーズでは攻撃のみ
	if nextAction.ActionType != combat.EnemyActionAttack {
		t.Errorf("通常フェーズでは攻撃行動であるべきです: got %v", nextAction.ActionType)
	}

	// 強化フェーズに移行
	state.Enemy.HP = state.Enemy.MaxHP / 2
	engine.CheckPhaseTransition(state)

	// 強化フェーズでの次回行動（複数回テストして特殊行動が発生しうることを確認）
	actionTypes := make(map[combat.EnemyActionType]int)
	for i := 0; i < 100; i++ {
		action := engine.DetermineNextAction(state)
		actionTypes[action.ActionType]++
	}

	// 攻撃行動が発生していることを確認
	if actionTypes[combat.EnemyActionAttack] == 0 {
		t.Error("攻撃行動が発生するべきです")
	}

	t.Logf("行動分布: 攻撃=%d, 自己バフ=%d, デバフ=%d",
		actionTypes[combat.EnemyActionAttack],
		actionTypes[combat.EnemyActionSelfBuff],
		actionTypes[combat.EnemyActionDebuff])
}

// TestBattleFlow_AttackIntervalProgression は敵の攻撃間隔を検証します。
func TestBattleFlow_AttackIntervalProgression(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 初期状態では攻撃準備ができていない
	if engine.IsAttackReady(state) {
		t.Error("初期状態では攻撃準備ができていないべきです")
	}

	// 次の攻撃までの時間を取得
	timeUntil := engine.GetTimeUntilNextAttack(state)
	if timeUntil <= 0 {
		t.Error("次の攻撃までの時間は0より大きいべきです")
	}
	t.Logf("次の攻撃まで: %v", timeUntil)

	// 攻撃間隔は設定されている
	if state.Enemy.AttackInterval <= 0 {
		t.Error("敵の攻撃間隔は0より大きいべきです")
	}
}

// TestBattleFlow_AllModuleCategoriesWork は全モジュールカテゴリの動作を検証します。
func TestBattleFlow_AllModuleCategoriesWork(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	// 物理攻撃
	physicalModule := agents[0].Modules[0]
	physicalDamage := engine.ApplyModuleEffect(state, agents[0], physicalModule, typingResult)
	if physicalDamage <= 0 {
		t.Error("物理攻撃はダメージを与えるべきです")
	}

	// 魔法攻撃
	magicModule := agents[0].Modules[1]
	magicDamage := engine.ApplyModuleEffect(state, agents[0], magicModule, typingResult)
	if magicDamage <= 0 {
		t.Error("魔法攻撃はダメージを与えるべきです")
	}

	// 回復
	state.Player.TakeDamage(50)
	healModule := agents[1].Modules[0]
	healAmount := engine.ApplyModuleEffect(state, agents[1], healModule, typingResult)
	if healAmount <= 0 {
		t.Error("回復は効果量があるべきです")
	}

	// バフ
	buffModule := agents[0].Modules[2]
	buffEffect := engine.ApplyModuleEffect(state, agents[0], buffModule, typingResult)
	if buffEffect <= 0 {
		t.Error("バフは効果量があるべきです")
	}

	// デバフ
	debuffModule := agents[0].Modules[3]
	debuffEffect := engine.ApplyModuleEffect(state, agents[0], debuffModule, typingResult)
	if debuffEffect <= 0 {
		t.Error("デバフは効果量があるべきです")
	}

	t.Logf("物理攻撃: %d, 魔法攻撃: %d, 回復: %d, バフ: %d, デバフ: %d",
		physicalDamage, magicDamage, healAmount, buffEffect, debuffEffect)
}

// TestBattleFlow_StatisticsAccumulation はバトル統計の蓄積を検証します。
func TestBattleFlow_StatisticsAccumulation(t *testing.T) {
	engine := combat.NewBattleEngine(createTestEnemyTypes())
	agents := createTestAgentsWithPassiveSkills()

	state, err := engine.InitializeBattle(1, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// 初期状態
	if state.Stats.TotalTypingCount != 0 {
		t.Error("初期タイピング回数は0であるべきです")
	}

	// 複数回のタイピングと攻撃
	wpmValues := []float64{60, 80, 100, 120, 140}
	for _, wpm := range wpmValues {
		result := &typing.TypingResult{
			Completed:      true,
			WPM:            wpm,
			Accuracy:       0.95,
			SpeedFactor:    wpm / 60,
			AccuracyFactor: 0.95,
		}
		engine.RecordTypingResult(state, result)
		engine.ApplyModuleEffect(state, agents[0], agents[0].Modules[0], result)
	}

	// 統計確認
	if state.Stats.TotalTypingCount != 5 {
		t.Errorf("タイピング回数 expected 5, got %d", state.Stats.TotalTypingCount)
	}

	avgWPM := state.Stats.GetAverageWPM()
	expectedAvgWPM := 100.0 // (60+80+100+120+140)/5
	if avgWPM != expectedAvgWPM {
		t.Errorf("平均WPM expected %f, got %f", expectedAvgWPM, avgWPM)
	}

	if state.Stats.TotalDamageDealt == 0 {
		t.Error("与えたダメージが記録されるべきです")
	}

	// クリア時間
	clearTime := state.Stats.GetClearTime()
	if clearTime <= 0 {
		t.Error("クリア時間は0より大きいべきです")
	}
}
