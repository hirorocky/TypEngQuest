// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/components"
	"hirorocky/type-battle/internal/tui/styles"
)

// ==================== Task 10.4: エージェント管理画面 ====================

// AgentManagementTab はタブの種類を表します。
type AgentManagementTab int

const (
	// TabCoreList はコア一覧タブです。
	TabCoreList AgentManagementTab = iota
	// TabModuleList はモジュール一覧タブです。
	TabModuleList
	// TabSynthesis は合成タブです。
	TabSynthesis
	// TabEquip は装備タブです。
	TabEquip
)

// InventoryProvider はインベントリデータを提供するインターフェースです。
type InventoryProvider interface {
	GetCores() []*domain.CoreModel
	GetModules() []*domain.ModuleModel
	GetAgents() []*domain.AgentModel
	GetEquippedAgents() []*domain.AgentModel
	AddAgent(agent *domain.AgentModel) error
	RemoveCore(id string) error
	RemoveModule(id string) error
	EquipAgent(slot int, agent *domain.AgentModel) error
	UnequipAgent(slot int) error
}

// SynthesisState は合成状態を表します。
type SynthesisState struct {
	selectedCore    *domain.CoreModel
	selectedModules []*domain.ModuleModel
	step            int // 0: コア選択, 1: モジュール選択, 2: 確認
}

// AgentManagementScreen はエージェント管理画面を表します。
// Requirements: 5.1, 5.2, 5.5, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2
type AgentManagementScreen struct {
	inventory      InventoryProvider
	currentTab     AgentManagementTab
	selectedIndex  int
	coreList       []*domain.CoreModel
	moduleList     []*domain.ModuleModel
	agentList      []*domain.AgentModel
	equipSlots     []*domain.AgentModel
	synthesisState SynthesisState
	styles         *styles.GameStyles
	width          int
	height         int
}

// NewAgentManagementScreen は新しいAgentManagementScreenを作成します。
func NewAgentManagementScreen(inventory InventoryProvider) *AgentManagementScreen {
	screen := &AgentManagementScreen{
		inventory:     inventory,
		currentTab:    TabCoreList,
		selectedIndex: 0,
		equipSlots:    make([]*domain.AgentModel, 3),
		synthesisState: SynthesisState{
			selectedModules: []*domain.ModuleModel{},
		},
		styles: styles.NewGameStyles(),
		width:  120,
		height: 40,
	}
	screen.updateCurrentList()
	return screen
}

// Init は画面の初期化を行います。
func (s *AgentManagementScreen) Init() tea.Cmd {
	return nil
}

// Update はメッセージを処理します。
func (s *AgentManagementScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		s.width = msg.Width
		s.height = msg.Height
		return s, nil

	case tea.KeyMsg:
		return s.handleKeyMsg(msg)
	}

	return s, nil
}

// handleKeyMsg はキーボード入力を処理します。
func (s *AgentManagementScreen) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		return s, func() tea.Msg {
			return ChangeSceneMsg{Scene: "home"}
		}
	case "left", "h":
		s.prevTab()
	case "right", "l":
		s.nextTab()
	case "up", "k":
		s.moveUp()
	case "down", "j":
		s.moveDown()
	case "enter":
		return s.handleEnter()
	case "d":
		return s.handleDelete()
	}

	return s, nil
}

// prevTab は前のタブに移動します。
func (s *AgentManagementScreen) prevTab() {
	if s.currentTab > TabCoreList {
		s.currentTab--
		s.selectedIndex = 0
		s.updateCurrentList()
	}
}

// nextTab は次のタブに移動します。
func (s *AgentManagementScreen) nextTab() {
	if s.currentTab < TabEquip {
		s.currentTab++
		s.selectedIndex = 0
		s.updateCurrentList()
	}
}

// moveUp は選択を上に移動します。
func (s *AgentManagementScreen) moveUp() {
	if s.selectedIndex > 0 {
		s.selectedIndex--
	}
}

// moveDown は選択を下に移動します。
func (s *AgentManagementScreen) moveDown() {
	maxIndex := s.getMaxIndex()
	if s.selectedIndex < maxIndex-1 {
		s.selectedIndex++
	}
}

// getMaxIndex は現在のタブの最大インデックスを返します。
func (s *AgentManagementScreen) getMaxIndex() int {
	switch s.currentTab {
	case TabCoreList:
		return len(s.coreList)
	case TabModuleList:
		return len(s.moduleList)
	case TabSynthesis:
		if s.synthesisState.step == 0 {
			return len(s.coreList)
		}
		return len(s.moduleList)
	case TabEquip:
		return len(s.agentList) + len(s.equipSlots)
	}
	return 0
}

