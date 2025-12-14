// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"fmt"
	"strings"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"

	"github.com/charmbracelet/lipgloss"
)

// PassiveSkillNotification はパッシブスキルの効果を表示するコンポーネントです。
// エージェントのコア特性から付与されるパッシブスキルの効果を
// コンパクトな形式または詳細な形式で表示します。
type PassiveSkillNotification struct {
	skill      *domain.PassiveSkill
	coreLevel  int
	gameStyles *styles.GameStyles
}

// NewPassiveSkillNotification は新しいPassiveSkillNotificationを作成します。
// skillがnilの場合でも有効な通知を作成します（表示は空になります）。
// coreLevelは効果量のスケーリングに使用されます。
func NewPassiveSkillNotification(skill *domain.PassiveSkill, coreLevel int) *PassiveSkillNotification {
	return &PassiveSkillNotification{
		skill:      skill,
		coreLevel:  coreLevel,
		gameStyles: styles.NewGameStyles(),
	}
}

// GetName はパッシブスキルの名前を返します。
// skillがnilの場合は空文字列を返します。
func (n *PassiveSkillNotification) GetName() string {
	if n.skill == nil {
		return ""
	}
	return n.skill.Name
}

// GetDescription はパッシブスキルの説明を返します。
// skillがnilの場合は空文字列を返します。
func (n *PassiveSkillNotification) GetDescription() string {
	if n.skill == nil {
		return ""
	}
	return n.skill.Description
}

// GetEffectModifiers はコアレベルに応じた効果量を計算して返します。
// skillがnilの場合はゼロ値のStatModifiersを返します。
func (n *PassiveSkillNotification) GetEffectModifiers() domain.StatModifiers {
	if n.skill == nil {
		return domain.StatModifiers{}
	}
	return n.skill.CalculateModifiers(n.coreLevel)
}

// HasActiveEffects はこの通知が有効なパッシブスキルを持っているかを返します。
func (n *PassiveSkillNotification) HasActiveEffects() bool {
	return n.skill != nil
}

// RenderCompact はコンパクトな形式でパッシブスキルをレンダリングします。
// skillがnilの場合は空文字列を返します。
func (n *PassiveSkillNotification) RenderCompact() string {
	if n.skill == nil {
		return ""
	}

	style := lipgloss.NewStyle().
		Foreground(styles.ColorBuff).
		Bold(true)

	return style.Render(fmt.Sprintf("★ %s", n.skill.Name))
}

// RenderDetail は詳細な形式でパッシブスキルをレンダリングします。
// 名前、説明、効果リストを含む複数行の出力を返します。
// skillがnilの場合は「パッシブスキルなし」を返します。
func (n *PassiveSkillNotification) RenderDetail(width int) string {
	if n.skill == nil {
		return lipgloss.NewStyle().
			Foreground(styles.ColorSubtle).
			Render("パッシブスキルなし")
	}

	var builder strings.Builder

	// タイトル
	titleStyle := lipgloss.NewStyle().
		Foreground(styles.ColorBuff).
		Bold(true)
	builder.WriteString(titleStyle.Render(fmt.Sprintf("★ %s", n.skill.Name)))
	builder.WriteString("\n")

	// 説明
	descStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)
	builder.WriteString(descStyle.Render(n.skill.Description))
	builder.WriteString("\n")

	// 効果リスト
	effects := n.RenderEffectsList()
	if len(effects) > 0 {
		builder.WriteString("\n")
		labelStyle := lipgloss.NewStyle().Foreground(styles.ColorSecondary)
		builder.WriteString(labelStyle.Render("効果 (Lv." + fmt.Sprintf("%d", n.coreLevel) + "):"))
		builder.WriteString("\n")
		for _, effect := range effects {
			builder.WriteString("  " + effect + "\n")
		}
	}

	return builder.String()
}

