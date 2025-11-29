// Package main は TypeBattleターミナルタイピングバトルゲームのエントリーポイントです。
package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"hirorocky/type-battle/internal/app"
)

func main() {
	model := app.New()
	p := tea.NewProgram(model, tea.WithAltScreen())

	if _, err := p.Run(); err != nil {
		fmt.Printf("Error running program: %v\n", err)
		os.Exit(1)
	}
}
