// Package screens はTUIゲームの画面を提供します。
// battle_logic.go はバトル画面のゲームロジックを担当します。
package screens

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"
	"hirorocky/type-battle/internal/usecase/combat"
	"hirorocky/type-battle/internal/usecase/combat/chain"
	"hirorocky/type-battle/internal/usecase/typing"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// randFloat は0.0〜1.0の乱数を返します。
func randFloat() float64 {
	return rand.Float64()
}

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
// パッシブスキル（ps_last_stand, ps_counter_charge, ps_adaptive_shield, ps_quick_recovery）を統合。
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

	action := s.battleState.NextAction
	var damage int
	var msg string

	switch action.ActionType {
	case combat.EnemyActionAttack:
		// パッシブスキル対応版の攻撃処理を使用
		// ps_last_stand, ps_counter_charge, ps_adaptive_shield が評価される
		attackType := action.AttackType
		if attackType == "" {
			attackType = s.enemy.Type.AttackType
		}
		damage = s.battleEngine.ProcessEnemyAttackWithPassiveAndPattern(s.battleState, attackType)
		msg = fmt.Sprintf("%dダメージを受けた！", damage)

		s.message = fmt.Sprintf("%sの攻撃！ %s", s.enemy.Name, msg)
		if damage > 0 {
			s.floatingDamageManager.AddDamage(damage, "player")
			s.playerHPBar.SetTarget(s.player.HP)
		}

		// ps_quick_recovery: 被ダメージ時にリキャスト短縮
		s.evaluateQuickRecovery()

	case combat.EnemyActionSelfBuff:
		s.battleEngine.ApplyEnemySelfBuff(s.battleState, action.BuffType)
		msg = combat.GetEnemyBuffName(action.BuffType)
		s.message = fmt.Sprintf("%sが%s！", s.enemy.Name, msg)

	case combat.EnemyActionDebuff:
		s.battleEngine.ApplyPlayerDebuff(s.battleState, action.DebuffType)
		msg = combat.GetPlayerDebuffName(action.DebuffType)
		s.message = fmt.Sprintf("%sが%s", s.enemy.Name, msg)

	default:
		s.message = "敵の行動"
	}

	// フェーズ変化をチェック
	if s.battleEngine.CheckPhaseTransition(s.battleState) {
		// 敵のパッシブを強化パッシブに切り替え
		s.battleEngine.SwitchEnemyPassive(s.battleState)
		s.message += " [敵が強化フェーズに突入！]"
	}

	// 次回行動を決定
	s.battleState.NextAction = s.battleEngine.DetermineNextAction(s.battleState)

	// 次の行動時間を設定
	s.nextEnemyAttack = time.Now().Add(s.enemy.AttackInterval)
}

