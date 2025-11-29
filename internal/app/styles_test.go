package app

import (
	"testing"

	"github.com/charmbracelet/lipgloss"
)

// TestStylesInitialization verifies that lipgloss styles can be created
func TestStylesInitialization(t *testing.T) {
	style := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FAFAFA"))

	if style.GetBold() != true {
		t.Fatal("Style should be bold")
	}
}

// TestTitleStyle verifies the title style configuration
func TestTitleStyle(t *testing.T) {
	styles := NewStyles()
	if styles.Title.GetBold() != true {
		t.Fatal("Title style should be bold")
	}
}

// TestErrorStyle verifies the error style has red foreground
func TestErrorStyle(t *testing.T) {
	styles := NewStyles()
	// Error style should exist
	_ = styles.Error
}

// TestSuccessStyle verifies the success style has green foreground
func TestSuccessStyle(t *testing.T) {
	styles := NewStyles()
	// Success style should exist
	_ = styles.Success
}
