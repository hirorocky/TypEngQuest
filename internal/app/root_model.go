// Package app は TypeBattle TUIゲームのRootModelを提供します。
// RootModelはゲーム全体の状態管理とシーンルーティングを担当します。
package app

import (
	tea "github.com/charmbracelet/bubbletea"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/tui/screens"
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

	// inventory はゲームのインベントリを管理します
	inventory *MockInventory

	// 各シーンの画面インスタンス
	homeScreen              *screens.HomeScreen
	battleSelectScreen      *screens.BattleSelectScreen
	battleScreen            *screens.BattleScreen
	agentManagementScreen   *screens.AgentManagementScreen
	encyclopediaScreen      *screens.EncyclopediaScreen
	statsAchievementsScreen *screens.StatsAchievementsScreen
	settingsScreen          *screens.SettingsScreen
}

// NewRootModel はデフォルトの初期状態で新しいRootModelを作成します。
// 初期シーンはSceneHome（ホーム画面）に設定されます。
func NewRootModel() *RootModel {
	gameState := NewGameState()
	inventory := NewMockInventory()

	// ホーム画面を初期化
	homeScreen := screens.NewHomeScreen(0, nil)

	// バトル選択画面を初期化
	battleSelectScreen := screens.NewBattleSelectScreen(
		gameState.MaxLevelReached,
		inventory.GetEquippedAgents(),
	)

	// エージェント管理画面を初期化
	agentManagementScreen := screens.NewAgentManagementScreen(inventory)

	// 図鑑画面を初期化
	encyclopediaData := createDefaultEncyclopediaData()
	encyclopediaScreen := screens.NewEncyclopediaScreen(encyclopediaData)

	// 統計・実績画面を初期化
	statsData := createDefaultStatsData()
	statsAchievementsScreen := screens.NewStatsAchievementsScreen(statsData)

	// 設定画面を初期化
	settingsData := createDefaultSettingsData()
	settingsScreen := screens.NewSettingsScreen(settingsData)

	return &RootModel{
		ready:                   false,
		currentScene:            SceneHome,
		gameState:               gameState,
		styles:                  NewStyles(),
		inventory:               inventory,
		homeScreen:              homeScreen,
		battleSelectScreen:      battleSelectScreen,
		agentManagementScreen:   agentManagementScreen,
		encyclopediaScreen:      encyclopediaScreen,
		statsAchievementsScreen: statsAchievementsScreen,
		settingsScreen:          settingsScreen,
	}
}

// createDefaultEncyclopediaData は図鑑のデフォルトデータを作成します。
func createDefaultEncyclopediaData() *screens.EncyclopediaTestData {
	coreTypes := GetAllCoreTypes()
	moduleTypes := []screens.ModuleTypeInfo{
		{ID: "physical_lv1", Name: "物理攻撃Lv1", Category: domain.PhysicalAttack, Level: 1, Description: "基本的な物理攻撃"},
		{ID: "magic_lv1", Name: "魔法攻撃Lv1", Category: domain.MagicAttack, Level: 1, Description: "基本的な魔法攻撃"},
		{ID: "heal_lv1", Name: "回復Lv1", Category: domain.Heal, Level: 1, Description: "基本的な回復"},
		{ID: "buff_lv1", Name: "バフLv1", Category: domain.Buff, Level: 1, Description: "味方を強化"},
		{ID: "debuff_lv1", Name: "デバフLv1", Category: domain.Debuff, Level: 1, Description: "敵を弱体化"},
	}
	enemyTypes := GetAllEnemyTypes()

	return &screens.EncyclopediaTestData{
		AllCoreTypes:        coreTypes,
		AllModuleTypes:      moduleTypes,
		AllEnemyTypes:       enemyTypes,
		AcquiredCoreTypes:   []string{"all_rounder"},
		AcquiredModuleTypes: []string{"physical_lv1"},
		EncounteredEnemies:  []string{},
	}
}

// createDefaultStatsData は統計のデフォルトデータを作成します。
func createDefaultStatsData() *screens.StatsTestData {
	return &screens.StatsTestData{
		TypingStats: screens.TypingStatsData{
			MaxWPM:               0,
			AverageWPM:           0,
			PerfectAccuracyCount: 0,
			TotalCharacters:      0,
		},
		BattleStats: screens.BattleStatsData{
			TotalBattles:    0,
			Wins:            0,
			Losses:          0,
			MaxLevelReached: 0,
		},
		Achievements: []screens.AchievementData{
			{ID: "wpm_50", Name: "タイピスト見習い", Description: "WPM 50達成", Achieved: false},
			{ID: "wpm_80", Name: "タイピスト", Description: "WPM 80達成", Achieved: false},
			{ID: "wpm_100", Name: "タイピストマスター", Description: "WPM 100達成", Achieved: false},
			{ID: "enemy_10", Name: "初陣の勇者", Description: "敵10体撃破", Achieved: false},
			{ID: "enemy_50", Name: "熟練の戦士", Description: "敵50体撃破", Achieved: false},
			{ID: "level_10", Name: "Lv10到達", Description: "レベル10に到達", Achieved: false},
		},
	}
}

