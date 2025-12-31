// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"hirorocky/type-battle/internal/config"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/infra/masterdata"
	"hirorocky/type-battle/internal/tui/components"
	"hirorocky/type-battle/internal/tui/styles"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
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

// DebugInventoryProvider はデバッグモード用のインベントリプロバイダーインターフェースです。
type DebugInventoryProvider interface {
	InventoryProvider
	GetCoreTypes() []masterdata.CoreTypeData
	GetModuleTypes() []masterdata.ModuleDefinitionData
	GetChainEffects() []masterdata.ChainEffectData
	CreateCoreFromType(typeID string, level int) *domain.CoreModel
	CreateModuleFromType(typeID string, chainEffect *domain.ChainEffect) *domain.ModuleModel
}

// SynthesisState は合成状態を表します。
type SynthesisState struct {
	selectedCore    *domain.CoreModel
	selectedModules []*domain.ModuleModel
	step            int // 0: コア選択, 1: モジュール選択, 2: 確認
}

// DebugSynthesisState はデバッグモード専用の合成状態です。
type DebugSynthesisState struct {
	step             int // 0:コアタイプ, 1:レベル入力, 2:モジュール, 3:チェイン, 4:確認
	selectedCoreType *masterdata.CoreTypeData
	coreLevel        int
	levelInput       string
	selectedModules  []*DebugModuleSelection
	currentModuleIdx int
}

// DebugModuleSelection はデバッグモードでのモジュール選択状態です。
type DebugModuleSelection struct {
	ModuleType  *masterdata.ModuleDefinitionData
	ChainEffect *domain.ChainEffect
}

// AgentManagementScreen はエージェント管理画面を表します。

// UI-Improvement Requirements: 2.5, 2.6, 2.7, 2.8, 2.9
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
	// UI改善: 確認ダイアログ
	confirmDialog    *components.ConfirmDialog
	pendingDeleteIdx int // 削除待ちのエージェントインデックス
	// 装備タブ用: 選択中のスロットインデックス (0-2)
	selectedEquipSlot int
	// エラー/ステータスメッセージ
	errorMessage  string
	statusMessage string
	// デバッグモード
	debugMode           bool
	debugProvider       DebugInventoryProvider
	debugSynthesisState DebugSynthesisState
}

