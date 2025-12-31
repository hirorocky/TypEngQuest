// Package components はTUI共通コンポーネントを提供します。
package components

import (
	"fmt"
	"strings"

	"hirorocky/type-battle/internal/tui/styles"

	"github.com/charmbracelet/lipgloss"
)

// RecastProgressBar はエージェントのリキャスト残り時間を視覚的に表示するコンポーネントです。
// 残り時間と総時間からプログレス割合を計算し、
// 完了に近づくにつれ色が変化（赤→黄→緑）します。
type RecastProgressBar struct {
	remainingSeconds float64
	totalSeconds     float64
	gameStyles       *styles.GameStyles
}

// リキャスト進捗色の閾値
const (
	// RecastHighThreshold は赤色表示の閾値（残り時間75%以上）
	RecastHighThreshold = 0.75
	// RecastMediumThreshold は黄色表示の閾値（残り時間25%以上）
	RecastMediumThreshold = 0.25
)

// NewRecastProgressBar は新しいRecastProgressBarを作成します。
func NewRecastProgressBar() *RecastProgressBar {
	return &RecastProgressBar{
		remainingSeconds: 0,
		totalSeconds:     0,
		gameStyles:       styles.NewGameStyles(),
	}
}

// SetProgress はリキャストの残り時間と総時間を設定します。
// totalが0以下の場合は進捗0として扱います。
// remainingが負の場合は0として扱います。
func (b *RecastProgressBar) SetProgress(remaining, total float64) {
	if remaining < 0 {
		remaining = 0
	}
	if total <= 0 {
		b.remainingSeconds = 0
		b.totalSeconds = 0
		return
	}
	if remaining > total {
		remaining = total
	}

	b.remainingSeconds = remaining
	b.totalSeconds = total
}

// GetProgress はリキャストの進捗率（0.0-1.0）を返します。
// 1.0は残り時間が総時間と同じ（開始直後）、0.0は完了を示します。
func (b *RecastProgressBar) GetProgress() float64 {
	if b.totalSeconds <= 0 {
		return 0
	}
	return b.remainingSeconds / b.totalSeconds
}

// GetColorType は現在の進捗率に応じた色タイプを返します。
// 残り時間が多い（進捗率高）= "red"（リキャスト中）
// 残り時間が中程度 = "yellow"
// 残り時間が少ない（進捗率低）= "green"（もうすぐ完了）
func (b *RecastProgressBar) GetColorType() string {
	progress := b.GetProgress()

	if progress > RecastHighThreshold {
		return "red"
	} else if progress > RecastMediumThreshold {
		return "yellow"
	}
	return "green"
}

// getBarColor は進捗率に応じた色を返します。
func (b *RecastProgressBar) getBarColor() lipgloss.Color {
	colorType := b.GetColorType()
	switch colorType {
	case "red":
		return styles.ColorHPLow
	case "yellow":
		return styles.ColorHPMedium
	default:
		return styles.ColorHPHigh
	}
}

// Render はリキャストプログレスバーをレンダリングします。
// 残り秒数のテキストをバー内に表示します。
func (b *RecastProgressBar) Render(width int) string {
	if width < 5 {
		width = 5
	}

	// バー内部の幅（括弧分を除く）
	innerWidth := width - 2
	if innerWidth < 3 {
		innerWidth = 3
	}

	progress := b.GetProgress()
	barColor := b.getBarColor()

	// 塗りつぶし部分の幅を計算
	filledWidth := int(float64(innerWidth) * progress)
	if filledWidth > innerWidth {
		filledWidth = innerWidth
	}
	if filledWidth < 0 {
		filledWidth = 0
	}

	// 残り時間テキスト
	timeText := fmt.Sprintf("%.1fs", b.remainingSeconds)

	// プログレスバー文字列を構築
	filled := strings.Repeat("█", filledWidth)
	empty := strings.Repeat("░", innerWidth-filledWidth)
	bar := filled + empty

	// バーにテキストを重ねる
	barRunes := []rune(bar)
	textStart := (innerWidth - len(timeText)) / 2
	if textStart < 0 {
		textStart = 0
	}
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

// RenderCompact はコンパクトなリキャストプログレスバーをレンダリングします。
// 残り秒数のみ表示する短いバージョンです。
// 引数widthは将来の拡張用に予約されています。
func (b *RecastProgressBar) RenderCompact(_ int) string {
	barColor := b.getBarColor()
	timeText := fmt.Sprintf("%.1fs", b.remainingSeconds)

	barStyle := lipgloss.NewStyle().
		Foreground(barColor).
		Bold(true)

	return barStyle.Render(timeText)
}
