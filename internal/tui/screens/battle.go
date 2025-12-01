// Package screens はTUIゲームの画面を提供します。
package screens

import (
	"fmt"
	"strings"
	"time"

	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/ascii"
	"hirorocky/type-battle/internal/tui/styles"
	"hirorocky/type-battle/internal/typing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ==================== Task 10.3: バトル画面 ====================

// tickInterval はバトル画面の更新間隔です。
const tickInterval = 100 * time.Millisecond

// BattleTickMsg はバトル画面の定期更新メッセージです。
type BattleTickMsg struct{}

// BattleResultMsg はバトル結果メッセージです。
type BattleResultMsg struct {
	Victory bool
	Level   int
	Stats   *battle.BattleStatistics // バトル統計
	EnemyID string                   // 敵図鑑更新用
}

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
// UI-Improvement Requirements: 3.1, 3.2, 3.9
type BattleScreen struct {
	// 戦闘参加者
	enemy          *domain.EnemyModel
	player         *domain.PlayerModel
	equippedAgents []*domain.AgentModel

	// モジュールスロット
	moduleSlots  []ModuleSlot
	selectedSlot int

	// エージェント選択状態（UI改善: 3エリアレイアウト用）
	selectedAgentIdx int

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

	// ゲーム終了状態
	gameOver      bool
	victory       bool
	showingResult bool

	// UI
	styles          *styles.GameStyles
	winLoseRenderer ascii.WinLoseRenderer
	width           int
	height          int
	message         string

	// アニメーション（UI改善: フローティングダメージ、HPバーアニメーション）
	floatingDamageManager *styles.FloatingDamageManager
	playerHPBar           *styles.AnimatedHPBar
	enemyHPBar            *styles.AnimatedHPBar
}

// NewBattleScreen は新しいBattleScreenを作成します。
func NewBattleScreen(enemy *domain.EnemyModel, player *domain.PlayerModel, agents []*domain.AgentModel) *BattleScreen {
	// デフォルト辞書を作成
	dictionary := createDefaultDictionary()

	// 敵タイプリストを作成（BattleEngine用）
	enemyTypes := []domain.EnemyType{enemy.Type}

	gs := styles.NewGameStyles()
	screen := &BattleScreen{
		enemy:              enemy,
		player:             player,
		equippedAgents:     agents,
		moduleSlots:        make([]ModuleSlot, 0),
		selectedSlot:       0,
		selectedAgentIdx:   0,
		isTyping:           false,
		challengeGenerator: typing.NewChallengeGenerator(dictionary),
		evaluator:          typing.NewEvaluator(),
		battleEngine:       battle.NewBattleEngine(enemyTypes),
		styles:             gs,
		winLoseRenderer:    ascii.NewWinLoseRenderer(gs),
		width:              140,
		height:             40,
		// UI改善: アニメーション初期化
		floatingDamageManager: styles.NewFloatingDamageManager(),
		playerHPBar:           styles.NewAnimatedHPBar(player.MaxHP),
		enemyHPBar:            styles.NewAnimatedHPBar(enemy.MaxHP),
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

	// Requirement 11.8: 初回行動を決定
	screen.battleState.NextAction = screen.battleEngine.DetermineNextAction(screen.battleState)

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
	return s.tick()
}

// tick は次のtickコマンドを返します。
func (s *BattleScreen) tick() tea.Cmd {
	return tea.Tick(tickInterval, func(t time.Time) tea.Msg {
		return BattleTickMsg{}
	})
}

// Update はメッセージを処理します。
func (s *BattleScreen) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		s.width = msg.Width
		s.height = msg.Height
		return s, nil

	case BattleTickMsg:
		return s.handleTick()

	case tea.KeyMsg:
		return s.handleKeyMsg(msg)
	}

	return s, nil
}

