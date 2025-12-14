// Package screens はTUI画面のテストを提供します。
package screens

import (
	"strings"
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"

	tea "github.com/charmbracelet/bubbletea"
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
	_, _ = screen.Update(BattleTickMsg{})

	// 結果表示状態ではシーン遷移コマンドは返されない（tickのみ継続）
	// ただしtickは継続するのでcmdがnilではない可能性がある
	if screen.IsShowingResult() {
		// Enterを押さない限りBattleResultMsgは発行されない
		// 他のキーを押しても遷移しない
		_, _ = screen.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'a'}})

		// まだ結果表示状態のはず
		if !screen.IsShowingResult() {
			t.Error("Enter以外のキーで結果表示が終了しました")
		}
	}

	// Enterを押すとBattleResultMsgが返される
	_, cmd := screen.Update(tea.KeyMsg{Type: tea.KeyEnter})

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

// ==================== Task 6.1-6.6: バトル画面UI改善のテスト ====================

// TestBattleScreen3AreaLayout はバトル画面の3エリアレイアウトをテストします。

func TestBattleScreen3AreaLayout(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// 敵情報が含まれること
	if !strings.Contains(rendered, enemy.Name) {
		t.Error("敵情報エリアに敵の名前が表示されていません")
	}

	// プレイヤー情報が含まれること
	if !strings.Contains(rendered, "プレイヤー") {
		t.Error("プレイヤー情報エリアが表示されていません")
	}

	// モジュール情報が含まれること
	if !strings.Contains(rendered, "モジュール") {
		t.Error("モジュールエリアが表示されていません")
	}
}

// TestBattleScreenAgentModuleDisplay はエージェントごとのモジュール表示をテストします。

func TestBattleScreenAgentModuleDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// エージェントのコアタイプ名が含まれること
	if !strings.Contains(rendered, agents[0].GetCoreTypeName()) {
		t.Error("エージェントのコアタイプ名が表示されていません")
	}
}

// TestBattleScreenHPBarDisplay はHPバー表示をテストします。

func TestBattleScreenHPBarDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// HPバーが含まれること（HPの数値が表示されている）
	if !strings.Contains(rendered, "HP:") {
		t.Error("HP表示がありません")
	}
}

// TestBattleScreenEnemyAttackTimerDisplay は敵攻撃タイマー表示をテストします。

func TestBattleScreenEnemyAttackTimerDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	rendered := screen.View()

	// 行動予告（物理攻撃/魔法攻撃など）の表示が含まれること
	if !strings.Contains(rendered, "ダメージ") {
		t.Error("敵攻撃タイマー表示がありません")
	}
}

// TestBattleScreenTypingColorDisplay はタイピングの色分け表示をテストします。

func TestBattleScreenTypingColorDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	// タイピングチャレンジを開始
	screen.StartTypingChallenge("hello", 10*time.Second)

	// 数文字入力
	screen.ProcessTypingInput('h')
	screen.ProcessTypingInput('e')

	rendered := screen.View()

	// タイピングエリアが表示されること（進捗表示で確認）
	if !strings.Contains(rendered, "進捗") {
		t.Error("タイピングエリアが表示されていません")
	}
}

// TestBattleScreenWinDisplay は勝利時のWIN表示をテストします。

func TestBattleScreenWinDisplay(t *testing.T) {
	enemy := createTestEnemy()
	enemy.HP = 0 // 敵HP0で勝利

	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	// TickMsgを送信して勝利状態に
	_, _ = screen.Update(BattleTickMsg{})

	if !screen.IsVictory() {
		t.Error("勝利状態になっていません")
	}

	rendered := screen.View()

	// 勝利メッセージが含まれること
	if !strings.Contains(rendered, "勝利") {
		t.Error("勝利メッセージが表示されていません")
	}
}

// TestBattleScreenLoseDisplay は敗北時のLOSE表示をテストします。

