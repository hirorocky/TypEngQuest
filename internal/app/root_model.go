// Package app は BlitzTypingOperator TUIゲームのRootModelを提供します。
// RootModelはゲーム全体の状態管理とシーンルーティングを担当します。
package app

import (
	"io/fs"
	"log/slog"
	"os"
	"path/filepath"

	"hirorocky/type-battle/internal/agent"
	"hirorocky/type-battle/internal/battle"
	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/loader"
	"hirorocky/type-battle/internal/persistence"
	"hirorocky/type-battle/internal/reward"
	"hirorocky/type-battle/internal/startup"
	"hirorocky/type-battle/internal/tui/screens"

	tea "github.com/charmbracelet/bubbletea"
)

// RootModel は BlitzTypingOperatorゲームのメインアプリケーション状態を表します。
// Bubbletea TUIフレームワークのtea.Modelインターフェースを実装し、
// ゲーム全体の状態管理とシーン間の遷移を統括します。
//
// Elm Architectureパターンに基づき、以下の責務を持ちます：
// - ゲーム全体の状態（GameState）の保持
// - 現在のシーン（画面）の管理
// - メッセージを現在のシーンへルーティング
// - シーン遷移メッセージの処理
// - 起動時のセーブデータロード
// - バトル終了時のオートセーブ
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

	// saveDataIO はセーブデータの読み書きを担当します
	saveDataIO *persistence.SaveDataIO

	// statusMessage はステータスメッセージ（セーブ/ロード結果など）です
	statusMessage string

	// sceneRouter はシーン遷移を管理します
	sceneRouter *SceneRouter

	// 各シーンの画面インスタンス
	homeScreen              *screens.HomeScreen
	battleSelectScreen      *screens.BattleSelectScreen
	battleScreen            *screens.BattleScreen
	agentManagementScreen   *screens.AgentManagementScreen
	encyclopediaScreen      *screens.EncyclopediaScreen
	statsAchievementsScreen *screens.StatsAchievementsScreen
	settingsScreen          *screens.SettingsScreen
	rewardScreen            *screens.RewardScreen
}

// NewRootModel はデフォルトの初期状態で新しいRootModelを作成します。
// 初期シーンはSceneHome（ホーム画面）に設定されます。
// セーブデータが存在する場合は自動的にロードします。
// 外部データファイル（data/）から敵タイプ等を読み込みます。
//
// dataDir: 外部データディレクトリのパス（空の場合は埋め込みデータを使用）
// embeddedFS: 埋め込みファイルシステム（dataDir が空の場合に使用）
func NewRootModel(dataDir string, embeddedFS fs.FS) *RootModel {
	// セーブディレクトリを決定
	homeDir, _ := os.UserHomeDir()
	saveDir := filepath.Join(homeDir, ".BlitzTypingOperator")
	saveDataIO := persistence.NewSaveDataIO(saveDir)

	// 外部データをロード
	var dataLoader *loader.DataLoader
	if dataDir != "" {
		// 外部ディレクトリから読み込み
		dataLoader = loader.NewDataLoader(dataDir)
	} else {
		// 埋め込みFSから読み込み
		dataLoader = loader.NewEmbeddedDataLoader(embeddedFS, "data")
	}
	externalData, loadErr := dataLoader.LoadAllExternalData()

	// セーブデータをロードまたは新規作成
	var gameState *GameState
	var statusMessage string

	if saveDataIO.Exists() {
		saveData, err := saveDataIO.LoadGame()
		if err == nil {
			gameState = GameStateFromSaveData(saveData, externalData)
			statusMessage = "セーブデータをロードしました"
		} else {
			// セーブデータの読み込みに失敗した場合、新規ゲームを初期化
			initializer := startup.NewNewGameInitializer(externalData)
			saveData := initializer.InitializeNewGame()
			gameState = GameStateFromSaveData(saveData, externalData)
			statusMessage = "セーブデータの読み込みに失敗しました。新規ゲームを開始します"
		}
	} else {
		// セーブデータが存在しない場合、新規ゲームを初期化（マスタデータ参照）
		initializer := startup.NewNewGameInitializer(externalData)
		saveData := initializer.InitializeNewGame()
		gameState = GameStateFromSaveData(saveData, externalData)
		statusMessage = "新規ゲームを開始します"
	}

	// 外部データを設定
	if loadErr == nil && externalData != nil {
		gameState.SetExternalData(externalData)
		// EnemyGeneratorを外部データで再初期化
		gameState.UpdateEnemyGenerator(externalData.EnemyTypes)
	}

	// インベントリプロバイダーアダプターを作成（複数画面で共有）
	invAdapter := &inventoryProviderAdapter{
		inv:      gameState.Inventory(),
		agentMgr: gameState.AgentManager(),
		player:   gameState.Player(),
	}

	// ホーム画面を初期化（AgentProviderとして渡す）
	homeScreen := screens.NewHomeScreen(gameState.MaxLevelReached, invAdapter)
	homeScreen.SetStatusMessage(statusMessage)

	// バトル選択画面を初期化（AgentProviderとして渡す）
	battleSelectScreen := screens.NewBattleSelectScreen(
		gameState.MaxLevelReached,
		invAdapter,
	)

	// エージェント管理画面を初期化（InventoryProviderとして渡す）
	agentManagementScreen := screens.NewAgentManagementScreen(invAdapter)

	// 図鑑画面を初期化
	encyclopediaData := createDefaultEncyclopediaData()
	encyclopediaScreen := screens.NewEncyclopediaScreen(encyclopediaData)

	// 統計・実績画面を初期化
	statsData := createStatsDataFromGameState(gameState)
	statsAchievementsScreen := screens.NewStatsAchievementsScreen(statsData)

	// 設定画面を初期化
	settingsData := createSettingsDataFromGameState(gameState)
	settingsScreen := screens.NewSettingsScreen(settingsData)

	return &RootModel{
		ready:                   false,
		currentScene:            SceneHome,
		gameState:               gameState,
		styles:                  NewStyles(),
		saveDataIO:              saveDataIO,
		statusMessage:           statusMessage,
		sceneRouter:             NewSceneRouter(),
		homeScreen:              homeScreen,
		battleSelectScreen:      battleSelectScreen,
		agentManagementScreen:   agentManagementScreen,
		encyclopediaScreen:      encyclopediaScreen,
		statsAchievementsScreen: statsAchievementsScreen,
		settingsScreen:          settingsScreen,
	}
}