// NewAgentManagementScreen は新しいAgentManagementScreenを作成します。
// debugMode: デバッグモードを有効化
// debugProvider: デバッグモード用のプロバイダー（nilの場合は通常モード）
func NewAgentManagementScreen(inventory InventoryProvider, debugMode bool, debugProvider DebugInventoryProvider) *AgentManagementScreen {
	screen := &AgentManagementScreen{
		inventory:     inventory,
		currentTab:    TabCoreList,
		selectedIndex: 0,
		equipSlots:    make([]*domain.AgentModel, config.MaxAgentEquipSlots),
		synthesisState: SynthesisState{
			selectedModules: []*domain.ModuleModel{},
		},
		styles:        styles.NewGameStyles(),
		width:         140,
		height:        40,
		debugMode:     debugMode,
		debugProvider: debugProvider,
		debugSynthesisState: DebugSynthesisState{
			selectedModules: make([]*DebugModuleSelection, 0),
		},
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
// UI-Improvement Requirement 2.9: 確認ダイアログ対応
func (s *AgentManagementScreen) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	// 確認ダイアログが表示中の場合はダイアログのキー処理を優先
	if s.confirmDialog != nil && s.confirmDialog.Visible {
		result := s.confirmDialog.HandleKey(msg.String())
		switch result {
		case components.ConfirmResultYes:
			// 削除を実行
			s.executeDelete()
			return s, nil
		case components.ConfirmResultNo, components.ConfirmResultCancelled:
			// キャンセル
			return s, nil
		}
		return s, nil
	}

	// デバッグモードで合成タブの場合は専用処理
	if s.debugMode && s.currentTab == TabSynthesis {
		return s.handleDebugSynthesisKeyMsg(msg)
	}

	// 装備タブの場合は専用の処理
	if s.currentTab == TabEquip {
		return s.handleEquipKeyMsg(msg)
	}

	switch msg.String() {
	case "esc":
		return s, func() tea.Msg {
			return ChangeSceneMsg{Scene: "home"}
		}
	case "backspace":
		return s.handleBackspace()
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

// handleEquipKeyMsg は装備タブ専用のキー処理を行います。
// Tab: スロット切り替え、上下: エージェント選択、Enter: 装備、Backspace: 取り外し
func (s *AgentManagementScreen) handleEquipKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		return s, func() tea.Msg {
			return ChangeSceneMsg{Scene: "home"}
		}
	case "tab":
		// スロット切り替え (0 → 1 → 2 → 0...)
		s.selectedEquipSlot = (s.selectedEquipSlot + 1) % 3
	case "left", "h":
		s.prevTab()
	case "right", "l":
		s.nextTab()
	case "up", "k":
		// エージェント一覧で上に移動
		if s.selectedIndex > 0 {
			s.selectedIndex--
		}
	case "down", "j":
		// エージェント一覧で下に移動
		if s.selectedIndex < len(s.agentList)-1 {
			s.selectedIndex++
		}
	case "enter":
		// 選択中のエージェントを選択中のスロットに装備
		if s.selectedIndex < len(s.agentList) {
			agent := s.agentList[s.selectedIndex]
			if err := s.inventory.EquipAgent(s.selectedEquipSlot, agent); err != nil {
				slog.Error("エージェント装備に失敗",
					slog.Int("slot", s.selectedEquipSlot),
					slog.String("agent_id", agent.ID),
					slog.Any("error", err),
				)
				s.errorMessage = fmt.Sprintf("装備に失敗しました: %v", err)
				s.statusMessage = ""
			} else {
				s.statusMessage = fmt.Sprintf("'%s'をスロット%dに装備しました", agent.GetCoreTypeName(), s.selectedEquipSlot+1)
				s.errorMessage = ""
			}
			s.updateCurrentList()
		}
	case "backspace":
		// 選択中のスロットからエージェントを取り外し
		if s.equipSlots[s.selectedEquipSlot] != nil {
			agentName := s.equipSlots[s.selectedEquipSlot].GetCoreTypeName()
			if err := s.inventory.UnequipAgent(s.selectedEquipSlot); err != nil {
				slog.Error("エージェント装備解除に失敗",
					slog.Int("slot", s.selectedEquipSlot),
					slog.Any("error", err),
				)
				s.errorMessage = fmt.Sprintf("装備解除に失敗しました: %v", err)
				s.statusMessage = ""
			} else {
				s.statusMessage = fmt.Sprintf("'%s'をスロット%dから取り外しました", agentName, s.selectedEquipSlot+1)
				s.errorMessage = ""
			}
			s.updateCurrentList()
		}
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
	s.equipSlots = make([]*domain.AgentModel, config.MaxAgentEquipSlots)
	for i := 0; i < config.MaxAgentEquipSlots && i < len(equipped); i++ {
		s.equipSlots[i] = equipped[i]
	}
}

// handleBackspace は合成中のBackspace処理を行います。
func (s *AgentManagementScreen) handleBackspace() (tea.Model, tea.Cmd) {
	if s.currentTab != TabSynthesis {
		return s, nil
	}

	switch s.synthesisState.step {
	case 0: // コア選択中 - 何もしない
		return s, nil
	case 1: // モジュール選択中
		if len(s.synthesisState.selectedModules) > 0 {
			// 最後に選択したモジュールを取り消し
			s.synthesisState.selectedModules = s.synthesisState.selectedModules[:len(s.synthesisState.selectedModules)-1]
		} else {
			// モジュール未選択ならコア選択に戻る
			s.synthesisState.selectedCore = nil
			s.synthesisState.step = 0
			s.selectedIndex = 0
		}
	case 2: // 確認画面
		// モジュール選択に戻る
		s.synthesisState.step = 1
	}
	return s, nil
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
			// タグ互換性チェック + 重複チェック
			if s.synthesisState.selectedCore != nil &&
				s.isModuleCompatible(module) &&
				!s.isModuleAlreadySelected(module) {
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
			if err := s.inventory.UnequipAgent(s.selectedIndex); err != nil {
				slog.Error("エージェント装備解除に失敗",
					slog.Int("slot", s.selectedIndex),
					slog.Any("error", err),
				)
			}
			s.updateCurrentList()
		}
	} else {
		// エージェント装備
		agentIndex := s.selectedIndex - 3
		if agentIndex < len(s.agentList) {
			// 空きスロットを探す
			for i := 0; i < 3; i++ {
				if s.equipSlots[i] == nil {
					if err := s.inventory.EquipAgent(i, s.agentList[agentIndex]); err != nil {
						slog.Error("エージェント装備に失敗",
							slog.Int("slot", i),
							slog.String("agent_id", s.agentList[agentIndex].ID),
							slog.Any("error", err),
						)
					}
					s.updateCurrentList()
					break
				}
			}
		}
	}
	return s, nil
}

// handleDelete は削除処理を行います。
// UI-Improvement Requirement 2.9: エージェント削除時に確認ダイアログを表示
func (s *AgentManagementScreen) handleDelete() (tea.Model, tea.Cmd) {
	switch s.currentTab {
	case TabCoreList:
		if s.selectedIndex < len(s.coreList) {
			core := s.coreList[s.selectedIndex]
			s.confirmDialog = components.NewConfirmDialog(
				"コアの削除",
				fmt.Sprintf("「%s Lv.%d」を削除しますか？", core.Name, core.Level),
			)
			s.confirmDialog.Show()
			s.pendingDeleteIdx = s.selectedIndex
		}
	case TabModuleList:
		if s.selectedIndex < len(s.moduleList) {
			module := s.moduleList[s.selectedIndex]
			s.confirmDialog = components.NewConfirmDialog(
				"モジュールの削除",
				fmt.Sprintf("「%s」を削除しますか？", module.Name()),
			)
			s.confirmDialog.Show()
			s.pendingDeleteIdx = s.selectedIndex
		}
	case TabEquip:
		// エージェント削除（装備タブで所持エージェントを選択中の場合）
		if s.selectedIndex >= 3 && s.selectedIndex-3 < len(s.agentList) {
			agent := s.agentList[s.selectedIndex-3]
			s.confirmDialog = components.NewConfirmDialog(
				"エージェントの削除",
				fmt.Sprintf("「%s Lv.%d」を削除しますか？", agent.GetCoreTypeName(), agent.Level),
			)
			s.confirmDialog.Show()
			s.pendingDeleteIdx = s.selectedIndex
		}
	}
	return s, nil
}

// executeDelete は確認後の削除を実行します。
func (s *AgentManagementScreen) executeDelete() {
	switch s.currentTab {
	case TabCoreList:
		if s.pendingDeleteIdx < len(s.coreList) {
			if err := s.inventory.RemoveCore(s.coreList[s.pendingDeleteIdx].ID); err != nil {
				slog.Error("コア削除に失敗",
					slog.String("core_id", s.coreList[s.pendingDeleteIdx].ID),
					slog.Any("error", err),
				)
			}
			s.updateCurrentList()
		}
	case TabModuleList:
		if s.pendingDeleteIdx < len(s.moduleList) {
			if err := s.inventory.RemoveModule(s.moduleList[s.pendingDeleteIdx].TypeID); err != nil {
				slog.Error("モジュール削除に失敗",
					slog.String("module_type_id", s.moduleList[s.pendingDeleteIdx].TypeID),
					slog.Any("error", err),
				)
			}
			s.updateCurrentList()
		}
	case TabEquip:
		// エージェント削除は未実装（インベントリにRemoveAgentメソッドが必要）
		// 今後の拡張として実装
	}
	s.pendingDeleteIdx = -1
}

// isModuleAlreadySelected は指定されたモジュールが既に選択済みかをチェックします。
func (s *AgentManagementScreen) isModuleAlreadySelected(module *domain.ModuleModel) bool {
	for _, selected := range s.synthesisState.selectedModules {
		if selected.TypeID == module.TypeID {
			return true
		}
	}
	return false
}

// isModuleCompatible はモジュールがコアと互換性があるかチェックします。
func (s *AgentManagementScreen) isModuleCompatible(module *domain.ModuleModel) bool {
	if s.synthesisState.selectedCore == nil {
		return false
	}
	allowedTags := s.synthesisState.selectedCore.Type.AllowedTags
	for _, moduleTag := range module.Tags() {
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
	if err := s.inventory.AddAgent(agent); err != nil {
		slog.Error("エージェント追加に失敗",
			slog.String("agent_id", agent.ID),
			slog.Any("error", err),
		)
		s.errorMessage = fmt.Sprintf("エージェントの合成に失敗しました: %v", err)
		return // 素材を消費しないように処理を中断
	}

	// エラーメッセージをクリアしてステータスメッセージを設定
	s.errorMessage = ""
	s.statusMessage = "エージェントを合成しました"

	// 使用した素材を削除
	if err := s.inventory.RemoveCore(s.synthesisState.selectedCore.ID); err != nil {
		slog.Error("合成素材のコア削除に失敗",
			slog.String("core_id", s.synthesisState.selectedCore.ID),
			slog.Any("error", err),
		)
	}
	for _, m := range s.synthesisState.selectedModules {
		if err := s.inventory.RemoveModule(m.TypeID); err != nil {
			slog.Error("合成素材のモジュール削除に失敗",
				slog.String("module_type_id", m.TypeID),
				slog.Any("error", err),
			)
		}
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
// UI-Improvement Requirement 2.9: 確認ダイアログのオーバーレイ表示
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

	// ステータス/エラーメッセージ
	if s.errorMessage != "" {
		errorStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("196")). // 赤色
			Align(lipgloss.Center).
			Width(s.width)
		builder.WriteString(errorStyle.Render(s.errorMessage))
		builder.WriteString("\n")
	} else if s.statusMessage != "" {
		statusStyle := lipgloss.NewStyle().
			Foreground(styles.ColorSecondary).
			Align(lipgloss.Center).
			Width(s.width)
		builder.WriteString(statusStyle.Render(s.statusMessage))
		builder.WriteString("\n")
	}

	// ヒント
	hintStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Align(lipgloss.Center).
		Width(s.width)

	var hints string
	if s.confirmDialog != nil && s.confirmDialog.Visible {
		hints = "←/→: 選択切替  Enter: 決定  Esc: キャンセル"
	} else if s.currentTab == TabEquip {
		hints = "←/→: タブ切替  Tab: スロット切替  ↑/↓: エージェント選択  Enter: 装備  Backspace: 取り外し  Esc: ホーム"
	} else {
		hints = "←/→: タブ切替  ↑/↓: 選択  Enter: 決定  Backspace: 戻る  d: 削除  Esc: ホーム"
	}
	builder.WriteString(hintStyle.Render(hints))

	// 確認ダイアログのオーバーレイ
	if s.confirmDialog != nil && s.confirmDialog.Visible {
		builder.WriteString("\n\n")
		dialog := s.confirmDialog.Render(s.width, s.height)
		builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(dialog))
	}

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
		// デバッグモードでは専用のUIを使用
		if s.debugMode {
			return s.renderDebugSynthesis()
		}
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
		prefix := "  "
		if i == s.selectedIndex {
			style = style.Bold(true).
				Foreground(styles.ColorSelectedFg).
				Background(styles.ColorSelectedBg)
			prefix = "> "
		}
		item := fmt.Sprintf("%s Lv.%d", core.Type.Name, core.Level)
		items = append(items, style.Render(prefix+item))
	}
	return strings.Join(items, "\n")
}