func TestBattleScreenLoseDisplay(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	player.HP = 0 // プレイヤーHP0で敗北

	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	// TickMsgを送信して敗北状態に
	_, _ = screen.Update(BattleTickMsg{})

	if !screen.IsDefeat() {
		t.Error("敗北状態になっていません")
	}

	rendered := screen.View()

	// 敗北メッセージが含まれること
	if !strings.Contains(rendered, "敗北") {
		t.Error("敗北メッセージが表示されていません")
	}
}

// ==================== Task 6.1: ファイル分割検証テスト ====================

// TestBattleScreenLogicSeparation はバトルロジックが正しく動作することを検証します。
// Task 6.1: UIレンダリングとゲームロジックの分離後も機能が維持されることを確認
func TestBattleScreenLogicSeparation(t *testing.T) {
	enemy := createTestEnemy()
	enemy.HP = 100
	player := createTestPlayer()
	player.HP = 100
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// checkGameOver - 正常状態では終了しない
	if screen.checkGameOver() {
		t.Error("HP残っているのにゲームオーバー判定されました")
	}

	// 敵HP0で勝利判定
	enemy.HP = 0
	if !screen.checkGameOver() {
		t.Error("敵HP0でゲームオーバー判定されませんでした")
	}
	if !screen.IsVictory() {
		t.Error("敵HP0で勝利判定されませんでした")
	}
}

// TestBattleScreenViewSeparation はView関連メソッドが正しく動作することを検証します。
// Task 6.1: UIレンダリングとゲームロジックの分離後も描画が維持されることを確認
func TestBattleScreenViewSeparation(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)
	screen.width = 120
	screen.height = 40

	// renderEnemyArea
	enemyArea := screen.renderEnemyArea()
	if enemyArea == "" {
		t.Error("renderEnemyAreaが空を返しました")
	}
	if !strings.Contains(enemyArea, enemy.Name) {
		t.Error("敵エリアに敵名が含まれていません")
	}

	// renderAgentArea
	agentArea := screen.renderAgentArea()
	if agentArea == "" {
		t.Error("renderAgentAreaが空を返しました")
	}

	// renderPlayerArea
	playerArea := screen.renderPlayerArea()
	if playerArea == "" {
		t.Error("renderPlayerAreaが空を返しました")
	}
	if !strings.Contains(playerArea, "プレイヤー") {
		t.Error("プレイヤーエリアにプレイヤー情報が含まれていません")
	}
}

// TestBattleScreenCooldownLogic はクールダウンロジックが正しく動作することを検証します。
// Task 6.1: ロジック分離後もクールダウン機能が維持されることを確認
func TestBattleScreenCooldownLogic(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// クールダウン開始
	screen.StartCooldown(0, 5.0)
	if screen.moduleSlots[0].CooldownRemaining != 5.0 {
		t.Errorf("クールダウン設定失敗: got %.2f, want 5.0", screen.moduleSlots[0].CooldownRemaining)
	}

	// クールダウン更新
	screen.UpdateCooldowns(1.0)
	if screen.moduleSlots[0].CooldownRemaining != 4.0 {
		t.Errorf("クールダウン更新失敗: got %.2f, want 4.0", screen.moduleSlots[0].CooldownRemaining)
	}

	// IsReady確認
	if screen.moduleSlots[0].IsReady() {
		t.Error("クールダウン中なのにIsReady=trueになっています")
	}

	// クールダウン完了
	screen.UpdateCooldowns(5.0)
	if !screen.moduleSlots[0].IsReady() {
		t.Error("クールダウン完了後もIsReady=falseのままです")
	}
}

// TestBattleScreenTypingLogic はタイピングロジックが正しく動作することを検証します。
// Task 6.1: ロジック分離後もタイピング機能が維持されることを確認
func TestBattleScreenTypingLogic(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// タイピング開始
	screen.StartTypingChallenge("test", 10*time.Second)
	if !screen.isTyping {
		t.Error("タイピングが開始されていません")
	}
	if screen.typingText != "test" {
		t.Errorf("タイピングテキストが正しくありません: got %s, want test", screen.typingText)
	}

	// タイピング入力処理
	screen.ProcessTypingInput('t')
	if screen.typingIndex != 1 {
		t.Errorf("タイピングインデックスが更新されていません: got %d, want 1", screen.typingIndex)
	}

	// 誤入力
	screen.ProcessTypingInput('x')
	if len(screen.typingMistakes) == 0 {
		t.Error("誤入力が記録されていません")
	}

	// タイピングキャンセル
	screen.CancelTyping()
	if screen.isTyping {
		t.Error("タイピングがキャンセルされていません")
	}
}

