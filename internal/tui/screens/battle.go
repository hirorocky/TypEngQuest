// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"
)

// ==================== Task 10.3: バトル画面 ====================

// ModuleSlot はモジュールスロットを表します。
type ModuleSlot struct {
	Module            *domain.ModuleModel
	Agent             *domain.AgentModel
	AgentIndex        int
	ModuleIndex       int
	CooldownRemaining float64
	CooldownTotal     float64
}

// IsReady はモジュールが使用可能かを返します。
func (s *ModuleSlot) IsReady() bool {
	return s.CooldownRemaining <= 0
}

// BattleScreen はバトル画面を表します。
// Requirements: 9.2-9.6, 9.11-9.15, 18.9, 18.10
type BattleScreen struct {
	// 戦闘参加者
	enemy          *domain.EnemyModel
	player         *domain.PlayerModel
	equippedAgents []*domain.AgentModel

	// モジュールスロット
	moduleSlots   []ModuleSlot
	selectedSlot  int

	// タイピング状態
	isTyping          bool
	typingText        string
	typingIndex       int
	typingMistakes    []int
	typingStartTime   time.Time
	typingTimeLimit   time.Duration
	selectedModuleIdx int

	// 敵攻撃
	nextEnemyAttack time.Time

	// UI
	styles  *styles.GameStyles
	width   int
	height  int
	message string
}

// NewBattleScreen は新しいBattleScreenを作成します。
func NewBattleScreen(enemy *domain.EnemyModel, player *domain.PlayerModel, agents []*domain.AgentModel) *BattleScreen {
	screen := &BattleScreen{
		enemy:          enemy,
		player:         player,
		equippedAgents: agents,
		moduleSlots:    make([]ModuleSlot, 0),
		selectedSlot:   0,
		isTyping:       false,
		styles:         styles.NewGameStyles(),
		width:          120,
		height:         40,
	}

	// モジュールスロットを初期化
	// Requirement 18.10: エージェントごとにモジュールをグループ化
	for agentIdx, agent := range agents {
		for modIdx, module := range agent.Modules {
			screen.moduleSlots = append(screen.moduleSlots, ModuleSlot{
				Module:            module,
				Agent:             agent,
				AgentIndex:        agentIdx,
				ModuleIndex:       modIdx,
				CooldownRemaining: 0,
				CooldownTotal:     5.0, // デフォルト5秒
			})
		}
	}

	return screen
}

// Init は画面の初期化を行います。
func (s *BattleScreen) Init() tea.Cmd {
	s.nextEnemyAttack = time.Now().Add(s.enemy.AttackInterval)
	return nil
}

// Update はメッセージを処理します。
func (s *BattleScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
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
func (s *BattleScreen) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	if s.isTyping {
		return s.handleTypingInput(msg)
	}

	return s.handleModuleSelection(msg)
}

// handleModuleSelection はモジュール選択時のキー処理を行います。
func (s *BattleScreen) handleModuleSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		s.selectedSlot--
		if s.selectedSlot < 0 {
			s.selectedSlot = len(s.moduleSlots) - 1
		}
	case "down", "j":
		s.selectedSlot++
		if s.selectedSlot >= len(s.moduleSlots) {
			s.selectedSlot = 0
		}
	case "enter":
		if len(s.moduleSlots) > 0 && s.moduleSlots[s.selectedSlot].IsReady() {
			// モジュール選択 → タイピングチャレンジ開始
			s.selectedModuleIdx = s.selectedSlot
			// TODO: 実際のチャレンジテキストは外部から取得
			s.StartTypingChallenge("example", 5*time.Second)
		}
	case "esc":
		// バトルを中断してホームに戻る（デバッグ用）
		return s, func() tea.Msg {
			return ChangeSceneMsg{Scene: "home"}
		}
	}

	return s, nil
}

// handleTypingInput はタイピング中のキー処理を行います。
func (s *BattleScreen) handleTypingInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		// タイピングをキャンセル
		s.CancelTyping()
		return s, nil
	default:
		if len(msg.Runes) == 1 {
			s.ProcessTypingInput(msg.Runes[0])
		}
	}

	return s, nil
}

// StartTypingChallenge はタイピングチャレンジを開始します。
// Requirement 9.6: タイピングチャレンジテキスト表示
func (s *BattleScreen) StartTypingChallenge(text string, timeLimit time.Duration) {
	s.isTyping = true
	s.typingText = text
	s.typingIndex = 0
	s.typingMistakes = make([]int, 0)
	s.typingStartTime = time.Now()
	s.typingTimeLimit = timeLimit
}

// ProcessTypingInput はタイピング入力を処理します。
func (s *BattleScreen) ProcessTypingInput(r rune) {
	if s.typingIndex >= len(s.typingText) {
		return
	}

	expected := rune(s.typingText[s.typingIndex])
	if r == expected {
		s.typingIndex++
		// 完了チェック
		if s.typingIndex >= len(s.typingText) {
			s.CompleteTyping()
		}
	} else {
		// 誤入力
		s.typingMistakes = append(s.typingMistakes, s.typingIndex)
	}
}

