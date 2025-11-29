// Package app は TypeBattle TUIゲームのメインアプリケーションモデルを提供します。
// Elm Architectureパターンを使用してBubbletea tea.Modelインターフェースを実装します。
package app

import (
	tea "github.com/charmbracelet/bubbletea"
)

// Model は TypeBattleゲームのメインアプリケーション状態を表します。
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

// Update handles incoming messages and updates the model state.
// It returns the updated model and any commands to execute.
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

// View renders the current state of the application as a string.
func (m *Model) View() string {
	// If terminal state hasn't been set yet, show loading message
	if m.terminalState == nil {
		return m.styles.Subtle.Render("Loading...")
	}

	// If terminal is too small, show warning message
	if !m.terminalState.IsValid() {
		warning := m.styles.Warning.Render(m.terminalState.WarningMessage())
		quitHint := m.styles.Subtle.Render("Press q to quit.")
		return warning + "\n\n" + quitHint
	}

	title := m.styles.Title.Render("TypeBattle - Terminal Typing Battle Game")
	quitHint := m.styles.Subtle.Render("Press q to quit.")
	return title + "\n\n" + quitHint
}