// createDefaultSettingsData は設定のデフォルトデータを作成します。
func createDefaultSettingsData() *screens.SettingsData {
	return &screens.SettingsData{
		Keybinds: map[string]string{
			"select":     "enter",
			"cancel":     "esc",
			"move_up":    "k",
			"move_down":  "j",
			"move_left":  "h",
			"move_right": "l",
		},
		SoundVolume: 100,
		Difficulty:  "normal",
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
// - screens.ChangeSceneMsg: 各画面からのシーン遷移要求
//
// 更新されたモデルと実行するコマンドを返します。
func (m *RootModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.terminalState = NewTerminalState(msg.Width, msg.Height)
		m.ready = m.terminalState.IsValid()
		// 各画面にもサイズ変更を通知
		if m.homeScreen != nil {
			m.homeScreen.Update(msg)
		}
		return m, nil

	case tea.KeyMsg:
		// グローバルなキー処理
		switch msg.String() {
		case "ctrl+c":
			return m, tea.Quit
		case "esc":
			// ホーム画面以外ならホームに戻る
			if m.currentScene != SceneHome {
				m.currentScene = SceneHome
				return m, nil
			}
		case "q":
			// ホーム画面でのみ終了可能
			if m.currentScene == SceneHome {
				return m, tea.Quit
			}
		}
		// 各画面に入力を転送
		return m.forwardToCurrentScene(msg)

	case ChangeSceneMsg:
		m.currentScene = msg.Scene
		return m, nil

	case screens.ChangeSceneMsg:
		// 画面からのシーン遷移要求を処理
		m.handleScreenSceneChange(msg.Scene)
		return m, nil

	case screens.StartBattleMsg:
		// バトル開始メッセージを処理
		m.startBattle(msg.Level)
		return m, nil
	}
	return m, nil
}

// startBattle はバトルを開始します。
func (m *RootModel) startBattle(level int) {
	// 敵を生成
	enemy := GenerateEnemy(level)

	// 装備中エージェントを取得
	agents := m.inventory.GetEquippedAgents()

	// プレイヤーを作成
	player := domain.NewPlayer()
	player.RecalculateHP(agents)
	player.PrepareForBattle()

	// バトル画面を作成
	m.battleScreen = screens.NewBattleScreen(enemy, player, agents)

	// シーンを切り替え
	m.currentScene = SceneBattle
}

// forwardToCurrentScene は現在のシーンにメッセージを転送します。
func (m *RootModel) forwardToCurrentScene(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd

	switch m.currentScene {
	case SceneHome:
		if m.homeScreen != nil {
			_, cmd = m.homeScreen.Update(msg)
		}
	case SceneBattleSelect:
		if m.battleSelectScreen != nil {
			_, cmd = m.battleSelectScreen.Update(msg)
		}
	case SceneBattle:
		if m.battleScreen != nil {
			_, cmd = m.battleScreen.Update(msg)
		}
	case SceneAgentManagement:
		if m.agentManagementScreen != nil {
			_, cmd = m.agentManagementScreen.Update(msg)
		}
	case SceneEncyclopedia:
		if m.encyclopediaScreen != nil {
			_, cmd = m.encyclopediaScreen.Update(msg)
		}
	case SceneAchievement:
		if m.statsAchievementsScreen != nil {
			_, cmd = m.statsAchievementsScreen.Update(msg)
		}
	case SceneSettings:
		if m.settingsScreen != nil {
			_, cmd = m.settingsScreen.Update(msg)
		}
	}

	return m, cmd
}

// handleScreenSceneChange は画面からのシーン遷移要求を処理します。
func (m *RootModel) handleScreenSceneChange(sceneName string) {
	switch sceneName {
	case "home":
		m.currentScene = SceneHome
	case "battle_select":
		m.currentScene = SceneBattleSelect
	case "battle":
		m.currentScene = SceneBattle
	case "agent_management":
		m.currentScene = SceneAgentManagement
	case "encyclopedia":
		m.currentScene = SceneEncyclopedia
	case "stats_achievements":
		m.currentScene = SceneAchievement
	case "settings":
		m.currentScene = SceneSettings
	}
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
func (m *RootModel) renderCurrentScene() string {
	switch m.currentScene {
	case SceneHome:
		if m.homeScreen != nil {
			return m.homeScreen.View()
		}
	case SceneBattleSelect:
		if m.battleSelectScreen != nil {
			return m.battleSelectScreen.View()
		}
		return m.renderPlaceholder("バトル選択画面")
	case SceneBattle:
		if m.battleScreen != nil {
			return m.battleScreen.View()
		}
		return m.renderPlaceholder("バトル画面")
	case SceneAgentManagement:
		if m.agentManagementScreen != nil {
			return m.agentManagementScreen.View()
		}
		return m.renderPlaceholder("エージェント管理画面")
	case SceneEncyclopedia:
		if m.encyclopediaScreen != nil {
			return m.encyclopediaScreen.View()
		}
		return m.renderPlaceholder("図鑑画面")
	case SceneAchievement:
		if m.statsAchievementsScreen != nil {
			return m.statsAchievementsScreen.View()
		}
		return m.renderPlaceholder("統計・実績画面")
	case SceneSettings:
		if m.settingsScreen != nil {
			return m.settingsScreen.View()
		}
		return m.renderPlaceholder("設定画面")
	}

	return m.renderPlaceholder("不明な画面")
}

// renderPlaceholder はプレースホルダー画面をレンダリングします。
func (m *RootModel) renderPlaceholder(name string) string {
	title := m.styles.Title.Render("TypeBattle")
	info := m.styles.Subtle.Render(name + " (準備中)")
	hint := m.styles.Subtle.Render("Esc: ホームに戻る  q: 終了")
	return title + "\n\n" + info + "\n\n" + hint
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
