// Package styles はTUIスタイリングのテストを提供します。

package styles

import (
	"testing"
)

// TestGetEffectColor は効果タイプのカラー取得をテストします。
func TestGetEffectColor(t *testing.T) {
	tests := []struct {
		effectType string
		wantColor  bool
	}{
		{"damage", true},
		{"heal", true},
		{"buff", true},
		{"debuff", true},
		{"unknown", true}, // デフォルトカラーが返される
	}

	for _, tt := range tests {
		t.Run(tt.effectType, func(t *testing.T) {
			color := GetEffectColor(tt.effectType)
			if color == "" {
				t.Errorf("GetEffectColor(%s)が空を返しました", tt.effectType)
			}
		})
	}
}

// TestRenderColoredIcon はカラー付きアイコンの描画をテストします。
func TestRenderColoredIcon(t *testing.T) {
	icon := RenderColoredIcon("⚔️", ColorDamage)
	if icon == "" {
		t.Error("RenderColoredIconが空文字列を返しました")
	}
}

// TestRenderModuleIcon はモジュールアイコンの描画をテストします。
func TestRenderModuleIcon(t *testing.T) {
	tests := []struct {
		icon       string
		effectType string
	}{
		{"⚔️", "damage"},
		{"💥", "damage"},
		{"💚", "heal"},
		{"💪", "buff"},
		{"💀", "debuff"},
	}

	for _, tt := range tests {
		t.Run(tt.icon, func(t *testing.T) {
			result := RenderModuleIcon(tt.icon, tt.effectType)
			if result == "" {
				t.Errorf("RenderModuleIcon(%s, %s)が空文字列を返しました", tt.icon, tt.effectType)
			}
		})
	}
}

// TestRenderIcons は複数アイコンの描画をテストします。
func TestRenderIcons(t *testing.T) {
	icons := []string{"⚔️", "💥", "💚"}
	result := RenderIcons(icons, ColorDamage)

	if len(result) != 3 {
		t.Errorf("RenderIconsが正しくない数のアイコンを返しました: got %d, want 3", len(result))
	}

	for i, icon := range result {
		if icon == "" {
			t.Errorf("RenderIcons()[%d]が空文字列です", i)
		}
	}
}
