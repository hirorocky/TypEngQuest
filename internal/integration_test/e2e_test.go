// Package integration_test は統合テストを提供します。

package integration_test

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/infra/masterdata"
	"hirorocky/type-battle/internal/infra/savedata"
	"hirorocky/type-battle/internal/infra/startup"
	"hirorocky/type-battle/internal/usecase/combat"
	"hirorocky/type-battle/internal/usecase/rewarding"
	"hirorocky/type-battle/internal/usecase/typing"
)

// createTestExternalData はテスト用の外部データを作成します。
func createTestExternalData() *masterdata.ExternalData {
	return &masterdata.ExternalData{
		CoreTypes: []masterdata.CoreTypeData{
			{
				ID:             "all_rounder",
				Name:           "オールラウンダー",
				AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
				StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
				PassiveSkillID: "adaptability",
				MinDropLevel:   1,
			},
		},
		ModuleDefinitions: []masterdata.ModuleDefinitionData{
			{
				ID:            "physical_strike_lv1",
				Name:          "物理打撃Lv1",
				Category:      "physical_attack",
				Tags:          []string{"physical_low"},
				BaseEffect:    10.0,
				StatReference: "STR",
				Description:   "物理ダメージを与える基本攻撃",
				MinDropLevel:  1,
			},
			{
				ID:            "fireball_lv1",
				Name:          "ファイアボールLv1",
				Category:      "magic_attack",
				Tags:          []string{"magic_low"},
				BaseEffect:    12.0,
				StatReference: "MAG",
				Description:   "魔法ダメージを与える基本魔法",
				MinDropLevel:  1,
			},
			{
				ID:            "heal_lv1",
				Name:          "ヒールLv1",
				Category:      "heal",
				Tags:          []string{"heal_low"},
				BaseEffect:    8.0,
				StatReference: "MAG",
				Description:   "HPを回復する基本回復魔法",
				MinDropLevel:  1,
			},
			{
				ID:            "attack_buff_lv1",
				Name:          "攻撃バフLv1",
				Category:      "buff",
				Tags:          []string{"buff_low"},
				BaseEffect:    5.0,
				StatReference: "SPD",
				Description:   "一時的に攻撃力を上昇させる",
				MinDropLevel:  1,
			},
		},
		EnemyTypes: []masterdata.EnemyTypeData{
			{
				ID:              "slime",
				Name:            "スライム",
				BaseHP:          50,
				BaseAttackPower: 5,
			},
		},
		PassiveSkills: []masterdata.PassiveSkillData{
			{
				ID:          "ps_combo_master",
				Name:        "コンボマスター",
				Description: "連続タイピングでダメージ増加",
			},
		},
		FirstAgent: &masterdata.FirstAgentData{
			ID:         "agent_first",
			CoreTypeID: "all_rounder",
			CoreLevel:  1,
			Modules: []masterdata.FirstAgentModuleData{
				{TypeID: "physical_strike_lv1", ChainEffectType: "damage_amp", ChainEffectValue: 1.2},
				{TypeID: "fireball_lv1"},
				{TypeID: "heal_lv1"},
				{TypeID: "attack_buff_lv1"},
			},
		},
	}
}

// createTestRewardCalculator はテスト用のRewardCalculatorを作成します。
func createTestRewardCalculator() *rewarding.RewardCalculator {
	coreTypes := []domain.CoreType{
		{
			ID:   "all_rounder",
			Name: "オールラウンダー",
			StatWeights: map[string]float64{
				"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0,
			},
			PassiveSkillID: "balanced_power",
			AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low"},
			MinDropLevel:   1,
		},
	}

	moduleTypes := []rewarding.ModuleDropInfo{
		{
			ID:           "physical_attack_1",
			Name:         "物理打撃Lv1",
			Category:     domain.PhysicalAttack,
			Tags:         []string{"physical_low"},
			BaseEffect:   10.0,
			StatRef:      "STR",
			Description:  "物理ダメージを与える",
			MinDropLevel: 1,
		},
	}

	passiveSkills := map[string]domain.PassiveSkill{
		"balanced_power": {
			ID:          "balanced_power",
			Name:        "バランスフォース",
			Description: "全ステータスがバランス良く成長",
		},
	}

	return rewarding.NewRewardCalculator(coreTypes, moduleTypes, passiveSkills)
}

// ==================================================
// Task 15.4: ゲームループE2Eテスト
// ==================================================

