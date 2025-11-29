package app

import (
	"testing"

	tea "github.com/charmbracelet/bubbletea"
)

// TestMinTerminalWidth verifies the minimum terminal width constant
func TestMinTerminalWidth(t *testing.T) {
	if MinTerminalWidth != 120 {
		t.Errorf("MinTerminalWidth should be 120, got %d", MinTerminalWidth)
	}
}

// TestMinTerminalHeight verifies the minimum terminal height constant
func TestMinTerminalHeight(t *testing.T) {
	if MinTerminalHeight != 40 {
		t.Errorf("MinTerminalHeight should be 40, got %d", MinTerminalHeight)
	}
}

// TestCheckTerminalSize_ValidSize verifies that valid terminal size passes validation
func TestCheckTerminalSize_ValidSize(t *testing.T) {
	tests := []struct {
		name   string
		width  int
		height int
	}{
		{"exact minimum", 120, 40},
		{"larger width", 200, 40},
		{"larger height", 120, 60},
		{"both larger", 200, 60},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckTerminalSize(tt.width, tt.height)
			if err != nil {
				t.Errorf("CheckTerminalSize(%d, %d) returned error: %v", tt.width, tt.height, err)
			}
		})
	}
}

// TestCheckTerminalSize_InvalidSize verifies that invalid terminal size returns error
func TestCheckTerminalSize_InvalidSize(t *testing.T) {
	tests := []struct {
		name   string
		width  int
		height int
	}{
		{"width too small", 100, 40},
		{"height too small", 120, 30},
		{"both too small", 100, 30},
		{"zero width", 0, 40},
		{"zero height", 120, 0},
		{"negative width", -1, 40},
		{"negative height", 120, -1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckTerminalSize(tt.width, tt.height)
			if err == nil {
				t.Errorf("CheckTerminalSize(%d, %d) should return error but got nil", tt.width, tt.height)
			}
		})
	}
}

// TestTerminalSizeError_Width verifies error contains width information
func TestTerminalSizeError_Width(t *testing.T) {
	err := CheckTerminalSize(100, 40)
	if err == nil {
		t.Fatal("expected error but got nil")
	}

	sizeErr, ok := err.(*TerminalSizeError)
	if !ok {
		t.Fatalf("expected *TerminalSizeError, got %T", err)
	}

	if sizeErr.CurrentWidth != 100 {
		t.Errorf("CurrentWidth should be 100, got %d", sizeErr.CurrentWidth)
	}
	if sizeErr.RequiredWidth != 120 {
		t.Errorf("RequiredWidth should be 120, got %d", sizeErr.RequiredWidth)
	}
}

// TestTerminalSizeError_Height verifies error contains height information
func TestTerminalSizeError_Height(t *testing.T) {
	err := CheckTerminalSize(120, 30)
	if err == nil {
		t.Fatal("expected error but got nil")
	}

	sizeErr, ok := err.(*TerminalSizeError)
	if !ok {
		t.Fatalf("expected *TerminalSizeError, got %T", err)
	}

	if sizeErr.CurrentHeight != 30 {
		t.Errorf("CurrentHeight should be 30, got %d", sizeErr.CurrentHeight)
	}
	if sizeErr.RequiredHeight != 40 {
		t.Errorf("RequiredHeight should be 40, got %d", sizeErr.RequiredHeight)
	}
}

// TestTerminalSizeError_Error verifies error message format
func TestTerminalSizeError_Error(t *testing.T) {
	err := CheckTerminalSize(100, 30)
	if err == nil {
		t.Fatal("expected error but got nil")
	}

	msg := err.Error()
	if msg == "" {
		t.Error("error message should not be empty")
	}

	// Error message should mention both dimensions and requirements
	if len(msg) < 20 {
		t.Error("error message should be descriptive")
	}
}

// TestNewTerminalState creates a new terminal state
func TestNewTerminalState(t *testing.T) {
	state := NewTerminalState(120, 40)
	if state == nil {
		t.Fatal("NewTerminalState returned nil")
	}
	if state.Width != 120 {
		t.Errorf("Width should be 120, got %d", state.Width)
	}
	if state.Height != 40 {
		t.Errorf("Height should be 40, got %d", state.Height)
	}
}

// TestTerminalState_IsValid verifies terminal size validation method
func TestTerminalState_IsValid(t *testing.T) {
	tests := []struct {
		name     string
		width    int
		height   int
		expected bool
	}{
		{"valid size", 120, 40, true},
		{"larger size", 200, 60, true},
		{"width too small", 100, 40, false},
		{"height too small", 120, 30, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			state := NewTerminalState(tt.width, tt.height)
			if state.IsValid() != tt.expected {
				t.Errorf("IsValid() = %v, expected %v", state.IsValid(), tt.expected)
			}
		})
	}
}