// RenderEffectsList は効果のリストを文字列スライスとして返します。
// 各要素は「効果名: 値」形式です。
// skillがnilまたは効果がない場合は空のスライスを返します。
func (n *PassiveSkillNotification) RenderEffectsList() []string {
	if n.skill == nil {
		return []string{}
	}

	modifiers := n.GetEffectModifiers()
	effects := make([]string, 0)

	valueStyle := lipgloss.NewStyle().Foreground(styles.ColorBuff)

	// ステータス乗算効果
	if modifiers.STR_Mult != 0 && modifiers.STR_Mult != 1.0 {
		percent := (modifiers.STR_Mult - 1.0) * 100
		effects = append(effects, fmt.Sprintf("STR: %s", valueStyle.Render(fmt.Sprintf("%+.0f%%", percent))))
	}
	if modifiers.MAG_Mult != 0 && modifiers.MAG_Mult != 1.0 {
		percent := (modifiers.MAG_Mult - 1.0) * 100
		effects = append(effects, fmt.Sprintf("MAG: %s", valueStyle.Render(fmt.Sprintf("%+.0f%%", percent))))
	}
	if modifiers.SPD_Mult != 0 && modifiers.SPD_Mult != 1.0 {
		percent := (modifiers.SPD_Mult - 1.0) * 100
		effects = append(effects, fmt.Sprintf("SPD: %s", valueStyle.Render(fmt.Sprintf("%+.0f%%", percent))))
	}
	if modifiers.LUK_Mult != 0 && modifiers.LUK_Mult != 1.0 {
		percent := (modifiers.LUK_Mult - 1.0) * 100
		effects = append(effects, fmt.Sprintf("LUK: %s", valueStyle.Render(fmt.Sprintf("%+.0f%%", percent))))
	}

	// ステータス加算効果
	if modifiers.STR_Add != 0 {
		effects = append(effects, fmt.Sprintf("STR: %s", valueStyle.Render(fmt.Sprintf("%+d", modifiers.STR_Add))))
	}
	if modifiers.MAG_Add != 0 {
		effects = append(effects, fmt.Sprintf("MAG: %s", valueStyle.Render(fmt.Sprintf("%+d", modifiers.MAG_Add))))
	}
	if modifiers.SPD_Add != 0 {
		effects = append(effects, fmt.Sprintf("SPD: %s", valueStyle.Render(fmt.Sprintf("%+d", modifiers.SPD_Add))))
	}
	if modifiers.LUK_Add != 0 {
		effects = append(effects, fmt.Sprintf("LUK: %s", valueStyle.Render(fmt.Sprintf("%+d", modifiers.LUK_Add))))
	}

	// 特殊効果
	if modifiers.CDReduction != 0 {
		effects = append(effects, fmt.Sprintf("CD短縮: %s", valueStyle.Render(fmt.Sprintf("%.0f%%", modifiers.CDReduction*100))))
	}
	if modifiers.TypingTimeExt != 0 {
		effects = append(effects, fmt.Sprintf("入力時間: %s", valueStyle.Render(fmt.Sprintf("+%.1f秒", modifiers.TypingTimeExt))))
	}
	if modifiers.DamageReduction != 0 {
		effects = append(effects, fmt.Sprintf("被ダメ軽減: %s", valueStyle.Render(fmt.Sprintf("%.0f%%", modifiers.DamageReduction*100))))
	}
	if modifiers.CritRate != 0 {
		effects = append(effects, fmt.Sprintf("クリ率: %s", valueStyle.Render(fmt.Sprintf("+%.0f%%", modifiers.CritRate*100))))
	}
	if modifiers.PhysicalEvade != 0 {
		effects = append(effects, fmt.Sprintf("物理回避: %s", valueStyle.Render(fmt.Sprintf("+%.0f%%", modifiers.PhysicalEvade*100))))
	}
	if modifiers.MagicEvade != 0 {
		effects = append(effects, fmt.Sprintf("魔法回避: %s", valueStyle.Render(fmt.Sprintf("+%.0f%%", modifiers.MagicEvade*100))))
	}

	return effects
}

// RenderBadge はバッジ形式でパッシブスキルをレンダリングします。
// 小さな領域に表示するための最小形式です。
// skillがnilの場合は空文字列を返します。
func (n *PassiveSkillNotification) RenderBadge() string {
	if n.skill == nil {
		return ""
	}

	style := lipgloss.NewStyle().
		Foreground(styles.ColorBuff).
		Background(lipgloss.Color("236")).
		Padding(0, 1)

	// 短縮名（最初の4文字 + ...）
	name := n.skill.Name
	if len([]rune(name)) > 6 {
		name = string([]rune(name)[:6]) + ".."
	}

	return style.Render("★" + name)
}