// handleTick は定期更新を処理します。
func (s *BattleScreen) handleTick() (tea.Model, tea.Cmd) {
	// ゲーム終了済みなら何もしない（最優先）
	if s.gameOver {
		return s, nil
	}

	// 結果表示中はtickを継続するが、ゲーム進行はしない
	if s.showingResult {
		return s, s.tick()
	}

	deltaSeconds := tickInterval.Seconds()

	// 勝敗判定（結果表示状態に入る）
	if s.checkGameOver() {
		s.showingResult = true
		// HP表示を実際のHPに即座に合わせる
		if s.enemy.HP <= 0 {
			s.enemyHPBar.SetTarget(0)
			s.enemyHPBar.ForceComplete()
		}
		if s.player.HP <= 0 {
			s.playerHPBar.SetTarget(0)
			s.playerHPBar.ForceComplete()
		}
		return s, s.tick()
	}

	// クールダウンを更新
	s.UpdateCooldowns(deltaSeconds)

	// UI改善: アニメーション更新
	deltaMS := int(tickInterval.Milliseconds())
	s.floatingDamageManager.Update(deltaMS)
	s.playerHPBar.Update(deltaMS)
	s.enemyHPBar.Update(deltaMS)

	// タイピング中の時間切れチェック
	if s.isTyping {
		elapsed := time.Since(s.typingStartTime)
		if elapsed >= s.typingTimeLimit {
			s.CancelTyping()
			s.message = "タイムアップ！"
		}
	}

	// 敵攻撃チェック
	if time.Now().After(s.nextEnemyAttack) {
		s.processEnemyAttack()

		// 攻撃後の敗北判定（結果表示状態に入る）
		if s.checkGameOver() {
			s.showingResult = true
			// HP表示を実際のHPに即座に合わせる
			if s.enemy.HP <= 0 {
				s.enemyHPBar.SetTarget(0)
				s.enemyHPBar.ForceComplete()
			}
			if s.player.HP <= 0 {
				s.playerHPBar.SetTarget(0)
				s.playerHPBar.ForceComplete()
			}
			return s, s.tick()
		}
	}

	// バフ・デバフの持続時間を更新
	s.updateEffectDurations(deltaSeconds)

	// 次のtickを返す
	return s, s.tick()
}

// checkGameOver は勝敗を判定します。
func (s *BattleScreen) checkGameOver() bool {
	// プレイヤー敗北
	if s.player.HP <= 0 {
		s.gameOver = true
		s.victory = false
		s.message = "敗北..."
		return true
	}

	// プレイヤー勝利
	if s.enemy.HP <= 0 {
		s.gameOver = true
		s.victory = true
		s.message = "勝利！"
		return true
	}

	return false
}

// createGameOverCmd はゲーム終了時のコマンドを作成します。
func (s *BattleScreen) createGameOverCmd() tea.Cmd {
	result := BattleResultMsg{
		Victory: s.victory,
		Level:   s.enemy.Level,
		Stats:   s.battleState.Stats,
		EnemyID: s.enemy.Type.ID,
	}
	return func() tea.Msg {
		return result
	}
}

// IsGameOver はゲームが終了したかを返します。
func (s *BattleScreen) IsGameOver() bool {
	return s.gameOver
}

// IsVictory は勝利したかを返します。
func (s *BattleScreen) IsVictory() bool {
	return s.gameOver && s.victory
}

// IsDefeat は敗北したかを返します。
func (s *BattleScreen) IsDefeat() bool {
	return s.gameOver && !s.victory
}

// IsShowingResult は結果表示中かを返します。
func (s *BattleScreen) IsShowingResult() bool {
	return s.showingResult
}

