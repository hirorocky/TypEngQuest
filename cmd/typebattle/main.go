// Package main は TypeBattleターミナルタイピングバトルゲームのエントリーポイントです。
//
// ゲームはBubbletea TUIフレームワークを使用し、Elm Architectureパターンに基づいて
// RootModelを中心としたイベント駆動型アーキテクチャで実装されています。
//
// 終了操作（qキーまたはCtrl+C）を行うと、tea.WithAltScreen()により
// ターミナルの状態が自動的に復元されます。
package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
	"hirorocky/type-battle/internal/app"
)

func main() {
	// RootModelを作成 - ゲーム全体の状態管理とシーンルーティングを担当
	model := app.NewRootModel()

	// Bubbleteaプログラムを作成
	// tea.WithAltScreen(): 代替スクリーンバッファを使用し、
	// 終了時に元のターミナル状態を自動的に復元する
	p := tea.NewProgram(model, tea.WithAltScreen())

	if _, err := p.Run(); err != nil {
		fmt.Printf("Error running program: %v\n", err)
		os.Exit(1)
	}
}