func TestE2E_NewGameFlow(t *testing.T) {

	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	// セーブデータがない場合は新規ゲーム開始
	if !io.Exists() {
		saveData := initializer.InitializeNewGame()

		// 初期エージェントが装備されている
		if len(saveData.Player.EquippedAgentIDs) == 0 {
			t.Error("初期エージェントが装備されているべきです")
		}

		// 初期エージェントがインベントリに存在する（ID化された構造）
		if len(saveData.Inventory.AgentInstances) == 0 {
			t.Error("初期エージェントがインベントリに存在するべきです")
		}

		// セーブ
		err := io.SaveGame(saveData)
		if err != nil {
			t.Fatalf("セーブに失敗: %v", err)
		}
	}

	// 再起動シミュレート：ロード
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 状態が保持されている
	if len(loadedData.Player.EquippedAgentIDs) == 0 {
		t.Error("装備エージェントが復元されるべきです")
	}
}

func TestE2E_BattleVictoryFlow(t *testing.T) {

	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	// 新規ゲーム開始
	saveData := initializer.InitializeNewGame()

	// ホーム画面（シミュレート）- 装備エージェントを取得（ドメインオブジェクトを直接作成）
	agent := initializer.CreateInitialAgent()
	agents := []*domain.AgentModel{agent}
	if len(agents) == 0 {
		t.Fatal("エージェントがいません")
	}

	// バトル選択画面（シミュレート）- レベル1を選択
	battleLevel := 1

	// バトル開始
	enemyTypes := []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             50,
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}
	engine := combat.NewBattleEngine(enemyTypes)
	battleState, err := engine.InitializeBattle(battleLevel, agents)
	if err != nil {
		t.Fatalf("バトル初期化に失敗: %v", err)
	}

	// バトル進行：プレイヤーが攻撃して敵を倒す
	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	// 敵を倒すまで攻撃を繰り返す
	for battleState.Enemy.IsAlive() {
		agent := agents[0]
		module := agent.Modules[0] // 物理攻撃
		engine.ApplyModuleEffect(battleState, agent, module, typingResult)
		engine.RecordTypingResult(battleState, typingResult)
	}

	// 勝敗判定
	ended, result := engine.CheckBattleEnd(battleState)
	if !ended {
		t.Error("バトルが終了するべきです")
	}
	if !result.IsVictory {
		t.Error("勝利であるべきです")
	}

	// 報酬計算
	rewardCalc := createTestRewardCalculator()
	// バトル統計を作成
	battleStats := &rewarding.BattleStatistics{
		TotalWPM:         result.Stats.TotalWPM,
		TotalAccuracy:    result.Stats.TotalAccuracy,
		TotalTypingCount: result.Stats.TotalTypingCount,
	}
	rewards := rewardCalc.CalculateRewards(result.IsVictory, battleStats, battleLevel)

	// 報酬画面（シミュレート）- WPM、正確性を表示
	avgWPM := result.Stats.GetAverageWPM()
	if avgWPM == 0 {
		t.Error("平均WPMが計算されるべきです")
	}

	// 報酬をインベントリに追加（v1.0.0形式）
	for _, c := range rewards.DroppedCores {
		saveData.Inventory.CoreInstances = append(saveData.Inventory.CoreInstances, savedata.CoreInstanceSave{
			CoreTypeID: c.TypeID,
			Level:      c.Level,
		})
	}
	for _, m := range rewards.DroppedModules {
		modSave := savedata.ModuleInstanceSave{
			TypeID: m.TypeID,
		}
		if m.ChainEffect != nil {
			modSave.ChainEffect = &savedata.ChainEffectSave{
				Type:  string(m.ChainEffect.Type),
				Value: m.ChainEffect.Value,
			}
		}
		saveData.Inventory.ModuleInstances = append(saveData.Inventory.ModuleInstances, modSave)
	}

	// 統計更新
	saveData.Statistics.TotalBattles++
	saveData.Statistics.Victories++
	if battleLevel > saveData.Statistics.MaxLevelReached {
		saveData.Statistics.MaxLevelReached = battleLevel
	}

	// セーブ
	err = io.SaveGame(saveData)
	if err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// 状態確認
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	if loadedData.Statistics.TotalBattles != 1 {
		t.Errorf("TotalBattles expected 1, got %d", loadedData.Statistics.TotalBattles)
	}
	if loadedData.Statistics.MaxLevelReached != 1 {
		t.Errorf("MaxLevelReached expected 1, got %d", loadedData.Statistics.MaxLevelReached)
	}
}