// processEnemyAttack は敵の行動を処理します。
// Requirement 11.8: 事前決定された行動を実行し、次回行動を再決定
func (s *BattleScreen) processEnemyAttack() {
	if s.battleEngine == nil || s.battleState == nil {
		// フォールバック: 従来の攻撃処理
		damage := s.enemy.AttackPower
		s.player.HP -= damage
		if s.player.HP < 0 {
			s.player.HP = 0
		}
		s.message = fmt.Sprintf("%sの攻撃！ %dダメージを受けた！", s.enemy.Name, damage)
		s.nextEnemyAttack = time.Now().Add(s.enemy.AttackInterval)
		// UI改善: フローティングダメージとHPアニメーション
		s.floatingDamageManager.AddDamage(damage, "player")
		s.playerHPBar.SetTarget(s.player.HP)
		return
	}

	// 事前決定された行動を実行
	damage, msg := s.battleEngine.ExecuteNextAction(s.battleState)

	// メッセージを表示
	action := s.battleState.NextAction
	switch action.ActionType {
	case battle.EnemyActionAttack:
		s.message = fmt.Sprintf("%sの攻撃！ %s", s.enemy.Name, msg)
		// UI改善: フローティングダメージとHPアニメーション
		if damage > 0 {
			s.floatingDamageManager.AddDamage(damage, "player")
			s.playerHPBar.SetTarget(s.player.HP)
		}
	case battle.EnemyActionSelfBuff:
		s.message = fmt.Sprintf("%sが%s！", s.enemy.Name, msg)
	case battle.EnemyActionDebuff:
		s.message = fmt.Sprintf("%sが%s", s.enemy.Name, msg)
	default:
		s.message = msg
	}

	// フェーズ変化をチェック
	if s.battleEngine.CheckPhaseTransition(s.battleState) {
		s.message += " [敵が強化フェーズに突入！]"
	}

	// 次回行動を決定
	s.battleState.NextAction = s.battleEngine.DetermineNextAction(s.battleState)

	// 次の行動時間を設定
	s.nextEnemyAttack = time.Now().Add(s.enemy.AttackInterval)
}

// updateEffectDurations はバフ・デバフの持続時間を更新します。
func (s *BattleScreen) updateEffectDurations(deltaSeconds float64) {
	// プレイヤーのエフェクトを更新
	if s.player.EffectTable != nil {
		s.player.EffectTable.UpdateDurations(deltaSeconds)
	}

	// 敵のエフェクトを更新
	if s.enemy.EffectTable != nil {
		s.enemy.EffectTable.UpdateDurations(deltaSeconds)
	}
}

// handleKeyMsg はキーボード入力を処理します。
func (s *BattleScreen) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	// 結果表示中はEnterでのみ遷移
	if s.showingResult {
		return s.handleResultInput(msg)
	}

	if s.isTyping {
		return s.handleTypingInput(msg)
	}

	return s.handleModuleSelection(msg)
}

// handleResultInput は結果表示中のキー入力を処理します。
func (s *BattleScreen) handleResultInput(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.Type {
	case tea.KeyEnter:
		// Enterで結果を確定してホームに戻る
		return s, s.createGameOverCmd()
	}
	// Enter以外のキーは無視
	return s, nil
}