// updateCurrentList は現在のリストを更新します。
func (s *AgentManagementScreen) updateCurrentList() {
	s.coreList = s.inventory.GetCores()
	s.moduleList = s.inventory.GetModules()
	s.agentList = s.inventory.GetAgents()

	equipped := s.inventory.GetEquippedAgents()
	s.equipSlots = make([]*domain.AgentModel, 3)
	for i := 0; i < 3 && i < len(equipped); i++ {
		s.equipSlots[i] = equipped[i]
	}
}

// handleEnter はEnterキーの処理を行います。
func (s *AgentManagementScreen) handleEnter() (tea.Model, tea.Cmd) {
	switch s.currentTab {
	case TabSynthesis:
		return s.handleSynthesisEnter()
	case TabEquip:
		return s.handleEquipEnter()
	}
	return s, nil
}

// handleSynthesisEnter は合成タブでのEnter処理を行います。
func (s *AgentManagementScreen) handleSynthesisEnter() (tea.Model, tea.Cmd) {
	switch s.synthesisState.step {
	case 0: // コア選択
		if s.selectedIndex < len(s.coreList) {
			s.synthesisState.selectedCore = s.coreList[s.selectedIndex]
			s.synthesisState.step = 1
			s.selectedIndex = 0
		}
	case 1: // モジュール選択
		if s.selectedIndex < len(s.moduleList) {
			module := s.moduleList[s.selectedIndex]
			// タグ互換性チェック
			if s.synthesisState.selectedCore != nil && s.isModuleCompatible(module) {
				if len(s.synthesisState.selectedModules) < 4 {
					s.synthesisState.selectedModules = append(s.synthesisState.selectedModules, module)
				}
				if len(s.synthesisState.selectedModules) == 4 {
					s.synthesisState.step = 2
				}
			}
		}
	case 2: // 確認・合成実行
		if s.canSynthesize() {
			s.executeSynthesis()
			s.resetSynthesisState()
		}
	}
	return s, nil
}

// handleEquipEnter は装備タブでのEnter処理を行います。
func (s *AgentManagementScreen) handleEquipEnter() (tea.Model, tea.Cmd) {
	// 装備スロット（0-2）または所持エージェント（3以降）
	if s.selectedIndex < 3 {
		// 装備解除
		if s.equipSlots[s.selectedIndex] != nil {
			s.inventory.UnequipAgent(s.selectedIndex)
			s.updateCurrentList()
		}
	} else {
		// エージェント装備
		agentIndex := s.selectedIndex - 3
		if agentIndex < len(s.agentList) {
			// 空きスロットを探す
			for i := 0; i < 3; i++ {
				if s.equipSlots[i] == nil {
					s.inventory.EquipAgent(i, s.agentList[agentIndex])
					s.updateCurrentList()
					break
				}
			}
		}
	}
	return s, nil
}

// handleDelete は削除処理を行います。
func (s *AgentManagementScreen) handleDelete() (tea.Model, tea.Cmd) {
	switch s.currentTab {
	case TabCoreList:
		if s.selectedIndex < len(s.coreList) {
			s.inventory.RemoveCore(s.coreList[s.selectedIndex].ID)
			s.updateCurrentList()
		}
	case TabModuleList:
		if s.selectedIndex < len(s.moduleList) {
			s.inventory.RemoveModule(s.moduleList[s.selectedIndex].ID)
			s.updateCurrentList()
		}
	}
	return s, nil
}

// isModuleCompatible はモジュールがコアと互換性があるかチェックします。
func (s *AgentManagementScreen) isModuleCompatible(module *domain.ModuleModel) bool {
	if s.synthesisState.selectedCore == nil {
		return false
	}
	allowedTags := s.synthesisState.selectedCore.Type.AllowedTags
	for _, moduleTag := range module.Tags {
		for _, allowedTag := range allowedTags {
			if moduleTag == allowedTag {
				return true
			}
		}
	}
	return false
}

// canSynthesize は合成可能かどうかを返します。
func (s *AgentManagementScreen) canSynthesize() bool {
	return s.synthesisState.selectedCore != nil &&
		len(s.synthesisState.selectedModules) == 4
}

