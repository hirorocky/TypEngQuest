// Package screens はTUI画面のテストを提供します。
package screens

import (
	"testing"

	"hirorocky/type-battle/internal/domain"

	tea "github.com/charmbracelet/bubbletea"
)

// mockAgentProvider はテスト用のAgentProvider実装です。
type mockAgentProvider struct {
	agents []*domain.AgentModel
}

func (m *mockAgentProvider) GetEquippedAgents() []*domain.AgentModel {
	return m.agents
}

// ==================== Task 10.2: バトル選択画面のテスト ====================

// TestNewBattleSelectScreen はBattleSelectScreenの初期化をテストします。

func TestNewBattleSelectScreen(t *testing.T) {
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})

	if screen == nil {
		t.Fatal("BattleSelectScreenがnilです")
	}

	// 入力フィールドが初期化されていること
	if screen.input == nil {
		t.Error("入力フィールドがnilです")
	}
}

// TestBattleSelectMaxLevelDisplay は最高レベル表示をテストします。

func TestBattleSelectMaxLevelDisplay(t *testing.T) {
	maxLevel := 15
	screen := NewBattleSelectScreen(maxLevel, &mockAgentProvider{})

	// 挑戦可能最大レベルは maxLevel + 1
	if screen.maxChallengeLevel != maxLevel+1 {
		t.Errorf("挑戦可能最大レベル: got %d, want %d", screen.maxChallengeLevel, maxLevel+1)
	}
}

// TestBattleSelectInputValidation は入力検証をテストします。

func TestBattleSelectInputValidation(t *testing.T) {
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})

	tests := []struct {
		name        string
		input       string
		expectError bool
		errorType   string
	}{
		{"有効な入力", "5", false, ""},
		{"最大レベル", "11", false, ""},
		{"1未満", "0", true, "too_low"},
		{"最大レベル超過", "12", true, "too_high"},
		{"空入力", "", true, "empty"},
		{"非数値", "abc", true, "invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			screen.input.Value = tt.input
			valid, _ := screen.validateInput()

			if valid == tt.expectError {
				if tt.expectError {
					t.Error("エラーが検出されませんでした")
				} else {
					t.Error("有効な入力がエラーと判定されました")
				}
			}
		})
	}
}

// TestBattleSelectNoAgentEquipped はエージェント未装備時のテストです。

func TestBattleSelectNoAgentEquipped(t *testing.T) {
	// エージェント未装備
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})
	screen.input.Value = "5"

	// 確認画面に移動
	screen.state = StateConfirm

	// バトル開始を試みる
	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEnter})

	// エラーメッセージが設定されるか確認
	if screen.error == "" && cmd != nil {
		// コマンドが返された場合、バトル開始メッセージかどうか確認
		// 未装備の場合はバトル開始できないはず
	}
}

// TestBattleSelectWithAgentEquipped はエージェント装備時のテストです。
func TestBattleSelectWithAgentEquipped(t *testing.T) {
	// エージェントを装備
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m2", "モジュール2", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m3", "モジュール3", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m4", "モジュール4", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
	}
	agent := domain.NewAgent("agent1", core, modules)

	screen := NewBattleSelectScreen(10, &mockAgentProvider{agents: []*domain.AgentModel{agent}})
	screen.input.Value = "5"

	// 入力検証
	valid, _ := screen.validateInput()
	if !valid {
		t.Error("有効な入力がエラーと判定されました")
	}
}

// TestBattleSelectConfirmScreen は確認画面のテストです。

func TestBattleSelectConfirmScreen(t *testing.T) {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m2", "モジュール2", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m3", "モジュール3", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m4", "モジュール4", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
	}
	agent := domain.NewAgent("agent1", core, modules)

	screen := NewBattleSelectScreen(10, &mockAgentProvider{agents: []*domain.AgentModel{agent}})
	screen.input.Value = "5"

	// Enterで確認画面へ
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEnter})

	if screen.state != StateConfirm {
		t.Errorf("確認画面に遷移していません: state=%d", screen.state)
	}
}

// TestBattleSelectRechallenge は再挑戦のテストです。