// handleModuleSelection はモジュール選択時のキー処理を行います。
// UI-Improvement: 左右キーでエージェント切替、上下キーでモジュール選択
func (s *BattleScreen) handleModuleSelection(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "left", "h":
		// 前のエージェントに切り替え
		s.selectedAgentIdx--
		if s.selectedAgentIdx < 0 {
			s.selectedAgentIdx = len(s.equippedAgents) - 1
		}
		// そのエージェントの最初のモジュールを選択
		s.selectFirstModuleOfAgent(s.selectedAgentIdx)
	case "right", "l":
		// 次のエージェントに切り替え
		s.selectedAgentIdx++
		if s.selectedAgentIdx >= len(s.equippedAgents) {
			s.selectedAgentIdx = 0
		}
		// そのエージェントの最初のモジュールを選択
		s.selectFirstModuleOfAgent(s.selectedAgentIdx)
	case "up", "k":
		// 現在のエージェント内で前のモジュールに移動
		s.moveToPrevModuleInAgent()
	case "down", "j":
		// 現在のエージェント内で次のモジュールに移動
		s.moveToNextModuleInAgent()
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

// selectFirstModuleOfAgent は指定エージェントの最初のモジュールを選択します。
func (s *BattleScreen) selectFirstModuleOfAgent(agentIdx int) {
	for i, slot := range s.moduleSlots {
		if slot.AgentIndex == agentIdx {
			s.selectedSlot = i
			return
		}
	}
}

// moveToPrevModuleInAgent は現在のエージェント内で前のモジュールに移動します。
func (s *BattleScreen) moveToPrevModuleInAgent() {
	if len(s.moduleSlots) == 0 {
		return
	}

	currentAgentIdx := s.selectedAgentIdx
	agentModules := s.getModuleIndicesForAgent(currentAgentIdx)

	if len(agentModules) == 0 {
		return
	}

	// 現在のモジュールの位置を見つける
	currentPos := 0
	for i, idx := range agentModules {
		if idx == s.selectedSlot {
			currentPos = i
			break
		}
	}

	// 前のモジュールに移動（ループ）
	newPos := currentPos - 1
	if newPos < 0 {
		newPos = len(agentModules) - 1
	}
	s.selectedSlot = agentModules[newPos]
}

// moveToNextModuleInAgent は現在のエージェント内で次のモジュールに移動します。
func (s *BattleScreen) moveToNextModuleInAgent() {
	if len(s.moduleSlots) == 0 {
		return
	}

	currentAgentIdx := s.selectedAgentIdx
	agentModules := s.getModuleIndicesForAgent(currentAgentIdx)

	if len(agentModules) == 0 {
		return
	}

	// 現在のモジュールの位置を見つける
	currentPos := 0
	for i, idx := range agentModules {
		if idx == s.selectedSlot {
			currentPos = i
			break
		}
	}

	// 次のモジュールに移動（ループ）
	newPos := currentPos + 1
	if newPos >= len(agentModules) {
		newPos = 0
	}
	s.selectedSlot = agentModules[newPos]
}

// getModuleIndicesForAgent は指定エージェントのモジュールスロットのインデックスを返します。
func (s *BattleScreen) getModuleIndicesForAgent(agentIdx int) []int {
	var indices []int
	for i, slot := range s.moduleSlots {
		if slot.AgentIndex == agentIdx {
			indices = append(indices, i)
		}
	}
	return indices
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

	// UI改善: フローティングダメージ/回復とHPアニメーション
	if effectAmount > 0 {
		switch module.Category {
		case domain.PhysicalAttack, domain.MagicAttack:
			// 敵へのダメージ
			s.floatingDamageManager.AddDamage(effectAmount, "enemy")
			s.enemyHPBar.SetTarget(s.enemy.HP)
		case domain.Heal:
			// プレイヤーへの回復
			s.floatingDamageManager.AddHeal(effectAmount, "player")
			s.playerHPBar.SetTarget(s.player.HP)
		}
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
// UI-Improvement Requirement 3.1: 3エリアレイアウト（敵情報、エージェント、プレイヤー情報）
func (s *BattleScreen) View() string {
	var builder strings.Builder

	// 上部: 敵情報エリア
	enemyArea := s.renderEnemyArea()
	builder.WriteString(enemyArea)
	builder.WriteString("\n")

	// 中央: エージェントエリア / タイピングエリア / 結果表示
	if s.showingResult {
		// 結果表示（WIN/LOSE ASCIIアート）
		resultArea := s.renderResultArea()
		builder.WriteString(resultArea)
	} else if s.isTyping {
		// タイピングチャレンジ
		typingArea := s.renderTypingArea()
		builder.WriteString(typingArea)
	} else {
		// エージェントエリア（3体横並びカード）
		agentArea := s.renderAgentArea()
		builder.WriteString(agentArea)
	}
	builder.WriteString("\n")

	// 下部: プレイヤー情報エリア
	playerArea := s.renderPlayerArea()
	builder.WriteString(playerArea)
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
	if s.showingResult {
		hint = "Enter: 続ける"
	} else if s.isTyping {
		hint = "タイピング中...  Esc: キャンセル"
	} else {
		hint = "←/→: エージェント切替  ↑/↓: モジュール選択  Enter: 使用  Esc: 中断"
	}
	builder.WriteString(hintStyle.Render(hint))

	return builder.String()
}

// getActionDisplay は次回行動の表示情報を返します。
// Requirement 11.8: 行動タイプに応じたアイコン・色を返す
func (s *BattleScreen) getActionDisplay() (icon string, text string, color lipgloss.Color) {
	if s.battleState == nil {
		return "?", "不明", styles.ColorSubtle
	}

	action := s.battleState.NextAction

	switch action.ActionType {
	case battle.EnemyActionAttack:
		// 攻撃予告（赤色）
		if action.AttackType == "physical" {
			return "⚔", fmt.Sprintf("物理攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage
		}
		return "✦", fmt.Sprintf("魔法攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage

	case battle.EnemyActionSelfBuff:
		// 自己バフ予告（黄色）
		name := battle.GetEnemyBuffName(action.BuffType)
		return "▲", name, styles.ColorWarning

	case battle.EnemyActionDebuff:
		// プレイヤーデバフ予告（青色）
		name := battle.GetPlayerDebuffName(action.DebuffType)
		return "▼", name, styles.ColorInfo
	}

	return "?", "不明", styles.ColorSubtle
}

// renderTypingArea はタイピングエリアを描画します。
// Requirement 9.6: タイピングチャレンジテキスト表示と入力進捗
// Requirement 9.15: 制限時間のリアルタイム表示
// UI改善: 残り時間をプログレスバー形式で表示
func (s *BattleScreen) renderTypingArea() string {
	var builder strings.Builder

	// 制限時間計算
	elapsed := time.Since(s.typingStartTime)
	remaining := s.typingTimeLimit - elapsed
	if remaining < 0 {
		remaining = 0
	}

	// UI改善: 残り時間プログレスバー（バー内に秒数表示）
	timeRatio := remaining.Seconds() / s.typingTimeLimit.Seconds()
	builder.WriteString(s.renderTimeProgressBar(remaining.Seconds(), timeRatio))
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

// renderTimeProgressBar は残り時間をプログレスバー形式で描画します。
// UI改善: バー内に秒数を表示、時間に応じて色を変化
func (s *BattleScreen) renderTimeProgressBar(remainingSeconds float64, ratio float64) string {
	barWidth := 30
	timeText := fmt.Sprintf("%.1fs", remainingSeconds)

	// 色を時間割合に応じて決定
	var barColor lipgloss.Color
	if ratio > 0.5 {
		barColor = styles.ColorHPHigh // 緑
	} else if ratio > 0.25 {
		barColor = styles.ColorHPMedium // 黄
	} else {
		barColor = styles.ColorHPLow // 赤
	}

	// 塗りつぶし部分の計算
	filledWidth := int(float64(barWidth) * ratio)
	if filledWidth < 0 {
		filledWidth = 0
	}
	if filledWidth > barWidth {
		filledWidth = barWidth
	}

	// プログレスバー文字列を構築
	filled := strings.Repeat("█", filledWidth)
	empty := strings.Repeat("░", barWidth-filledWidth)

	// バー全体を結合
	bar := filled + empty

	// 中央に秒数を挿入
	// バーの中央位置を計算
	textStart := (barWidth - len(timeText)) / 2
	if textStart < 0 {
		textStart = 0
	}

	// バーにテキストを重ねる
	barRunes := []rune(bar)
	for i, c := range timeText {
		pos := textStart + i
		if pos < len(barRunes) {
			barRunes[pos] = c
		}
	}
	barWithText := string(barRunes)

	// スタイル適用
	barStyle := lipgloss.NewStyle().
		Foreground(barColor).
		Bold(true)

	return barStyle.Render("[" + barWithText + "]")
}

// renderEnemyActionBar は敵の次回行動までのプログレスバーを描画します。
func (s *BattleScreen) renderEnemyActionBar(remainingSeconds float64, ratio float64) string {
	barWidth := 40
	timeText := fmt.Sprintf("%.1fs", remainingSeconds)

	// 塗りつぶし部分の計算
	filledWidth := int(float64(barWidth) * ratio)
	if filledWidth < 0 {
		filledWidth = 0
	}
	if filledWidth > barWidth {
		filledWidth = barWidth
	}

	// プログレスバー文字列を構築
	filled := strings.Repeat("█", filledWidth)
	empty := strings.Repeat("░", barWidth-filledWidth)
	bar := filled + empty
	barRunes := []rune(bar)

	// テキストの位置を計算
	textStart := (barWidth - len(timeText)) / 2
	if textStart < 0 {
		textStart = 0
	}
	textEnd := textStart + len(timeText)
	if textEnd > barWidth {
		textEnd = barWidth
	}

	// スタイル定義
	barStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)
	textStyle := lipgloss.NewStyle().Foreground(styles.ColorSelectedFg).Bold(true)
	bracketStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)

	// バーを3つの部分に分けてレンダリング（前半バー + テキスト + 後半バー）
	beforeText := string(barRunes[:textStart])
	afterText := string(barRunes[textEnd:])

	return bracketStyle.Render("[") +
		barStyle.Render(beforeText) +
		textStyle.Render(timeText) +
		barStyle.Render(afterText) +
		bracketStyle.Render("]")
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

// ==================== UI改善: 3エリアレイアウト ====================

// renderEnemyArea は敵情報エリアをレンダリングします。
// UI-Improvement Requirement 3.1: 敵情報エリア
func (s *BattleScreen) renderEnemyArea() string {
	var builder strings.Builder

	// 敵名とフェーズ
	nameStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorDamage)
	builder.WriteString(nameStyle.Render(s.enemy.Name))
	builder.WriteString(fmt.Sprintf(" Lv.%d", s.enemy.Level))

	if s.enemy.IsEnhanced() {
		phaseStyle := lipgloss.NewStyle().Foreground(styles.ColorDamage).Bold(true)
		builder.WriteString("  ")
		builder.WriteString(phaseStyle.Render("[強化フェーズ]"))
	}
	builder.WriteString("\n")

	// HP表示（UI改善: アニメーション付きHPバー + フローティングダメージ）
	hpBar := s.enemyHPBar.Render(s.styles, 50)
	displayHP := s.enemyHPBar.GetCurrentHP()
	hpValue := fmt.Sprintf(" %d/%d", displayHP, s.enemy.MaxHP)
	builder.WriteString("HP: ")
	builder.WriteString(hpBar)
	builder.WriteString(hpValue)

	// フローティングダメージ表示
	floatingTexts := s.floatingDamageManager.GetTextsForArea("enemy")
	if len(floatingTexts) > 0 {
		// 最新のフローティングテキストを表示
		text := floatingTexts[0]
		var floatStyle lipgloss.Style
		if text.IsHealing {
			floatStyle = lipgloss.NewStyle().Foreground(styles.ColorHPHigh).Bold(true)
		} else {
			floatStyle = lipgloss.NewStyle().Foreground(styles.ColorDamage).Bold(true)
		}
		builder.WriteString("  ")
		builder.WriteString(floatStyle.Render(text.Text))
	}
	builder.WriteString("\n")

	// 敵のバフ表示
	buffs := s.enemy.EffectTable.GetRowsBySource(domain.SourceBuff)
	if len(buffs) > 0 {
		for _, buff := range buffs {
			if buff.Duration != nil {
				builder.WriteString(s.styles.RenderBuff(buff.Name, *buff.Duration))
				builder.WriteString(" ")
			}
		}
		builder.WriteString("\n")
	}

	// 行動予告
	icon, actionText, actionColor := s.getActionDisplay()
	actionStyle := lipgloss.NewStyle().Foreground(actionColor).Bold(true)
	builder.WriteString(actionStyle.Render(fmt.Sprintf("%s %s", icon, actionText)))
	builder.WriteString("\n")

	// 次の敵攻撃までの時間（プログレスバー）
	remaining := time.Until(s.nextEnemyAttack)
	if remaining < 0 {
		remaining = 0
	}
	ratio := remaining.Seconds() / s.enemy.AttackInterval.Seconds()
	if ratio > 1 {
		ratio = 1
	}
	builder.WriteString(s.renderEnemyActionBar(remaining.Seconds(), ratio))

	// エリアボックス
	areaStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorDamage).
		Padding(1, 2).
		Width(s.width - 4)

	title := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Render("─────────────────────────────────  ENEMY  ─────────────────────────────────")

	return lipgloss.JoinVertical(lipgloss.Center,
		title,
		areaStyle.Render(builder.String()),
	)
}

// renderAgentArea はエージェントエリア（3体横並びカード）をレンダリングします。
// UI-Improvement Requirement 3.2: エージェント横並びカード表示
func (s *BattleScreen) renderAgentArea() string {
	// 画面幅に基づいてカード幅を計算（余白を最小限に）
	// 外枠: border(2) + padding(4) = 6
	// カード間スペース: 1 × 2 = 2
	// カードボーダー: 2 × 3 = 6
	// 利用可能幅 = s.width - 4(外枠Width調整) - 6(外枠) - 2(カード間) - 6(カードボーダー) = s.width - 18
	cardWidth := (s.width - 18) / 3
	if cardWidth < 30 {
		cardWidth = 30 // 最小幅を確保
	}
	var cards []string

	for i := 0; i < 3; i++ {
		var cardContent strings.Builder
		isSelected := i == s.selectedAgentIdx

		if i < len(s.equippedAgents) {
			agent := s.equippedAgents[i]

			// エージェント名とレベル
			nameStyle := lipgloss.NewStyle().Bold(true)
			if isSelected {
				nameStyle = nameStyle.
					Foreground(styles.ColorSelectedFg).
					Background(styles.ColorSelectedBg)
			}
			cardContent.WriteString(nameStyle.Render(fmt.Sprintf("%s Lv.%d", agent.GetCoreTypeName(), agent.Level)))
			cardContent.WriteString("\n\n")

			// エージェントのモジュール一覧
			agentModules := s.getModulesForAgent(i)
			for j, slot := range agentModules {
				isModuleSelected := isSelected && j == s.getSelectedModuleInAgent(i)

				// モジュールアイコン
				icon := s.getModuleIcon(slot.Module.Category)

				// モジュール名とクールダウン
				var moduleStyle lipgloss.Style
				if isModuleSelected {
					moduleStyle = lipgloss.NewStyle().
						Bold(true).
						Foreground(styles.ColorSelectedFg).
						Background(styles.ColorSelectedBg)
				} else if !slot.IsReady() {
					moduleStyle = lipgloss.NewStyle().Foreground(styles.ColorSubtle)
				} else {
					moduleStyle = lipgloss.NewStyle().Foreground(styles.ColorSecondary)
				}

				prefix := "  "
				if isModuleSelected {
					prefix = "> "
				}

				if !slot.IsReady() {
					cdBar := s.styles.RenderCooldownBarWithTime(slot.CooldownRemaining, slot.CooldownTotal, 8)
					cardContent.WriteString(moduleStyle.Render(fmt.Sprintf("%s%s %s ", prefix, icon, slot.Module.Name)))
					cardContent.WriteString(cdBar)
				} else {
					cardContent.WriteString(moduleStyle.Render(fmt.Sprintf("%s%s %s", prefix, icon, slot.Module.Name)))
					cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorHPHigh).Render(" [READY]"))
				}
				cardContent.WriteString("\n")
			}
		} else {
			// 空スロット
			cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("(空)"))
		}

		// カードボックス
		borderColor := styles.ColorSubtle
		if isSelected {
			borderColor = styles.ColorPrimary
		}

		cardStyle := lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(borderColor).
			Padding(0, 1).
			Width(cardWidth).
			Height(10)

		cards = append(cards, cardStyle.Render(cardContent.String()))
	}

	// カードを横に並べる（スペースを最小限に）
	agentCards := lipgloss.JoinHorizontal(lipgloss.Top, cards[0], " ", cards[1], " ", cards[2])

	// エリアボックス
	areaStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(1, 2).
		Width(s.width - 4)

	title := lipgloss.NewStyle().
		Foreground(styles.ColorSubtle).
		Render("────────────────────────────────  PLAYER  ────────────────────────────────")

	return lipgloss.JoinVertical(lipgloss.Center,
		title,
		areaStyle.Render(agentCards),
	)
}