// TestTerminalState_WarningMessage returns appropriate warning for invalid size
func TestTerminalState_WarningMessage(t *testing.T) {
	state := NewTerminalState(100, 30)
	msg := state.WarningMessage()

	if msg == "" {
		t.Error("WarningMessage should not be empty for invalid size")
	}
}

// TestTerminalState_WarningMessage_ValidSize returns empty for valid size
func TestTerminalState_WarningMessage_ValidSize(t *testing.T) {
	state := NewTerminalState(120, 40)
	msg := state.WarningMessage()

	if msg != "" {
		t.Errorf("WarningMessage should be empty for valid size, got: %s", msg)
	}
}

// TestModel_HandleWindowSizeMsg verifies model updates terminal state on WindowSizeMsg
func TestModel_HandleWindowSizeMsg(t *testing.T) {
	model := New()

	// Simulate receiving WindowSizeMsg
	msg := tea.WindowSizeMsg{Width: 150, Height: 50}
	updatedModel, _ := model.Update(msg)

	m, ok := updatedModel.(*Model)
	if !ok {
		t.Fatal("Update should return *Model")
	}

	if m.terminalState == nil {
		t.Fatal("terminalState should be set after WindowSizeMsg")
	}

	if m.terminalState.Width != 150 {
		t.Errorf("Width should be 150, got %d", m.terminalState.Width)
	}
	if m.terminalState.Height != 50 {
		t.Errorf("Height should be 50, got %d", m.terminalState.Height)
	}
}

// TestModel_ShowsWarningOnSmallTerminal verifies warning is shown when terminal is too small
func TestModel_ShowsWarningOnSmallTerminal(t *testing.T) {
	model := New()

	// Simulate receiving small WindowSizeMsg
	msg := tea.WindowSizeMsg{Width: 100, Height: 30}
	updatedModel, _ := model.Update(msg)

	m, ok := updatedModel.(*Model)
	if !ok {
		t.Fatal("Update should return *Model")
	}

	view := m.View()
	// View should contain warning about terminal size
	if len(view) == 0 {
		t.Error("View should not be empty")
	}
}

// TestModel_Ready_AfterValidWindowSize verifies model is ready after valid window size
func TestModel_Ready_AfterValidWindowSize(t *testing.T) {
	model := New()

	msg := tea.WindowSizeMsg{Width: 120, Height: 40}
	updatedModel, _ := model.Update(msg)

	m, ok := updatedModel.(*Model)
	if !ok {
		t.Fatal("Update should return *Model")
	}

	if !m.ready {
		t.Error("Model should be ready after valid WindowSizeMsg")
	}
}

// TestModel_NotReady_AfterInvalidWindowSize verifies model is not ready when terminal is too small
func TestModel_NotReady_AfterInvalidWindowSize(t *testing.T) {
	model := New()

	msg := tea.WindowSizeMsg{Width: 100, Height: 30}
	updatedModel, _ := model.Update(msg)

	m, ok := updatedModel.(*Model)
	if !ok {
		t.Fatal("Update should return *Model")
	}

	if m.ready {
		t.Error("Model should not be ready after invalid WindowSizeMsg")
	}
}

// TestModel_WindowSizeChange verifies model handles terminal resize correctly
func TestModel_WindowSizeChange(t *testing.T) {
	model := New()

	// First set valid size
	msg1 := tea.WindowSizeMsg{Width: 120, Height: 40}
	updatedModel, _ := model.Update(msg1)
	m := updatedModel.(*Model)

	if !m.ready {
		t.Error("Model should be ready after first valid WindowSizeMsg")
	}

	// Then resize to invalid
	msg2 := tea.WindowSizeMsg{Width: 100, Height: 30}
	updatedModel2, _ := m.Update(msg2)
	m2 := updatedModel2.(*Model)

	if m2.ready {
		t.Error("Model should not be ready after resize to invalid size")
	}
}

// TestFormatRecommendedSize formats the recommended size message correctly
func TestFormatRecommendedSize(t *testing.T) {
	msg := FormatRecommendedSize()
	if msg == "" {
		t.Error("FormatRecommendedSize should not return empty string")
	}
	// Should contain the minimum dimensions
	if len(msg) < 10 {
		t.Error("FormatRecommendedSize should be descriptive")
	}
}
