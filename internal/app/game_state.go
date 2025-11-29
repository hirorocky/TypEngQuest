// Package app は TypeBattle TUIゲームのゲーム状態管理を提供します。
package app

// GameState はゲーム全体の状態を保持する構造体です。
// プレイヤー情報、インベントリ、統計、実績、設定などを含みます。
// セーブ/ロード時にはこの構造体がJSON形式で永続化されます。
type GameState struct {
	// MaxLevelReached は到達した最高レベルを表します。
	// 初期値は0で、レベル1クリア後に1になります。
	// 挑戦可能な最大レベルは MaxLevelReached + 1 です。
	MaxLevelReached int

	// TODO: 以下のフィールドは今後のタスクで実装予定
	// player         *PlayerModel
	// inventory      *InventoryManager
	// agentManager   *AgentManager
	// statistics     *StatisticsManager
	// achievements   *AchievementManager
	// externalData   *ExternalData
	// settings       *Settings
}

// NewGameState はデフォルト値で新しいGameStateを作成します。
// 初回起動時やセーブデータが存在しない場合に使用されます。
func NewGameState() *GameState {
	return &GameState{
		MaxLevelReached: 0,
	}
}