// renderResultArea は結果表示（WIN/LOSE ASCIIアート）をレンダリングします。
// UI-Improvement Requirement 3.9: WIN/LOSE ASCIIアート表示
func (s *BattleScreen) renderResultArea() string {
	var resultArt string
	if s.victory {
		resultArt = s.winLoseRenderer.RenderWin()
	} else {
		resultArt = s.winLoseRenderer.RenderLose()
	}

	// 中央揃え
	centeredArt := lipgloss.NewStyle().
		Width(s.width - 8).
		Align(lipgloss.Center).
		Render(resultArt)

	// エリアボックス
	areaStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorPrimary).
		Padding(2, 2).
		Width(s.width - 4)

	return areaStyle.Render(centeredArt)
}

// renderPlayerArea はプレイヤー情報エリアをレンダリングします。
// UI-Improvement Requirement 3.1: プレイヤー情報エリア
func (s *BattleScreen) renderPlayerArea() string {
	var builder strings.Builder

	// プレイヤー名
	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(styles.ColorHPHigh)
	builder.WriteString(titleStyle.Render("プレイヤー"))
	builder.WriteString("\n")

	// HP表示（UI改善: アニメーション付きHPバー + フローティングダメージ/回復）
	hpBar := s.playerHPBar.Render(s.styles, 50)
	displayHP := s.playerHPBar.GetCurrentHP()
	hpValue := fmt.Sprintf(" %d/%d", displayHP, s.player.MaxHP)
	builder.WriteString("HP: ")
	builder.WriteString(hpBar)
	builder.WriteString(hpValue)

	// フローティングダメージ/回復表示
	floatingTexts := s.floatingDamageManager.GetTextsForArea("player")
	if len(floatingTexts) > 0 {
		// 最新のフローティングテキストを表示
		text := floatingTexts[0]
		var floatStyle lipgloss.Style
		if text.IsHealing {
			floatStyle = lipgloss.NewStyle().Foreground(styles.ColorHPHigh).Bold(true)
		} else {
			floatStyle = lipgloss.NewStyle().Foreground(styles.ColorDamage).Bold(true)
		}
		builder.WriteString("  ")
		builder.WriteString(floatStyle.Render(text.Text))
	}
	builder.WriteString("\n")

	// バフ表示
	buffs := s.player.EffectTable.GetRowsBySource(domain.SourceBuff)
	if len(buffs) > 0 {
		builder.WriteString("バフ: ")
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
		builder.WriteString("デバフ: ")
		for _, debuff := range debuffs {
			if debuff.Duration != nil {
				builder.WriteString(s.styles.RenderDebuff(debuff.Name, *debuff.Duration))
				builder.WriteString(" ")
			}
		}
	}

	// エリアボックス
	areaStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorHPHigh).
		Padding(1, 2).
		Width(s.width - 4)

	return areaStyle.Render(builder.String())
}