// renderCorePreview はコアのプレビューをレンダリングします。
// タスク 10.1: パッシブスキル情報を表示
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

	// パッシブスキル情報を追加
	if core.PassiveSkill.ID != "" {
		passiveNotification := components.NewPassiveSkillNotification(&core.PassiveSkill, core.Level)
		panel.AddItem("パッシブ", core.PassiveSkill.Name)
		if core.PassiveSkill.Description != "" {
			panel.AddItem("効果", core.PassiveSkill.Description)
		}
		// 効果リスト
		effects := passiveNotification.RenderEffectsList()
		for _, effect := range effects {
			panel.AddItem("", effect)
		}
	}

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
		prefix := "  "
		if i == s.selectedIndex {
			style = style.Bold(true).
				Foreground(styles.ColorSelectedFg).
				Background(styles.ColorSelectedBg)
			prefix = "> "
		}
		item := fmt.Sprintf("%s [%s]", module.Name(), module.Category().String())
		items = append(items, style.Render(prefix+item))
	}
	return strings.Join(items, "\n")
}

// renderModulePreview はモジュールのプレビューをレンダリングします。
// タスク 10.2: チェイン効果情報を表示
func (s *AgentManagementScreen) renderModulePreview() string {
	module := s.getSelectedModuleDetail()
	if module == nil {
		return "モジュールを選択してください"
	}

	panel := components.NewInfoPanel(module.Name())
	panel.AddItem("カテゴリ", module.Category().String())
	panel.AddItem("基礎効果", fmt.Sprintf("%.0f", module.BaseEffect()))
	panel.AddItem("参照ステータス", module.StatRef())
	panel.AddItem("説明", module.Description())

	// チェイン効果情報を追加
	if module.HasChainEffect() {
		chainBadge := components.NewChainEffectBadge(module.ChainEffect)
		panel.AddItem("チェイン効果", chainBadge.GetCategoryIcon()+" "+chainBadge.GetDescription())
	}

	return panel.Render(45)
}

// renderSynthesis は合成画面をレンダリングします。
// design.md準拠: 左右2カラムレイアウト
func (s *AgentManagementScreen) renderSynthesis() string {
	// 左側パネル: 選択可能なパーツ
	leftContent := s.renderSynthesisLeftPanel()

	// 右側パネル: 選択済みパーツ + 完成予測ステータス
	rightContent := s.renderSynthesisRightPanel()

	// 左右のパネルを結合
	leftBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1).
		Width(50).
		Height(20).
		Render(leftContent)

	rightBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1).
		Width(55).
		Height(20).
		Render(rightContent)

	content := lipgloss.JoinHorizontal(lipgloss.Top, leftBox, "  ", rightBox)
	return lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(content)
}

// renderSynthesisLeftPanel は合成画面の左側パネルをレンダリングします。
func (s *AgentManagementScreen) renderSynthesisLeftPanel() string {
	var builder strings.Builder

	// タイトル
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
	builder.WriteString(titleStyle.Render("選択可能なパーツ"))
	builder.WriteString("\n\n")

	// ステップ表示
	steps := []string{"コア選択", "モジュール選択", "確認"}
	stepStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorPrimary)
	builder.WriteString(stepStyle.Render(fmt.Sprintf("ステップ %d: %s", s.synthesisState.step+1, steps[s.synthesisState.step])))
	builder.WriteString("\n\n")

	// リスト
	switch s.synthesisState.step {
	case 0:
		builder.WriteString(s.renderSynthesisCoreListItems())
	case 1:
		builder.WriteString(s.renderSynthesisModuleListItems())
	case 2:
		builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("Enterキーで合成を実行"))
	}

	builder.WriteString("\n\n")

	// 区切り線
	builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("────────────────────────────────────────"))
	builder.WriteString("\n")

	// 選択中パーツの詳細
	builder.WriteString(titleStyle.Render("選択中パーツの詳細"))
	builder.WriteString("\n\n")
	builder.WriteString(s.renderSelectedPartDetail())

	return builder.String()
}