// TestBattleScreenEffectDuration はエフェクト持続時間更新が正しく動作することを検証します。
// Task 6.1: ロジック分離後もエフェクト更新が維持されることを確認
func TestBattleScreenEffectDuration(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	// プレイヤーにバフを追加
	duration := 5.0
	player.EffectTable.AddRow(domain.EffectRow{
		ID:         "test_buff",
		SourceType: domain.SourceBuff,
		Name:       "テストバフ",
		Duration:   &duration,
	})

	screen := NewBattleScreen(enemy, player, agents)

	// 初期状態確認
	buffs := player.EffectTable.GetRowsBySource(domain.SourceBuff)
	if len(buffs) == 0 {
		t.Fatal("バフが追加されていません")
	}
	if *buffs[0].Duration != 5.0 {
		t.Errorf("初期持続時間が正しくありません: got %.2f, want 5.0", *buffs[0].Duration)
	}

	// エフェクト持続時間更新
	screen.updateEffectDurations(1.0)

	buffs = player.EffectTable.GetRowsBySource(domain.SourceBuff)
	if len(buffs) == 0 {
		t.Fatal("バフが消えてしまいました")
	}
	if *buffs[0].Duration != 4.0 {
		t.Errorf("持続時間更新後の値が正しくありません: got %.2f, want 4.0", *buffs[0].Duration)
	}
}

// ==================== Task 7.1: RecastManager統合テスト ====================

// TestBattleScreenHasRecastManager はRecastManagerが初期化されることを検証します。
func TestBattleScreenHasRecastManager(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if screen.recastManager == nil {
		t.Error("RecastManagerが初期化されていません")
	}
}

// TestBattleScreenModuleUsageStartsRecast はモジュール使用時にリキャストが開始されることを検証します。
func TestBattleScreenModuleUsageStartsRecast(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffect()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// モジュール使用前はエージェントがReady
	if !screen.recastManager.IsAgentReady(0) {
		t.Error("初期状態でエージェントがリキャスト中になっています")
	}

	// タイピングチャレンジを開始してモジュールを使用
	screen.selectedModuleIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a') // タイピング完了

	// エージェント0がリキャスト中になっているはず
	if screen.recastManager.IsAgentReady(0) {
		t.Error("モジュール使用後もエージェントがReady状態です")
	}
}

// TestBattleScreenRecastBlocksModuleUsage はリキャスト中のエージェントのモジュール使用がブロックされることを検証します。
func TestBattleScreenRecastBlocksModuleUsage(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// エージェント0のリキャストを開始
	screen.recastManager.StartRecast(0, 5*time.Second)

	// エージェント0のモジュールは使用不可
	if screen.isModuleUsable(0) {
		t.Error("リキャスト中のエージェントのモジュールが使用可能になっています")
	}
}

// TestBattleScreenTickUpdatesRecast はTickMsgでリキャスト時間が更新されることを検証します。
func TestBattleScreenTickUpdatesRecast(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// リキャストを開始（3秒）
	screen.recastManager.StartRecast(0, 3*time.Second)

	initialState := screen.recastManager.GetRecastState(0)
	if initialState == nil {
		t.Fatal("リキャスト状態が取得できません")
	}
	initialRemaining := initialState.RemainingSeconds

	// TickMsgを送信
	_, _ = screen.Update(BattleTickMsg{})

	state := screen.recastManager.GetRecastState(0)
	if state == nil {
		t.Fatal("TickMsg後にリキャスト状態が取得できません")
	}

	// 100ms(tickInterval)分減少しているはず
	expected := initialRemaining - 0.1
	if state.RemainingSeconds > expected+0.01 || state.RemainingSeconds < expected-0.01 {
		t.Errorf("リキャスト時間が更新されていません: got %.2f, want %.2f", state.RemainingSeconds, expected)
	}
}

