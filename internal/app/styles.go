package app

import (
	"github.com/charmbracelet/lipgloss"
)

// Colors defines the color palette for the application
var (
	ColorPrimary   = lipgloss.Color("#7D56F4")
	ColorSecondary = lipgloss.Color("#FAFAFA")
	ColorSuccess   = lipgloss.Color("#04B575")
	ColorError     = lipgloss.Color("#FF4672")
	ColorWarning   = lipgloss.Color("#FFB454")
	ColorSubtle    = lipgloss.Color("#6C6C6C")
)

// Styles holds all the lipgloss styles used throughout the application
type Styles struct {
	Title   lipgloss.Style
	Error   lipgloss.Style
	Success lipgloss.Style
	Warning lipgloss.Style
	Subtle  lipgloss.Style
	Border  lipgloss.Style
}

// NewStyles creates and returns a new Styles instance with default configurations
func NewStyles() *Styles {
	return &Styles{
		Title: lipgloss.NewStyle().
			Bold(true).
			Foreground(ColorPrimary).
			MarginBottom(1),

		Error: lipgloss.NewStyle().
			Foreground(ColorError).
			Bold(true),

		Success: lipgloss.NewStyle().
			Foreground(ColorSuccess).
			Bold(true),

		Warning: lipgloss.NewStyle().
			Foreground(ColorWarning),

		Subtle: lipgloss.NewStyle().
			Foreground(ColorSubtle),

		Border: lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorPrimary).
			Padding(1, 2),
	}
}