// renderSynthesisRightPanel は合成画面の右側パネルをレンダリングします。
func (s *AgentManagementScreen) renderSynthesisRightPanel() string {
	var builder strings.Builder

	// タイトル
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
	builder.WriteString(titleStyle.Render("選択済みパーツ"))
	builder.WriteString("\n\n")

	// コア
	labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)
	valueStyle := lipgloss.NewStyle().Foreground(styles.ColorPrimary)

	builder.WriteString(labelStyle.Render("コア: "))
	if s.synthesisState.selectedCore != nil {
		builder.WriteString(valueStyle.Render(fmt.Sprintf("%s Lv.%d", s.synthesisState.selectedCore.Name, s.synthesisState.selectedCore.Level)))
	} else {
		builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("(未選択)"))
	}
	builder.WriteString("\n")

	// モジュール
	for i := 0; i < 4; i++ {
		builder.WriteString(labelStyle.Render(fmt.Sprintf("モジュール%d: ", i+1)))
		if i < len(s.synthesisState.selectedModules) {
			builder.WriteString(valueStyle.Render(s.synthesisState.selectedModules[i].Name()))
		} else {
			builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("(未選択)"))
		}
		builder.WriteString("\n")
	}

	builder.WriteString("\n")

	// 区切り線
	builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("──────────────────────────────────────────────"))
	builder.WriteString("\n")

	// 完成予測ステータス
	builder.WriteString(titleStyle.Render("完成予測ステータス"))
	builder.WriteString("\n\n")
	builder.WriteString(s.renderSynthesisPreview())

	return builder.String()
}

// renderSelectedPartDetail は選択中パーツの詳細をレンダリングします。
func (s *AgentManagementScreen) renderSelectedPartDetail() string {
	switch s.synthesisState.step {
	case 0:
		// コア選択中
		core := s.getSelectedCoreDetail()
		if core == nil {
			return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("コアを選択してください")
		}
		return s.formatCoreDetail(core)
	case 1:
		// モジュール選択中
		module := s.getSelectedModuleDetail()
		if module == nil {
			return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("モジュールを選択してください")
		}
		return s.formatModuleDetail(module)
	case 2:
		// 確認画面
		return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("合成準備完了")
	}
	return ""
}

// formatCoreDetail はコアの詳細をフォーマットします。
func (s *AgentManagementScreen) formatCoreDetail(core *domain.CoreModel) string {
	var builder strings.Builder
	nameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorPrimary)
	labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)

	builder.WriteString(nameStyle.Render(fmt.Sprintf("%s Lv.%d", core.Name, core.Level)))
	builder.WriteString("\n")
	builder.WriteString(labelStyle.Render("特性: "))
	builder.WriteString(core.Type.Name)
	builder.WriteString("\n")
	builder.WriteString(fmt.Sprintf("STR: %-3d  MAG: %-3d  SPD: %-3d  LUK: %-3d",
		core.Stats.STR, core.Stats.MAG, core.Stats.SPD, core.Stats.LUK))

	return builder.String()
}

// formatModuleDetail はモジュールの詳細をフォーマットします。
func (s *AgentManagementScreen) formatModuleDetail(module *domain.ModuleModel) string {
	var builder strings.Builder
	nameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorPrimary)
	labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)

	builder.WriteString(nameStyle.Render(module.Name()))
	builder.WriteString("\n")
	builder.WriteString(labelStyle.Render("カテゴリ: "))
	builder.WriteString(module.Icon() + " " + module.Category().String())
	builder.WriteString("\n")
	builder.WriteString(labelStyle.Render("基礎効果: "))
	builder.WriteString(fmt.Sprintf("%.0f", module.BaseEffect()))
	builder.WriteString("\n")
	builder.WriteString(labelStyle.Render("説明: "))
	builder.WriteString(module.Description())

	return builder.String()
}

// renderSynthesisPreview は合成後の予測ステータスをレンダリングします。
// タスク 10.3: パッシブスキルとチェイン効果を表示
func (s *AgentManagementScreen) renderSynthesisPreview() string {
	if s.synthesisState.selectedCore == nil {
		return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("コアを選択すると\n予測ステータスが表示されます")
	}

	var builder strings.Builder
	core := s.synthesisState.selectedCore
	labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)
	valueStyle := lipgloss.NewStyle().Foreground(styles.ColorSecondary)
	passiveStyle := lipgloss.NewStyle().Foreground(styles.ColorBuff)

	// 名前
	builder.WriteString(labelStyle.Render("名前: "))
	builder.WriteString(valueStyle.Render(core.Type.Name))
	builder.WriteString("\n")

	// レベル
	builder.WriteString(labelStyle.Render("Lv: "))
	builder.WriteString(valueStyle.Render(fmt.Sprintf("%d", core.Level)))
	builder.WriteString("\n")

	// ステータス
	stats := core.Stats
	builder.WriteString(fmt.Sprintf("STR: %-3d  MAG: %-3d\n", stats.STR, stats.MAG))
	builder.WriteString(fmt.Sprintf("SPD: %-3d  LUK: %-3d\n", stats.SPD, stats.LUK))

	// パッシブスキル情報
	if core.PassiveSkill.ID != "" {
		builder.WriteString("\n")
		passiveNotification := components.NewPassiveSkillNotification(&core.PassiveSkill, core.Level)
		builder.WriteString(labelStyle.Render("パッシブ: "))
		builder.WriteString(passiveStyle.Render(core.PassiveSkill.Name))
		builder.WriteString("\n")
		// 効果リスト（最初の2つまで）
		effects := passiveNotification.RenderEffectsList()
		for i, effect := range effects {
			if i >= 2 {
				break
			}
			builder.WriteString("  " + effect + "\n")
		}
	}

	// モジュール情報
	if len(s.synthesisState.selectedModules) > 0 {
		builder.WriteString("\n")
		builder.WriteString(labelStyle.Render("モジュール:"))
		builder.WriteString("\n")
		for _, m := range s.synthesisState.selectedModules {
			icon := m.Icon()
			builder.WriteString(fmt.Sprintf("  %s %s", icon, m.Name()))
			// チェイン効果があれば表示
			if m.HasChainEffect() {
				chainBadge := components.NewChainEffectBadge(m.ChainEffect)
				builder.WriteString(" " + chainBadge.Render())
			}
			builder.WriteString("\n")
		}
	}

	return builder.String()
}