// executeSynthesis は合成を実行します。
func (s *AgentManagementScreen) executeSynthesis() {
	if !s.canSynthesize() {
		return
	}

	// エージェント作成
	agentID := fmt.Sprintf("agent_%d", len(s.agentList)+1)
	agent := domain.NewAgent(agentID, s.synthesisState.selectedCore, s.synthesisState.selectedModules)

	// インベントリに追加
	s.inventory.AddAgent(agent)

	// 使用した素材を削除
	s.inventory.RemoveCore(s.synthesisState.selectedCore.ID)
	for _, m := range s.synthesisState.selectedModules {
		s.inventory.RemoveModule(m.ID)
	}

	s.updateCurrentList()
}

// resetSynthesisState は合成状態をリセットします。
func (s *AgentManagementScreen) resetSynthesisState() {
	s.synthesisState = SynthesisState{
		selectedModules: []*domain.ModuleModel{},
	}
	s.selectedIndex = 0
}

// getSelectedCoreDetail は選択中のコアの詳細を返します。
func (s *AgentManagementScreen) getSelectedCoreDetail() *domain.CoreModel {
	if s.selectedIndex < len(s.coreList) {
		return s.coreList[s.selectedIndex]
	}
	return nil
}

// getSelectedModuleDetail は選択中のモジュールの詳細を返します。
func (s *AgentManagementScreen) getSelectedModuleDetail() *domain.ModuleModel {
	if s.selectedIndex < len(s.moduleList) {
		return s.moduleList[s.selectedIndex]
	}
	return nil
}

// View は画面をレンダリングします。
func (s *AgentManagementScreen) View() string {
	var builder strings.Builder

	// タイトル
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorPrimary).
		Align(lipgloss.Center).
		Width(s.width)

	builder.WriteString(titleStyle.Render("エージェント管理"))
	builder.WriteString("\n\n")

	// タブバー
	builder.WriteString(s.renderTabBar())
	builder.WriteString("\n\n")

	// メインコンテンツ
	builder.WriteString(s.renderMainContent())
	builder.WriteString("\n\n")

	// ヒント
	hintStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Align(lipgloss.Center).
		Width(s.width)

	hints := "←/→: タブ切替  ↑/↓: 選択  Enter: 決定  d: 削除  Esc: 戻る"
	builder.WriteString(hintStyle.Render(hints))

	return builder.String()
}

// renderTabBar はタブバーをレンダリングします。
func (s *AgentManagementScreen) renderTabBar() string {
	tabs := []string{"コア一覧", "モジュール一覧", "合成", "装備"}

	var tabItems []string
	for i, tab := range tabs {
		style := lipgloss.NewStyle().Padding(0, 2)
		if AgentManagementTab(i) == s.currentTab {
			style = style.
				Bold(true).
				Foreground(styles.ColorPrimary).
				Background(lipgloss.Color("236"))
		} else {
			style = style.Foreground(styles.ColorSubtle)
		}
		tabItems = append(tabItems, style.Render(tab))
	}

	tabBar := lipgloss.JoinHorizontal(lipgloss.Center, tabItems...)
	return lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(tabBar)
}

// renderMainContent はメインコンテンツをレンダリングします。
func (s *AgentManagementScreen) renderMainContent() string {
	switch s.currentTab {
	case TabCoreList:
		return s.renderCoreList()
	case TabModuleList:
		return s.renderModuleList()
	case TabSynthesis:
		return s.renderSynthesis()
	case TabEquip:
		return s.renderEquip()
	}
	return ""
}

// renderCoreList はコア一覧をレンダリングします。
func (s *AgentManagementScreen) renderCoreList() string {
	var builder strings.Builder

	if len(s.coreList) == 0 {
		return lipgloss.NewStyle().
			Width(s.width).
			Align(lipgloss.Center).
			Foreground(styles.ColorSubtle).
			Render("コアがありません")
	}

	// リストとプレビューを横に並べる
	listContent := s.renderCoreListItems()
	previewContent := s.renderCorePreview()

	listBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1).
		Width(50).
		Render(listContent)

	previewBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1).
		Width(50).
		Render(previewContent)

	content := lipgloss.JoinHorizontal(lipgloss.Top, listBox, "  ", previewBox)
	builder.WriteString(lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(content))

	return builder.String()
}

// renderCoreListItems はコアリストの項目をレンダリングします。
func (s *AgentManagementScreen) renderCoreListItems() string {
	var items []string
	for i, core := range s.coreList {
		style := lipgloss.NewStyle()
		if i == s.selectedIndex {
			style = style.Bold(true).Foreground(styles.ColorPrimary)
		}
		item := fmt.Sprintf("%s Lv.%d (%s)", core.Name, core.Level, core.Type.Name)
		items = append(items, style.Render(item))
	}
	return strings.Join(items, "\n")
}

