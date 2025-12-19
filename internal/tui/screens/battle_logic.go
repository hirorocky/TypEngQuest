// Package screens はTUIゲームの画面を提供します。
// battle_logic.go はバトル画面のゲームロジックを担当します。
package screens

import (
	"fmt"
	"time"

	"hirorocky/type-battle/internal/config"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"
	"hirorocky/type-battle/internal/usecase/combat"
	"hirorocky/type-battle/internal/usecase/combat/chain"
	"hirorocky/type-battle/internal/usecase/typing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ==================== ゲームロジック: 状態判定 ====================

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

// ==================== ゲームロジック: 敵攻撃処理 ====================

// processEnemyAttack は敵の行動を処理します。

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
	case combat.EnemyActionAttack:
		s.message = fmt.Sprintf("%sの攻撃！ %s", s.enemy.Name, msg)
		// UI改善: フローティングダメージとHPアニメーション
		if damage > 0 {
			s.floatingDamageManager.AddDamage(damage, "player")
			s.playerHPBar.SetTarget(s.player.HP)
		}
	case combat.EnemyActionSelfBuff:
		s.message = fmt.Sprintf("%sが%s！", s.enemy.Name, msg)
	case combat.EnemyActionDebuff:
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

// ==================== ゲームロジック: クールダウン ====================

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

// ==================== ゲームロジック: リキャスト管理 ====================

// UpdateRecasts はリキャスト時間を更新し、終了したエージェントのチェイン効果を破棄します。
func (s *BattleScreen) UpdateRecasts(deltaSeconds float64) {
	if s.recastManager == nil {
		return
	}

	// リキャスト時間を更新（deltaSecondsをtime.Durationに変換）
	delta := time.Duration(deltaSeconds * float64(time.Second))
	completedAgents := s.recastManager.UpdateRecast(delta)

	// リキャスト完了したエージェントのチェイン効果を破棄
	if s.chainEffectManager != nil {
		for _, agentIndex := range completedAgents {
			s.chainEffectManager.ExpireEffectsForAgent(agentIndex)
		}
	}
}

// isModuleUsable は指定スロットのモジュールが使用可能かを判定します。
// モジュールのクールダウンとエージェントのリキャスト状態を両方チェックします。
func (s *BattleScreen) isModuleUsable(slotIndex int) bool {
	if slotIndex < 0 || slotIndex >= len(s.moduleSlots) {
		return false
	}

	slot := s.moduleSlots[slotIndex]

	// モジュールのクールダウンチェック
	if !slot.IsReady() {
		return false
	}

	// エージェントのリキャストチェック
	if s.recastManager != nil && !s.recastManager.IsAgentReady(slot.AgentIndex) {
		return false
	}

	return true
}

// startAgentRecast はエージェントのリキャストを開始し、チェイン効果を登録します。
func (s *BattleScreen) startAgentRecast(agentIndex int, module *domain.ModuleModel) {
	if s.recastManager == nil {
		return
	}

	// エージェントのリキャストを開始
	s.recastManager.StartRecast(agentIndex, config.DefaultRecastDuration)

	// チェイン効果を登録
	if s.chainEffectManager != nil && module.ChainEffect != nil {
		s.chainEffectManager.RegisterChainEffect(agentIndex, module.ChainEffect, module.TypeID)
	}
}

// triggerChainEffects はモジュール使用時に他エージェントのチェイン効果を発動します。
func (s *BattleScreen) triggerChainEffects(usingAgentIndex int, moduleCategory domain.ModuleCategory) {
	if s.chainEffectManager == nil {
		return
	}

	// チェイン効果の発動をチェック
	triggered := s.chainEffectManager.CheckAndTrigger(usingAgentIndex, moduleCategory)

	// 発動した効果を適用
	for _, effect := range triggered {
		s.applyTriggeredChainEffect(&effect)
	}
}

// applyTriggeredChainEffect は発動したチェイン効果を適用します。
func (s *BattleScreen) applyTriggeredChainEffect(effect *chain.TriggeredChainEffect) {
	// 効果タイプに応じた処理
	switch effect.Effect.Type {
	case domain.ChainEffectDamageBonus:
		// 追加ダメージ（敵へのダメージ）
		bonusDamage := int(effect.EffectValue)
		if s.enemy != nil {
			s.enemy.HP -= bonusDamage
			if s.enemy.HP < 0 {
				s.enemy.HP = 0
			}
			s.floatingDamageManager.AddDamage(bonusDamage, "enemy")
			s.enemyHPBar.SetTarget(s.enemy.HP)
			s.message = fmt.Sprintf("チェイン発動！ %s (+%dダメージ)", effect.Message, bonusDamage)
		}

	case domain.ChainEffectHealBonus:
		// 追加回復
		bonusHeal := int(effect.EffectValue)
		if s.player != nil {
			s.player.HP += bonusHeal
			if s.player.HP > s.player.MaxHP {
				s.player.HP = s.player.MaxHP
			}
			s.floatingDamageManager.AddHeal(bonusHeal, "player")
			s.playerHPBar.SetTarget(s.player.HP)
			s.message = fmt.Sprintf("チェイン発動！ %s (+%d回復)", effect.Message, bonusHeal)
		}

	case domain.ChainEffectBuffExtend, domain.ChainEffectBuffDuration:
		// バフ延長
		if s.player != nil && s.player.EffectTable != nil {
			s.player.EffectTable.ExtendBuffDurations(effect.EffectValue)
			s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
		}

	case domain.ChainEffectDebuffExtend, domain.ChainEffectDebuffDuration:
		// デバフ延長
		if s.enemy != nil && s.enemy.EffectTable != nil {
			s.enemy.EffectTable.ExtendDebuffDurations(effect.EffectValue)
			s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
		}

	default:
		// その他の効果は現時点では未実装
		s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
	}
}

// ==================== ゲームロジック: タイピング ====================

// StartTypingChallenge はタイピングチャレンジを開始します。

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
	agentIndex := slot.AgentIndex

	// 他エージェントの待機中チェイン効果を発動（モジュール効果適用前）
	s.triggerChainEffects(agentIndex, module.Category())

	var effectAmount int
	if s.battleEngine != nil && s.battleState != nil {
		effectAmount = s.battleEngine.ApplyModuleEffect(s.battleState, agent, module, typingResult)
	}

	// UI改善: フローティングダメージ/回復とHPアニメーション
	if effectAmount > 0 {
		switch module.Category() {
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

	// エージェントのリキャストを開始し、チェイン効果を登録
	s.startAgentRecast(agentIndex, module)

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
	switch module.Category() {
	case domain.PhysicalAttack, domain.MagicAttack:
		action = fmt.Sprintf("%dダメージを与えた！", effectAmount)
	case domain.Heal:
		action = fmt.Sprintf("%d回復した！", effectAmount)
	case domain.Buff:
		action = fmt.Sprintf("%sを付与した！", module.Name())
	case domain.Debuff:
		action = fmt.Sprintf("敵に%sを付与した！", module.Name())
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

// ==================== ゲームロジック: 行動表示 ====================

// getActionDisplay は次回行動の表示情報を返します。

func (s *BattleScreen) getActionDisplay() (icon string, text string, color lipgloss.Color) {
	if s.battleState == nil {
		return "?", "不明", styles.ColorSubtle
	}

	action := s.battleState.NextAction

	switch action.ActionType {
	case combat.EnemyActionAttack:
		// 攻撃予告（赤色）
		if action.AttackType == "physical" {
			return "⚔", fmt.Sprintf("物理攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage
		}
		return "✦", fmt.Sprintf("魔法攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage

	case combat.EnemyActionSelfBuff:
		// 自己バフ予告（黄色）
		name := combat.GetEnemyBuffName(action.BuffType)
		return "▲", name, styles.ColorWarning

	case combat.EnemyActionDebuff:
		// プレイヤーデバフ予告（青色）
		name := combat.GetPlayerDebuffName(action.DebuffType)
		return "▼", name, styles.ColorInfo
	}

	return "?", "不明", styles.ColorSubtle
}

// ==================== ゲームロジック: モジュール選択ナビゲーション ====================

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