// renderSynthesisCoreListItems はコアリストの項目をレンダリングします（合成用）。
func (s *AgentManagementScreen) renderSynthesisCoreListItems() string {
	if len(s.coreList) == 0 {
		return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("コアがありません")
	}

	var items []string
	for i, core := range s.coreList {
		style := lipgloss.NewStyle()
		prefix := "  "
		if i == s.selectedIndex {
			style = style.Bold(true).
				Foreground(styles.ColorSelectedFg).
				Background(styles.ColorSelectedBg)
			prefix = "> "
		}
		item := fmt.Sprintf("%s Lv.%d (%s)", core.Name, core.Level, core.Type.Name)
		items = append(items, style.Render(prefix+item))
	}
	return strings.Join(items, "\n")
}

// renderSynthesisModuleListItems はモジュールリストの項目をレンダリングします（合成用）。
func (s *AgentManagementScreen) renderSynthesisModuleListItems() string {
	if len(s.moduleList) == 0 {
		return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("モジュールがありません")
	}

	var items []string
	for i, module := range s.moduleList {
		compatible := s.isModuleCompatible(module)
		alreadySelected := s.isModuleAlreadySelected(module)
		style := lipgloss.NewStyle()
		prefix := "  "

		if i == s.selectedIndex {
			style = style.Bold(true).
				Foreground(styles.ColorSelectedFg).
				Background(styles.ColorSelectedBg)
			prefix = "> "
		} else if !compatible || alreadySelected {
			style = style.Foreground(styles.ColorSubtle)
		}

		icon := module.Icon()
		item := fmt.Sprintf("%s %s", icon, module.Name())
		if !compatible {
			item += " (互換性なし)"
		} else if alreadySelected {
			item += " (選択済み)"
		}
		items = append(items, style.Render(prefix+item))
	}
	return strings.Join(items, "\n")
}

// renderEquip は装備画面をレンダリングします。
// UI-Improvement Requirement 2.5, 2.6, 2.7: 上下分割レイアウト
func (s *AgentManagementScreen) renderEquip() string {
	var builder strings.Builder

	// 上部エリア: 所持エージェント一覧（左）と選択中エージェント詳細（右）
	topSection := s.renderEquipTopSection()
	topBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1, 2).
		Width(s.width - 10)

	topTitle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Render("──────────────────────────  所持エージェント  ──────────────────────────")

	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(
		lipgloss.JoinVertical(lipgloss.Center, topTitle, topBox.Render(topSection)),
	))
	builder.WriteString("\n\n")

	// 下部エリア: 装備中エージェント（3スロット横並び）
	bottomSection := s.renderEquipBottomSection()

	bottomTitle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Render("────────────────────────  装備中エージェント  ────────────────────────")

	builder.WriteString(lipgloss.NewStyle().Width(s.width).Align(lipgloss.Center).Render(
		lipgloss.JoinVertical(lipgloss.Center, bottomTitle, bottomSection),
	))

	return builder.String()
}

// renderEquipTopSection は装備タブの上部セクション（エージェント一覧と詳細）をレンダリングします。
func (s *AgentManagementScreen) renderEquipTopSection() string {
	// 左側: エージェント一覧
	leftContent := s.renderEquipAgentList()
	leftBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(0, 1).
		Width(35).
		Height(12)

	// 右側: 選択中エージェントの詳細
	rightContent := s.renderEquipAgentDetail()
	rightBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(0, 1).
		Width(55).
		Height(12)

	return lipgloss.JoinHorizontal(lipgloss.Top,
		leftBox.Render(leftContent),
		"  ",
		rightBox.Render(rightContent),
	)
}

// renderEquipAgentList は装備タブのエージェント一覧をレンダリングします。
func (s *AgentManagementScreen) renderEquipAgentList() string {
	var builder strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
	builder.WriteString(titleStyle.Render("エージェント一覧"))
	builder.WriteString("\n\n")

	if len(s.agentList) == 0 {
		builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("(なし)"))
		return builder.String()
	}

	for i, agent := range s.agentList {
		style := lipgloss.NewStyle()
		prefix := "  "

		if i == s.selectedIndex {
			style = style.Bold(true).
				Foreground(styles.ColorSelectedFg).
				Background(styles.ColorSelectedBg)
			prefix = "> "
		}

		// 装備中かチェックしてマークを付ける
		equipMark := ""
		for slotIdx, equipped := range s.equipSlots {
			if equipped != nil && equipped.ID == agent.ID {
				equipMark = fmt.Sprintf(" [E%d]", slotIdx+1)
				break
			}
		}

		item := fmt.Sprintf("%s Lv.%d%s", agent.GetCoreTypeName(), agent.Level, equipMark)
		builder.WriteString(style.Render(prefix + item))
		builder.WriteString("\n")
	}

	return builder.String()
}

// renderEquipAgentDetail は選択中エージェントの詳細をレンダリングします。
func (s *AgentManagementScreen) renderEquipAgentDetail() string {
	var builder strings.Builder

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
	builder.WriteString(titleStyle.Render("選択中エージェント詳細"))
	builder.WriteString("\n\n")

	// 選択中のエージェントを取得（一覧から）
	var selectedAgent *domain.AgentModel
	if s.selectedIndex >= 0 && s.selectedIndex < len(s.agentList) {
		selectedAgent = s.agentList[s.selectedIndex]
	}

	if selectedAgent == nil {
		builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("エージェントを選択してください"))
		return builder.String()
	}

	// エージェント名とレベル（白色で表示）
	nameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
	builder.WriteString(nameStyle.Render(fmt.Sprintf("%s Lv.%d", selectedAgent.GetCoreTypeName(), selectedAgent.Level)))
	builder.WriteString("\n")

	// パッシブスキル効果（短い説明を表示）
	passiveNotification := components.NewPassiveSkillNotification(&selectedAgent.Core.PassiveSkill, selectedAgent.Core.Level)
	if passiveNotification.HasActiveEffects() {
		passiveStyle := lipgloss.NewStyle().Foreground(styles.ColorBuff)
		shortDesc := passiveNotification.GetShortDescription()
		builder.WriteString(passiveStyle.Render(fmt.Sprintf("★ %s: %s", passiveNotification.GetName(), shortDesc)))
		builder.WriteString("\n")
	}

	// 区切り線
	builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("────────────────────────────────────"))
	builder.WriteString("\n")

	// ステータス（コアから取得）
	stats := selectedAgent.Core.Stats
	builder.WriteString(fmt.Sprintf("STR: %-4d  MAG: %-4d  SPD: %-4d  LUK: %-4d\n",
		stats.STR, stats.MAG, stats.SPD, stats.LUK))

	// 区切り線
	builder.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("────────────────────────────────────"))
	builder.WriteString("\n")

	// モジュール（チェイン効果付き）
	labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)
	builder.WriteString(labelStyle.Render("モジュール:"))
	builder.WriteString("\n")
	for _, module := range selectedAgent.Modules {
		icon := module.Icon()
		if module.HasChainEffect() {
			chainBadge := components.NewChainEffectBadge(module.ChainEffect)
			builder.WriteString(fmt.Sprintf("  %s %s + %s\n", icon, module.Name(), chainBadge.GetDescription()))
		} else {
			builder.WriteString(fmt.Sprintf("  %s %s\n", icon, module.Name()))
		}
	}

	return builder.String()
}