// inventoryProviderAdapter はInventoryManagerとAgentManagerをInventoryProviderインターフェースに適合させます。
// コア・モジュールの管理はInventoryManager、エージェント・装備の管理はAgentManagerが担当します。
type inventoryProviderAdapter struct {
	inv      *InventoryManager
	agentMgr *agent.AgentManager
	player   *domain.PlayerModel
}

func (a *inventoryProviderAdapter) GetCores() []*domain.CoreModel {
	return a.inv.GetCores()
}

func (a *inventoryProviderAdapter) GetModules() []*domain.ModuleModel {
	return a.inv.GetModules()
}

func (a *inventoryProviderAdapter) GetAgents() []*domain.AgentModel {
	return a.agentMgr.GetAgents()
}

func (a *inventoryProviderAdapter) GetEquippedAgents() []*domain.AgentModel {
	return a.agentMgr.GetEquippedAgents()
}

func (a *inventoryProviderAdapter) AddAgent(agent *domain.AgentModel) error {
	return a.agentMgr.AddAgent(agent)
}

func (a *inventoryProviderAdapter) RemoveCore(id string) error {
	return a.inv.RemoveCore(id)
}

func (a *inventoryProviderAdapter) RemoveModule(id string) error {
	return a.inv.RemoveModule(id)
}

func (a *inventoryProviderAdapter) EquipAgent(slot int, agentModel *domain.AgentModel) error {
	return a.agentMgr.EquipAgent(slot, agentModel.ID, a.player)
}

func (a *inventoryProviderAdapter) UnequipAgent(slot int) error {
	return a.agentMgr.UnequipAgent(slot, a.player)
}

