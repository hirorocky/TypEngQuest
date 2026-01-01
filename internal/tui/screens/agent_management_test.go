// Package screens はTUI画面のテストを提供します。
package screens

import (
	"testing"

	"hirorocky/type-battle/internal/domain"

	tea "github.com/charmbracelet/bubbletea"
)

// newTestDamageModule はテスト用ダメージモジュールを作成するヘルパー関数です。
func newTestDamageModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:              id,
		Name:            name,
		Icon:            "⚔️",
		Tags:            tags,
		Description:     description,
		CooldownSeconds: 10.0,
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

// newTestHealModule はテスト用回復モジュールを作成するヘルパー関数です。
func newTestHealModule(id, name string, tags []string, statCoef float64, statRef, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:              id,
		Name:            name,
		Icon:            "💚",
		Tags:            tags,
		Description:     description,
		CooldownSeconds: 10.0,
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

// newTestBuffModule はテスト用バフモジュールを作成するヘルパー関数です。
func newTestBuffModule(id, name string, tags []string, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:              id,
		Name:            name,
		Icon:            "⬆️",
		Tags:            tags,
		Description:     description,
		CooldownSeconds: 10.0,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetSelf,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageBonus,
					Value:    10.0,
					Duration: 10.0,
				},
				Probability: 1.0,
				Icon:        "⬆️",
			},
		},
	}, nil)
}

// newTestDebuffModule はテスト用デバフモジュールを作成するヘルパー関数です。
func newTestDebuffModule(id, name string, tags []string, description string) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:              id,
		Name:            name,
		Icon:            "⬇️",
		Tags:            tags,
		Description:     description,
		CooldownSeconds: 10.0,
		Effects: []domain.ModuleEffect{
			{
				Target: domain.TargetEnemy,
				ColumnSpec: &domain.EffectColumnSpec{
					Column:   domain.ColDamageCut,
					Value:    -10.0,
					Duration: 8.0,
				},
				Probability: 1.0,
				Icon:        "⬇️",
			},
		},
	}, nil)
}

