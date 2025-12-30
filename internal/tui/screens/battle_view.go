// Package screens はTUIゲームの画面を提供します。
// battle_view.go はバトル画面のUIレンダリングロジックを担当します。
package screens

import (
	"fmt"
	"strings"
	"time"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/components"
	"hirorocky/type-battle/internal/tui/styles"

	"github.com/charmbracelet/lipgloss"
)

// ==================== UIレンダリング ====================

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

// ==================== エリアレンダリング ====================

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
	buffs := s.enemy.EffectTable.FindBySourceType(domain.SourceBuff)
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
// タスク 9: リキャスト状態、チェイン効果、パッシブスキル表示を追加
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
			cardContent.WriteString("\n")

			// パッシブスキル表示（コア特性から）
			if agent.Core != nil && agent.Core.PassiveSkill.ID != "" {
				passiveNotification := components.NewPassiveSkillNotification(&agent.Core.PassiveSkill, agent.Level)
				cardContent.WriteString(passiveNotification.RenderCompact())
				cardContent.WriteString("\n")
			}

			// リキャスト状態表示
			recastState := s.recastManager.GetRecastState(i)
			if recastState != nil {
				recastBar := components.NewRecastProgressBar()
				recastBar.SetProgress(recastState.RemainingSeconds, recastState.TotalSeconds)
				cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorWarning).Render("⏳ "))
				cardContent.WriteString(recastBar.RenderCompact(10))
				cardContent.WriteString("\n")
			}

			// 待機中チェイン効果表示
			pendingChain := s.chainEffectManager.GetPendingEffectForAgent(i)
			if pendingChain != nil {
				chainBadge := components.NewChainEffectBadge(&pendingChain.Effect)
				cardContent.WriteString(lipgloss.NewStyle().Foreground(styles.ColorBuff).Render("🔗 "))
				cardContent.WriteString(chainBadge.RenderWithValue())
				cardContent.WriteString("\n")
			}

			// エージェントのモジュール一覧
			agentModules := s.getModulesForAgent(i)
			for j, slot := range agentModules {
				isModuleSelected := isSelected && j == s.getSelectedModuleInAgent(i)

				// モジュールアイコン
				icon := s.getModuleIcon(slot.Module.Category())

				// モジュール名とクールダウン
				var moduleStyle lipgloss.Style
				if isModuleSelected {
					moduleStyle = lipgloss.NewStyle().
						Bold(true).
						Foreground(styles.ColorSelectedFg).
						Background(styles.ColorSelectedBg)
				} else if !slot.IsReady() || recastState != nil {
					// クールダウン中またはリキャスト中は淡い色
					moduleStyle = lipgloss.NewStyle().Foreground(styles.ColorSubtle)
				} else {
					moduleStyle = lipgloss.NewStyle().Foreground(styles.ColorSecondary)
				}

				prefix := "  "
				if isModuleSelected {
					prefix = "> "
				}

				// チェイン効果バッジ
				chainBadgeStr := ""
				if slot.Module.HasChainEffect() {
					chainBadge := components.NewChainEffectBadge(slot.Module.ChainEffect)
					chainBadgeStr = chainBadge.Render() + " "
				}

				cardContent.WriteString(moduleStyle.Render(fmt.Sprintf("%s%s %s%s", prefix, icon, chainBadgeStr, slot.Module.Name())))
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
			Height(12) // 高さを増やしてパッシブスキル・リキャスト表示用のスペースを確保

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
	buffs := s.player.EffectTable.FindBySourceType(domain.SourceBuff)
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
	debuffs := s.player.EffectTable.FindBySourceType(domain.SourceDebuff)
	if len(debuffs) > 0 {
		builder.WriteString("デバフ: ")
		for _, debuff := range debuffs {
			if debuff.Duration != nil {
				builder.WriteString(s.styles.RenderDebuff(debuff.Name, *debuff.Duration))
				builder.WriteString(" ")
			}
		}
		builder.WriteString("\n")
	}

	// パッシブスキル表示（スタック型パッシブのダメージ倍率）
	passives := s.player.EffectTable.FindBySourceType(domain.SourcePassive)
	hasStackPassive := false
	for _, passive := range passives {
		if passive.MaxStacks > 0 {
			if !hasStackPassive {
				builder.WriteString("パッシブ: ")
				hasStackPassive = true
			}
			// スタック数を計算（コンボ数を使用、最大スタックでキャップ）
			stacks := s.comboCount
			if stacks > passive.MaxStacks {
				stacks = passive.MaxStacks
			}
			// ダメージ倍率を計算（スタック数 × 効果増分）
			bonusPercent := float64(stacks) * passive.StackIncrement * 100
			builder.WriteString(s.styles.RenderPassive(passive.Name, bonusPercent))
			builder.WriteString(" ")
		}
	}
	if hasStackPassive {
		builder.WriteString("\n")
	}

	// エリアボックス
	areaStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(styles.ColorHPHigh).
		Padding(1, 2).
		Width(s.width - 4)

	return areaStyle.Render(builder.String())
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

// renderTypingArea はタイピングエリアを描画します。

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

// ==================== プログレスバーレンダリング ====================

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

// ==================== UIヘルパー ====================

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
// 要件 7.3: domain.ModuleCategory.Icon()に委譲
func (s *BattleScreen) getModuleIcon(category domain.ModuleCategory) string {
	return category.Icon()
}
