// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/ascii"
	"hirorocky/type-battle/internal/tui/components"
	"hirorocky/type-battle/internal/tui/styles"
)

// ==================== Task 10.1: ホーム画面 ====================

// AgentProvider は装備エージェントを提供するインターフェースです。
// HomeScreenやBattleSelectScreenがAgentManagerから最新の装備状態を取得するために使用します。
type AgentProvider interface {
	GetEquippedAgents() []*domain.AgentModel
}

// HomeScreen はホーム画面を表します。
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 21.1
// UI-Improvement Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
type HomeScreen struct {
	menu            *components.Menu
	maxLevelReached int
	agentProvider   AgentProvider // 装備エージェントを取得するプロバイダー
	styles          *styles.GameStyles
	width           int
	height          int
	statusMessage   string // セーブ/ロード結果などのステータスメッセージ
	// UI改善: ASCIIアートレンダラー
	logoRenderer   ascii.ASCIILogoRenderer
	numberRenderer ascii.ASCIINumberRenderer
}

// ChangeSceneMsg はシーン遷移を要求するメッセージです。
type ChangeSceneMsg struct {
	Scene string
}

// NewHomeScreen は新しいHomeScreenを作成します。
// Requirement 2.1: ゲーム起動時にホーム画面を表示
func NewHomeScreen(maxLevelReached int, agentProvider AgentProvider) *HomeScreen {
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
		agentProvider:   agentProvider,
		styles:          styles.NewGameStyles(),
		width:           140,
		height:          40,
		// UI改善: ASCIIアートレンダラーを初期化
		logoRenderer:   ascii.NewASCIILogo(),
		numberRenderer: ascii.NewASCIINumbers(),
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
// UI-Improvement Requirement 1.1: ASCIIアートロゴを表示
func (s *HomeScreen) View() string {
	var builder strings.Builder

	// UI改善: ASCIIアートロゴを表示
	// Requirement 1.1: ホーム画面にフィグレット風ASCIIアートでゲームロゴを表示
	logo := s.logoRenderer.Render(true) // カラーモード
	logoLines := strings.Split(logo, "\n")

	// ロゴを中央揃えで表示
	for _, line := range logoLines {
		lineWidth := len([]rune(line))
		padding := (s.width - lineWidth) / 2
		if padding < 0 {
			padding = 0
		}
		builder.WriteString(strings.Repeat(" ", padding))
		builder.WriteString(line)
		builder.WriteString("\n")
	}

	// サブタイトル
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

	// ステータスメッセージ（セーブ/ロード結果など）
	if s.statusMessage != "" {
		statusStyle := lipgloss.NewStyle().
			Foreground(styles.ColorHeal).
			Align(lipgloss.Center).
			Width(s.width)

		status := statusStyle.Render("💾 " + s.statusMessage)
		builder.WriteString(status)
		builder.WriteString("\n\n")
	}

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
// UI-Improvement Requirement 1.4: 到達レベルをASCII数字アートで表示
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

	// UI改善: 到達最高レベルをASCII数字アートで表示
	// Requirement 1.4: 進行状況パネルに到達レベルをフィグレット風の大きなASCII数字アートで表示
	builder.WriteString(labelStyle.Render("到達最高レベル:"))
	builder.WriteString("\n")
	if s.maxLevelReached == 0 {
		builder.WriteString(labelStyle.Render("  まだなし"))
	} else {
		// ASCII数字でレベルを表示
		levelArt := s.numberRenderer.RenderNumber(s.maxLevelReached, styles.ColorPrimary)
		builder.WriteString(levelArt)
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

	// AgentProviderから最新の装備状態を取得
	var equippedAgents []*domain.AgentModel
	if s.agentProvider != nil {
		equippedAgents = s.agentProvider.GetEquippedAgents()
	}

	if len(equippedAgents) == 0 {
		builder.WriteString(labelStyle.Render("(未装備)"))
	} else {
		for i, agent := range equippedAgents {
			slotLabel := fmt.Sprintf("スロット%d: ", i+1)
			builder.WriteString(labelStyle.Render(slotLabel))
			agentInfo := fmt.Sprintf("%s (Lv.%d)", agent.GetCoreTypeName(), agent.Level)
			builder.WriteString(valueStyle.Render(agentInfo))
			builder.WriteString("\n")
		}
	}

	// 空きスロットを表示
	for i := len(equippedAgents); i < 3; i++ {
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

// SetStatusMessage はステータスメッセージを設定します。
func (s *HomeScreen) SetStatusMessage(msg string) {
	s.statusMessage = msg
}

// ClearStatusMessage はステータスメッセージをクリアします。
func (s *HomeScreen) ClearStatusMessage() {
	s.statusMessage = ""
}