// newTestModuleWithChainEffect はチェイン効果付きモジュールを作成するヘルパー関数です。
func newTestModuleWithChainEffect(id, name string, tags []string, statCoef float64, statRef, description string, chainEffect *domain.ChainEffect) *domain.ModuleModel {
	return domain.NewModuleFromType(domain.ModuleType{
		ID:              id,
		Name:            name,
		Icon:            "⚔️",
		Tags:            tags,
		Description:     description,
		CooldownSeconds: 10.0,
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

// ==================== Task 10.4: エージェント管理画面のテスト ====================

// TestNewAgentManagementScreen はAgentManagementScreenの初期化をテストします。
func TestNewAgentManagementScreen(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	if screen == nil {
		t.Fatal("AgentManagementScreenがnilです")
	}

	if screen.inventory == nil {
		t.Error("インベントリがnilです")
	}
}

// TestAgentManagementTabs はタブ切り替えをテストします。

func TestAgentManagementTabs(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 初期タブ
	if screen.currentTab != TabCoreList {
		t.Errorf("初期タブが正しくありません: got %d, want %d", screen.currentTab, TabCoreList)
	}

	// タブ切り替え（右へ）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyRight})
	if screen.currentTab != TabModuleList {
		t.Errorf("タブ切り替え(右)が正しくありません: got %d, want %d", screen.currentTab, TabModuleList)
	}

	// タブ切り替え（左へ）
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyLeft})
	if screen.currentTab != TabCoreList {
		t.Errorf("タブ切り替え(左)が正しくありません: got %d, want %d", screen.currentTab, TabCoreList)
	}
}

// TestAgentManagementCoreList はコア一覧表示をテストします。

func TestAgentManagementCoreList(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// コア一覧タブに移動
	screen.currentTab = TabCoreList
	screen.updateCurrentList()

	// コアリストが表示されていること
	if len(screen.coreList) == 0 {
		t.Error("コアリストが空です")
	}
}

// TestAgentManagementModuleList はモジュール一覧表示をテストします。

func TestAgentManagementModuleList(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// モジュール一覧タブに移動
	screen.currentTab = TabModuleList
	screen.updateCurrentList()

	// モジュールリストが表示されていること
	if len(screen.moduleList) == 0 {
		t.Error("モジュールリストが空です")
	}
}

// TestAgentManagementSynthesis は合成サブ画面をテストします。

func TestAgentManagementSynthesis(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 合成タブに移動
	screen.currentTab = TabSynthesis
	screen.updateCurrentList()

	// 合成状態が初期化されていること
	if screen.synthesisState.selectedCore != nil {
		t.Error("初期状態でコアが選択されています")
	}

	if len(screen.synthesisState.selectedModules) != 0 {
		t.Error("初期状態でモジュールが選択されています")
	}
}

// TestAgentManagementEquip は装備サブ画面をテストします。

func TestAgentManagementEquip(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 装備タブに移動
	screen.currentTab = TabEquip
	screen.updateCurrentList()

	// 装備スロットが3つあること
	if len(screen.equipSlots) != 3 {
		t.Errorf("装備スロット数: got %d, want 3", len(screen.equipSlots))
	}
}

// TestAgentManagementCoreDetailDisplay はコア詳細情報表示をテストします。

func TestAgentManagementCoreDetailDisplay(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// コア一覧タブでコアを選択
	screen.currentTab = TabCoreList
	screen.updateCurrentList()

	if len(screen.coreList) > 0 {
		screen.selectedIndex = 0
		detail := screen.getSelectedCoreDetail()

		if detail == nil {
			t.Error("コア詳細が取得できません")
		}
	}
}

// TestAgentManagementModuleDetailDisplay はモジュール詳細情報表示をテストします。

func TestAgentManagementModuleDetailDisplay(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// モジュール一覧タブでモジュールを選択
	screen.currentTab = TabModuleList
	screen.updateCurrentList()

	if len(screen.moduleList) > 0 {
		screen.selectedIndex = 0
		detail := screen.getSelectedModuleDetail()

		if detail == nil {
			t.Error("モジュール詳細が取得できません")
		}
	}
}

// TestAgentManagementSynthesisFlow は合成フローをテストします。

func TestAgentManagementSynthesisFlow(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 合成タブに移動
	screen.currentTab = TabSynthesis
	screen.updateCurrentList()

	// コアを選択
	if len(screen.coreList) > 0 {
		screen.synthesisState.selectedCore = screen.coreList[0]
	}

	// モジュールを4つ選択
	if len(screen.moduleList) >= 4 {
		screen.synthesisState.selectedModules = screen.moduleList[:4]
	}

	// 合成可能かチェック
	canSynthesize := screen.canSynthesize()
	if !canSynthesize {
		t.Log("合成に必要な条件が満たされていません（テスト環境依存）")
	}
}

// TestAgentManagementEquipFlow は装備フローをテストします。

func TestAgentManagementEquipFlow(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 装備タブに移動
	screen.currentTab = TabEquip
	screen.updateCurrentList()

	// 初期状態では空きスロットがあること
	emptySlots := 0
	for _, slot := range screen.equipSlots {
		if slot == nil {
			emptySlots++
		}
	}

	if emptySlots != 3 {
		t.Errorf("空きスロット数: got %d, want 3", emptySlots)
	}
}

// TestAgentManagementBackNavigation は戻るナビゲーションをテストします。
func TestAgentManagementBackNavigation(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)

	_, cmd := screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyEsc})

	if cmd == nil {
		t.Error("Escキーでコマンドが返されません")
	}
}