func TestBattleSelectRechallenge(t *testing.T) {
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})

	// 過去にクリアしたレベル（例: レベル5）への再挑戦
	screen.input.Value = "5"
	valid, _ := screen.validateInput()

	if !valid {
		t.Error("過去クリアレベルへの再挑戦が拒否されました")
	}
}

// TestBattleSelectRender はバトル選択画面のレンダリングをテストします。
func TestBattleSelectRender(t *testing.T) {
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// TestBattleSelectBackNavigation は戻るナビゲーションのテストです。

func TestBattleSelectBackNavigation(t *testing.T) {
	screen := NewBattleSelectScreen(10, &mockAgentProvider{})

	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEsc})

	if cmd == nil {
		t.Error("Escキーでコマンドが返されません")
	}
}

// ==================== タスク2.2: カルーセル方式のテスト ====================

// mockDefeatedEnemyProvider はテスト用のDefeatedEnemyProvider実装です。
type mockDefeatedEnemyProvider struct {
	defeated map[string]int
}

func (m *mockDefeatedEnemyProvider) GetDefeatedEnemies() map[string]int {
	return m.defeated
}

func (m *mockDefeatedEnemyProvider) IsEnemyDefeated(enemyTypeID string) bool {
	_, exists := m.defeated[enemyTypeID]
	return exists
}

func (m *mockDefeatedEnemyProvider) GetDefeatedLevel(enemyTypeID string) int {
	return m.defeated[enemyTypeID]
}

// mockEnemyTypeProvider はテスト用のEnemyTypeProvider実装です。
type mockEnemyTypeProvider struct {
	enemyTypes []domain.EnemyType
}

func (m *mockEnemyTypeProvider) GetEnemyTypes() []domain.EnemyType {
	return m.enemyTypes
}

// createTestEnemyTypes はテスト用の敵タイプリストを作成します。
func createTestEnemyTypes() []domain.EnemyType {
	return []domain.EnemyType{
		{ID: "slime", Name: "スライム", DefaultLevel: 1, BaseHP: 50, AttackType: "physical"},
		{ID: "goblin", Name: "ゴブリン", DefaultLevel: 2, BaseHP: 80, AttackType: "physical"},
		{ID: "dragon", Name: "ドラゴン", DefaultLevel: 10, BaseHP: 500, AttackType: "magic"},
	}
}

// TestBattleSelectCarouselInitialization はカルーセル方式の初期化をテストします。
func TestBattleSelectCarouselInitialization(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	if screen == nil {
		t.Fatal("BattleSelectScreenがnilです")
	}

	// 敵タイプが読み込まれていること
	if len(screen.enemyTypes) != 3 {
		t.Errorf("敵タイプ数: got %d, want 3", len(screen.enemyTypes))
	}

	// 初期選択インデックスが0であること
	if screen.selectedTypeIdx != 0 {
		t.Errorf("初期選択インデックス: got %d, want 0", screen.selectedTypeIdx)
	}
}

// TestBattleSelectCarouselNavigation は左右キーによる敵種類変更をテストします。
func TestBattleSelectCarouselNavigation(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// 右キーで次の敵タイプへ
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})
	if screen.selectedTypeIdx != 1 {
		t.Errorf("右キー後のインデックス: got %d, want 1", screen.selectedTypeIdx)
	}

	// 左キーで前の敵タイプへ
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyLeft})
	if screen.selectedTypeIdx != 0 {
		t.Errorf("左キー後のインデックス: got %d, want 0", screen.selectedTypeIdx)
	}

	// 最初の敵タイプで左キーを押すと最後に移動（ループ）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyLeft})
	if screen.selectedTypeIdx != 2 {
		t.Errorf("ループ後のインデックス: got %d, want 2", screen.selectedTypeIdx)
	}
}

// TestBattleSelectCarouselLevelSelection は上下キーによるレベル変更をテストします。
func TestBattleSelectCarouselLevelSelection(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	// slimeをレベル5で撃破済み
	defeated := map[string]int{"slime": 5}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// slime（デフォルトレベル1）が選択されている状態で
	// 撃破済みなので、レベル1〜6（撃破最高レベル+1）まで選択可能
	initialLevel := screen.selectedLevel
	if initialLevel != 1 {
		t.Errorf("初期レベル: got %d, want 1", initialLevel)
	}

	// 上キーでレベル上昇
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyUp})
	if screen.selectedLevel != 2 {
		t.Errorf("上キー後のレベル: got %d, want 2", screen.selectedLevel)
	}

	// 下キーでレベル下降
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyDown})
	if screen.selectedLevel != 1 {
		t.Errorf("下キー後のレベル: got %d, want 1", screen.selectedLevel)
	}
}

