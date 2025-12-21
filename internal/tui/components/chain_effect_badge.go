// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"fmt"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/styles"

	"github.com/charmbracelet/lipgloss"
)

// ChainEffectBadge はチェイン効果をコンパクトに表示するバッジコンポーネントです。
// チェイン効果のカテゴリに応じたアイコンと効果値を簡潔に表示します。
type ChainEffectBadge struct {
	effect     *domain.ChainEffect
	gameStyles *styles.GameStyles
}

// カテゴリアイコンマッピング
var categoryIcons = map[domain.ChainEffectCategory]string{
	domain.ChainEffectCategoryAttack:       "🗡️",
	domain.ChainEffectCategoryDefense:      "🛡️",
	domain.ChainEffectCategoryHeal:         "💚",
	domain.ChainEffectCategoryTyping:       "⌨️",
	domain.ChainEffectCategoryRecast:       "⏱️",
	domain.ChainEffectCategoryEffectExtend: "🔄",
	domain.ChainEffectCategorySpecial:      "✨",
}

// NewChainEffectBadge は新しいChainEffectBadgeを作成します。
// effectがnilの場合でも有効なバッジを作成します（表示は空になります）。
func NewChainEffectBadge(effect *domain.ChainEffect) *ChainEffectBadge {
	return &ChainEffectBadge{
		effect:     effect,
		gameStyles: styles.NewGameStyles(),
	}
}

// GetCategoryIcon はチェイン効果のカテゴリに応じたアイコンを返します。
// effectがnilの場合は空文字列を返します。
func (b *ChainEffectBadge) GetCategoryIcon() string {
	if b.effect == nil {
		return ""
	}

	category := b.effect.Type.Category()
	if icon, exists := categoryIcons[category]; exists {
		return icon
	}
	return "•"
}

// GetDescription は効果の説明文を返します。
// effectがnilの場合は空文字列を返します。
func (b *ChainEffectBadge) GetDescription() string {
	if b.effect == nil {
		return ""
	}
	return b.effect.Description
}

// getCategoryColor はカテゴリに応じた色を返します。
func (b *ChainEffectBadge) getCategoryColor() lipgloss.Color {
	if b.effect == nil {
		return styles.ColorSubtle
	}

	category := b.effect.Type.Category()
	switch category {
	case domain.ChainEffectCategoryAttack:
		return styles.ColorDamage
	case domain.ChainEffectCategoryDefense:
		return styles.ColorInfo
	case domain.ChainEffectCategoryHeal:
		return styles.ColorHPHigh
	case domain.ChainEffectCategoryTyping:
		return styles.ColorWarning
	case domain.ChainEffectCategoryRecast:
		return styles.ColorPrimary
	case domain.ChainEffectCategoryEffectExtend:
		return styles.ColorBuff
	case domain.ChainEffectCategorySpecial:
		return styles.ColorPrimary
	default:
		return styles.ColorSubtle
	}
}

// Render はバッジをレンダリングします（アイコンのみ）。
// effectがnilの場合は空文字列を返します。
func (b *ChainEffectBadge) Render() string {
	if b.effect == nil {
		return ""
	}

	icon := b.GetCategoryIcon()
	color := b.getCategoryColor()

	style := lipgloss.NewStyle().Foreground(color)
	return style.Render(icon)
}

// RenderWithValue はバッジをレンダリングします（アイコンと効果値）。
// effectがnilの場合は空文字列を返します。
func (b *ChainEffectBadge) RenderWithValue() string {
	if b.effect == nil {
		return ""
	}

	icon := b.GetCategoryIcon()
	color := b.getCategoryColor()

	style := lipgloss.NewStyle().Foreground(color)

	// 効果値のフォーマット
	valueText := b.formatValue()

	return style.Render(fmt.Sprintf("%s %s", icon, valueText))
}

// RenderFull はバッジをフルフォーマットでレンダリングします（アイコン、効果値、説明）。
// effectがnilの場合は「(No Effect)」を返します。
func (b *ChainEffectBadge) RenderFull() string {
	if b.effect == nil {
		return lipgloss.NewStyle().Foreground(styles.ColorSubtle).Render("(No Effect)")
	}

	icon := b.GetCategoryIcon()
	color := b.getCategoryColor()

	style := lipgloss.NewStyle().Foreground(color)
	descStyle := lipgloss.NewStyle().Foreground(styles.ColorSubtle)

	valueText := b.formatValue()

	return style.Render(fmt.Sprintf("[%s %s]", icon, valueText)) + " " + descStyle.Render(b.effect.Description)
}

// formatValue は効果値をフォーマットします。
func (b *ChainEffectBadge) formatValue() string {
	if b.effect == nil {
		return ""
	}

	// 効果タイプに応じたフォーマット
	switch b.effect.Type {
	case domain.ChainEffectDamageBonus, domain.ChainEffectHealBonus,
		domain.ChainEffectDamageAmp, domain.ChainEffectDamageCut,
		domain.ChainEffectEvasion, domain.ChainEffectReflect,
		domain.ChainEffectRegen, domain.ChainEffectHealAmp,
		domain.ChainEffectLifeSteal, domain.ChainEffectCooldownReduce,
		domain.ChainEffectDoubleCast:
		return fmt.Sprintf("+%.0f%%", b.effect.Value)

	case domain.ChainEffectBuffExtend, domain.ChainEffectDebuffExtend,
		domain.ChainEffectBuffDuration, domain.ChainEffectDebuffDuration,
		domain.ChainEffectTimeExtend:
		return fmt.Sprintf("+%.0fs", b.effect.Value)

	case domain.ChainEffectAutoCorrect:
		return fmt.Sprintf("x%.0f", b.effect.Value)

	case domain.ChainEffectArmorPierce, domain.ChainEffectOverheal:
		return "ON"

	default:
		return fmt.Sprintf("%.0f", b.effect.Value)
	}
}

// HasEffect はこのバッジが有効なチェイン効果を持っているかを返します。
func (b *ChainEffectBadge) HasEffect() bool {
	return b.effect != nil
}