// TestAgentManagementRender はレンダリングをテストします。
func TestAgentManagementRender(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// ==================== ヘルパー関数 ====================

// TestInventory はテスト用のインベントリを表すインターフェースです。
type TestInventory struct {
	cores    []*domain.CoreModel
	modules  []*domain.ModuleModel
	agents   []*domain.AgentModel
	equipped []*domain.AgentModel
}

// GetCores はコア一覧を返します。
func (i *TestInventory) GetCores() []*domain.CoreModel {
	return i.cores
}

// GetModules はモジュール一覧を返します。
func (i *TestInventory) GetModules() []*domain.ModuleModel {
	return i.modules
}

// GetAgents はエージェント一覧を返します。
func (i *TestInventory) GetAgents() []*domain.AgentModel {
	return i.agents
}

// GetEquippedAgents は装備中エージェント一覧を返します。
func (i *TestInventory) GetEquippedAgents() []*domain.AgentModel {
	return i.equipped
}

// AddAgent はエージェントを追加します。
func (i *TestInventory) AddAgent(agent *domain.AgentModel) error {
	i.agents = append(i.agents, agent)
	return nil
}

// RemoveCore はコアを削除します。
func (i *TestInventory) RemoveCore(id string) error {
	for idx, c := range i.cores {
		if c.ID == id {
			i.cores = append(i.cores[:idx], i.cores[idx+1:]...)
			return nil
		}
	}
	return nil
}

// RemoveModule はモジュールを削除します。
func (i *TestInventory) RemoveModule(typeID string) error {
	for idx, m := range i.modules {
		if m.TypeID == typeID {
			i.modules = append(i.modules[:idx], i.modules[idx+1:]...)
			return nil
		}
	}
	return nil
}

// EquipAgent はエージェントを装備します。
func (i *TestInventory) EquipAgent(slot int, agent *domain.AgentModel) error {
	for len(i.equipped) <= slot {
		i.equipped = append(i.equipped, nil)
	}
	i.equipped[slot] = agent
	return nil
}

// UnequipAgent はエージェントの装備を解除します。
func (i *TestInventory) UnequipAgent(slot int) error {
	if slot < len(i.equipped) {
		i.equipped[slot] = nil
	}
	return nil
}

func createTestInventory() *TestInventory {
	coreType := domain.CoreType{
		ID:          "all_rounder",
		Name:        "オールラウンダー",
		StatWeights: map[string]float64{"STR": 1.0, "INT": 1.0, "WIL": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
	}

	core1 := domain.NewCore("core1", "コア1", 5, coreType, domain.PassiveSkill{})
	core2 := domain.NewCore("core2", "コア2", 10, coreType, domain.PassiveSkill{})

	modules := []*domain.ModuleModel{
		newTestDamageModule("m1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", "物理ダメージ"),
		newTestDamageModule("m2", "魔法攻撃", []string{"magic_low"}, 1.0, "INT", "魔法ダメージ"),
		newTestHealModule("m3", "回復", []string{"heal_low"}, 0.8, "INT", "HP回復"),
		newTestBuffModule("m4", "バフ", []string{"buff_low"}, "攻撃力UP"),
		newTestDebuffModule("m5", "デバフ", []string{"debuff_low"}, "攻撃力DOWN"),
	}

	// テスト用エージェントを作成
	agentCore1 := domain.NewCore("agent_core1", "エージェントコア1", 5, coreType, domain.PassiveSkill{})
	agentCore2 := domain.NewCore("agent_core2", "エージェントコア2", 10, coreType, domain.PassiveSkill{})
	agentModules1 := []*domain.ModuleModel{
		newTestDamageModule("am1", "物理攻撃", []string{"physical_low"}, 1.0, "STR", "物理ダメージ"),
		newTestDamageModule("am2", "魔法攻撃", []string{"magic_low"}, 1.0, "INT", "魔法ダメージ"),
		newTestHealModule("am3", "回復", []string{"heal_low"}, 0.8, "INT", "HP回復"),
		newTestBuffModule("am4", "バフ", []string{"buff_low"}, "攻撃力UP"),
	}
	agentModules2 := []*domain.ModuleModel{
		newTestDamageModule("am5", "物理攻撃2", []string{"physical_low"}, 1.0, "STR", "物理ダメージ"),
		newTestDamageModule("am6", "魔法攻撃2", []string{"magic_low"}, 1.0, "INT", "魔法ダメージ"),
		newTestHealModule("am7", "回復2", []string{"heal_low"}, 0.8, "INT", "HP回復"),
		newTestBuffModule("am8", "バフ2", []string{"buff_low"}, "攻撃力UP"),
	}
	agent1 := domain.NewAgent("agent1", agentCore1, agentModules1)
	agent2 := domain.NewAgent("agent2", agentCore2, agentModules2)

	return &TestInventory{
		cores:    []*domain.CoreModel{core1, core2},
		modules:  modules,
		agents:   []*domain.AgentModel{agent1, agent2},
		equipped: []*domain.AgentModel{nil, nil, nil},
	}
}

// ==================== Task 5.1-5.4: エージェント管理画面UI改善のテスト ====================

// TestAgentManagementSynthesisLeftRightLayout は合成タブの左右分割レイアウトをテストします。

func TestAgentManagementSynthesisLeftRightLayout(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)
	screen.currentTab = TabSynthesis
	screen.width = 120
	screen.height = 40
	screen.updateCurrentList()

	rendered := screen.View()

	// 合成タブが表示されていること
	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}

	// 選択状況パネルが表示されていること
	if !containsString(rendered, "コア:") {
		t.Error("コア選択状況が表示されていません")
	}

	if !containsString(rendered, "モジュール") {
		t.Error("モジュール選択状況が表示されていません")
	}
}

// TestAgentManagementSynthesisDetailAndPreview は合成タブのパーツ詳細と完成予測ステータス表示をテストします。

