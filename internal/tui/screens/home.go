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

// ==================== Task 10.1: ホーム画面 ====================

// HomeScreen はホーム画面を表します。
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 21.1
type HomeScreen struct {
	menu             *components.Menu
	maxLevelReached  int
	equippedAgents   []*domain.AgentModel
	styles           *styles.GameStyles
	width            int
	height           int
}

// ChangeSceneMsg はシーン遷移を要求するメッセージです。
type ChangeSceneMsg struct {
	Scene string
}

// NewHomeScreen は新しいHomeScreenを作成します。
// Requirement 2.1: ゲーム起動時にホーム画面を表示
func NewHomeScreen(maxLevelReached int, equippedAgents []*domain.AgentModel) *HomeScreen {
	// Requirement 2.2: 4つの主要機能 + 設定
	items := []components.MenuItem{
		{Label: "エージェント管理", Value: "agent_management"},
		{Label: "バトル選択", Value: "battle_select"},
		{Label: "図鑑", Value: "encyclopedia"},
		{Label: "統計/実績", Value: "stats_achievements"},
		{Label: "設定", Value: "settings"}, // Requirement 21.1
	}

	return &HomeScreen{
		menu:            components.NewMenuWithTitle("メインメニュー", items),
		maxLevelReached: maxLevelReached,
		equippedAgents:  equippedAgents,
		styles:          styles.NewGameStyles(),
		width:           120,
		height:          40,
	}
}

// Init は画面の初期化を行います。
func (s *HomeScreen) Init() tea.Cmd {
	return nil
}

// Update はメッセージを処理します。
func (s *HomeScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
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
// Requirement 2.7: 矢印キーまたはhjklでメニュー選択
// Requirement 2.8: Enterキーで項目実行
func (s *HomeScreen) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		s.menu.MoveUp()
	case "down", "j":
		s.menu.MoveDown()
	case "enter":
		selected := s.menu.GetSelected()
		return s, s.handleMenuSelection(selected.Value)
	case "q", "ctrl+c":
		return s, tea.Quit
	}

	return s, nil
}

// handleMenuSelection はメニュー選択を処理します。
// Requirements 2.3, 2.4, 2.5, 2.6: 各機能画面への遷移
func (s *HomeScreen) handleMenuSelection(value string) tea.Cmd {
	return func() tea.Msg {
		return ChangeSceneMsg{Scene: value}
	}
}

// View は画面をレンダリングします。
func (s *HomeScreen) View() string {
	var builder strings.Builder

	// タイトル
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorPrimary).
		Align(lipgloss.Center).
		Width(s.width)

	title := titleStyle.Render("⚔ TypeBattle ⚔")
	builder.WriteString(title)
	builder.WriteString("\n")

	subtitleStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Align(lipgloss.Center).
		Width(s.width)

	subtitle := subtitleStyle.Render("Terminal Typing Battle Game")
	builder.WriteString(subtitle)
	builder.WriteString("\n\n")

	// メインコンテンツ（メニューと進行状況を横並び）
	menuContent := s.menu.Render()
	statusContent := s.renderStatusPanel()

	// レイアウト調整
	menuBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1, 2).
		Width(40).
		Render(menuContent)

	statusBox := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorSubtle).
		Padding(1, 2).
		Width(50).
		Render(statusContent)

	// 横に並べる
	content := lipgloss.JoinHorizontal(lipgloss.Top, menuBox, "  ", statusBox)

	// 中央揃え
	centeredContent := lipgloss.NewStyle().
		Width(s.width).
		Align(lipgloss.Center).
		Render(content)

	builder.WriteString(centeredContent)
	builder.WriteString("\n\n")

	// ヒント
	hintStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Align(lipgloss.Center).
		Width(s.width)

	hint := hintStyle.Render("↑/k: 上  ↓/j: 下  Enter: 選択  q: 終了")
	builder.WriteString(hint)

	return builder.String()
}

// renderStatusPanel は進行状況パネルをレンダリングします。
// Requirement 2.10: 現在の進行状況を表示
func (s *HomeScreen) renderStatusPanel() string {
	var builder strings.Builder

	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorSecondary)

	labelStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle)

	valueStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSecondary).
		Bold(true)

	builder.WriteString(titleStyle.Render("進行状況"))
	builder.WriteString("\n\n")

	// 到達最高レベル
	builder.WriteString(labelStyle.Render("到達最高レベル: "))
	if s.maxLevelReached == 0 {
		builder.WriteString(valueStyle.Render("まだなし"))
	} else {
		builder.WriteString(valueStyle.Render(fmt.Sprintf("Lv.%d", s.maxLevelReached)))
	}
	builder.WriteString("\n")

	// 挑戦可能最大レベル
	builder.WriteString(labelStyle.Render("挑戦可能レベル: "))
	nextLevel := s.maxLevelReached + 1
	builder.WriteString(valueStyle.Render(fmt.Sprintf("Lv.%d まで", nextLevel)))
	builder.WriteString("\n\n")

	// 装備中エージェント
	builder.WriteString(titleStyle.Render("装備中エージェント"))
	builder.WriteString("\n\n")

	if len(s.equippedAgents) == 0 {
		builder.WriteString(labelStyle.Render("(未装備)"))
	} else {
		for i, agent := range s.equippedAgents {
			slotLabel := fmt.Sprintf("スロット%d: ", i+1)
			builder.WriteString(labelStyle.Render(slotLabel))
			agentInfo := fmt.Sprintf("%s (Lv.%d)", agent.GetCoreTypeName(), agent.Level)
			builder.WriteString(valueStyle.Render(agentInfo))
			builder.WriteString("\n")
		}
	}

	// 空きスロットを表示
	for i := len(s.equippedAgents); i < 3; i++ {
		slotLabel := fmt.Sprintf("スロット%d: ", i+1)
		builder.WriteString(labelStyle.Render(slotLabel))
		builder.WriteString(labelStyle.Render("(空)"))
		builder.WriteString("\n")
	}

	return builder.String()
}

// SetMaxLevelReached は到達最高レベルを設定します。
func (s *HomeScreen) SetMaxLevelReached(level int) {
	s.maxLevelReached = level
}

// SetEquippedAgents は装備中エージェントを設定します。
func (s *HomeScreen) SetEquippedAgents(agents []*domain.AgentModel) {
	s.equippedAgents = agents
}
