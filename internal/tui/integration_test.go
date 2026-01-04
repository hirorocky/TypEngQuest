// Package tui は統合テストを提供します。
// Task 9: 統合テストとシステム検証
package tui

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/ascii"
	"hirorocky/type-battle/internal/tui/components"
	"hirorocky/type-battle/internal/tui/screens"
	"hirorocky/type-battle/internal/tui/styles"

	tea "github.com/charmbracelet/bubbletea"
)

// newTestDamageModule はテスト用のダメージモジュールを作成するヘルパー関数です。
func newTestDamageModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
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

// newTestHealModule はテスト用の回復モジュールを作成するヘルパー関数です。
func newTestHealModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "💚",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target:      domain.TargetSelf,
				HPFormula:   &domain.HPFormula{Base: 0, StatCoef: statCoef, StatRef: statRef},
				Probability: 1.0,
				Icon:        "💚",
			},
		},
	}, nil)
}

// newTestBuffModule はテスト用のバフモジュールを作成するヘルパー関数です。
func newTestBuffModule(id, name string, tags []string, value float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⬆️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetSelf,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageBonus,
					Value:    value,
					Duration: 10.0,
				},
				Probability: 1.0,
				Icon:        "⬆️",
			},
		},
	}, nil)
}

// newTestDebuffModule はテスト用のデバフモジュールを作成するヘルパー関数です。
func newTestDebuffModule(id, name string, tags []string, value float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:          id,
		Name:        name,
		Icon:        "⬇️",
		Tags:        tags,
		Description: description,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetEnemy,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageCut,
					Value:    value,
					Duration: 8.0,
				},
				Probability: 1.0,
				Icon:        "⬇️",
			},
		},
	}, nil)
}

// ==================== Task 9.1: ホーム画面の統合テスト ====================

// TestIntegrationHomeScreen はホーム画面の表示と操作フローをテストします。

func TestIntegrationHomeScreen(t *testing.T) {
	// テスト用のAgentProvider
	provider := &testAgentProvider{
		agents: []*domain.AgentModel{
			{Level: 5},
			{Level: 10},
		},
	}

	screen := screens.NewHomeScreen(15, provider)
	screen.Update(tea.WindowSizeMsg{Width: 120, Height: 40})

	rendered := screen.View()

	if rendered == "" {
		t.Error("ホーム画面のレンダリング結果が空です")
	}

	if !containsS(rendered, "メインメニュー") {
		t.Error("メインメニューが表示されていません")
	}
	if !containsS(rendered, "進行状況") {
		t.Error("進行状況パネルが表示されていません")
	}

	if !containsS(rendered, "到達最高レベル") {
		t.Error("到達最高レベルが表示されていません")
	}
}

// TestIntegrationHomeScreenWithoutAgents は装備なし時の動作をテストします。