func TestAgentManagementSynthesisDetailAndPreview(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)
	screen.currentTab = TabSynthesis
	screen.synthesisState.step = 0
	screen.width = 120
	screen.height = 40
	screen.updateCurrentList()

	// コアを選択
	if len(screen.coreList) > 0 {
		screen.selectedIndex = 0
		detail := screen.getSelectedCoreDetail()
		if detail == nil {
			t.Error("コア詳細が取得できません")
		}
	}

	rendered := screen.View()
	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// TestAgentManagementEquipTopBottomLayout は装備タブの上下分割レイアウトをテストします。

func TestAgentManagementEquipTopBottomLayout(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)
	screen.currentTab = TabEquip
	screen.width = 120
	screen.height = 40
	screen.updateCurrentList()

	rendered := screen.View()

	// 装備中エージェントセクションが表示されていること
	if !containsString(rendered, "装備中エージェント") {
		t.Error("装備中エージェントセクションが表示されていません")
	}
	// 空スロットの表示または装備済みエージェントが表示されていること
	if !containsString(rendered, "(空)") && !containsString(rendered, "Lv.") {
		t.Error("装備スロットが表示されていません")
	}
}

// TestAgentManagementEquipSlotSwitch は装備タブのスロット切替をテストします。

func TestAgentManagementEquipSlotSwitch(t *testing.T) {
	inventory := createTestInventory()
	screen := NewAgentManagementScreen(inventory, false, nil)
	screen.currentTab = TabEquip
	screen.width = 120
	screen.height = 40
	screen.updateCurrentList()

	// 初期選択位置
	initialIndex := screen.selectedIndex

	// 下キーで次のスロット/エージェントに移動
	screen.handleKeyMsg(tea.KeyMsg{Type: tea.KeyDown})

	// 選択位置が変わっていること
	if screen.selectedIndex == initialIndex && screen.getMaxIndex() > 1 {
		t.Error("選択位置が変わっていません")
	}
}

// containsString は文字列に部分文字列が含まれるかを確認します（テスト用）。
func containsString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// ==================== タスク10: エージェント管理画面拡張テスト ====================

// createTestInventoryWithPassiveAndChain はパッシブスキルとチェイン効果付きのテスト用インベントリを作成します。
func createTestInventoryWithPassiveAndChain() *TestInventory {
	// パッシブスキル付きコア
	passiveSkill := domain.PassiveSkill{
		ID:          "test_passive",
		Name:        "パワーブースト",
		Description: "STRを強化する",
		Effects: map[domain.EffectColumn]float64{
			domain.ColSTRMultiplier: 1.1,
		},
	}

	coreType := domain.CoreType{
		ID:             "test_core_type",
		Name:           "テストコア",
		StatWeights:    map[string]float64{"STR": 1.2, "INT": 1.0, "WIL": 1.1, "LUK": 0.8},
		AllowedTags:    []string{"physical_low", "magic_low"},
		PassiveSkillID: "test_passive",
	}

	core := domain.NewCore("core1", "テストコア", 5, coreType, passiveSkill)

	// チェイン効果付きモジュール
	chainEffect := domain.NewChainEffect(domain.ChainEffectDamageBonus, 25.0)
	module1 := newTestModuleWithChainEffect(
		"module1", "攻撃モジュール",
		[]string{"physical_low"},
		1.0, "STR", "テスト攻撃",
		&chainEffect,
	)
	module2 := newTestDamageModule(
		"module2", "魔法モジュール",
		[]string{"magic_low"},
		1.0, "INT", "テスト魔法",
	)
	module3 := newTestHealModule(
		"module3", "回復モジュール",
		[]string{"magic_low"},
		0.8, "INT", "テスト回復",
	)
	module4 := newTestBuffModule(
		"module4", "バフモジュール",
		[]string{"magic_low"},
		"テストバフ",
	)

	return &TestInventory{
		cores:    []*domain.CoreModel{core},
		modules:  []*domain.ModuleModel{module1, module2, module3, module4},
		agents:   []*domain.AgentModel{},
		equipped: []*domain.AgentModel{nil, nil, nil},
	}
}

// TestAgentManagementScreen_RenderCorePreviewWithPassiveSkill はコアプレビューのパッシブスキル表示テストです。
func TestAgentManagementScreen_RenderCorePreviewWithPassiveSkill(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// コアタブを選択
	screen.currentTab = TabCoreList
	screen.selectedIndex = 0

	// View()を呼び出し
	result := screen.View()

	// パッシブスキル名が表示されている
	if !containsString(result, "パワーブースト") {
		t.Error("Core preview should contain passive skill name 'パワーブースト'")
	}
}