func TestE2E_AgentSynthesisFlow(t *testing.T) {
	// エージェント合成フロー
	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	// 追加アイテム付きで新規ゲーム開始
	saveData := initializer.CreateNewGameWithExtraItems()

	// コアとモジュールがインベントリにある（v1.0.0形式）
	if len(saveData.Inventory.CoreInstances) == 0 {
		t.Fatal("コアがありません")
	}
	if len(saveData.Inventory.ModuleInstances) < 4 {
		t.Fatalf("モジュールが4個未満です: got %d", len(saveData.Inventory.ModuleInstances))
	}

	// テスト用にドメインオブジェクトを作成（マスタデータから初期エージェントを使用）
	firstAgent := initializer.CreateInitialAgent()
	if firstAgent == nil {
		t.Fatal("初期エージェントの作成に失敗しました")
	}
	core := firstAgent.Core
	selectedModules := firstAgent.Modules

	if len(selectedModules) != 4 {
		t.Fatalf("初期モジュールが4個必要です: got %d", len(selectedModules))
	}

	// エージェント合成
	newAgent := domain.NewAgent("new_agent_1", core, selectedModules)

	// 合成後の状態確認
	if newAgent.Level != core.Level {
		t.Error("エージェントレベルはコアレベルと一致するべきです")
	}
	if len(newAgent.Modules) != 4 {
		t.Error("エージェントは4つのモジュールを持つべきです")
	}

	// インベントリに追加（v1.0.0形式: コア情報とチェイン効果を埋め込み）
	moduleIDs := make([]string, len(newAgent.Modules))
	moduleChainEffects := make([]*savedata.ChainEffectSave, len(newAgent.Modules))
	for i, m := range newAgent.Modules {
		moduleIDs[i] = m.TypeID
		if m.ChainEffect != nil {
			moduleChainEffects[i] = &savedata.ChainEffectSave{
				Type:  string(m.ChainEffect.Type),
				Value: m.ChainEffect.Value,
			}
		}
	}
	saveData.Inventory.AgentInstances = append(saveData.Inventory.AgentInstances, savedata.AgentInstanceSave{
		ID: newAgent.ID,
		Core: savedata.CoreInstanceSave{
			CoreTypeID: newAgent.Core.TypeID,
			Level:      newAgent.Core.Level,
		},
		ModuleIDs:          moduleIDs,
		ModuleChainEffects: moduleChainEffects,
	})

	// エージェント装備（空きスロットを探して装備）
	for i := range saveData.Player.EquippedAgentIDs {
		if saveData.Player.EquippedAgentIDs[i] == "" {
			saveData.Player.EquippedAgentIDs[i] = newAgent.ID
			break
		}
	}

	// セーブ
	err := io.SaveGame(saveData)
	if err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// ロードして確認
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 新しいエージェントが保存されている（ID化された構造）
	found := false
	for _, a := range loadedData.Inventory.AgentInstances {
		if a.ID == "new_agent_1" {
			found = true
			break
		}
	}
	if !found {
		t.Error("合成したエージェントが保存されているべきです")
	}
}

func TestE2E_ProgressionFlow(t *testing.T) {
	// ゲーム進行フロー：複数バトル→レベル上昇
	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()
	// ドメインオブジェクトを直接作成
	agent := initializer.CreateInitialAgent()
	agents := []*domain.AgentModel{agent}

	enemyTypes := []domain.EnemyType{
		{
			ID:                 "goblin",
			Name:               "ゴブリン",
			BaseHP:             20, // 弱めに設定
			BaseAttackPower:    5,
			BaseAttackInterval: 3 * time.Second,
			AttackType:         "physical",
		},
	}
	engine := combat.NewBattleEngine(enemyTypes)

	typingResult := &typing.TypingResult{
		Completed:      true,
		WPM:            80,
		Accuracy:       0.95,
		SpeedFactor:    1.5,
		AccuracyFactor: 0.95,
	}

	// 5回バトルして進行
	for level := 1; level <= 5; level++ {
		battleState, err := engine.InitializeBattle(level, agents)
		if err != nil {
			t.Fatalf("バトル初期化に失敗: %v", err)
		}

		// 敵を倒す
		for battleState.Enemy.IsAlive() {
			agent := agents[0]
			module := agent.Modules[0]
			engine.ApplyModuleEffect(battleState, agent, module, typingResult)
		}

		// 勝利確認
		ended, result := engine.CheckBattleEnd(battleState)
		if !ended || !result.IsVictory {
			t.Errorf("レベル%dのバトルで勝利するべきです", level)
		}

		// 統計更新
		saveData.Statistics.TotalBattles++
		saveData.Statistics.Victories++
		if level > saveData.Statistics.MaxLevelReached {
			saveData.Statistics.MaxLevelReached = level
		}
	}

	// セーブ
	err := io.SaveGame(saveData)
	if err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// 状態確認
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	if loadedData.Statistics.TotalBattles != 5 {
		t.Errorf("TotalBattles expected 5, got %d", loadedData.Statistics.TotalBattles)
	}
	if loadedData.Statistics.MaxLevelReached != 5 {
		t.Errorf("MaxLevelReached expected 5, got %d", loadedData.Statistics.MaxLevelReached)
	}
}