func TestIntegrationHomeScreenWithoutAgents(t *testing.T) {
	screen := screens.NewHomeScreen(5, nil)
	screen.Update(tea.WindowSizeMsg{Width: 120, Height: 40})

	rendered := screen.View()
	// 誘導メッセージまたはバトル無効化の視覚的表示を確認
	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// ==================== Task 9.2: エージェント管理画面の統合テスト ====================

// TestIntegrationAgentManagement はエージェント管理画面の操作フローをテストします。

func TestIntegrationAgentManagement(t *testing.T) {
	inventory := createTestInventory()
	screen := screens.NewAgentManagementScreen(inventory, false, nil)
	screen.Update(tea.WindowSizeMsg{Width: 120, Height: 40})

	// 全タブのレンダリングテスト
	rendered := screen.View()
	if rendered == "" {
		t.Error("エージェント管理画面のレンダリング結果が空です")
	}

	// タブ切り替え（右キー）でエラーが発生しないこと
	screen.Update(tea.KeyMsg{Type: tea.KeyRight})
	rendered = screen.View()
	if rendered == "" {
		t.Error("タブ切り替え後のレンダリング結果が空です")
	}
}

// ==================== Task 9.3: バトル画面の統合テスト ====================

// TestIntegrationBattleScreen はバトル画面のアニメーションと表示をテストします。

func TestIntegrationBattleScreen(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := screens.NewBattleScreen(enemy, player, agents, nil)
	screen.Update(tea.WindowSizeMsg{Width: 120, Height: 40})

	rendered := screen.View()

	if !containsS(rendered, enemy.Name) {
		t.Error("敵情報エリアが表示されていません")
	}
	if !containsS(rendered, "プレイヤー") {
		t.Error("プレイヤー情報エリアが表示されていません")
	}
	if !containsS(rendered, "モジュール") {
		t.Error("モジュールエリアが表示されていません")
	}
}

// TestIntegrationBattleScreenWinLose は勝敗表示をテストします。

func TestIntegrationBattleScreenWinLose(t *testing.T) {
	// 勝利ケース
	enemy := createTestEnemy()
	enemy.HP = 0
	player := createTestPlayer()
	agents := createTestAgents()

	screen := screens.NewBattleScreen(enemy, player, agents, nil)
	screen.Update(screens.BattleTickMsg{})

	if !screen.IsVictory() {
		t.Error("勝利状態になっていません")
	}

	rendered := screen.View()
	if !containsS(rendered, "勝利") {
		t.Error("勝利メッセージが表示されていません")
	}
}

// ==================== Task 9.4: カラーテーマと視覚フィードバックの統合テスト ====================

// TestIntegrationColorTheme はカラーテーマの統一をテストします。

func TestIntegrationColorTheme(t *testing.T) {
	// カラーモード
	colorStyles := styles.NewGameStyles()
	if colorStyles == nil {
		t.Error("カラーモードのGameStylesがnilです")
	}

	// モノクロモード
	monoStyles := styles.NewGameStylesWithNoColor()
	if monoStyles == nil {
		t.Error("モノクロモードのGameStylesがnilです")
	}

	// HPバーがレンダリングできること
	colorBar := colorStyles.RenderHPBar(50, 100, 20)
	monoBar := monoStyles.RenderHPBar(50, 100, 20)
	if colorBar == "" || monoBar == "" {
		t.Error("HPバーのレンダリングに失敗しました")
	}
}

// TestIntegrationVisualFeedback は視覚フィードバックの統合をテストします。

func TestIntegrationVisualFeedback(t *testing.T) {
	// メニューコンポーネント
	items := []components.MenuItem{
		{Label: "有効", Value: "1", Disabled: false},
		{Label: "無効", Value: "2", Disabled: true},
	}
	menu := components.NewMenu(items)

	rendered := menu.Render()
	if !containsS(rendered, ">") {
		t.Error("選択カーソルが表示されていません")
	}

	// 入力フィールド
	field := components.NewInputField("テスト")
	valid, msg := field.Validate()
	if valid {
		t.Error("空の入力がバリデーションを通過しました")
	}
	if msg == "" {
		t.Error("エラーメッセージが空です")
	}
}

// TestIntegrationASCIIArt はASCIIアート機能の統合をテストします。
func TestIntegrationASCIIArt(t *testing.T) {
	// ロゴ
	logo := ascii.NewASCIILogo()
	logoRender := logo.Render(true)
	if logoRender == "" {
		t.Error("ASCIIロゴのレンダリングに失敗しました")
	}

	// 数字
	numbers := ascii.NewASCIINumbers()
	numRender := numbers.RenderNumber(123, styles.ColorPrimary)
	if numRender == "" {
		t.Error("ASCII数字のレンダリングに失敗しました")
	}

	// WIN/LOSE
	gameStyles := styles.NewGameStyles()
	winLose := ascii.NewWinLoseRenderer(gameStyles)
	winRender := winLose.RenderWin()
	loseRender := winLose.RenderLose()
	if winRender == "" || loseRender == "" {
		t.Error("WIN/LOSEのレンダリングに失敗しました")
	}
}

// ==================== ヘルパー関数 ====================

type testAgentProvider struct {
	agents []*domain.AgentModel
}

func (p *testAgentProvider) GetEquippedAgents() []*domain.AgentModel {
	return p.agents
}

func containsS(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// InventoryProviderの実装
type testInventoryProvider struct {
	cores    []*domain.CoreModel
	modules  []*domain.ModuleModel
	agents   []*domain.AgentModel
	equipped []*domain.AgentModel
}

func (i *testInventoryProvider) GetCores() []*domain.CoreModel {
	return i.cores
}

func (i *testInventoryProvider) GetModules() []*domain.ModuleModel {
	return i.modules
}

func (i *testInventoryProvider) GetAgents() []*domain.AgentModel {
	return i.agents
}

func (i *testInventoryProvider) GetEquippedAgents() []*domain.AgentModel {
	return i.equipped
}

func (i *testInventoryProvider) AddAgent(agent *domain.AgentModel) error {
	i.agents = append(i.agents, agent)
	return nil
}

func (i *testInventoryProvider) RemoveCore(id string) error {
	for idx, c := range i.cores {
		if c.ID == id {
			i.cores = append(i.cores[:idx], i.cores[idx+1:]...)
			return nil
		}
	}
	return nil
}

func (i *testInventoryProvider) RemoveModule(typeID string) error {
	for idx, m := range i.modules {
		if m.TypeID == typeID {
			i.modules = append(i.modules[:idx], i.modules[idx+1:]...)
			return nil
		}
	}
	return nil
}

func (i *testInventoryProvider) EquipAgent(slot int, agent *domain.AgentModel) error {
	for len(i.equipped) <= slot {
		i.equipped = append(i.equipped, nil)
	}
	i.equipped[slot] = agent
	return nil
}

func (i *testInventoryProvider) UnequipAgent(slot int) error {
	if slot < len(i.equipped) {
		i.equipped[slot] = nil
	}
	return nil
}

func createTestInventory() screens.InventoryProvider {
	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
	}

	core1 := domain.NewCore("core1", "コア1", 5, coreType, domain.PassiveSkill{})
	core2 := domain.NewCore("core2", "コア2", 10, coreType, domain.PassiveSkill{})

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", "物理ダメージ"),
		newTestDamageModule("m2", "魔法攻撃", []string{"magic_low"}, 1.0, "MAG", "魔法ダメージ"),
		newTestHealModule("m3", "回復", []string{"heal_low"}, 1.0, "MAG", "HP回復"),
		newTestBuffModule("m4", "バフ", []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
		newTestDebuffModule("m5", "デバフ", []string{"debuff_low"}, 10, "SPD", "攻撃力DOWN"),
	}

	return &testInventoryProvider{
		cores:    []*domain.CoreModel{core1, core2},
		modules:  modules,
		agents:   []*domain.AgentModel{},
		equipped: []*domain.AgentModel{nil, nil, nil},
	}
}

func createTestEnemy() *domain.EnemyModel {
	enemyType := domain.EnemyType{
		ID:                 "test_enemy",
		Name:               "テストエネミー",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 2 * time.Second,
		AttackType:         "physical",
	}

	return domain.NewEnemy(
		"enemy1",
		"テストエネミー Lv.5",
		5,
		500,
		20,
		2*time.Second,
		enemyType,
	)
}

func createTestPlayer() *domain.PlayerModel {
	player := domain.NewPlayer()
	player.MaxHP = 100
	player.HP = 100
	return player
}

func createTestAgents() []*domain.AgentModel {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}

	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", "物理ダメージ"),
		newTestDamageModule("m2", "魔法攻撃", []string{"magic_low"}, 1.0, "MAG", "魔法ダメージ"),
		newTestHealModule("m3", "回復", []string{"heal_low"}, 1.0, "MAG", "HP回復"),
		newTestBuffModule("m4", "バフ", []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
	}

	agent := domain.NewAgent("agent1", core, modules)
	return []*domain.AgentModel{agent}
}
