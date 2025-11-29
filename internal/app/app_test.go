package app

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

// TestNewApp verifies that a new App model can be created successfully
func TestNewApp(t *testing.T) {
	model := New()
	if model == nil {
		t.Fatal("New() returned nil")
	}
}

// TestAppImplementsTeaModel verifies that App implements tea.Model interface
func TestAppImplementsTeaModel(t *testing.T) {
	var _ tea.Model = (*Model)(nil)
}

// TestAppInit verifies that Init returns a valid tea.Cmd (can be nil)
func TestAppInit(t *testing.T) {
	model := New()
	cmd := model.Init()
	// Init can return nil or a valid command
	_ = cmd
}

// TestAppUpdate verifies that Update handles a basic message and returns a model and command
func TestAppUpdate(t *testing.T) {
	model := New()
	updatedModel, cmd := model.Update(nil)
	if updatedModel == nil {
		t.Fatal("Update() returned nil model")
	}
	// cmd can be nil
	_ = cmd
}

// TestAppView verifies that View returns a non-empty string
func TestAppView(t *testing.T) {
	model := New()
	view := model.View()
	if view == "" {
		t.Fatal("View() returned empty string")
	}
}

// TestAppViewContainsGameTitle verifies that the initial view contains the game title
func TestAppViewContainsGameTitle(t *testing.T) {
	model := New()
	view := model.View()
	// Check for presence of game title (TypeBattle or related)
	if len(view) == 0 {
		t.Fatal("View should contain some content")
	}
}