// evaluateQuickRecovery はps_quick_recoveryの発動を評価し、リキャストを短縮します。
func (s *BattleScreen) evaluateQuickRecovery() {
	if s.battleEngine == nil || s.battleState == nil || s.recastManager == nil {
		return
	}

	for _, agent := range s.battleState.EquippedAgents {
		reduction := s.battleEngine.EvaluateQuickRecovery(s.battleState, agent)
		if reduction > 0 {
			s.recastManager.ReduceAllRecasts(time.Duration(reduction) * time.Second)
			s.message += " [クイックリカバリー発動！]"
		}
	}
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
// EffectTableからCooldownReduceを取得して初期値を短縮します。
func (s *BattleScreen) StartCooldown(slotIndex int, duration float64) {
	if slotIndex >= 0 && slotIndex < len(s.moduleSlots) {
		reducedDuration := duration

		// CooldownReduceを取得して初期値を短縮
		if s.player != nil && s.player.EffectTable != nil {
			ctx := domain.NewEffectContext(s.player.HP, s.player.MaxHP, 0, 0)
			if s.enemy != nil {
				ctx = domain.NewEffectContext(s.player.HP, s.player.MaxHP, s.enemy.HP, s.enemy.MaxHP)
			}
			effects := s.player.EffectTable.Aggregate(ctx)

			// CooldownReduce を適用（正=短縮、負=延長）
			// 30%短縮の場合、CooldownReduce=0.3 → duration * (1 - 0.3) = 70%
			reducedDuration = duration * (1.0 - effects.CooldownReduce)

			// 最低10%は残す（極端な短縮対策）
			minDuration := duration * 0.1
			if reducedDuration < minDuration {
				reducedDuration = minDuration
			}
		}

		s.moduleSlots[slotIndex].CooldownRemaining = reducedDuration
		s.moduleSlots[slotIndex].CooldownTotal = duration // 表示用に元の値を保持
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

	// モジュールのクールダウン秒数を使用してリキャストを開始
	cooldownDuration := time.Duration(module.CooldownSeconds() * float64(time.Second))
	s.recastManager.StartRecast(agentIndex, cooldownDuration)

	// チェイン効果を登録
	if s.chainEffectManager != nil && module.ChainEffect != nil {
		s.chainEffectManager.RegisterChainEffect(agentIndex, module.ChainEffect, module.TypeID)
	}
}

// triggerChainEffects はモジュール使用時に他エージェントのチェイン効果を発動します。
func (s *BattleScreen) triggerChainEffects(usingAgentIndex int, effectFlags chain.ModuleEffectFlags) {
	if s.chainEffectManager == nil {
		return
	}

	// チェイン効果の発動をチェック
	triggered := s.chainEffectManager.CheckAndTrigger(usingAgentIndex, effectFlags)

	// 発動した効果を適用
	for _, effect := range triggered {
		s.applyTriggeredChainEffect(&effect)
	}
}

// chainEffectDuration はチェイン効果の持続時間（秒）です。
const chainEffectDuration = 10.0

// applyTriggeredChainEffect は発動したチェイン効果を適用します。
func (s *BattleScreen) applyTriggeredChainEffect(effect *chain.TriggeredChainEffect) {
	// 効果タイプに応じた処理
	switch effect.Effect.Type {
	case domain.ChainEffectDamageBonus:
		// 追加ダメージ（敵へのダメージ）- 即時適用
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
		// 追加回復 - 即時適用
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
		// バフ延長 - 即時適用
		if s.player != nil && s.player.EffectTable != nil {
			s.player.EffectTable.ExtendBuffDurations(effect.EffectValue)
			s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
		}

	case domain.ChainEffectDebuffExtend, domain.ChainEffectDebuffDuration:
		// デバフ延長 - 即時適用
		if s.enemy != nil && s.enemy.EffectTable != nil {
			s.enemy.EffectTable.ExtendDebuffDurations(effect.EffectValue)
			s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
		}

	default:
		// 持続効果は EffectTable に登録
		s.registerChainEffectToTable(effect)
		s.message = fmt.Sprintf("チェイン発動！ %s", effect.Message)
	}
}

// registerChainEffectToTable はチェイン効果を EffectTable に登録します。
func (s *BattleScreen) registerChainEffectToTable(effect *chain.TriggeredChainEffect) {
	if s.player == nil || s.player.EffectTable == nil {
		return
	}

	// チェイン効果の値を EffectColumn にマッピング
	values := make(map[domain.EffectColumn]float64)
	flags := make(map[domain.EffectColumn]bool)

	switch effect.Effect.Type {
	// 攻撃強化カテゴリ
	case domain.ChainEffectDamageAmp:
		values[domain.ColDamageMultiplier] = 1.0 + effect.EffectValue/100.0
	case domain.ChainEffectArmorPierce:
		flags[domain.ColArmorPierce] = true
	case domain.ChainEffectLifeSteal:
		values[domain.ColLifeSteal] = effect.EffectValue / 100.0

	// 防御強化カテゴリ
	case domain.ChainEffectDamageCut:
		values[domain.ColDamageCut] = effect.EffectValue / 100.0
	case domain.ChainEffectEvasion:
		values[domain.ColEvasion] = effect.EffectValue / 100.0
	case domain.ChainEffectReflect:
		values[domain.ColReflect] = effect.EffectValue / 100.0
	case domain.ChainEffectRegen:
		values[domain.ColRegen] = effect.EffectValue

	// 回復強化カテゴリ
	case domain.ChainEffectHealAmp:
		values[domain.ColHealMultiplier] = 1.0 + effect.EffectValue/100.0
	case domain.ChainEffectOverheal:
		flags[domain.ColOverheal] = true

	// タイピングカテゴリ
	case domain.ChainEffectTimeExtend:
		values[domain.ColTimeExtend] = effect.EffectValue
	case domain.ChainEffectAutoCorrect:
		values[domain.ColAutoCorrect] = effect.EffectValue

	// リキャストカテゴリ
	case domain.ChainEffectCooldownReduce:
		values[domain.ColCooldownReduce] = effect.EffectValue / 100.0

	// 特殊カテゴリ
	case domain.ChainEffectDoubleCast:
		values[domain.ColDoubleCast] = effect.EffectValue / 100.0
	}

	// EffectEntry を作成して登録
	duration := chainEffectDuration
	entry := domain.EffectEntry{
		SourceType:  domain.SourceChain,
		SourceID:    string(effect.Effect.Type),
		SourceIndex: effect.SourceAgentIndex,
		Name:        effect.Effect.Description,
		Duration:    &duration,
		Values:      values,
		Flags:       flags,
	}

	s.player.EffectTable.AddEntry(entry)
}

// ==================== ゲームロジック: タイピング ====================

// StartTypingChallenge はタイピングチャレンジを開始します。
// EffectTableからTimeExtendとAutoCorrectを取得して適用します。
func (s *BattleScreen) StartTypingChallenge(text string, timeLimit time.Duration) {
	s.isTyping = true
	s.typingText = text
	s.typingIndex = 0
	s.typingMistakes = make([]int, 0)
	s.typingStartTime = time.Now()
	// パッシブスキル使用フラグをリセット（チャレンジ毎）
	s.typoRecoveryUsed = false
	s.secondChanceUsed = false

	// EffectTableからTimeExtendとAutoCorrectを取得
	finalTimeLimit := timeLimit
	autoCorrect := 0
	if s.player != nil && s.player.EffectTable != nil {
		ctx := domain.NewEffectContext(s.player.HP, s.player.MaxHP, 0, 0)
		if s.enemy != nil {
			ctx = domain.NewEffectContext(s.player.HP, s.player.MaxHP, s.enemy.HP, s.enemy.MaxHP)
		}
		effects := s.player.EffectTable.Aggregate(ctx)

		// TimeExtend を適用（正負どちらも可能）
		if effects.TimeExtend != 0 {
			extension := time.Duration(effects.TimeExtend * float64(time.Second))
			finalTimeLimit = timeLimit + extension
			// 最低1秒を保証
			if finalTimeLimit < time.Second {
				finalTimeLimit = time.Second
			}
		}

		// AutoCorrect を取得
		autoCorrect = effects.AutoCorrect
	}

	s.typingTimeLimit = finalTimeLimit
	s.autoCorrectRemaining = autoCorrect

	// Evaluator用のチャレンジ状態を初期化
	challenge := &typing.Challenge{
		Text:      text,
		TimeLimit: finalTimeLimit,
	}
	s.typingState = s.evaluator.StartChallenge(challenge)
}

// ProcessTypingInput はタイピング入力を処理します。
// AutoCorrectが有効な場合、ミスを無視します。
// ps_typo_recoveryが発動した場合、時間を延長します。
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
		// AutoCorrectが残っている場合はミスを無視
		if s.autoCorrectRemaining > 0 {
			s.autoCorrectRemaining--
			// ミスを記録しない、インデックスも進めない
			return
		}
		s.typingMistakes = append(s.typingMistakes, s.typingIndex)

		// ps_typo_recovery: ミス時に時間延長（1回/チャレンジ）
		if !s.typoRecoveryUsed && s.battleEngine != nil && s.battleState != nil {
			slot := s.moduleSlots[s.selectedModuleIdx]
			agent := slot.Agent
			timeExtension := s.battleEngine.EvaluateTypoRecovery(s.battleState, agent)
			if timeExtension > 0 {
				s.typoRecoveryUsed = true
				s.typingTimeLimit += time.Duration(timeExtension * float64(time.Second))
				s.message = fmt.Sprintf("[タイポリカバリー発動！ +%.0f秒]", timeExtension)
			}
		}
	}
}