// renderCorePreview はコアのプレビューをレンダリングします。
func (s *AgentManagementScreen) renderCorePreview() string {
	core := s.getSelectedCoreDetail()
	if core == nil {
		return "コアを選択してください"
	}

	panel := components.NewInfoPanel(core.Name)
	panel.AddItem("レベル", fmt.Sprintf("Lv.%d", core.Level))
	panel.AddItem("特性", core.Type.Name)
	panel.AddItem("STR", fmt.Sprintf("%d", core.Stats.STR))
	panel.AddItem("MAG", fmt.Sprintf("%d", core.Stats.MAG))
	panel.AddItem("SPD", fmt.Sprintf("%d", core.Stats.SPD))
	panel.AddItem("LUK", fmt.Sprintf("%d", core.Stats.LUK))

	return panel.Render(45)
}

// renderModuleList はモジュール一覧をレンダリングします。
func (s *AgentManagementScreen) renderModuleList() string {
	if len(s.moduleList) == 0 {
		return lipgloss.NewStyle().
			Width(s.width).
			Align(lipgloss.Center).
			Foreground(styles.ColorSubtle).
			Render("モジュールがありません")
	}

	listContent := s.renderModuleListItems()
	previewContent := s.renderModulePreview()

	listBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1).
		Width(50).
		Render(listContent)

	previewBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1).
		Width(50).
		Render(previewContent)

	content := lipgloss.JoinHorizontal(lipgloss.Top, listBox, "  ", previewBox)
	return lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(content)
}

// renderModuleListItems はモジュールリストの項目をレンダリングします。
func (s *AgentManagementScreen) renderModuleListItems() string {
	var items []string
	for i, module := range s.moduleList {
		style := lipgloss.NewStyle()
		if i == s.selectedIndex {
			style = style.Bold(true).Foreground(styles.ColorPrimary)
		}
		item := fmt.Sprintf("%s [%s] Lv.%d", module.Name, module.Category.String(), module.Level)
		items = append(items, style.Render(item))
	}
	return strings.Join(items, "\n")
}

// renderModulePreview はモジュールのプレビューをレンダリングします。
func (s *AgentManagementScreen) renderModulePreview() string {
	module := s.getSelectedModuleDetail()
	if module == nil {
		return "モジュールを選択してください"
	}

	panel := components.NewInfoPanel(module.Name)
	panel.AddItem("カテゴリ", module.Category.String())
	panel.AddItem("レベル", fmt.Sprintf("Lv.%d", module.Level))
	panel.AddItem("基礎効果", fmt.Sprintf("%.0f", module.BaseEffect))
	panel.AddItem("参照ステータス", module.StatRef)
	panel.AddItem("説明", module.Description)

	return panel.Render(45)
}

// renderSynthesis は合成画面をレンダリングします。
func (s *AgentManagementScreen) renderSynthesis() string {
	var builder strings.Builder

	// 合成ステップ表示
	stepStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorSecondary)

	steps := []string{"コア選択", "モジュール選択", "確認"}
	currentStep := stepStyle.Render(fmt.Sprintf("ステップ %d: %s", s.synthesisState.step+1, steps[s.synthesisState.step]))
	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(currentStep))
	builder.WriteString("\n\n")

	// 選択状況
	selectionPanel := s.renderSynthesisSelection()
	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(selectionPanel))
	builder.WriteString("\n\n")

	// リスト
	switch s.synthesisState.step {
	case 0:
		builder.WriteString(s.renderSynthesisCoreList())
	case 1:
		builder.WriteString(s.renderSynthesisModuleList())
	case 2:
		builder.WriteString(s.renderSynthesisConfirm())
	}

	return builder.String()
}

// renderSynthesisSelection は合成選択状況をレンダリングします。
func (s *AgentManagementScreen) renderSynthesisSelection() string {
	var items []string

	// コア
	coreLabel := "コア: "
	if s.synthesisState.selectedCore != nil {
		coreLabel += s.synthesisState.selectedCore.Name
	} else {
		coreLabel += "(未選択)"
	}
	items = append(items, coreLabel)

	// モジュール
	for i := 0; i < 4; i++ {
		moduleLabel := fmt.Sprintf("モジュール%d: ", i+1)
		if i < len(s.synthesisState.selectedModules) {
			moduleLabel += s.synthesisState.selectedModules[i].Name
		} else {
			moduleLabel += "(未選択)"
		}
		items = append(items, moduleLabel)
	}

	content := strings.Join(items, "  |  ")
	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(0, 2).
		Render(content)
}