// getModulesForAgent は指定エージェントのモジュールスロットを取得します。
func (s *BattleScreen) getModulesForAgent(agentIdx int) []ModuleSlot {
	var modules []ModuleSlot
	for _, slot := range s.moduleSlots {
		if slot.AgentIndex == agentIdx {
			modules = append(modules, slot)
		}
	}
	return modules
}

// getSelectedModuleInAgent は選択中エージェント内でのモジュール選択位置を返します。
func (s *BattleScreen) getSelectedModuleInAgent(agentIdx int) int {
	if s.selectedAgentIdx != agentIdx {
		return -1
	}

	// 現在選択されているスロットがこのエージェントのものか確認
	if s.selectedSlot >= 0 && s.selectedSlot < len(s.moduleSlots) {
		slot := s.moduleSlots[s.selectedSlot]
		if slot.AgentIndex == agentIdx {
			// このエージェント内での相対位置を計算
			moduleIdx := 0
			for i := 0; i < s.selectedSlot; i++ {
				if s.moduleSlots[i].AgentIndex == agentIdx {
					moduleIdx++
				}
			}
			return moduleIdx
		}
	}
	return 0
}

// getModuleIcon はモジュールカテゴリのアイコンを返します。
// UI-Improvement Requirement 3.6: モジュールカテゴリアイコン
func (s *BattleScreen) getModuleIcon(category domain.ModuleCategory) string {
	switch category {
	case domain.PhysicalAttack:
		return "⚔"
	case domain.MagicAttack:
		return "✦"
	case domain.Heal:
		return "♥"
	case domain.Buff:
		return "▲"
	case domain.Debuff:
		return "▼"
	default:
		return "•"
	}
}