// CompleteTyping はタイピングを完了します。
// パッシブスキル（ps_combo_master, ps_echo_skill, ps_miracle_heal）を統合。
// DoubleCastが有効な場合、確率判定を行い成功すれば効果を2回適用します。
func (s *BattleScreen) CompleteTyping() {
	s.isTyping = false
	s.typoRecoveryUsed = false // チャレンジ完了時にリセット

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

	// コンボカウントの更新（ps_combo_master用）
	if typingResult.Accuracy >= 1.0 {
		s.comboCount++
	} else {
		s.comboCount = 0
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

	// モジュールの効果フラグを取得
	effectFlags := getModuleEffectFlags(module)

	// 他エージェントの待機中チェイン効果を発動（モジュール効果適用前）
	s.triggerChainEffects(agentIndex, effectFlags)

	// DoubleCast判定
	doubleCastTriggered := false
	if s.player != nil && s.player.EffectTable != nil {
		ctx := domain.NewEffectContext(s.player.HP, s.player.MaxHP, 0, 0)
		if s.enemy != nil {
			ctx = domain.NewEffectContext(s.player.HP, s.player.MaxHP, s.enemy.HP, s.enemy.MaxHP)
		}
		effects := s.player.EffectTable.Aggregate(ctx)
		if effects.DoubleCast > 0 {
			// 確率判定（乱数を使用）
			if randFloat() < effects.DoubleCast {
				doubleCastTriggered = true
			}
		}
	}

	// ps_echo_skill判定（スキル2回発動）
	echoSkillRepeat := 1
	echoSkillTriggered := false
	if s.battleEngine != nil && s.battleState != nil {
		echoSkillRepeat = s.battleEngine.EvaluateEchoSkill(s.battleState, agent)
		if echoSkillRepeat > 1 {
			echoSkillTriggered = true
		}
	}

	// ps_miracle_heal判定（回復スキル時HP全回復）
	miracleHealTriggered := false
	if s.battleEngine != nil && s.battleState != nil {
		if s.battleEngine.EvaluateMiracleHeal(s.battleState, agent, module) {
			miracleHealTriggered = true
		}
	}

	var effectAmount int
	if s.battleEngine != nil && s.battleState != nil {
		// コンボ対応版のモジュール効果適用（ps_combo_master）
		effectAmount = s.battleEngine.ApplyModuleEffectWithCombo(s.battleState, agent, module, typingResult, s.comboCount)

		// ps_echo_skill発動時は追加で効果を適用
		for i := 1; i < echoSkillRepeat; i++ {
			additionalEffect := s.battleEngine.ApplyModuleEffectWithCombo(s.battleState, agent, module, typingResult, s.comboCount)
			effectAmount += additionalEffect
		}

		// DoubleCast発動時は2回目も適用
		if doubleCastTriggered {
			secondEffect := s.battleEngine.ApplyModuleEffectWithCombo(s.battleState, agent, module, typingResult, s.comboCount)
			effectAmount += secondEffect
		}

		// ps_miracle_heal発動時はHP全回復
		if miracleHealTriggered {
			s.player.HP = s.player.MaxHP
			s.playerHPBar.SetTarget(s.player.HP)
		}
	}

	// UI改善: フローティングダメージ/回復とHPアニメーション
	if effectAmount > 0 {
		if effectFlags.HasDamage {
			// 敵へのダメージ
			s.floatingDamageManager.AddDamage(effectAmount, "enemy")
			s.enemyHPBar.SetTarget(s.enemy.HP)
		} else if effectFlags.HasHeal {
			// プレイヤーへの回復
			s.floatingDamageManager.AddHeal(effectAmount, "player")
			s.playerHPBar.SetTarget(s.player.HP)
		}
	}

	// メッセージを表示
	s.message = s.formatEffectMessage(module, effectAmount, typingResult, effectFlags)
	if s.comboCount > 0 {
		s.message += fmt.Sprintf(" [コンボ:%d]", s.comboCount)
	}
	if echoSkillTriggered {
		s.message += " [エコースキル発動！]"
	}
	if miracleHealTriggered {
		s.message += " [ミラクルヒール発動！]"
	}
	if doubleCastTriggered {
		s.message += " [ダブルキャスト発動！]"
	}

	// クールダウンを開始
	s.StartCooldown(s.selectedModuleIdx, slot.CooldownTotal)

	// エージェントのリキャストを開始し、チェイン効果を登録
	s.startAgentRecast(agentIndex, module)

	// フェーズ変化をチェック
	if s.battleEngine != nil && s.battleState != nil {
		if s.battleEngine.CheckPhaseTransition(s.battleState) {
			// 敵のパッシブを強化パッシブに切り替え
			s.battleEngine.SwitchEnemyPassive(s.battleState)
			s.message += " [敵が強化フェーズに突入！]"
		}
	}
}

// formatEffectMessage は効果メッセージをフォーマットします。
func (s *BattleScreen) formatEffectMessage(module *domain.ModuleModel, effectAmount int, result *typing.TypingResult, flags chain.ModuleEffectFlags) string {
	var action string
	if flags.HasDamage {
		action = fmt.Sprintf("%dダメージを与えた！", effectAmount)
	} else if flags.HasHeal {
		action = fmt.Sprintf("%d回復した！", effectAmount)
	} else if flags.HasBuff {
		action = fmt.Sprintf("%sを付与した！", module.Name())
	} else if flags.HasDebuff {
		action = fmt.Sprintf("敵に%sを付与した！", module.Name())
	} else {
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

	// チャージ中の場合はチャージ状態を表示
	if s.enemy != nil && s.enemy.IsCharging {
		return s.getChargingActionDisplay()
	}

	// ディフェンス中の場合はディフェンス状態を表示
	if s.enemy != nil && s.enemy.IsDefending {
		return s.getDefenseActionDisplay()
	}

	action := s.battleState.NextAction

	switch action.ActionType {
	case combat.EnemyActionAttack:
		// 攻撃予告（赤色）
		if action.AttackType == "physical" {
			return "⚔️", fmt.Sprintf("物理攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage
		}
		return "💥", fmt.Sprintf("魔法攻撃 %dダメージ", action.ExpectedValue), styles.ColorDamage

	case combat.EnemyActionSelfBuff:
		// 自己バフ予告（黄色）
		name := combat.GetEnemyBuffName(action.BuffType)
		return "💪", name, styles.ColorWarning

	case combat.EnemyActionDebuff:
		// プレイヤーデバフ予告（青色）
		name := combat.GetPlayerDebuffName(action.DebuffType)
		return "💀", name, styles.ColorInfo

	case combat.EnemyActionDefense:
		// ディフェンス予告（シアン色）
		return s.getDefensePreviewDisplay(action)
	}

	return "?", "不明", styles.ColorSubtle
}

// getChargingActionDisplay はチャージ中の行動表示情報を返します。
func (s *BattleScreen) getChargingActionDisplay() (icon string, text string, color lipgloss.Color) {
	now := time.Now()
	progress := s.enemy.GetChargeProgress(now)
	remaining := s.enemy.GetChargeRemainingTime(now)

	actionName := "不明"
	if s.enemy.PendingAction != nil {
		actionName = s.enemy.PendingAction.Name
	}

	// チャージ進捗バーを生成
	progressBar := s.renderChargeProgressBar(progress)

	text = fmt.Sprintf("チャージ中: %s %s (%.1fs)", actionName, progressBar, remaining.Seconds())
	return "⏳", text, styles.ColorWarning
}

// getDefenseActionDisplay はディフェンス中の行動表示情報を返します。
func (s *BattleScreen) getDefenseActionDisplay() (icon string, text string, color lipgloss.Color) {
	now := time.Now()
	remaining := s.enemy.GetDefenseRemainingTime(now)
	typeName := s.enemy.GetDefenseTypeName()

	text = fmt.Sprintf("%s発動中 (残り%.1fs)", typeName, remaining.Seconds())
	return "🛡️", text, styles.ColorBuff
}

// getDefensePreviewDisplay はディフェンス予告の表示情報を返します。
func (s *BattleScreen) getDefensePreviewDisplay(action combat.NextEnemyAction) (icon string, text string, color lipgloss.Color) {
	var defenseName string
	switch action.DefenseType {
	case domain.DefensePhysicalCut:
		defenseName = fmt.Sprintf("物理防御 (%.0f%%軽減)", action.DefenseValue*100)
	case domain.DefenseMagicCut:
		defenseName = fmt.Sprintf("魔法防御 (%.0f%%軽減)", action.DefenseValue*100)
	case domain.DefenseDebuffEvade:
		defenseName = fmt.Sprintf("デバフ回避 (%.0f%%)", action.DefenseValue*100)
	default:
		defenseName = "防御"
	}

	text = fmt.Sprintf("%s (%.1fs)", defenseName, float64(action.DefenseDurationMs)/1000)
	return "🛡️", text, styles.ColorBuff
}

// renderChargeProgressBar はチャージ進捗バーを描画します。
func (s *BattleScreen) renderChargeProgressBar(progress float64) string {
	barWidth := 10
	filledWidth := int(float64(barWidth) * progress)
	if filledWidth > barWidth {
		filledWidth = barWidth
	}

	filled := strings.Repeat("█", filledWidth)
	empty := strings.Repeat("░", barWidth-filledWidth)

	return "[" + filled + empty + "]"
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

// getModuleEffectFlags はモジュールが持つ効果の種別フラグを取得します。
func getModuleEffectFlags(module *domain.ModuleModel) chain.ModuleEffectFlags {
	flags := chain.ModuleEffectFlags{}

	for _, effect := range module.Type.Effects {
		if effect.IsDamageEffect() {
			flags.HasDamage = true
		}
		if effect.IsHealEffect() {
			flags.HasHeal = true
		}
		if effect.IsBuffEffect() {
			flags.HasBuff = true
		}
		if effect.IsDebuffEffect() {
			flags.HasDebuff = true
		}
	}

	return flags
}