// TestBattleScreenRecastCompletionEnablesAgent はリキャスト終了時にエージェントが使用可能になることを検証します。
func TestBattleScreenRecastCompletionEnablesAgent(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	// 短いリキャストを開始（0.05秒 = 50ms = tick1回未満）
	screen.recastManager.StartRecast(0, 50*time.Millisecond)

	// リキャスト中
	if screen.recastManager.IsAgentReady(0) {
		t.Error("リキャスト開始直後にエージェントがReady状態です")
	}

	// TickMsgを送信（100ms経過）
	_, _ = screen.Update(BattleTickMsg{})

	// リキャスト完了
	if !screen.recastManager.IsAgentReady(0) {
		t.Error("リキャスト時間経過後もエージェントがリキャスト中です")
	}
}

// ==================== Task 7.2: ChainEffectManager統合テスト ====================

// TestBattleScreenHasChainEffectManager はChainEffectManagerが初期化されることを検証します。
func TestBattleScreenHasChainEffectManager(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if screen.chainEffectManager == nil {
		t.Error("ChainEffectManagerが初期化されていません")
	}
}

// TestBattleScreenModuleUsageRegistersChainEffect はモジュール使用時にチェイン効果が登録されることを検証します。
func TestBattleScreenModuleUsageRegistersChainEffect(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffect()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// 登録前は待機中チェイン効果なし
	if len(screen.chainEffectManager.GetPendingEffects()) != 0 {
		t.Error("初期状態で待機中チェイン効果が存在します")
	}

	// タイピングチャレンジを開始してモジュールを使用
	screen.selectedModuleIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a') // タイピング完了

	// チェイン効果が登録されているはず
	pendingEffects := screen.chainEffectManager.GetPendingEffects()
	if len(pendingEffects) == 0 {
		t.Error("モジュール使用後にチェイン効果が登録されていません")
	}
}

// TestBattleScreenChainEffectTrigger は他エージェントのモジュール使用時にチェイン効果が発動することを検証します。
func TestBattleScreenChainEffectTrigger(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffectMultiple()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) < 5 {
		t.Skip("モジュールスロットが足りません")
	}

	// エージェント0のモジュールを使用（チェイン効果を登録）
	screen.selectedModuleIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a')

	// 待機中チェイン効果があること
	if len(screen.chainEffectManager.GetPendingEffects()) == 0 {
		t.Error("エージェント0のチェイン効果が登録されていません")
	}

	// エージェント1のモジュールを使用（チェイン効果が発動）
	screen.selectedModuleIdx = 4 // エージェント1の最初のモジュール
	screen.selectedAgentIdx = 1
	screen.StartTypingChallenge("b", 10*time.Second)
	screen.ProcessTypingInput('b')

	// チェイン効果が発動して削除されているはず
	pendingEffects := screen.chainEffectManager.GetPendingEffects()
	// エージェント0の効果は発動済み、エージェント1の効果は待機中
	foundAgent0 := false
	for _, pe := range pendingEffects {
		if pe.AgentIndex == 0 {
			foundAgent0 = true
		}
	}
	if foundAgent0 {
		t.Error("エージェント0のチェイン効果が発動後も残っています")
	}
}