// createStatsDataFromGameState はGameStateから統計データを生成します。
func createStatsDataFromGameState(gs *GameState) *screens.StatsTestData {
	stats := gs.Statistics()
	achievements := gs.Achievements()

	// 実績データを変換
	allAchievements := achievements.GetAllAchievements()
	achievementData := make([]screens.AchievementData, 0, len(allAchievements))
	for _, ach := range allAchievements {
		achievementData = append(achievementData, screens.AchievementData{
			ID:          ach.ID,
			Name:        ach.Name,
			Description: ach.Description,
			Achieved:    achievements.IsUnlocked(ach.ID),
		})
	}

	return &screens.StatsTestData{
		TypingStats: screens.TypingStatsData{
			MaxWPM:               stats.Typing().MaxWPM,
			AverageWPM:           stats.GetAverageWPM(),
			PerfectAccuracyCount: stats.Typing().PerfectAccuracyCount,
			TotalCharacters:      stats.Typing().TotalCharacters,
		},
		BattleStats: screens.BattleStatsData{
			TotalBattles:    stats.Battle().TotalBattles,
			Wins:            stats.Battle().Wins,
			Losses:          stats.Battle().Losses,
			MaxLevelReached: gs.MaxLevelReached,
		},
		Achievements: achievementData,
	}
}

// createSettingsDataFromGameState はGameStateから設定データを生成します。
func createSettingsDataFromGameState(gs *GameState) *screens.SettingsData {
	settings := gs.Settings()
	return &screens.SettingsData{
		Keybinds:    settings.Keybinds(),
		SoundVolume: settings.SoundVolume(),
		Difficulty:  string(settings.Difficulty()),
	}
}

// createDefaultEncyclopediaData は図鑑のデフォルトデータを作成します。
func createDefaultEncyclopediaData() *screens.EncyclopediaTestData {
	coreTypes := []domain.CoreType{
		{
			ID:             "all_rounder",
			Name:           "オールラウンダー",
			StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
			PassiveSkillID: "balance_mastery",
			AllowedTags:    []string{"physical_low", "magic_low", "heal_low", "buff_low", "debuff_low"},
			MinDropLevel:   1,
		},
		{
			ID:             "attacker",
			Name:           "攻撃バランス",
			StatWeights:    map[string]float64{"STR": 1.2, "MAG": 1.2, "SPD": 0.8, "LUK": 0.8},
			PassiveSkillID: "attack_boost",
			AllowedTags:    []string{"physical_low", "physical_mid", "magic_low", "magic_mid"},
			MinDropLevel:   1,
		},
		{
			ID:             "healer",
			Name:           "ヒーラー",
			StatWeights:    map[string]float64{"STR": 0.8, "MAG": 1.4, "SPD": 0.9, "LUK": 0.9},
			PassiveSkillID: "heal_boost",
			AllowedTags:    []string{"heal_low", "heal_mid", "magic_low", "buff_low"},
			MinDropLevel:   5,
		},
		{
			ID:             "tank",
			Name:           "タンク",
			StatWeights:    map[string]float64{"STR": 1.1, "MAG": 0.7, "SPD": 0.7, "LUK": 1.5},
			PassiveSkillID: "defense_boost",
			AllowedTags:    []string{"physical_low", "buff_low", "buff_mid"},
			MinDropLevel:   3,
		},
	}
	moduleTypes := []screens.ModuleTypeInfo{
		{ID: "physical_lv1", Name: "物理攻撃Lv1", Category: domain.PhysicalAttack, Level: 1, Description: "基本的な物理攻撃"},
		{ID: "magic_lv1", Name: "魔法攻撃Lv1", Category: domain.MagicAttack, Level: 1, Description: "基本的な魔法攻撃"},
		{ID: "heal_lv1", Name: "回復Lv1", Category: domain.Heal, Level: 1, Description: "基本的な回復"},
		{ID: "buff_lv1", Name: "バフLv1", Category: domain.Buff, Level: 1, Description: "味方を強化"},
		{ID: "debuff_lv1", Name: "デバフLv1", Category: domain.Debuff, Level: 1, Description: "敵を弱体化"},
	}
	enemyTypes := []domain.EnemyType{
		{ID: "goblin", Name: "ゴブリン", BaseHP: 100, BaseAttackPower: 10, BaseAttackInterval: 3000000000, AttackType: "physical"},
		{ID: "orc", Name: "オーク", BaseHP: 200, BaseAttackPower: 15, BaseAttackInterval: 4000000000, AttackType: "physical"},
		{ID: "dragon", Name: "ドラゴン", BaseHP: 500, BaseAttackPower: 30, BaseAttackInterval: 5000000000, AttackType: "magic"},
	}

	return &screens.EncyclopediaTestData{
		AllCoreTypes:        coreTypes,
		AllModuleTypes:      moduleTypes,
		AllEnemyTypes:       enemyTypes,
		AcquiredCoreTypes:   []string{"all_rounder"},
		AcquiredModuleTypes: []string{"physical_lv1"},
		EncounteredEnemies:  []string{},
	}
}

