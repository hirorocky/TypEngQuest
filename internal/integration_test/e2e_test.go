// Package integration_test は統合テストを提供します。
// Requirements: 1.1, 2.1, 3.7, 12.1, 17.5
package integration_test

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/loader"
	"hirorocky/type-battle/internal/persistence"
	"hirorocky/type-battle/internal/reward"
	"hirorocky/type-battle/internal/startup"
	"hirorocky/type-battle/internal/typing"
)

// createTestRewardCalculator はテスト用のRewardCalculatorを作成します。
func createTestRewardCalculator() *reward.RewardCalculator {
	coreTypes := []loader.CoreTypeData{
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

	moduleTypes := []loader.ModuleDefinitionData{
		{
			ID:            "physical_attack_1",
			Name:          "物理打撃Lv1",
			Category:      "physical_attack",
			Level:         1,
			Tags:          []string{"physical_low"},
			BaseEffect:    10.0,
			StatReference: "STR",
			Description:   "物理ダメージを与える",
			MinDropLevel:  1,
		},
	}

	passiveSkills := map[string]domain.PassiveSkill{
		"balanced_power": {
			ID:          "balanced_power",
			Name:        "バランスフォース",
			Description: "全ステータスがバランス良く成長",
		},
	}

	return reward.NewRewardCalculator(coreTypes, moduleTypes, passiveSkills)
}

// ==================================================
// Task 15.4: ゲームループE2Eテスト
// ==================================================

func TestE2E_NewGameFlow(t *testing.T) {
	// Requirement 1.1, 17.5: 起動→新規ゲーム開始
	tempDir := t.TempDir()
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

	// セーブデータがない場合は新規ゲーム開始
	if !io.Exists() {
		saveData := initializer.InitializeNewGame()

		// 初期エージェントが装備されている
		if len(saveData.Player.EquippedAgentIDs) == 0 {
			t.Error("初期エージェントが装備されているべきです")
		}

		// 初期エージェントがインベントリに存在する
		if len(saveData.Inventory.Agents) == 0 {
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
	// Requirement 2.1, 3.7, 12.1: ホーム→バトル選択→バトル→勝利→報酬
	tempDir := t.TempDir()
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

	// 新規ゲーム開始
	saveData := initializer.InitializeNewGame()

	// ホーム画面（シミュレート）- 装備エージェントを取得
	agents := saveData.Inventory.Agents
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
	engine := battle.NewBattleEngine(enemyTypes)
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
	battleStats := &reward.BattleStatistics{
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

	// 報酬をインベントリに追加
	for _, c := range rewards.DroppedCores {
		saveData.Inventory.Cores = append(saveData.Inventory.Cores, c)
	}
	for _, m := range rewards.DroppedModules {
		saveData.Inventory.Modules = append(saveData.Inventory.Modules, m)
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
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

	// 追加アイテム付きで新規ゲーム開始
	saveData := initializer.CreateNewGameWithExtraItems()

	// コアとモジュールがインベントリにある
	if len(saveData.Inventory.Cores) == 0 {
		t.Fatal("コアがありません")
	}
	if len(saveData.Inventory.Modules) < 4 {
		t.Fatal("モジュールが4個未満です")
	}

	// コアを選択
	core := saveData.Inventory.Cores[0]

	// 互換性のあるモジュールを選択
	selectedModules := make([]*domain.ModuleModel, 0, 4)
	for _, m := range saveData.Inventory.Modules {
		if m.IsCompatibleWithCore(core) {
			selectedModules = append(selectedModules, m)
			if len(selectedModules) >= 4 {
				break
			}
		}
	}

	if len(selectedModules) != 4 {
		t.Fatalf("互換性のあるモジュールが4個見つかりません: got %d", len(selectedModules))
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

	// インベントリに追加（消費したコア/モジュールを削除するのは省略）
	saveData.Inventory.Agents = append(saveData.Inventory.Agents, newAgent)

	// エージェント装備
	if len(saveData.Player.EquippedAgentIDs) < 3 {
		saveData.Player.EquippedAgentIDs = append(saveData.Player.EquippedAgentIDs, newAgent.ID)
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

	// 新しいエージェントが保存されている
	found := false
	for _, a := range loadedData.Inventory.Agents {
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
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

	saveData := initializer.InitializeNewGame()
	agents := saveData.Inventory.Agents

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
	engine := battle.NewBattleEngine(enemyTypes)

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
	// Requirement 17.5: セーブ→終了→再起動→ロード→状態確認
	tempDir := t.TempDir()
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

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
	io2 := persistence.NewSaveDataIO(tempDir)

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

	// インベントリも復元されている
	if len(loadedData.Inventory.Agents) == 0 {
		t.Error("エージェントが復元されるべきです")
	}
}

func TestE2E_DefeatAndRetry(t *testing.T) {
	// 敗北→リトライフロー
	tempDir := t.TempDir()
	io := persistence.NewSaveDataIO(tempDir)
	initializer := startup.NewNewGameInitializer()

	saveData := initializer.InitializeNewGame()
	agents := saveData.Inventory.Agents

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
	engine := battle.NewBattleEngine(enemyTypes)

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