// renderEquipBottomSection は装備タブの下部セクション（装備スロット）をレンダリングします。
func (s *AgentManagementScreen) renderEquipBottomSection() string {
	var cards []string
	// 画面幅を3等分してカード幅を計算（枠線とパディングを考慮）
	cardWidth := (s.width - 20) / 3

	for i := 0; i < 3; i++ {
		var cardContent strings.Builder
		isSelected := i == s.selectedEquipSlot

		if s.equipSlots[i] != nil {
			agent := s.equipSlots[i]

			// コアタイプ+レベル行（選択中は▶を表示、非選択は白色）
			if isSelected {
				coreNameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorPrimary)
				cardContent.WriteString(coreNameStyle.Render(fmt.Sprintf("▶ %s Lv.%d", agent.Core.Type.Name, agent.Level)))
			} else {
				coreNameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSecondary)
				cardContent.WriteString(coreNameStyle.Render(fmt.Sprintf("  %s Lv.%d", agent.Core.Type.Name, agent.Level)))
			}
			cardContent.WriteString("\n")

			// モジュールを2列×2行で表示
			modules := agent.Modules
			moduleWidth := (cardWidth - 4) / 2
			for row := 0; row < 2; row++ {
				var rowModules []string
				for col := 0; col < 2; col++ {
					idx := row*2 + col
					if idx < len(modules) {
						module := modules[idx]
						icon := module.Icon()
						name := module.Name()
						// 名前が長すぎる場合は切り詰め
						maxLen := moduleWidth - 3
						if len([]rune(name)) > maxLen {
							name = string([]rune(name)[:maxLen-1]) + ".."
						}
						rowModules = append(rowModules, fmt.Sprintf("%s %s", icon, name))
					}
				}
				if len(rowModules) > 0 {
					// 2列を均等幅で表示
					cell1 := lipgloss.NewStyle().Width(moduleWidth).Render(rowModules[0])
					cell2 := ""
					if len(rowModules) > 1 {
						cell2 = lipgloss.NewStyle().Width(moduleWidth).Render(rowModules[1])
					}
					cardContent.WriteString(lipgloss.JoinHorizontal(lipgloss.Left, cell1, cell2))
					cardContent.WriteString("\n")
				}
			}
		} else {
			// 空スロットの表示（選択中は▶を表示）
			if isSelected {
				cardContent.WriteString(lipgloss.NewStyle().Bold(true).Foreground(styles.ColorSubtle).Render("▶ (空)"))
			} else {
				cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("  (空)"))
			}
			cardContent.WriteString("\n\n")
			cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("  Enterで装備"))
		}

		// カードスタイル
		borderColor := styles.ColorSubtle
		if isSelected {
			borderColor = styles.ColorPrimary
		}

		cardStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(borderColor).
			Padding(0, 1).
			Width(cardWidth).
			Height(5)

		cards = append(cards, cardStyle.Render(cardContent.String()))
	}

	return lipgloss.JoinHorizontal(lipgloss.Center, cards[0], " ", cards[1], " ", cards[2])
}

// ==================== デバッグモード専用の関数群 ====================

// handleDebugSynthesisKeyMsg はデバッグモード合成画面のキー処理です。
func (s *AgentManagementScreen) handleDebugSynthesisKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch s.debugSynthesisState.step {
	case 0: // コアタイプ選択
		return s.handleDebugCoreTypeSelection(msg)
	case 1: // レベル入力
		return s.handleDebugLevelInput(msg)
	case 2: // モジュールタイプ選択
		return s.handleDebugModuleTypeSelection(msg)
	case 3: // チェイン効果選択
		return s.handleDebugChainEffectSelection(msg)
	case 4: // 確認
		return s.handleDebugConfirmation(msg)
	}
	return s, nil
}

// handleDebugCoreTypeSelection はコアタイプ選択を処理します。
func (s *AgentManagementScreen) handleDebugCoreTypeSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	coreTypes := s.debugProvider.GetCoreTypes()

	switch msg.String() {
	case "esc":
		return s, func() tea.Msg {
			return ChangeSceneMsg{Scene: "home"}
		}
	case "up", "k":
		if s.selectedIndex > 0 {
			s.selectedIndex--
		}
	case "down", "j":
		if s.selectedIndex < len(coreTypes)-1 {
			s.selectedIndex++
		}
	case "enter":
		if s.selectedIndex < len(coreTypes) {
			ct := coreTypes[s.selectedIndex]
			s.debugSynthesisState.selectedCoreType = &ct
			s.debugSynthesisState.step = 1 // レベル入力へ
			s.debugSynthesisState.levelInput = ""
			s.selectedIndex = 0
		}
	case "left", "h":
		s.prevTab()
	case "right", "l":
		s.nextTab()
	}
	return s, nil
}

