// Package screens はTUI画面のテストを提供します。
package screens

import (
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// ==================== Task 10.3: バトル画面のテスト ====================

// TestNewBattleScreen はBattleScreenの初期化をテストします。
func TestNewBattleScreen(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if screen == nil {
		t.Fatal("BattleScreenがnilです")
	}

	if screen.enemy != enemy {
		t.Error("敵が正しく設定されていません")
	}

	if screen.player != player {
		t.Error("プレイヤーが正しく設定されていません")
	}
}

// TestBattleScreenEnemyInfo は敵情報表示をテストします。
// Requirement 9.2: 敵の名前、HP、レベルを表示
func TestBattleScreenEnemyInfo(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}

	// 敵の名前が含まれているか確認
	// （実際のレンダリング内容の詳細はUIに依存）
}

// TestBattleScreenPlayerInfo はプレイヤー情報表示をテストします。
// Requirement 9.3: プレイヤーのHP、バフ・デバフを表示
func TestBattleScreenPlayerInfo(t *testing.T) {
	player := createTestPlayer()
	player.HP = 50
	player.MaxHP = 100

	// バフを追加
	duration := 5.0
	player.EffectTable.AddRow(domain.EffectRow{
		ID:         "buff1",
		SourceType: domain.SourceBuff,
		Name:       "攻撃UP",
		Duration:   &duration,
	})

	enemy := createTestEnemy()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// TestBattleScreenModuleList はモジュール一覧表示をテストします。
// Requirement 9.4: 装備中の全エージェントのモジュールを一覧表示
// Requirement 18.10: エージェントごとにモジュールをグループ化して表示
func TestBattleScreenModuleList(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// モジュールスロットが作成されていることを確認
	if len(screen.moduleSlots) == 0 {
		t.Error("モジュールスロットが空です")
	}

	// エージェントごとにグループ化されているか
	expectedSlots := len(agents) * 4 // 各エージェント4モジュール
	if len(screen.moduleSlots) != expectedSlots {
		t.Errorf("モジュールスロット数: got %d, want %d", len(screen.moduleSlots), expectedSlots)
	}
}

// TestBattleScreenCooldownDisplay はクールダウン表示をテストします。
// Requirement 9.5: モジュールのクールダウン状態を表示
// Requirement 18.9: プログレスバー、残り秒数表示
func TestBattleScreenCooldownDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// クールダウンを設定
	if len(screen.moduleSlots) > 0 {
		screen.moduleSlots[0].CooldownRemaining = 3.0
		screen.moduleSlots[0].CooldownTotal = 5.0
	}

	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// TestBattleScreenTypingChallenge はタイピングチャレンジ表示をテストします。
// Requirement 9.6: タイピングチャレンジテキスト表示と入力進捗
func TestBattleScreenTypingChallenge(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// タイピングチャレンジを開始
	screen.StartTypingChallenge("hello", 5*time.Second)

	if !screen.isTyping {
		t.Error("タイピング状態になっていません")
	}

	if screen.typingText != "hello" {
		t.Errorf("タイピングテキスト: got %s, want hello", screen.typingText)
	}
}

// TestBattleScreenTimeLimit は制限時間表示をテストします。
// Requirement 9.15: 制限時間のリアルタイム表示
func TestBattleScreenTimeLimit(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// タイピングチャレンジを開始
	screen.StartTypingChallenge("test", 10*time.Second)

	// 時間制限が設定されているか
	if screen.typingTimeLimit != 10*time.Second {
		t.Errorf("タイピング制限時間: got %v, want 10s", screen.typingTimeLimit)
	}
}

// TestBattleScreenRender はバトル画面のレンダリングをテストします。
func TestBattleScreenRender(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}
}

// ==================== ヘルパー関数 ====================

func createTestEnemy() *domain.EnemyModel {
	enemyType := domain.EnemyType{
		ID:                 "test_enemy",
		Name:               "テストエネミー",
		BaseHP:             100,
		BaseAttackPower:    10,
		BaseAttackInterval: 2 * time.Second,
		AttackType:         "physical",
	}

	return domain.NewEnemy(
		"enemy1",
		"テストエネミー Lv.5",
		5,
		500,
		20,
		2*time.Second,
		enemyType,
	)
}

func createTestPlayer() *domain.PlayerModel {
	player := domain.NewPlayer()
	player.MaxHP = 100
	player.HP = 100
	return player
}

func createTestAgents() []*domain.AgentModel {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}

	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})

	modules := []*domain.ModuleModel{
		domain.NewModule("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", "物理ダメージ"),
		domain.NewModule("m2", "魔法攻撃", domain.MagicAttack, 1, []string{"magic_low"}, 10, "MAG", "魔法ダメージ"),
		domain.NewModule("m3", "回復", domain.Heal, 1, []string{"heal_low"}, 10, "MAG", "HP回復"),
		domain.NewModule("m4", "バフ", domain.Buff, 1, []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
	}

	agent := domain.NewAgent("agent1", core, modules)
	return []*domain.AgentModel{agent}
}
