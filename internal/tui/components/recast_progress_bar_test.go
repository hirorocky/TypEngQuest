// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"strings"
	"testing"
)

func TestRecastProgressBar_NewRecastProgressBar(t *testing.T) {
	bar := NewRecastProgressBar()
	if bar == nil {
		t.Fatal("NewRecastProgressBar should return non-nil")
	}
}

func TestRecastProgressBar_SetProgress(t *testing.T) {
	tests := []struct {
		name        string
		remaining   float64
		total       float64
		wantPercent float64
	}{
		{"full", 10.0, 10.0, 1.0},
		{"half", 5.0, 10.0, 0.5},
		{"quarter", 2.5, 10.0, 0.25},
		{"empty", 0.0, 10.0, 0.0},
		{"zero_total", 5.0, 0.0, 0.0},
		{"negative_remaining", -1.0, 10.0, 0.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bar := NewRecastProgressBar()
			bar.SetProgress(tt.remaining, tt.total)

			got := bar.GetProgress()
			if got != tt.wantPercent {
				t.Errorf("GetProgress() = %v, want %v", got, tt.wantPercent)
			}
		})
	}
}

func TestRecastProgressBar_Render(t *testing.T) {
	tests := []struct {
		name      string
		remaining float64
		total     float64
		width     int
		wantLen   bool
	}{
		{"full_bar", 10.0, 10.0, 20, true},
		{"half_bar", 5.0, 10.0, 20, true},
		{"empty_bar", 0.0, 10.0, 20, true},
		{"narrow_bar", 5.0, 10.0, 10, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bar := NewRecastProgressBar()
			bar.SetProgress(tt.remaining, tt.total)

			result := bar.Render(tt.width)
			if tt.wantLen && len(result) == 0 {
				t.Error("Render() should return non-empty string")
			}
		})
	}
}

func TestRecastProgressBar_ColorByProgress(t *testing.T) {
	bar := NewRecastProgressBar()

	// 進捗率に応じて色が変わることをテスト
	// 残り時間が少ない（進捗率が低い）= 緑に近づく
	// 残り時間が多い（進捗率が高い）= 赤
	tests := []struct {
		name      string
		remaining float64
		total     float64
		wantColor string // "red", "yellow", "green"
	}{
		{"high_remaining_red", 9.0, 10.0, "red"},
		{"medium_remaining_yellow", 4.0, 10.0, "yellow"},
		{"low_remaining_green", 1.0, 10.0, "green"},
		{"very_low_remaining_green", 0.5, 10.0, "green"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bar.SetProgress(tt.remaining, tt.total)
			colorType := bar.GetColorType()
			if colorType != tt.wantColor {
				t.Errorf("GetColorType() = %v, want %v", colorType, tt.wantColor)
			}
		})
	}
}

func TestRecastProgressBar_ShowsRemainingTime(t *testing.T) {
	bar := NewRecastProgressBar()
	bar.SetProgress(5.5, 10.0)

	result := bar.Render(30)

	// 残り秒数が表示されていることを確認
	if !strings.Contains(result, "5.5") && !strings.Contains(result, "5.5s") {
		t.Errorf("Render() should contain remaining time, got %v", result)
	}
}