// handleDebugLevelInput はレベル入力を処理します。
func (s *AgentManagementScreen) handleDebugLevelInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "0", "1", "2", "3", "4", "5", "6", "7", "8", "9":
		// 数字を追加（最大2桁）
		if len(s.debugSynthesisState.levelInput) < 2 {
			s.debugSynthesisState.levelInput += msg.String()
		}
	case "backspace":
		// 数字を削除
		if len(s.debugSynthesisState.levelInput) > 0 {
			s.debugSynthesisState.levelInput = s.debugSynthesisState.levelInput[:len(s.debugSynthesisState.levelInput)-1]
		} else {
			// コアタイプ選択に戻る
			s.debugSynthesisState.step = 0
			s.selectedIndex = 0
		}
	case "enter":
		// レベルを確定
		level, err := strconv.Atoi(s.debugSynthesisState.levelInput)
		if err != nil {
			s.errorMessage = "レベルには数値を入力してください"
			return s, nil
		}
		if level < 1 || level > 99 {
			s.errorMessage = "レベルは1〜99の範囲で入力してください"
			return s, nil
		}
		s.debugSynthesisState.coreLevel = level
		s.debugSynthesisState.step = 2 // モジュール選択へ
		s.debugSynthesisState.currentModuleIdx = 0
		s.selectedIndex = 0
		s.errorMessage = ""
	case "esc":
		// コアタイプ選択に戻る
		s.debugSynthesisState.step = 0
		s.debugSynthesisState.levelInput = ""
		s.selectedIndex = 0
	}
	return s, nil
}

// handleDebugModuleTypeSelection はモジュールタイプ選択を処理します。
func (s *AgentManagementScreen) handleDebugModuleTypeSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	moduleTypes := s.debugProvider.GetModuleTypes()

	switch msg.String() {
	case "esc":
		// 前のモジュールに戻る、または レベル入力に戻る
		if s.debugSynthesisState.currentModuleIdx > 0 {
			s.debugSynthesisState.currentModuleIdx--
			s.debugSynthesisState.selectedModules = s.debugSynthesisState.selectedModules[:len(s.debugSynthesisState.selectedModules)-1]
		} else {
			s.debugSynthesisState.step = 1
		}
		s.selectedIndex = 0
	case "up", "k":
		if s.selectedIndex > 0 {
			s.selectedIndex--
		}
	case "down", "j":
		if s.selectedIndex < len(moduleTypes)-1 {
			s.selectedIndex++
		}
	case "enter":
		if s.selectedIndex < len(moduleTypes) {
			mt := moduleTypes[s.selectedIndex]
			s.debugSynthesisState.selectedModules = append(s.debugSynthesisState.selectedModules, &DebugModuleSelection{
				ModuleType:  &mt,
				ChainEffect: nil,
			})
			s.debugSynthesisState.step = 3 // チェイン効果選択へ
			s.selectedIndex = 0
		}
	}
	return s, nil
}

// handleDebugChainEffectSelection はチェイン効果選択を処理します。
func (s *AgentManagementScreen) handleDebugChainEffectSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	chainEffects := s.debugProvider.GetChainEffects()
	// +1 は「なし」オプション用
	maxIndex := len(chainEffects)

	switch msg.String() {
	case "esc":
		// モジュール選択に戻る（最後のモジュールを削除）
		s.debugSynthesisState.selectedModules = s.debugSynthesisState.selectedModules[:len(s.debugSynthesisState.selectedModules)-1]
		s.debugSynthesisState.step = 2
		s.selectedIndex = 0
	case "up", "k":
		if s.selectedIndex > 0 {
			s.selectedIndex--
		}
	case "down", "j":
		if s.selectedIndex < maxIndex {
			s.selectedIndex++
		}
	case "enter":
		// チェイン効果を選択
		moduleIdx := s.debugSynthesisState.currentModuleIdx
		if s.selectedIndex == 0 {
			// 「なし」を選択
			s.debugSynthesisState.selectedModules[moduleIdx].ChainEffect = nil
		} else {
			ce := chainEffects[s.selectedIndex-1]
			// 効果値はmax_valueを使用（デバッグモードなので最大値）
			chainEffect := domain.NewChainEffect(ce.ToDomainEffectType(), ce.MaxValue)
			s.debugSynthesisState.selectedModules[moduleIdx].ChainEffect = &chainEffect
		}

		// 次のモジュールスロットへ、または確認画面へ
		if s.debugSynthesisState.currentModuleIdx < 3 {
			s.debugSynthesisState.currentModuleIdx++
			s.debugSynthesisState.step = 2 // モジュール選択に戻る
		} else {
			s.debugSynthesisState.step = 4 // 確認画面へ
		}
		s.selectedIndex = 0
	}
	return s, nil
}

// handleDebugConfirmation は確認画面を処理します。
func (s *AgentManagementScreen) handleDebugConfirmation(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc", "backspace":
		// 最後のチェイン効果選択に戻る
		s.debugSynthesisState.step = 3
		s.debugSynthesisState.currentModuleIdx = 3
		s.selectedIndex = 0
	case "enter":
		// 合成を実行
		s.executeDebugSynthesis()
	}
	return s, nil
}

// executeDebugSynthesis はデバッグモードの合成を実行します。
func (s *AgentManagementScreen) executeDebugSynthesis() {
	state := s.debugSynthesisState

	// コアを作成
	core := s.debugProvider.CreateCoreFromType(
		state.selectedCoreType.ID,
		state.coreLevel,
	)
	if core == nil {
		s.errorMessage = "コアの作成に失敗しました"
		return
	}

	// モジュールを作成
	var modules []*domain.ModuleModel
	for _, sel := range state.selectedModules {
		module := s.debugProvider.CreateModuleFromType(
			sel.ModuleType.ID,
			sel.ChainEffect,
		)
		if module == nil {
			s.errorMessage = fmt.Sprintf("モジュール %s の作成に失敗しました", sel.ModuleType.ID)
			return
		}
		modules = append(modules, module)
	}

	// エージェントを作成
	agentID := fmt.Sprintf("debug_agent_%d", len(s.debugProvider.GetAgents())+1)
	agent := domain.NewAgent(agentID, core, modules)

	// インベントリに追加
	if err := s.inventory.AddAgent(agent); err != nil {
		s.errorMessage = fmt.Sprintf("エージェント作成に失敗: %v", err)
		return
	}

	s.statusMessage = fmt.Sprintf("デバッグエージェント「%s」を作成しました", agent.GetCoreTypeName())
	s.errorMessage = ""
	s.resetDebugSynthesisState()
	s.updateCurrentList()
}

// resetDebugSynthesisState はデバッグ合成状態をリセットします。
func (s *AgentManagementScreen) resetDebugSynthesisState() {
	s.debugSynthesisState = DebugSynthesisState{
		selectedModules: make([]*DebugModuleSelection, 0),
	}
	s.selectedIndex = 0
}