// renderSynthesisCoreList は合成用コアリストをレンダリングします。
func (s *AgentManagementScreen) renderSynthesisCoreList() string {
	if len(s.coreList) == 0 {
		return lipgloss.NewStyle().
			Width(s.width).
			Align(lipgloss.Center).
			Foreground(styles.ColorSubtle).
			Render("合成可能なコアがありません")
	}

	return s.renderCoreList()
}

// renderSynthesisModuleList は合成用モジュールリストをレンダリングします。
func (s *AgentManagementScreen) renderSynthesisModuleList() string {
	if len(s.moduleList) == 0 {
		return lipgloss.NewStyle().
			Width(s.width).
			Align(lipgloss.Center).
			Foreground(styles.ColorSubtle).
			Render("合成可能なモジュールがありません")
	}

	// 互換性のあるモジュールのみ表示
	var items []string
	for i, module := range s.moduleList {
		compatible := s.isModuleCompatible(module)
		style := lipgloss.NewStyle()
		if i == s.selectedIndex {
			style = style.Bold(true).Foreground(styles.ColorPrimary)
		} else if !compatible {
			style = style.Foreground(styles.ColorSubtle)
		}

		item := fmt.Sprintf("%s [%s]", module.Name, module.Category.String())
		if !compatible {
			item += " (互換性なし)"
		}
		items = append(items, style.Render(item))
	}

	listContent := strings.Join(items, "\n")
	listBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1).
		Width(60).
		Render(listContent)

	return lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(listBox)
}

// renderSynthesisConfirm は合成確認画面をレンダリングします。
func (s *AgentManagementScreen) renderSynthesisConfirm() string {
	if !s.canSynthesize() {
		return lipgloss.NewStyle().
			Width(s.width).
			Align(lipgloss.Center).
			Foreground(styles.ColorSubtle).
			Render("合成条件が満たされていません")
	}

	panel := components.NewInfoPanel("合成プレビュー")
	panel.AddItem("コア", s.synthesisState.selectedCore.Name)
	panel.AddItem("コアレベル", fmt.Sprintf("Lv.%d", s.synthesisState.selectedCore.Level))
	for i, m := range s.synthesisState.selectedModules {
		panel.AddItem(fmt.Sprintf("モジュール%d", i+1), m.Name)
	}

	content := panel.Render(50)
	content += "\n\nEnterキーで合成を実行"

	box := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1).
		Width(60).
		Render(content)

	return lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(box)
}

// renderEquip は装備画面をレンダリングします。
func (s *AgentManagementScreen) renderEquip() string {
	var builder strings.Builder

	// 装備スロット
	slotsContent := s.renderEquipSlots()
	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(slotsContent))
	builder.WriteString("\n\n")

	// 所持エージェント一覧
	agentsContent := s.renderAgentList()
	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(agentsContent))

	return builder.String()
}

// renderEquipSlots は装備スロットをレンダリングします。
func (s *AgentManagementScreen) renderEquipSlots() string {
	var slots []string

	for i := 0; i < 3; i++ {
		style := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			Padding(0, 1).
			Width(30)

		if i == s.selectedIndex && s.selectedIndex < 3 {
			style = style.BorderForeground(styles.ColorPrimary)
		} else {
			style = style.BorderForeground(styles.ColorSubtle)
		}

		var content string
		if s.equipSlots[i] != nil {
			agent := s.equipSlots[i]
			content = fmt.Sprintf("スロット%d\n%s\nLv.%d", i+1, agent.GetCoreTypeName(), agent.Level)
		} else {
			content = fmt.Sprintf("スロット%d\n(空)", i+1)
		}

		slots = append(slots, style.Render(content))
	}

	return lipgloss.JoinHorizontal(lipgloss.Center, slots...)
}

// renderAgentList はエージェント一覧をレンダリングします。
func (s *AgentManagementScreen) renderAgentList() string {
	if len(s.agentList) == 0 {
		return lipgloss.NewStyle().
			Foreground(styles.ColorSubtle).
			Render("所持エージェントなし")
	}

	var items []string
	for i, agent := range s.agentList {
		style := lipgloss.NewStyle()
		listIndex := i + 3 // スロットの後
		if listIndex == s.selectedIndex {
			style = style.Bold(true).Foreground(styles.ColorPrimary)
		}
		item := fmt.Sprintf("%s Lv.%d", agent.GetCoreTypeName(), agent.Level)
		items = append(items, style.Render(item))
	}

	listContent := strings.Join(items, "\n")
	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1).
		Width(50).
		Render("所持エージェント\n\n" + listContent)
}
