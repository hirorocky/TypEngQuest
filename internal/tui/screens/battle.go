// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"
	"hirorocky/type-battle/internal/typing"
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

	// タイピングシステム
	challengeGenerator *typing.ChallengeGenerator
	evaluator          *typing.Evaluator
	typingState        *typing.ChallengeState

	// バトルエンジン
	battleEngine *battle.BattleEngine
	battleState  *battle.BattleState

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
	// デフォルト辞書を作成
	dictionary := createDefaultDictionary()

	// 敵タイプリストを作成（BattleEngine用）
	enemyTypes := []domain.EnemyType{enemy.Type}

	screen := &BattleScreen{
		enemy:              enemy,
		player:             player,
		equippedAgents:     agents,
		moduleSlots:        make([]ModuleSlot, 0),
		selectedSlot:       0,
		isTyping:           false,
		challengeGenerator: typing.NewChallengeGenerator(dictionary),
		evaluator:          typing.NewEvaluator(),
		battleEngine:       battle.NewBattleEngine(enemyTypes),
		styles:             styles.NewGameStyles(),
		width:              120,
		height:             40,
	}

	// バトル状態を初期化
	screen.battleState = &battle.BattleState{
		Enemy:          enemy,
		Player:         player,
		EquippedAgents: agents,
		Level:          enemy.Level,
		Stats: &battle.BattleStatistics{
			StartTime: time.Now(),
		},
		NextAttackTime: time.Now().Add(enemy.AttackInterval),
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

// createDefaultDictionary はデフォルトのタイピング辞書を作成します。
func createDefaultDictionary() *typing.Dictionary {
	return &typing.Dictionary{
		// Easy: 3-6文字の単語
		Easy: []string{
			"cat", "dog", "run", "jump", "fire", "ice",
			"hit", "cut", "heal", "buff", "fast", "slow",
			"axe", "bow", "sun", "moon", "star", "wind",
			"red", "blue", "gold", "dark", "life", "mana",
		},
		// Medium: 7-11文字の単語
		Medium: []string{
			"warrior", "monster", "defense", "attack",
			"healing", "protect", "thunder", "blizzard",
			"fireball", "critical", "accuracy", "strength",
			"powerful", "ultimate", "blessing", "cursed",
		},
		// Hard: 12-20文字の単語
		Hard: []string{
			"thunderstorm", "annihilation", "resurrection",
			"extraordinary", "invulnerable", "battleground",
			"concentration", "determination", "acceleration",
			"purification", "hallucination", "obliteration",
		},
	}
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
			module := s.moduleSlots[s.selectedSlot].Module

			// モジュールレベルに応じた難易度でチャレンジを生成
			difficulty := typing.GetDifficultyForModuleLevel(module.Level)
			timeLimit := typing.GetDefaultTimeLimit(difficulty)
			challenge := s.challengeGenerator.Generate(difficulty, timeLimit)

			if challenge != nil {
				s.StartTypingChallenge(challenge.Text, challenge.TimeLimit)
			}
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

	// Evaluator用のチャレンジ状態を初期化
	challenge := &typing.Challenge{
		Text:      text,
		TimeLimit: timeLimit,
	}
	s.typingState = s.evaluator.StartChallenge(challenge)
}

// ProcessTypingInput はタイピング入力を処理します。
func (s *BattleScreen) ProcessTypingInput(r rune) {
	if s.typingIndex >= len(s.typingText) {
		return
	}

	// Evaluator経由で入力を処理
	if s.typingState != nil {
		s.typingState = s.evaluator.ProcessInput(s.typingState, r)
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

	// タイピング結果を評価
	var typingResult *typing.TypingResult
	if s.typingState != nil {
		typingResult = s.evaluator.CompleteChallenge(s.typingState)
	} else {
		// フォールバック用のデフォルト結果
		typingResult = &typing.TypingResult{
			Completed:      true,
			WPM:            60.0,
			Accuracy:       1.0,
			SpeedFactor:    1.0,
			AccuracyFactor: 1.0,
		}
	}

	// バトル統計に記録
	if s.battleEngine != nil && s.battleState != nil {
		s.battleEngine.RecordTypingResult(s.battleState, typingResult)
	}

	// モジュール効果を適用
	slot := s.moduleSlots[s.selectedModuleIdx]
	agent := slot.Agent
	module := slot.Module

	var effectAmount int
	if s.battleEngine != nil && s.battleState != nil {
		effectAmount = s.battleEngine.ApplyModuleEffect(s.battleState, agent, module, typingResult)
	}

	// メッセージを表示
	s.message = s.formatEffectMessage(module, effectAmount, typingResult)

	// クールダウンを開始
	s.StartCooldown(s.selectedModuleIdx, slot.CooldownTotal)

	// フェーズ変化をチェック
	if s.battleEngine != nil && s.battleState != nil {
		if s.battleEngine.CheckPhaseTransition(s.battleState) {
			s.message += " [敵が強化フェーズに突入！]"
		}
	}
}

// formatEffectMessage は効果メッセージをフォーマットします。
func (s *BattleScreen) formatEffectMessage(module *domain.ModuleModel, effectAmount int, result *typing.TypingResult) string {
	var action string
	switch module.Category {
	case domain.PhysicalAttack, domain.MagicAttack:
		action = fmt.Sprintf("%dダメージを与えた！", effectAmount)
	case domain.Heal:
		action = fmt.Sprintf("%d回復した！", effectAmount)
	case domain.Buff:
		action = fmt.Sprintf("%sを付与した！", module.Name)
	case domain.Debuff:
		action = fmt.Sprintf("敵に%sを付与した！", module.Name)
	default:
		action = "効果を発動した！"
	}

	return fmt.Sprintf("%s (WPM:%.0f 正確性:%.0f%%)", action, result.WPM, result.Accuracy*100)
}

// CancelTyping はタイピングをキャンセルします。
func (s *BattleScreen) CancelTyping() {
	s.isTyping = false
	s.typingState = nil
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