// renderDebugSynthesis はデバッグ合成画面をレンダリングします。
func (s *AgentManagementScreen) renderDebugSynthesis() string {
	var b strings.Builder

	// ヘッダー
	b.WriteString(s.styles.Text.Title.Render("[DEBUG] エージェント合成"))
	b.WriteString("\n\n")

	switch s.debugSynthesisState.step {
	case 0:
		b.WriteString(s.renderDebugCoreTypeList())
	case 1:
		b.WriteString(s.renderDebugLevelInput())
	case 2:
		b.WriteString(s.renderDebugModuleTypeList())
	case 3:
		b.WriteString(s.renderDebugChainEffectList())
	case 4:
		b.WriteString(s.renderDebugConfirmation())
	}

	// エラー/ステータスメッセージ
	if s.errorMessage != "" {
		b.WriteString("\n")
		b.WriteString(s.styles.Text.Error.Render(s.errorMessage))
	}
	if s.statusMessage != "" {
		b.WriteString("\n")
		b.WriteString(s.styles.Text.Success.Render(s.statusMessage))
	}

	return b.String()
}

// renderDebugCoreTypeList はコアタイプ選択リストをレンダリングします。
func (s *AgentManagementScreen) renderDebugCoreTypeList() string {
	var b strings.Builder
	b.WriteString(s.styles.Text.Subtitle.Render("コアタイプ選択"))
	b.WriteString("\n\n")

	coreTypes := s.debugProvider.GetCoreTypes()
	for i, ct := range coreTypes {
		prefix := "  "
		if i == s.selectedIndex {
			prefix = "> "
		}
		item := fmt.Sprintf("%s%s", prefix, ct.Name)
		if i == s.selectedIndex {
			b.WriteString(s.styles.Text.Bold.Render(item))
		} else {
			b.WriteString(item)
		}
		b.WriteString("\n")
	}

	b.WriteString("\n")
	b.WriteString(s.styles.Text.Subtle.Render("↑/↓: 選択  Enter: 決定  ←/→: タブ切替  Esc: 戻る"))
	return b.String()
}

// renderDebugLevelInput はレベル入力画面をレンダリングします。
func (s *AgentManagementScreen) renderDebugLevelInput() string {
	var b strings.Builder
	b.WriteString(s.styles.Text.Subtitle.Render("レベル入力"))
	b.WriteString("\n\n")

	b.WriteString(fmt.Sprintf("選択中コア: %s\n\n", s.debugSynthesisState.selectedCoreType.Name))
	b.WriteString(fmt.Sprintf("レベル (1-99): [%s]\n", s.debugSynthesisState.levelInput))

	b.WriteString("\n")
	b.WriteString(s.styles.Text.Subtle.Render("数字キー: 入力  Enter: 確定  Backspace: 削除/戻る  Esc: 戻る"))
	return b.String()
}

// renderDebugModuleTypeList はモジュールタイプ選択リストをレンダリングします。
func (s *AgentManagementScreen) renderDebugModuleTypeList() string {
	var b strings.Builder
	b.WriteString(s.styles.Text.Subtitle.Render(fmt.Sprintf("モジュール選択 (%d/4)", s.debugSynthesisState.currentModuleIdx+1)))
	b.WriteString("\n\n")

	// 選択済みモジュール表示
	if len(s.debugSynthesisState.selectedModules) > 0 {
		b.WriteString("選択済み: ")
		for i, sel := range s.debugSynthesisState.selectedModules {
			if i > 0 {
				b.WriteString(", ")
			}
			b.WriteString(sel.ModuleType.Name)
		}
		b.WriteString("\n\n")
	}

	moduleTypes := s.debugProvider.GetModuleTypes()
	for i, mt := range moduleTypes {
		prefix := "  "
		if i == s.selectedIndex {
			prefix = "> "
		}
		item := fmt.Sprintf("%s%s [%s]", prefix, mt.Name, mt.Category)
		if i == s.selectedIndex {
			b.WriteString(s.styles.Text.Bold.Render(item))
		} else {
			b.WriteString(item)
		}
		b.WriteString("\n")
	}

	b.WriteString("\n")
	b.WriteString(s.styles.Text.Subtle.Render("↑/↓: 選択  Enter: 決定  Esc: 戻る"))
	return b.String()
}

// renderDebugChainEffectList はチェイン効果選択リストをレンダリングします。
func (s *AgentManagementScreen) renderDebugChainEffectList() string {
	var b strings.Builder
	moduleIdx := s.debugSynthesisState.currentModuleIdx
	moduleName := s.debugSynthesisState.selectedModules[moduleIdx].ModuleType.Name
	b.WriteString(s.styles.Text.Subtitle.Render(fmt.Sprintf("チェイン効果選択 - %s", moduleName)))
	b.WriteString("\n\n")

	// 「なし」オプション
	prefix := "  "
	if s.selectedIndex == 0 {
		prefix = "> "
	}
	item := prefix + "なし"
	if s.selectedIndex == 0 {
		b.WriteString(s.styles.Text.Bold.Render(item))
	} else {
		b.WriteString(item)
	}
	b.WriteString("\n")

	// チェイン効果リスト
	chainEffects := s.debugProvider.GetChainEffects()
	for i, ce := range chainEffects {
		prefix := "  "
		if i+1 == s.selectedIndex {
			prefix = "> "
		}
		item := fmt.Sprintf("%s%s (最大値: %.0f)", prefix, ce.Name, ce.MaxValue)
		if i+1 == s.selectedIndex {
			b.WriteString(s.styles.Text.Bold.Render(item))
		} else {
			b.WriteString(item)
		}
		b.WriteString("\n")
	}

	b.WriteString("\n")
	b.WriteString(s.styles.Text.Subtle.Render("↑/↓: 選択  Enter: 決定  Esc: 戻る"))
	return b.String()
}

// renderDebugConfirmation は確認画面をレンダリングします。
func (s *AgentManagementScreen) renderDebugConfirmation() string {
	var b strings.Builder
	b.WriteString(s.styles.Text.Subtitle.Render("合成確認"))
	b.WriteString("\n\n")

	state := s.debugSynthesisState

	// コア情報
	b.WriteString(fmt.Sprintf("コア: %s Lv.%d\n\n", state.selectedCoreType.Name, state.coreLevel))

	// モジュール情報
	for i, sel := range state.selectedModules {
		b.WriteString(fmt.Sprintf("モジュール%d: %s\n", i+1, sel.ModuleType.Name))
		if sel.ChainEffect != nil {
			b.WriteString(fmt.Sprintf("  チェイン: %s\n", sel.ChainEffect.Description))
		} else {
			b.WriteString("  チェイン: なし\n")
		}
	}

	b.WriteString("\n")
	b.WriteString(s.styles.Text.Subtle.Render("Enter: 合成実行  Backspace/Esc: 戻る"))
	return b.String()
}