// CompleteTyping はタイピングを完了します。
func (s *BattleScreen) CompleteTyping() {
	s.isTyping = false
	s.message = "タイピング完了！"
	// TODO: モジュール効果を適用
}

// CancelTyping はタイピングをキャンセルします。
func (s *BattleScreen) CancelTyping() {
	s.isTyping = false
	s.message = "タイピングキャンセル"
}

// View は画面をレンダリングします。
func (s *BattleScreen) View() string {
	var builder strings.Builder

	// 上部: 敵情報
	enemyInfo := s.renderEnemyInfo()
	builder.WriteString(enemyInfo)
	builder.WriteString("\n")

	// 中央: バトルエリア
	if s.isTyping {
		typingArea := s.renderTypingArea()
		builder.WriteString(typingArea)
	} else {
		battleArea := s.renderBattleArea()
		builder.WriteString(battleArea)
	}
	builder.WriteString("\n")

	// 下部: プレイヤー情報とモジュール一覧
	playerInfo := s.renderPlayerInfo()
	moduleList := s.renderModuleList()

	bottomContent := lipgloss.JoinHorizontal(lipgloss.Top, playerInfo, "  ", moduleList)
	builder.WriteString(bottomContent)
	builder.WriteString("\n")

	// メッセージ
	if s.message != "" {
		msgStyle := lipgloss.NewStyle().
			Foreground(styles.ColorInfo).
			Align(lipgloss.Center).
			Width(s.width)
		builder.WriteString(msgStyle.Render(s.message))
		builder.WriteString("\n")
	}

	// ヒント
	hintStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Align(lipgloss.Center).
		Width(s.width)

	var hint string
	if s.isTyping {
		hint = "タイピング中...  Esc: キャンセル"
	} else {
		hint = "↑/k: 上  ↓/j: 下  Enter: モジュール使用  Esc: 中断"
	}
	builder.WriteString(hintStyle.Render(hint))

	return builder.String()
}

// renderEnemyInfo は敵情報を描画します。
// Requirement 9.2: 敵の名前、HP、レベルを表示
func (s *BattleScreen) renderEnemyInfo() string {
	var builder strings.Builder

	nameStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorDamage)

	labelStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle)

	builder.WriteString(nameStyle.Render(s.enemy.Name))
	builder.WriteString("\n")

	// HP表示
	hpBar := s.styles.RenderHPBarWithValue(s.enemy.HP, s.enemy.MaxHP, 30)
	builder.WriteString(labelStyle.Render("HP: "))
	builder.WriteString(hpBar)
	builder.WriteString("\n")

	// フェーズ表示
	if s.enemy.IsEnhanced() {
		phaseStyle := lipgloss.NewStyle().
			Foreground(styles.ColorDamage).
			Bold(true)
		builder.WriteString(phaseStyle.Render("[強化フェーズ]"))
		builder.WriteString("\n")
	}

	// 敵のバフ表示
	buffs := s.enemy.EffectTable.GetRowsBySource(domain.SourceBuff)
	for _, buff := range buffs {
		if buff.Duration != nil {
			builder.WriteString(s.styles.RenderBuff(buff.Name, *buff.Duration))
			builder.WriteString(" ")
		}
	}

	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorDamage).
		Padding(1, 2).
		Width(50).
		Render(builder.String())
}

// renderPlayerInfo はプレイヤー情報を描画します。
// Requirement 9.3: プレイヤーのHP、バフ・デバフを表示
func (s *BattleScreen) renderPlayerInfo() string {
	var builder strings.Builder

	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorHPHigh)

	labelStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle)

	builder.WriteString(titleStyle.Render("プレイヤー"))
	builder.WriteString("\n")

	// HP表示
	// Requirement 9.4: 現在HP、最大HPを表示
	hpBar := s.styles.RenderHPBarWithValue(s.player.HP, s.player.MaxHP, 30)
	builder.WriteString(labelStyle.Render("HP: "))
	builder.WriteString(hpBar)
	builder.WriteString("\n\n")

	// バフ表示
	buffs := s.player.EffectTable.GetRowsBySource(domain.SourceBuff)
	if len(buffs) > 0 {
		builder.WriteString(labelStyle.Render("バフ: "))
		for _, buff := range buffs {
			if buff.Duration != nil {
				builder.WriteString(s.styles.RenderBuff(buff.Name, *buff.Duration))
				builder.WriteString(" ")
			}
		}
		builder.WriteString("\n")
	}

	// デバフ表示
	debuffs := s.player.EffectTable.GetRowsBySource(domain.SourceDebuff)
	if len(debuffs) > 0 {
		builder.WriteString(labelStyle.Render("デバフ: "))
		for _, debuff := range debuffs {
			if debuff.Duration != nil {
				builder.WriteString(s.styles.RenderDebuff(debuff.Name, *debuff.Duration))
				builder.WriteString(" ")
			}
		}
		builder.WriteString("\n")
	}

	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorHPHigh).
		Padding(1, 2).
		Width(40).
		Render(builder.String())
}