// createEncyclopediaDataFromGameState はGameStateから図鑑データを生成します。
func createEncyclopediaDataFromGameState(gs *GameState) *screens.EncyclopediaTestData {
	// 基本データを取得
	baseData := createDefaultEncyclopediaData()

	// 所持コアタイプを取得
	acquiredCoreTypes := make([]string, 0)
	for _, core := range gs.Inventory().GetCores() {
		acquiredCoreTypes = append(acquiredCoreTypes, core.Type.ID)
	}

	// 所持モジュールタイプを取得
	acquiredModuleTypes := make([]string, 0)
	for _, module := range gs.Inventory().GetModules() {
		acquiredModuleTypes = append(acquiredModuleTypes, module.ID)
	}

	return &screens.EncyclopediaTestData{
		AllCoreTypes:        baseData.AllCoreTypes,
		AllModuleTypes:      baseData.AllModuleTypes,
		AllEnemyTypes:       baseData.AllEnemyTypes,
		AcquiredCoreTypes:   acquiredCoreTypes,
		AcquiredModuleTypes: acquiredModuleTypes,
		EncounteredEnemies:  gs.GetEncounteredEnemies(),
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
		cmd := m.startBattle(msg.Level)
		return m, cmd

	case screens.BattleTickMsg:
		// バトル画面のtickメッセージを転送
		if m.currentScene == SceneBattle && m.battleScreen != nil {
			_, cmd := m.battleScreen.Update(msg)
			return m, cmd
		}

	case screens.BattleResultMsg:
		// バトル結果を処理
		m.handleBattleResult(msg)
		return m, nil
	}
	return m, nil
}

// handleBattleResult はバトル結果を処理します。
func (m *RootModel) handleBattleResult(result screens.BattleResultMsg) {
	stats := m.gameState.Statistics()

	// バトル統計を転送（勝敗に関わらず記録）
	if result.Stats != nil {
		// ダメージ統計を記録
		stats.RecordDamageDealt(result.Stats.TotalDamageDealt)
		stats.RecordDamageTaken(result.Stats.TotalDamageTaken)
		stats.RecordHealing(result.Stats.TotalHealAmount)

		// タイピング統計を記録（平均値を計算）
		if result.Stats.TotalTypingCount > 0 {
			avgWPM := result.Stats.TotalWPM / float64(result.Stats.TotalTypingCount)
			avgAccuracy := result.Stats.TotalAccuracy / float64(result.Stats.TotalTypingCount)
			stats.RecordTypingStats(avgWPM, avgAccuracy)
		}
	}

	// 敵図鑑を更新
	m.gameState.AddEncounteredEnemy(result.EnemyID)

	if result.Victory {
		// 勝利時：統計を記録し、最高レベルを更新
		m.gameState.RecordBattleVictory(result.Level)

		// ノーダメージ判定付きで実績チェック
		noDamage := result.Stats != nil && result.Stats.TotalDamageTaken == 0
		m.gameState.CheckBattleAchievementsWithNoDamage(noDamage)

		// バトル統計を変換
		rewardStats := convertBattleStatsToRewardStats(result.Stats)

		// 報酬を計算
		rewardResult := m.gameState.RewardCalculator().CalculateRewards(
			true,
			rewardStats,
			result.Level,
		)

		// 報酬をインベントリに追加
		m.gameState.AddRewardsToInventory(rewardResult)

		// 報酬画面を作成
		m.rewardScreen = screens.NewRewardScreen(rewardResult)

		// 報酬画面へ遷移
		m.currentScene = SceneReward
	} else {
		// 敗北時：統計を記録
		m.gameState.RecordBattleDefeat(result.Level)

		// ホーム画面の最高到達レベルを更新してホームに戻る
		m.homeScreen.SetMaxLevelReached(m.gameState.MaxLevelReached)
		m.currentScene = SceneHome
	}

	// オートセーブ（勝敗に関わらず実行）
	m.performAutoSave()

	m.battleScreen = nil
}

