// Package styles はTUIスタイリングのモジュールアイコン機能を提供します。

package styles

import (
	"hirorocky/type-battle/internal/domain"

	"github.com/charmbracelet/lipgloss"
)

// モジュールカテゴリに対応するアイコン（フォールバック用）

var moduleIcons = map[domain.ModuleCategory]string{
	domain.PhysicalAttack: "⚔️", // 剣（物理攻撃）
	domain.MagicAttack:    "💥",  // 爆発（魔法攻撃）
	domain.Heal:           "💚",  // 緑ハート（回復）
	domain.Buff:           "💪",  // 筋肉（バフ）
	domain.Debuff:         "💀",  // ドクロ（デバフ）
}

// モジュールカテゴリに対応するカラー
var moduleCategoryColors = map[domain.ModuleCategory]lipgloss.Color{
	domain.PhysicalAttack: ColorDamage, // 赤系
	domain.MagicAttack:    ColorInfo,   // 青系
	domain.Heal:           ColorHPHigh, // 緑系
	domain.Buff:           ColorBuff,   // 青系
	domain.Debuff:         ColorDebuff, // ピンク系
}

// GetModuleIcon はモジュールカテゴリに対応するアイコンを返します。

func GetModuleIcon(category domain.ModuleCategory) string {
	if icon, ok := moduleIcons[category]; ok {
		return icon
	}
	// 不明なカテゴリの場合はデフォルトアイコン
	return "?"
}

// GetModuleIconColored はカラー付きアイコンを返します。

func GetModuleIconColored(category domain.ModuleCategory, styles *GameStyles) string {
	icon := GetModuleIcon(category)
	color, ok := moduleCategoryColors[category]
	if !ok {
		color = ColorSubtle
	}

	style := lipgloss.NewStyle().Foreground(color)
	return style.Render(icon)
}

// GetModuleIcons は複数のカテゴリに対応するアイコンのスライスを返します。
func GetModuleIcons(categories []domain.ModuleCategory) []string {
	icons := make([]string, len(categories))
	for i, cat := range categories {
		icons[i] = GetModuleIcon(cat)
	}
	return icons
}

// GetModuleIconsColored は複数のカテゴリに対応するカラー付きアイコンのスライスを返します。
func GetModuleIconsColored(categories []domain.ModuleCategory, styles *GameStyles) []string {
	icons := make([]string, len(categories))
	for i, cat := range categories {
		icons[i] = GetModuleIconColored(cat, styles)
	}
	return icons
}

// GetCategoryColor はカテゴリに対応するカラーを返します。
func GetCategoryColor(category domain.ModuleCategory) lipgloss.Color {
	if color, ok := moduleCategoryColors[category]; ok {
		return color
	}
	return ColorSubtle
}
