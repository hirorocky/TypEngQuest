package app

import (
	"testing"

	"github.com/charmbracelet/bubbles/progress"
)

// TestBubblesProgressAvailable verifies that bubbles progress component is available
func TestBubblesProgressAvailable(t *testing.T) {
	// Create a progress bar to verify bubbles is properly imported
	p := progress.New(progress.WithDefaultGradient())
	if p.Width == 0 {
		// Width can be 0 by default, that's fine
	}
	// Just verify it can be created without panic
}
