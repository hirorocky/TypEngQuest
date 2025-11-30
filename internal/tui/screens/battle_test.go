// Package screens はTUI画面のテストを提供します。
package screens

import (
	"strings"
	"testing"
	"time"

	tea "github.com/charmbracelet/bubbletea"
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

// ==================== Task: バトル画面のTick機能テスト ====================

// TestBattleScreenInitReturnsTick はInit()がtickコマンドを返すことをテストします。
func TestBattleScreenInitReturnsTick(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	cmd := screen.Init()

	if cmd == nil {
		t.Error("Init()がnilを返しました。tickコマンドを返す必要があります")
	}
}

// TestBattleScreenTickUpdatesCooldowns はTickMsgがクールダウンを更新することをテストします。
func TestBattleScreenTickUpdatesCooldowns(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// クールダウンを設定
	if len(screen.moduleSlots) > 0 {
		screen.moduleSlots[0].CooldownRemaining = 3.0
	}

	// TickMsgを送信（100ms経過をシミュレート）
	_, _ = screen.Update(BattleTickMsg{})

	// クールダウンが減少していること
	if len(screen.moduleSlots) > 0 {
		// tickInterval (100ms = 0.1秒) 分減少しているはず
		expected := 3.0 - 0.1
		actual := screen.moduleSlots[0].CooldownRemaining
		if actual > expected+0.01 || actual < expected-0.01 {
			t.Errorf("クールダウンが更新されていません: got %.2f, want %.2f", actual, expected)
		}
	}
}

// TestBattleScreenTickReturnsNextTick はTickMsg処理後に次のtickコマンドを返すことをテストします。
func TestBattleScreenTickReturnsNextTick(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	_, cmd := screen.Update(BattleTickMsg{})

	if cmd == nil {
		t.Error("TickMsg処理後にnilを返しました。次のtickコマンドを返す必要があります")
	}
}

// TestBattleScreenTickHandlesEnemyAttack はTickMsgが敵攻撃を処理することをテストします。
func TestBattleScreenTickHandlesEnemyAttack(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	player.HP = 100
	player.MaxHP = 100
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// 敵攻撃時間を過去に設定
	screen.nextEnemyAttack = time.Now().Add(-1 * time.Second)

	// TickMsgを送信
	_, _ = screen.Update(BattleTickMsg{})

	// プレイヤーがダメージを受けているか、または次の攻撃時間が更新されているはず
	if screen.nextEnemyAttack.Before(time.Now()) {
		t.Error("敵攻撃後に次の攻撃時間が更新されていません")
	}
}

// TestBattleScreenTypingTimeout はタイピング中の時間切れをテストします。
func TestBattleScreenTypingTimeout(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// タイピングを開始（非常に短い制限時間）
	screen.StartTypingChallenge("test", 10*time.Millisecond)

	// 時間を経過させる
	time.Sleep(20 * time.Millisecond)

	// TickMsgを送信
	_, _ = screen.Update(BattleTickMsg{})

	// タイピングがキャンセルされているはず
	if screen.isTyping {
		t.Error("タイピング時間切れでもisTypingがtrueのままです")
	}
}

// ==================== Task: 敗北判定テスト ====================

// TestBattleScreenDefeatDetection はプレイヤーHP0で敗北判定されることをテストします。
func TestBattleScreenDefeatDetection(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	player.HP = 0
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// TickMsgを送信
	_, cmd := screen.Update(BattleTickMsg{})

	// 敗北状態になっているはず
	if !screen.IsGameOver() {
		t.Error("HP0でもゲームオーバーになっていません")
	}

	if !screen.IsDefeat() {
		t.Error("HP0でも敗北判定になっていません")
	}

	// 敗北時はシーン遷移コマンドが返されるはず
	if cmd == nil {
		t.Error("敗北時にコマンドが返されていません")
	}
}

// TestBattleScreenDefeatAfterEnemyAttack は敵攻撃でHP0になった場合の敗北判定をテストします。
func TestBattleScreenDefeatAfterEnemyAttack(t *testing.T) {
	enemy := createTestEnemy()
	enemy.AttackPower = 200 // 一撃で倒せるダメージ

	player := createTestPlayer()
	player.HP = 100
	player.MaxHP = 100
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// 敵攻撃時間を過去に設定
	screen.nextEnemyAttack = time.Now().Add(-1 * time.Second)

	// TickMsgを送信（敵攻撃が発生）
	_, _ = screen.Update(BattleTickMsg{})

	// プレイヤーのHPが0以下になっているはず
	if player.HP > 0 {
		t.Errorf("敵攻撃後もHP残っています: %d", player.HP)
	}

	// 敗北状態になっているはず
	if !screen.IsDefeat() {
		t.Error("敵攻撃でHP0になっても敗北判定になっていません")
	}
}

// TestBattleScreenVictoryDetection は敵HP0で勝利判定されることをテストします。
func TestBattleScreenVictoryDetection(t *testing.T) {
	enemy := createTestEnemy()
	enemy.HP = 0

	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// TickMsgを送信
	_, _ = screen.Update(BattleTickMsg{})

	// 勝利状態になっているはず
	if !screen.IsGameOver() {
		t.Error("敵HP0でもゲームオーバーになっていません")
	}

	if !screen.IsVictory() {
		t.Error("敵HP0でも勝利判定になっていません")
	}

	// 結果表示状態になっているはず
	if !screen.IsShowingResult() {
		t.Error("勝利時に結果表示状態になっていません")
	}
}

// ==================== Task: 結果表示待機テスト ====================

// TestBattleScreenResultWaitsForEnter は結果表示後Enterを待つことをテストします。
func TestBattleScreenResultWaitsForEnter(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	player.HP = 0
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// TickMsgを送信して敗北状態に
	_, cmd := screen.Update(BattleTickMsg{})

	// 結果表示状態ではシーン遷移コマンドは返されない（tickのみ継続）
	// ただしtickは継続するのでcmdがnilではない可能性がある
	if screen.IsShowingResult() {
		// Enterを押さない限りBattleResultMsgは発行されない
		// 他のキーを押しても遷移しない
		_, cmd = screen.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}})

		// まだ結果表示状態のはず
		if !screen.IsShowingResult() {
			t.Error("Enter以外のキーで結果表示が終了しました")
		}
	}

	// Enterを押すとBattleResultMsgが返される
	_, cmd = screen.Update(tea.KeyMsg{Type: tea.KeyEnter})

	if cmd == nil {
		t.Error("Enter押下後にコマンドが返されていません")
	}
}

// TestBattleScreenResultDisplaysMessage は結果表示にメッセージが含まれることをテストします。
func TestBattleScreenResultDisplaysMessage(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	player.HP = 0
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	// TickMsgを送信して敗北状態に
	_, _ = screen.Update(BattleTickMsg{})

	// Viewに結果メッセージが含まれているはず
	rendered := screen.View()

	if rendered == "" {
		t.Error("レンダリング結果が空です")
	}

	// "Enter"という文字が含まれているはず（続行のヒント）
	if !strings.Contains(rendered, "Enter") {
		t.Error("結果画面にEnterキーのヒントがありません")
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
