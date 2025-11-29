// Package app provides the main application model for the TypeBattle TUI game.
// It implements the Bubbletea tea.Model interface using the Elm Architecture pattern.
package app

import (
	tea "github.com/charmbracelet/bubbletea"
)

// Model represents the main application state for the TypeBattle game.
// It implements the tea.Model interface for Bubbletea TUI framework.
type Model struct {
	// ready indicates whether the application has been initialized
	ready bool
}

// New creates a new App model with default initial state.
func New() *Model {
	return &Model{
		ready: false,
	}
}

// Init initializes the application and returns any initial commands.
// This is called once when the program starts.
func (m *Model) Init() tea.Cmd {
	return nil
}

// Update handles incoming messages and updates the model state.
// It returns the updated model and any commands to execute.
func (m *Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
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
	return "TypeBattle - Terminal Typing Battle Game\n\nPress q to quit."
}