// performAutoSave はオートセーブを実行します。
func (m *RootModel) performAutoSave() {
	if m.saveDataIO == nil {
		return
	}

	saveData := m.gameState.ToSaveData()
	if err := m.saveDataIO.SaveGame(saveData); err != nil {
		slog.Error("オートセーブに失敗",
			slog.Any("error", err),
		)
		m.statusMessage = "オートセーブに失敗しました"
		m.homeScreen.SetStatusMessage(m.statusMessage)
	} else {
		m.statusMessage = "オートセーブしました"
		m.homeScreen.SetStatusMessage(m.statusMessage)
	}
}

// convertBattleStatsToRewardStats はバトル統計を報酬用統計に変換します。
func convertBattleStatsToRewardStats(stats *battle.BattleStatistics) *reward.BattleStatistics {
	if stats == nil {
		return &reward.BattleStatistics{}
	}
	return &reward.BattleStatistics{
		TotalWPM:         stats.TotalWPM,
		TotalAccuracy:    stats.TotalAccuracy,
		TotalTypingCount: stats.TotalTypingCount,
		TotalDamageDealt: stats.TotalDamageDealt,
		TotalDamageTaken: stats.TotalDamageTaken,
		TotalHealAmount:  stats.TotalHealAmount,
	}
}

// startBattle はバトルを開始します。
func (m *RootModel) startBattle(level int) tea.Cmd {
	// 敵を生成
	enemy := m.gameState.EnemyGenerator().Generate(level)

	// GameStateからプレイヤーとエージェントを取得
	m.gameState.PreparePlayerForBattle()
	player := m.gameState.Player()
	agents := m.gameState.GetEquippedAgents()

	// バトル画面を作成
	m.battleScreen = screens.NewBattleScreen(enemy, player, agents)

	// シーンを切り替え
	m.currentScene = SceneBattle

	// バトル画面を初期化（tickコマンドを開始）
	return m.battleScreen.Init()
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
	case SceneReward:
		if m.rewardScreen != nil {
			_, cmd = m.rewardScreen.Update(msg)
		}
	}

	return m, cmd
}

// handleScreenSceneChange は画面からのシーン遷移要求を処理します。
func (m *RootModel) handleScreenSceneChange(sceneName string) {
	// ホーム画面から別の画面に遷移する場合、ステータスメッセージをクリア
	if m.currentScene == SceneHome && sceneName != "home" {
		m.homeScreen.ClearStatusMessage()
	}

	// シーン固有の前処理を実行
	m.prepareSceneTransition(sceneName)

	// SceneRouterを使用してシーンを取得
	m.currentScene = m.sceneRouter.Route(sceneName)
}

// prepareSceneTransition はシーン遷移前の準備処理を実行します。
func (m *RootModel) prepareSceneTransition(sceneName string) {
	switch sceneName {
	case "home":
		// ホーム画面の最高到達レベルを更新
		m.homeScreen.SetMaxLevelReached(m.gameState.MaxLevelReached)
	case "battle_select":
		// バトル選択画面を再初期化してリセット
		invAdapter := &inventoryProviderAdapter{
			inv:      m.gameState.Inventory(),
			agentMgr: m.gameState.AgentManager(),
			player:   m.gameState.Player(),
		}
		m.battleSelectScreen = screens.NewBattleSelectScreen(
			m.gameState.MaxLevelReached,
			invAdapter,
		)
	case "encyclopedia":
		// 最新の図鑑データで画面を再初期化
		encycData := createEncyclopediaDataFromGameState(m.gameState)
		m.encyclopediaScreen = screens.NewEncyclopediaScreen(encycData)
	case "stats_achievements":
		// 最新の統計データで画面を再初期化
		statsData := createStatsDataFromGameState(m.gameState)
		m.statsAchievementsScreen = screens.NewStatsAchievementsScreen(statsData)
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
	case SceneReward:
		if m.rewardScreen != nil {
			return m.rewardScreen.View()
		}
		return m.renderPlaceholder("報酬画面")
	}

	return m.renderPlaceholder("不明な画面")
}

// renderPlaceholder はプレースホルダー画面をレンダリングします。
func (m *RootModel) renderPlaceholder(name string) string {
	title := m.styles.Title.Render("BlitzTypingOperator")
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