func TestE2E_SaveQuitRestartLoad(t *testing.T) {

	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	// ゲーム開始（セッション1）
	saveData := initializer.InitializeNewGame()
	saveData.Statistics.TotalBattles = 15
	saveData.Statistics.Victories = 12
	saveData.Statistics.MaxLevelReached = 8
	saveData.Statistics.HighestWPM = 150.5

	// セーブして終了
	err := io.SaveGame(saveData)
	if err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// 再起動シミュレート（新しいIOインスタンス）
	io2 := savedata.NewSaveDataIO(tempDir)

	// ロード
	loadedData, err := io2.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 状態が完全に復元されている
	if loadedData.Statistics.TotalBattles != 15 {
		t.Errorf("TotalBattles expected 15, got %d", loadedData.Statistics.TotalBattles)
	}
	if loadedData.Statistics.Victories != 12 {
		t.Errorf("Victories expected 12, got %d", loadedData.Statistics.Victories)
	}
	if loadedData.Statistics.MaxLevelReached != 8 {
		t.Errorf("MaxLevelReached expected 8, got %d", loadedData.Statistics.MaxLevelReached)
	}
	if loadedData.Statistics.HighestWPM != 150.5 {
		t.Errorf("HighestWPM expected 150.5, got %f", loadedData.Statistics.HighestWPM)
	}

	// インベントリも復元されている（ID化された構造）
	if len(loadedData.Inventory.AgentInstances) == 0 {
		t.Error("エージェントが復元されるべきです")
	}
}

func TestE2E_DefeatAndRetry(t *testing.T) {
	// 敗北→リトライフロー
	tempDir := t.TempDir()
	io := savedata.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer(createTestExternalData())

	saveData := initializer.InitializeNewGame()
	// ドメインオブジェクトを直接作成
	agent := initializer.CreateInitialAgent()
	agents := []*domain.AgentModel{agent}

	enemyTypes := []domain.EnemyType{
		{
			ID:                 "dragon",
			Name:               "ドラゴン",
			BaseHP:             1000, // 強い敵
			BaseAttackPower:    100,
			BaseAttackInterval: 1 * time.Second,
			AttackType:         "magic",
		},
	}
	engine := combat.NewBattleEngine(enemyTypes)

	// 強い敵とバトル
	battleState, _ := engine.InitializeBattle(10, agents)

	// 敵の攻撃を受け続けて敗北
	for battleState.Player.IsAlive() {
		engine.ProcessEnemyAttack(battleState)
	}

	// 敗北確認
	ended, result := engine.CheckBattleEnd(battleState)
	if !ended {
		t.Error("バトルが終了するべきです")
	}
	if result.IsVictory {
		t.Error("敗北であるべきです")
	}

	// 敗北時は報酬なし、統計は敗北カウント
	saveData.Statistics.TotalBattles++
	saveData.Statistics.Defeats++

	// セーブ（MaxLevelReachedは更新されない）
	io.SaveGame(saveData)

	// ロードして確認
	loadedData, _ := io.LoadGame()
	if loadedData.Statistics.Defeats != 1 {
		t.Errorf("Defeats expected 1, got %d", loadedData.Statistics.Defeats)
	}
	if loadedData.Statistics.MaxLevelReached != 0 {
		t.Error("敗北後のMaxLevelReachedは0のままであるべきです")
	}
}