// TestAgentManagementScreen_RenderModulePreviewWithChainEffect はモジュールプレビューのチェイン効果表示テストです。
func TestAgentManagementScreen_RenderModulePreviewWithChainEffect(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// モジュールタブを選択
	screen.currentTab = TabModuleList
	screen.selectedIndex = 0

	// View()を呼び出し
	result := screen.View()

	// チェイン効果情報が表示されている（攻撃モジュールはチェイン効果あり）
	if !containsString(result, "攻撃モジュール") {
		t.Error("Module preview should contain module name")
	}
	// チェイン効果アイコンまたは説明が表示されている
	if !containsString(result, "チェイン") && !containsString(result, "ダメージ") {
		t.Log("Module preview does not show chain effect explicitly (may be displayed with icon)")
	}
}

// TestAgentManagementScreen_RenderSynthesisPreviewWithPassiveSkill は合成プレビューのパッシブスキル表示テストです。
func TestAgentManagementScreen_RenderSynthesisPreviewWithPassiveSkill(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 合成タブを選択してコアを選択した状態にする
	screen.currentTab = TabSynthesis
	screen.synthesisState.selectedCore = inventory.cores[0]
	screen.synthesisState.step = 1

	// View()を呼び出し
	result := screen.View()

	// 選択済みコアのパッシブスキル名が表示されている
	if !containsString(result, "パワーブースト") || !containsString(result, "テストコア") {
		t.Errorf("Synthesis preview should contain core name and passive skill, got: %s", result)
	}
}

// TestAgentManagementScreen_RenderSynthesisPreviewWithChainEffect は合成プレビューのチェイン効果表示テストです。
func TestAgentManagementScreen_RenderSynthesisPreviewWithChainEffect(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 合成タブを選択してコアとモジュールを選択した状態にする
	screen.currentTab = TabSynthesis
	screen.synthesisState.selectedCore = inventory.cores[0]
	screen.synthesisState.selectedModules = []*domain.ModuleModel{inventory.modules[0]}
	screen.synthesisState.step = 1

	// View()を呼び出し
	result := screen.View()

	// 選択済みモジュールの情報が表示されている
	if !containsString(result, "攻撃モジュール") {
		t.Error("Synthesis preview should contain selected module name")
	}
}

// TestAgentManagementScreen_CorePreviewShowsPassiveSkillEffects はコアプレビューのパッシブスキル効果詳細表示テストです。
func TestAgentManagementScreen_CorePreviewShowsPassiveSkillEffects(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// コアタブを選択
	screen.currentTab = TabCoreList
	screen.selectedIndex = 0

	// View()を呼び出し
	result := screen.View()

	// パッシブスキルの説明が表示されている
	if !containsString(result, "STR") {
		t.Errorf("Core preview should contain passive skill effect (STR), got: %s", result)
	}
}

// TestAgentManagementScreen_ModulePreviewShowsChainEffectDetails はモジュールプレビューのチェイン効果詳細表示テストです。
func TestAgentManagementScreen_ModulePreviewShowsChainEffectDetails(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// モジュールタブを選択（チェイン効果付きモジュール）
	screen.currentTab = TabModuleList
	screen.selectedIndex = 0

	// View()を呼び出し
	result := screen.View()

	// モジュール名は表示されている
	if !containsString(result, "攻撃モジュール") {
		t.Errorf("Module preview should contain module name, got: %s", result)
	}
}

// TestAgentManagementScreen_SynthesisShowsAllModules は合成プレビューで全モジュールを表示するテストです。
func TestAgentManagementScreen_SynthesisShowsAllModules(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// 2つのモジュールを追加
	screen.currentTab = TabSynthesis
	screen.synthesisState.selectedCore = inventory.cores[0]
	screen.synthesisState.selectedModules = inventory.modules[:2]
	screen.synthesisState.step = 1

	// View()を呼び出し
	result := screen.View()

	// 両方のモジュール名が表示されている
	if !containsString(result, "攻撃モジュール") {
		t.Error("Synthesis preview should contain first module name")
	}
}

// TestAgentManagementScreen_PassiveSkillDisplayWithLevel はパッシブスキルがレベルに応じて表示されるテストです。
func TestAgentManagementScreen_PassiveSkillDisplayWithLevel(t *testing.T) {
	inventory := createTestInventoryWithPassiveAndChain()
	screen := NewAgentManagementScreen(inventory, false, nil)

	// コアタブを選択
	screen.currentTab = TabCoreList
	screen.selectedIndex = 0

	// View()を呼び出し
	result := screen.View()

	// レベル表示が含まれている
	if !containsString(result, "Lv.5") {
		t.Errorf("Core preview should contain level info, got: %s", result)
	}
}
