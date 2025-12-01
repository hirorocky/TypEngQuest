// Package app は BlitzTypingOperator TUIゲームのメインアプリケーションモデルを提供します。
// Elm Architectureパターンを使用してBubbletea tea.Modelインターフェースを実装します。
package app

import (
	tea "github.com/charmbracelet/bubbletea"
)

// Model は BlitzTypingOperatorゲームのメインアプリケーション状態を表します。
// Bubbletea TUIフレームワークのtea.Modelインターフェースを実装します。
type Model struct {
	// ready はアプリケーションが初期化され、
	// ターミナルサイズが最小要件を満たしているかを示します
	ready bool

	// terminalState は現在のターミナルサイズと検証状態を保持します
	terminalState *TerminalState

	// styles はアプリケーションのlipglossスタイルを保持します
	styles *Styles
}

// New はデフォルトの初期状態で新しいAppモデルを作成します。
func New() *Model {
	return &Model{
		ready:  false,
		styles: NewStyles(),
	}
}

// Init はアプリケーションを初期化し、初期コマンドを返します。
// これはプログラム開始時に一度だけ呼び出されます。
func (m *Model) Init() tea.Cmd {
	return nil
}

// Update は受信メッセージを処理し、モデルの状態を更新します。
// 更新されたモデルと実行するコマンドを返します。
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.terminalState = NewTerminalState(msg.Width, msg.Height)
		m.ready = m.terminalState.IsValid()
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "q", "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

// View はアプリケーションの現在の状態を文字列としてレンダリングします。
func (m *Model) View() string {
	// ターミナル状態がまだ設定されていない場合、ローディングメッセージを表示
	if m.terminalState == nil {
		return m.styles.Subtle.Render("Loading...")
	}

	// ターミナルが小さすぎる場合、警告メッセージを表示
	if !m.terminalState.IsValid() {
		warning := m.styles.Warning.Render(m.terminalState.WarningMessage())
		quitHint := m.styles.Subtle.Render("Press q to quit.")
		return warning + "\n\n" + quitHint
	}

	title := m.styles.Title.Render("BlitzTypingOperator - Terminal Typing Quest Game")
	quitHint := m.styles.Subtle.Render("Press q to quit.")
	return title + "\n\n" + quitHint
}