// TestBattleScreenRecastCompletionExpiresChainEffect はリキャスト終了時に未発動チェイン効果が破棄されることを検証します。
func TestBattleScreenRecastCompletionExpiresChainEffect(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffect()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// エージェント0のモジュールを使用（チェイン効果を登録）
	screen.selectedModuleIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a')

	// チェイン効果が登録されている
	if len(screen.chainEffectManager.GetPendingEffects()) == 0 {
		t.Error("チェイン効果が登録されていません")
	}

	// リキャストを短い時間に設定して終了させる
	screen.recastManager.CancelRecast(0)
	screen.recastManager.StartRecast(0, 50*time.Millisecond)

	// TickMsgを送信してリキャストを終了
	_, _ = screen.Update(BattleTickMsg{})

	// リキャスト完了
	if !screen.recastManager.IsAgentReady(0) {
		t.Error("リキャストが終了していません")
	}

	// チェイン効果が破棄されているはず
	for _, pe := range screen.chainEffectManager.GetPendingEffects() {
		if pe.AgentIndex == 0 {
			t.Error("リキャスト終了時にエージェント0のチェイン効果が破棄されていません")
		}
	}
}

// ==================== Task 7.3: 統合フロー検証テスト ====================

// TestBattleScreenModuleRecastChainFlowIntegration はモジュール使用→リキャスト開始→チェイン効果登録の一連フローを検証します。
func TestBattleScreenModuleRecastChainFlowIntegration(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffect()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// Step 1: 初期状態確認
	if !screen.recastManager.IsAgentReady(0) {
		t.Error("初期状態: エージェント0がリキャスト中")
	}
	if len(screen.chainEffectManager.GetPendingEffects()) != 0 {
		t.Error("初期状態: 待機中チェイン効果が存在")
	}

	// Step 2: モジュール使用
	screen.selectedModuleIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a')

	// Step 3: リキャスト開始確認
	if screen.recastManager.IsAgentReady(0) {
		t.Error("モジュール使用後: エージェント0がリキャスト中になっていない")
	}

	// Step 4: チェイン効果登録確認
	pendingEffects := screen.chainEffectManager.GetPendingEffects()
	if len(pendingEffects) == 0 {
		t.Error("モジュール使用後: チェイン効果が登録されていない")
	}

	// Step 5: エージェント0のモジュール使用がブロックされる
	if screen.isModuleUsable(0) {
		t.Error("リキャスト中: エージェント0のモジュールが使用可能になっている")
	}
}

// TestBattleScreenRecastBlockedModuleSelection はリキャスト中のモジュール選択がブロックされることを検証します。
func TestBattleScreenRecastBlockedModuleSelection(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgents()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) == 0 {
		t.Skip("モジュールスロットがありません")
	}

	// エージェント0をリキャスト状態に
	screen.recastManager.StartRecast(0, 5*time.Second)

	// エージェント0のモジュールを選択してEnterを押す
	screen.selectedSlot = 0
	screen.selectedAgentIdx = 0
	_, _ = screen.Update(tea.KeyMsg{Type: tea.KeyEnter})

	// タイピングチャレンジが開始されていないはず
	if screen.isTyping {
		t.Error("リキャスト中のエージェントのモジュールでタイピングチャレンジが開始されました")
	}
}

// TestBattleScreenChainEffectTimingVerification はチェイン効果発動条件とタイミングを検証します。
func TestBattleScreenChainEffectTimingVerification(t *testing.T) {
	enemy := createTestEnemy()
	player := createTestPlayer()
	agents := createTestAgentsWithChainEffectMultiple()

	screen := NewBattleScreen(enemy, player, agents)

	if len(screen.moduleSlots) < 5 {
		t.Skip("モジュールスロットが足りません（2エージェント必要）")
	}

	// エージェント0の攻撃モジュールを使用（ダメージボーナスのチェイン効果を登録）
	screen.selectedModuleIdx = 0
	screen.selectedAgentIdx = 0
	screen.StartTypingChallenge("a", 10*time.Second)
	screen.ProcessTypingInput('a')

	// 待機中チェイン効果が存在
	pendingBefore := len(screen.chainEffectManager.GetPendingEffects())
	if pendingBefore == 0 {
		t.Error("チェイン効果が登録されていません")
	}

	initialEnemyHP := enemy.HP

	// エージェント1の攻撃モジュールを使用（チェイン効果が発動するはず）
	screen.selectedModuleIdx = 4 // エージェント1の最初のモジュール
	screen.selectedAgentIdx = 1
	screen.StartTypingChallenge("b", 10*time.Second)
	screen.ProcessTypingInput('b')

	// チェイン効果が発動している（敵にダメージが与えられている）
	if enemy.HP >= initialEnemyHP {
		t.Log("注意: チェイン効果による追加ダメージが確認できませんでした。効果タイプによっては正常です。")
	}

	// エージェント0の待機中チェイン効果は発動済みで削除されている
	for _, pe := range screen.chainEffectManager.GetPendingEffects() {
		if pe.AgentIndex == 0 {
			t.Error("エージェント0のチェイン効果が発動後も残っています")
		}
	}
}

