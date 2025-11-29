// Package app provides terminal environment validation for the TypeBattle TUI game.
// It implements terminal size detection, validation, and warning message generation
// according to the minimum requirements (120x40 characters).
package app

import (
	"fmt"
)

const (
	// MinTerminalWidth is the minimum required terminal width in characters.
	// This ensures proper display of the game interface including:
	// - Battle screen with enemy info, player HP, and module list
	// - Agent management screen with inventory display
	MinTerminalWidth = 120

	// MinTerminalHeight is the minimum required terminal height in characters.
	// This ensures proper display of:
	// - HP bars and status information
	// - Typing challenge text and progress
	// - Menu items and navigation
	MinTerminalHeight = 40
)

// TerminalSizeError represents an error when terminal size doesn't meet requirements.
type TerminalSizeError struct {
	CurrentWidth   int
	CurrentHeight  int
	RequiredWidth  int
	RequiredHeight int
}

// Error returns a descriptive error message with current and required dimensions.
func (e *TerminalSizeError) Error() string {
	return fmt.Sprintf(
		"terminal size too small: current %dx%d, required at least %dx%d",
		e.CurrentWidth, e.CurrentHeight,
		e.RequiredWidth, e.RequiredHeight,
	)
}

// CheckTerminalSize validates that the terminal dimensions meet minimum requirements.
// Returns nil if valid, or a TerminalSizeError if the terminal is too small.
func CheckTerminalSize(width, height int) error {
	if width < MinTerminalWidth || height < MinTerminalHeight {
		return &TerminalSizeError{
			CurrentWidth:   width,
			CurrentHeight:  height,
			RequiredWidth:  MinTerminalWidth,
			RequiredHeight: MinTerminalHeight,
		}
	}
	return nil
}

// TerminalState holds the current terminal dimensions and validation status.
type TerminalState struct {
	Width  int
	Height int
}

// NewTerminalState creates a new TerminalState with the given dimensions.
func NewTerminalState(width, height int) *TerminalState {
	return &TerminalState{
		Width:  width,
		Height: height,
	}
}

// IsValid returns true if the terminal size meets minimum requirements.
func (t *TerminalState) IsValid() bool {
	return CheckTerminalSize(t.Width, t.Height) == nil
}

// WarningMessage returns a warning message if the terminal is too small,
// or an empty string if the size is valid.
func (t *TerminalState) WarningMessage() string {
	if t.IsValid() {
		return ""
	}

	var widthWarning, heightWarning string

	if t.Width < MinTerminalWidth {
		widthWarning = fmt.Sprintf("Width: %d (requires %d)", t.Width, MinTerminalWidth)
	}

	if t.Height < MinTerminalHeight {
		heightWarning = fmt.Sprintf("Height: %d (requires %d)", t.Height, MinTerminalHeight)
	}

	msg := "Terminal size is too small.\n\n"

	if widthWarning != "" {
		msg += widthWarning + "\n"
	}
	if heightWarning != "" {
		msg += heightWarning + "\n"
	}

	msg += "\n" + FormatRecommendedSize()

	return msg
}

// FormatRecommendedSize returns a formatted string with the recommended terminal size.
func FormatRecommendedSize() string {
	return fmt.Sprintf("Please resize your terminal to at least %dx%d characters.",
		MinTerminalWidth, MinTerminalHeight)
}
