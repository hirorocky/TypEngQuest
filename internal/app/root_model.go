// Package app は TypeBattle TUIゲームのRootModelを提供します。
// RootModelはゲーム全体の状態管理とシーンルーティングを担当します。
package app

import (
	tea "github.com/charmbracelet/bubbletea"
)

// RootModel は TypeBattleゲームのメインアプリケーション状態を表します。
// Bubbletea TUIフレームワークのtea.Modelインターフェースを実装し、
// ゲーム全体の状態管理とシーン間の遷移を統括します。
//
// Elm Architectureパターンに基づき、以下の責務を持ちます：
// - ゲーム全体の状態（GameState）の保持
// - 現在のシーン（画面）の管理
// - メッセージを現在のシーンへルーティング
// - シーン遷移メッセージの処理
// - 起動時のセーブデータロード（将来実装）
// - 終了時の状態保存（将来実装）
type RootModel struct {
	// ready はアプリケーションが初期化され、
	// ターミナルサイズが最小要件を満たしているかを示します
	ready bool

	// currentScene は現在表示中のシーンを表します
	currentScene Scene

	// gameState はゲーム全体の共有状態を保持します
	gameState *GameState

	// terminalState は現在のターミナルサイズと検証状態を保持します
	terminalState *TerminalState

	// styles はアプリケーションのlipglossスタイルを保持します
	styles *Styles

	// TODO: 以下のフィールドは今後のタスクで実装予定
	// homeScreen         *HomeScreen
	// battleScreen       *BattleScreen
	// agentScreen        *AgentManagementScreen
	// encyclopediaScreen *EncyclopediaScreen
	// achievementScreen  *AchievementScreen
	// settingsScreen     *SettingsScreen
	// errorMessage       string
}

// NewRootModel はデフォルトの初期状態で新しいRootModelを作成します。
// 初期シーンはSceneHome（ホーム画面）に設定されます。
func NewRootModel() *RootModel {
	return &RootModel{
		ready:        false,
		currentScene: SceneHome,
		gameState:    NewGameState(),
		styles:       NewStyles(),
	}
}

// Init はアプリケーションを初期化し、初期コマンドを返します。
// これはBubbleteaプログラム開始時に一度だけ呼び出されます。
// 将来的にはセーブデータのロードやデータファイルの読み込みを行います。
func (m *RootModel) Init() tea.Cmd {
	// 将来的にセーブデータのロードなどを行う
	return nil
}

// Update は受信メッセージを処理し、モデルの状態を更新します。
// Elm Architectureのコアとなるメソッドで、すべての状態変更はここを通じて行われます。
//
// 処理されるメッセージ：
// - tea.WindowSizeMsg: ターミナルサイズの変更
// - tea.KeyMsg: キーボード入力（終了操作など）
// - ChangeSceneMsg: シーン遷移要求
//
// 更新されたモデルと実行するコマンドを返します。
func (m *RootModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.terminalState = NewTerminalState(msg.Width, msg.Height)
		m.ready = m.terminalState.IsValid()
		return m, nil

	case tea.KeyMsg:
		return m.handleKeyMsg(msg)

	case ChangeSceneMsg:
		m.currentScene = msg.Scene
		return m, nil
	}
	return m, nil
}

// handleKeyMsg はキーボード入力を処理します。
func (m *RootModel) handleKeyMsg(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "q", "ctrl+c":
		// 終了操作: tea.Quitを返してプログラムを終了
		// Bubbleteaの tea.WithAltScreen() により自動的にターミナル状態が復元される
		return m, tea.Quit
	}
	return m, nil
}

// View はアプリケーションの現在の状態を文字列としてレンダリングします。
// 現在のシーンに応じて適切な画面を描画します。
func (m *RootModel) View() string {
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

	// 現在のシーンに応じてビューを描画
	return m.renderCurrentScene()
}

// renderCurrentScene は現在のシーンに応じたビューを返します。
// 将来的には各シーンコンポーネントのViewメソッドを呼び出します。
func (m *RootModel) renderCurrentScene() string {
	title := m.styles.Title.Render("TypeBattle - Terminal Typing Battle Game")
	sceneInfo := m.styles.Subtle.Render("Current scene: " + m.currentScene.String())
	quitHint := m.styles.Subtle.Render("Press q to quit.")

	// TODO: 各シーンのビューをここで切り替える
	// switch m.currentScene {
	// case SceneHome:
	//     return m.homeScreen.View()
	// case SceneBattle:
	//     return m.battleScreen.View()
	// ...
	// }

	return title + "\n\n" + sceneInfo + "\n\n" + quitHint
}

// GameState はゲーム全体の状態への参照を返します。
func (m *RootModel) GameState() *GameState {
	return m.gameState
}

// CurrentScene は現在表示中のシーンを返します。
func (m *RootModel) CurrentScene() Scene {
	return m.currentScene
}

// ChangeScene は現在のシーンを指定されたシーンに変更します。
// シーン遷移時のバリデーションや前処理が必要な場合はこのメソッドで行います。
func (m *RootModel) ChangeScene(scene Scene) {
	m.currentScene = scene
}

// TerminalState は現在のターミナル状態への参照を返します。
// WindowSizeMsgを受信するまではnilが返されます。
func (m *RootModel) TerminalState() *TerminalState {
	return m.terminalState
}

// Styles はアプリケーションのスタイル設定への参照を返します。
func (m *RootModel) Styles() *Styles {
	return m.styles
}

// IsReady はアプリケーションが使用可能な状態かどうかを返します。
// ターミナルサイズが最小要件を満たしている場合にtrueを返します。
func (m *RootModel) IsReady() bool {
	return m.ready
}