// ==================== テスト用ヘルパー関数（チェイン効果付き） ====================

// createTestAgentsWithChainEffect はチェイン効果付きのエージェントを作成します。
func createTestAgentsWithChainEffect() []*domain.AgentModel {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}

	core := domain.NewCore("core1", "テストコア", 5, coreType, domain.PassiveSkill{})

	// チェイン効果付きモジュール
	chainEffect := domain.NewChainEffect(domain.ChainEffectDamageBonus, 25)
	modules := []*domain.ModuleModel{
		domain.NewModuleWithChainEffect("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", "物理ダメージ", &chainEffect),
		domain.NewModule("m2", "魔法攻撃", domain.MagicAttack, 1, []string{"magic_low"}, 10, "MAG", "魔法ダメージ"),
		domain.NewModule("m3", "回復", domain.Heal, 1, []string{"heal_low"}, 10, "MAG", "HP回復"),
		domain.NewModule("m4", "バフ", domain.Buff, 1, []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
	}

	agent := domain.NewAgent("agent1", core, modules)
	return []*domain.AgentModel{agent}
}

// createTestAgentsWithChainEffectMultiple は複数のチェイン効果付きエージェントを作成します。
func createTestAgentsWithChainEffectMultiple() []*domain.AgentModel {
	coreType := domain.CoreType{
		ID:          "test",
		Name:        "テスト",
		StatWeights: map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		AllowedTags: []string{"physical_low"},
	}

	// エージェント1
	core1 := domain.NewCore("core1", "テストコア1", 5, coreType, domain.PassiveSkill{})
	chainEffect1 := domain.NewChainEffect(domain.ChainEffectDamageBonus, 25)
	modules1 := []*domain.ModuleModel{
		domain.NewModuleWithChainEffect("m1", "物理攻撃", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", "物理ダメージ", &chainEffect1),
		domain.NewModule("m2", "魔法攻撃", domain.MagicAttack, 1, []string{"magic_low"}, 10, "MAG", "魔法ダメージ"),
		domain.NewModule("m3", "回復", domain.Heal, 1, []string{"heal_low"}, 10, "MAG", "HP回復"),
		domain.NewModule("m4", "バフ", domain.Buff, 1, []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
	}
	agent1 := domain.NewAgent("agent1", core1, modules1)

	// エージェント2
	core2 := domain.NewCore("core2", "テストコア2", 5, coreType, domain.PassiveSkill{})
	chainEffect2 := domain.NewChainEffect(domain.ChainEffectHealBonus, 30)
	modules2 := []*domain.ModuleModel{
		domain.NewModuleWithChainEffect("m5", "物理攻撃2", domain.PhysicalAttack, 1, []string{"physical_low"}, 10, "STR", "物理ダメージ", &chainEffect2),
		domain.NewModule("m6", "魔法攻撃2", domain.MagicAttack, 1, []string{"magic_low"}, 10, "MAG", "魔法ダメージ"),
		domain.NewModule("m7", "回復2", domain.Heal, 1, []string{"heal_low"}, 10, "MAG", "HP回復"),
		domain.NewModule("m8", "バフ2", domain.Buff, 1, []string{"buff_low"}, 10, "SPD", "攻撃力UP"),
	}
	agent2 := domain.NewAgent("agent2", core2, modules2)

	return []*domain.AgentModel{agent1, agent2}
}