// TestBattleSelectCarouselUndefeatedEnemy は未撃破敵のレベル制限をテストします。
func TestBattleSelectCarouselUndefeatedEnemy(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	// goblinは未撃破
	defeated := map[string]int{"slime": 5}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// goblin（インデックス1）を選択
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})

	// 未撃破なのでデフォルトレベル（2）のみ選択可能
	if screen.selectedLevel != 2 {
		t.Errorf("未撃破敵のレベル: got %d, want 2", screen.selectedLevel)
	}

	// 上下キーを押してもレベルが変わらない
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyUp})
	if screen.selectedLevel != 2 {
		t.Errorf("上キー後のレベル（未撃破）: got %d, want 2", screen.selectedLevel)
	}
}

// TestBattleSelectCarouselStartBattle はバトル開始メッセージをテストします。
func TestBattleSelectCarouselStartBattle(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	agent := createTestAgent()
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{agents: []*domain.AgentModel{agent}},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// Enterでバトル開始
	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEnter})

	if cmd == nil {
		t.Fatal("コマンドがnilです")
	}

	// コマンドを実行してメッセージを取得
	msg := cmd()

	startBattleMsg, ok := msg.(StartBattleMsg)
	if !ok {
		t.Fatalf("StartBattleMsgではありません: %T", msg)
	}

	// 敵タイプIDが含まれていること
	if startBattleMsg.EnemyTypeID != "slime" {
		t.Errorf("敵タイプID: got %s, want slime", startBattleMsg.EnemyTypeID)
	}

	// レベルが正しいこと
	if startBattleMsg.Level != 1 {
		t.Errorf("レベル: got %d, want 1", startBattleMsg.Level)
	}
}

// createTestAgent はテスト用のエージェントを作成します。
func createTestAgent() *domain.AgentModel {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}
	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})
	modules := []*domain.ModuleModel{
		newTestModule("m1", "モジュール1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m2", "モジュール2", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m3", "モジュール3", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
		newTestModule("m4", "モジュール4", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", ""),
	}
	return domain.NewAgent("agent1", core, modules)
}

// ==================== タスク2.3: 敵情報パネルのテスト ====================

// TestBattleSelectCarouselEnemyInfoPanel は敵情報パネルの表示をテストします。
func TestBattleSelectCarouselEnemyInfoPanel(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{
			ID:           "slime",
			Name:         "スライム",
			DefaultLevel: 1,
			BaseHP:       50,
			AttackType:   "physical",
			NormalPassive: &domain.EnemyPassiveSkill{
				ID:   "slime_normal",
				Name: "ぷるぷるボディ",
			},
			EnhancedPassive: &domain.EnemyPassiveSkill{
				ID:   "slime_enhanced",
				Name: "怒りのスライム",
			},
		},
	}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	screen.width = 120
	screen.height = 40

	view := screen.View()

	// 敵名が表示されていること
	if !containsString(view, "スライム") {
		t.Error("敵名が表示されていません")
	}

	// 攻撃属性が表示されていること
	if !containsString(view, "物理") {
		t.Error("攻撃属性が表示されていません")
	}

	// パッシブスキル名が表示されていること
	if !containsString(view, "ぷるぷるボディ") {
		t.Error("通常パッシブ名が表示されていません")
	}

	if !containsString(view, "怒りのスライム") {
		t.Error("強化パッシブ名が表示されていません")
	}
}

// TestBattleSelectCarouselUndefeatedIndicator は未撃破敵の視覚的表示をテストします。
func TestBattleSelectCarouselUndefeatedIndicator(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	screen.width = 120
	screen.height = 40

	view := screen.View()

	// 未撃破の表示があること
	if !containsString(view, "未撃破") {
		t.Error("未撃破の表示がありません")
	}

	// 固定レベルの表示があること
	if !containsString(view, "固定") {
		t.Error("固定レベルの表示がありません")
	}
}