// renderModuleList はモジュール一覧を描画します。
// Requirement 9.4: 装備中の全エージェントのモジュールを一覧表示
// Requirement 18.10: エージェントごとにモジュールをグループ化
func (s *BattleScreen) renderModuleList() string {
	var builder strings.Builder

	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(styles.ColorSecondary)

	builder.WriteString(titleStyle.Render("モジュール"))
	builder.WriteString("\n\n")

	currentAgent := -1
	for i, slot := range s.moduleSlots {
		// エージェントグループヘッダー
		if slot.AgentIndex != currentAgent {
			currentAgent = slot.AgentIndex
			agentStyle := lipgloss.NewStyle().
				Foreground(styles.ColorInfo)
			agentHeader := fmt.Sprintf("--- %s (Lv.%d) ---",
				slot.Agent.GetCoreTypeName(), slot.Agent.Level)
			builder.WriteString(agentStyle.Render(agentHeader))
			builder.WriteString("\n")
		}

		// モジュール表示
		var style lipgloss.Style
		prefix := "  "

		if i == s.selectedSlot {
			style = lipgloss.NewStyle().
				Bold(true).
				Foreground(styles.ColorPrimary)
			prefix = "> "
		} else if !slot.IsReady() {
			style = lipgloss.NewStyle().
				Foreground(styles.ColorSubtle)
		} else {
			style = lipgloss.NewStyle().
				Foreground(styles.ColorSecondary)
		}

		moduleName := slot.Module.Name

		// Requirement 9.5: クールダウン状態を表示
		// Requirement 18.9: プログレスバー、残り秒数表示
		if !slot.IsReady() {
			cdBar := s.styles.RenderCooldownBarWithTime(slot.CooldownRemaining, slot.CooldownTotal, 10)
			builder.WriteString(style.Render(prefix + moduleName + " "))
			builder.WriteString(cdBar)
		} else {
			builder.WriteString(style.Render(prefix + moduleName))
			builder.WriteString(s.styles.Text.Success.Render(" [READY]"))
		}
		builder.WriteString("\n")
	}

	return lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1, 2).
		Width(50).
		Render(builder.String())
}

// renderBattleArea はバトルエリアを描画します。
func (s *BattleScreen) renderBattleArea() string {
	// 次の敵攻撃までの時間を表示
	remaining := time.Until(s.nextEnemyAttack)
	if remaining < 0 {
		remaining = 0
	}

	attackWarning := fmt.Sprintf("次の敵攻撃まで: %.1f秒", remaining.Seconds())
	warningStyle := lipgloss.NewStyle().
		Foreground(styles.ColorWarning).
		Bold(true).
		Align(lipgloss.Center).
		Width(s.width)

	return warningStyle.Render(attackWarning)
}

// renderTypingArea はタイピングエリアを描画します。
// Requirement 9.6: タイピングチャレンジテキスト表示と入力進捗
// Requirement 9.15: 制限時間のリアルタイム表示
func (s *BattleScreen) renderTypingArea() string {
	var builder strings.Builder

	// 制限時間表示
	elapsed := time.Since(s.typingStartTime)
	remaining := s.typingTimeLimit - elapsed
	if remaining < 0 {
		remaining = 0
	}

	timeStyle := lipgloss.NewStyle().
		Foreground(styles.ColorWarning).
		Bold(true)

	builder.WriteString(timeStyle.Render(fmt.Sprintf("残り時間: %.1f秒", remaining.Seconds())))
	builder.WriteString("\n\n")

	// タイピングテキスト
	typingDisplay := s.styles.RenderTypingChallenge(s.typingText, s.typingIndex, s.typingMistakes)

	typingBox := lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1, 2).
		Render(typingDisplay)

	builder.WriteString(typingBox)
	builder.WriteString("\n\n")

	// 進捗表示
	progress := float64(s.typingIndex) / float64(len(s.typingText)) * 100
	progressStr := fmt.Sprintf("進捗: %d/%d (%.0f%%)", s.typingIndex, len(s.typingText), progress)
	progressStyle := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle)

	builder.WriteString(progressStyle.Render(progressStr))

	return lipgloss.NewStyle().
		Align(lipgloss.Center).
		Width(s.width).
		Render(builder.String())
}

// UpdateCooldowns はクールダウンを更新します。
func (s *BattleScreen) UpdateCooldowns(deltaSeconds float64) {
	for i := range s.moduleSlots {
		if s.moduleSlots[i].CooldownRemaining > 0 {
			s.moduleSlots[i].CooldownRemaining -= deltaSeconds
			if s.moduleSlots[i].CooldownRemaining < 0 {
				s.moduleSlots[i].CooldownRemaining = 0
			}
		}
	}
}

// StartCooldown はモジュールのクールダウンを開始します。
func (s *BattleScreen) StartCooldown(slotIndex int, duration float64) {
	if slotIndex >= 0 && slotIndex < len(s.moduleSlots) {
		s.moduleSlots[slotIndex].CooldownRemaining = duration
		s.moduleSlots[slotIndex].CooldownTotal = duration
	}
}