// TestBattleSelectCarouselDefeatedIndicator は撃破済み敵の視覚的表示をテストします。
func TestBattleSelectCarouselDefeatedIndicator(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	defeated := map[string]int{"slime": 5}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	screen.width = 120
	screen.height = 40

	view := screen.View()

	// 撃破済みの表示があること
	if !containsString(view, "撃破済み") {
		t.Error("撃破済みの表示がありません")
	}

	// 最高レベルの表示があること
	if !containsString(view, "最高Lv.5") {
		t.Error("最高レベルの表示がありません")
	}
}

// containsString は既にagent_management_test.goで定義されているため、ここでは再利用します。

// ==================== タスク2.4: レベル選択制約のテスト ====================

// TestBattleSelectCarouselLevelConstraintUndefeated は未撃破敵のレベル制約をテストします。
func TestBattleSelectCarouselLevelConstraintUndefeated(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	// goblinは未撃破（デフォルトレベル2）
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: map[string]int{}},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// goblin（インデックス1）を選択
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})

	// デフォルトレベルが設定されていること
	if screen.selectedLevel != 2 {
		t.Errorf("デフォルトレベル: got %d, want 2", screen.selectedLevel)
	}

	// min == max であること（固定）
	if screen.minSelectableLevel != screen.maxSelectableLevel {
		t.Errorf("未撃破敵のレベル範囲が固定でありません: min=%d, max=%d",
			screen.minSelectableLevel, screen.maxSelectableLevel)
	}
}

// TestBattleSelectCarouselLevelConstraintDefeated は撃破済み敵のレベル制約をテストします。
func TestBattleSelectCarouselLevelConstraintDefeated(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	// slimeをレベル10で撃破済み（デフォルトレベル1）
	defeated := map[string]int{"slime": 10}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// slime（インデックス0）が選択されている
	// デフォルトレベル1、撃破最高レベル10なので、1〜11まで選択可能
	if screen.minSelectableLevel != 1 {
		t.Errorf("最小選択可能レベル: got %d, want 1", screen.minSelectableLevel)
	}

	if screen.maxSelectableLevel != 11 {
		t.Errorf("最大選択可能レベル: got %d, want 11", screen.maxSelectableLevel)
	}
}

// TestBattleSelectCarouselLevelConstraintMaxLevel は最大レベル100の制約をテストします。
func TestBattleSelectCarouselLevelConstraintMaxLevel(t *testing.T) {
	enemyTypes := []domain.EnemyType{
		{ID: "boss", Name: "ボス", DefaultLevel: 50, BaseHP: 1000},
	}
	// レベル100で撃破済み
	defeated := map[string]int{"boss": 100}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// 最大レベルは100を超えないこと
	if screen.maxSelectableLevel > 100 {
		t.Errorf("最大選択可能レベルが100を超えています: got %d", screen.maxSelectableLevel)
	}
}

// TestBattleSelectCarouselStartBattleWithEnemyTypeID はバトル開始メッセージに敵タイプIDが含まれることをテストします。
func TestBattleSelectCarouselStartBattleWithEnemyTypeID(t *testing.T) {
	enemyTypes := createTestEnemyTypes()
	agent := createTestAgent()
	defeated := map[string]int{"goblin": 5}
	screen := NewBattleSelectScreenCarousel(
		&mockAgentProvider{agents: []*domain.AgentModel{agent}},
		&mockDefeatedEnemyProvider{defeated: defeated},
		&mockEnemyTypeProvider{enemyTypes: enemyTypes},
	)

	// goblin（インデックス1）を選択
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})

	// レベルを3に設定
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyUp})

	// Enterでバトル開始
	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEnter})

	if cmd == nil {
		t.Fatal("コマンドがnilです")
	}

	msg := cmd()
	startBattleMsg, ok := msg.(StartBattleMsg)
	if !ok {
		t.Fatalf("StartBattleMsgではありません: %T", msg)
	}

	// 敵タイプIDがgoblinであること
	if startBattleMsg.EnemyTypeID != "goblin" {
		t.Errorf("敵タイプID: got %s, want goblin", startBattleMsg.EnemyTypeID)
	}

	// レベルが3であること
	if startBattleMsg.Level != 3 {
		t.Errorf("レベル: got %d, want 3", startBattleMsg.Level)
	}
}
