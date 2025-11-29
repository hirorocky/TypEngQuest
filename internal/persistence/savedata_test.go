// Package persistence はセーブデータの永続化を担当します。
package persistence

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// TestNewSaveData は新規SaveDataの作成をテストします。
func TestNewSaveData(t *testing.T) {
	saveData := NewSaveData()

	if saveData.Version == "" {
		t.Error("Versionが空です")
	}
	if saveData.Timestamp.IsZero() {
		t.Error("Timestampが設定されていません")
	}
	if saveData.Player == nil {
		t.Error("Playerがnilです")
	}
	if saveData.Inventory == nil {
		t.Error("Inventoryがnilです")
	}
	if saveData.Statistics == nil {
		t.Error("Statisticsがnilです")
	}
	if saveData.Achievements == nil {
		t.Error("Achievementsがnilです")
	}
	if saveData.Settings == nil {
		t.Error("Settingsがnilです")
	}
}

// TestSaveAndLoadGame はセーブとロードの基本動作をテストします。
func TestSaveAndLoadGame(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// テスト用のセーブデータを作成
	saveData := NewSaveData()
	saveData.Statistics.TotalBattles = 10
	saveData.Statistics.Victories = 8
	saveData.Statistics.MaxLevelReached = 5

	// セーブ
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// ロード
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 検証
	if loadedData.Statistics.TotalBattles != 10 {
		t.Errorf("TotalBattles: got %d, want 10", loadedData.Statistics.TotalBattles)
	}
	if loadedData.Statistics.Victories != 8 {
		t.Errorf("Victories: got %d, want 8", loadedData.Statistics.Victories)
	}
	if loadedData.Statistics.MaxLevelReached != 5 {
		t.Errorf("MaxLevelReached: got %d, want 5", loadedData.Statistics.MaxLevelReached)
	}
}

// TestAtomicWrite は原子的書き込み（一時ファイル→リネーム）をテストします。
// Requirement 17.3: 原子的書き込み処理
func TestAtomicWrite(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	saveData := NewSaveData()

	// セーブ実行
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// 一時ファイルが残っていないことを確認
	tmpFile := filepath.Join(tmpDir, "save.json.tmp")
	if _, err := os.Stat(tmpFile); !os.IsNotExist(err) {
		t.Error("一時ファイルが残っています")
	}

	// セーブファイルが存在することを確認
	saveFile := filepath.Join(tmpDir, "save.json")
	if _, err := os.Stat(saveFile); os.IsNotExist(err) {
		t.Error("セーブファイルが作成されていません")
	}
}

// TestBackupRotation はバックアップローテーション（直近3世代）をテストします。
// Requirement 17.7: バックアップローテーション
func TestBackupRotation(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// 4回セーブして、バックアップローテーションを確認
	for i := 0; i < 4; i++ {
		saveData := NewSaveData()
		saveData.Statistics.TotalBattles = i + 1
		if err := io.SaveGame(saveData); err != nil {
			t.Fatalf("セーブ%dに失敗: %v", i+1, err)
		}
	}

	// バックアップファイルの存在確認
	bak1 := filepath.Join(tmpDir, "save.json.bak1")
	bak2 := filepath.Join(tmpDir, "save.json.bak2")
	bak3 := filepath.Join(tmpDir, "save.json.bak3")

	if _, err := os.Stat(bak1); os.IsNotExist(err) {
		t.Error("save.json.bak1が存在しません")
	}
	if _, err := os.Stat(bak2); os.IsNotExist(err) {
		t.Error("save.json.bak2が存在しません")
	}
	if _, err := os.Stat(bak3); os.IsNotExist(err) {
		t.Error("save.json.bak3が存在しません")
	}
}

// TestLoadFromBackup は破損時のバックアップ復元をテストします。
// Requirement 19.2: 破損時のバックアップ復元試行
func TestLoadFromBackup(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// 1回目のセーブ（これがバックアップになる）
	saveData1 := NewSaveData()
	saveData1.Statistics.TotalBattles = 100
	if err := io.SaveGame(saveData1); err != nil {
		t.Fatalf("セーブ1に失敗: %v", err)
	}

	// 2回目のセーブ（これによりバックアップが作成される）
	saveData2 := NewSaveData()
	saveData2.Statistics.TotalBattles = 200
	if err := io.SaveGame(saveData2); err != nil {
		t.Fatalf("セーブ2に失敗: %v", err)
	}

	// メインのセーブファイルを破損させる
	saveFile := filepath.Join(tmpDir, "save.json")
	if err := os.WriteFile(saveFile, []byte("corrupted data"), 0644); err != nil {
		t.Fatalf("ファイル破損に失敗: %v", err)
	}

	// ロード（バックアップから復元されるはず）
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("バックアップからのロードに失敗: %v", err)
	}

	// バックアップのデータが読み込まれていることを確認
	// バックアップは2回目セーブ時に作成されるので、1回目のデータ(100)が入っている
	if loadedData.Statistics.TotalBattles != 100 {
		t.Errorf("TotalBattles: got %d, want 100", loadedData.Statistics.TotalBattles)
	}
}

// TestVersionCheck はセーブデータのバージョンチェックをテストします。
// Requirement 17.5: ロード時のバージョンチェック
func TestVersionCheck(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	saveData := NewSaveData()
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// バージョンが設定されていることを確認
	if loadedData.Version == "" {
		t.Error("Versionが空です")
	}
}

// TestLoadGameFileNotFound はセーブファイルが存在しない場合のエラーをテストします。
func TestLoadGameFileNotFound(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	_, err := io.LoadGame()
	if err == nil {
		t.Error("ファイルが存在しない場合はエラーが返されるべき")
	}
}

// TestSaveDataWithInventory はインベントリを含むセーブデータをテストします。
func TestSaveDataWithInventory(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// テスト用のコアとモジュールを作成
	coreType := domain.CoreType{
		ID:             "test_core",
		Name:           "テストコア",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		PassiveSkillID: "test_passive",
		AllowedTags:    []string{"physical_low"},
		MinDropLevel:   1,
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "test_passive",
		Name:        "テストパッシブ",
		Description: "テスト用のパッシブスキル",
	}
	core := domain.NewCore("core_001", "テストコア1", 5, coreType, passiveSkill)

	module := domain.NewModule(
		"module_001",
		"テストモジュール",
		domain.PhysicalAttack,
		1,
		[]string{"physical_low"},
		10.0,
		"STR",
		"テスト用のモジュール",
	)

	// セーブデータを作成
	saveData := NewSaveData()
	saveData.Inventory.Cores = append(saveData.Inventory.Cores, core)
	saveData.Inventory.Modules = append(saveData.Inventory.Modules, module)

	// セーブ
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// ロード
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 検証
	if len(loadedData.Inventory.Cores) != 1 {
		t.Errorf("Cores: got %d, want 1", len(loadedData.Inventory.Cores))
	}
	if len(loadedData.Inventory.Modules) != 1 {
		t.Errorf("Modules: got %d, want 1", len(loadedData.Inventory.Modules))
	}
	if loadedData.Inventory.Cores[0].ID != "core_001" {
		t.Errorf("Core ID: got %s, want core_001", loadedData.Inventory.Cores[0].ID)
	}
	if loadedData.Inventory.Modules[0].ID != "module_001" {
		t.Errorf("Module ID: got %s, want module_001", loadedData.Inventory.Modules[0].ID)
	}
}

// TestSaveDataWithAgents はエージェントを含むセーブデータをテストします。
func TestSaveDataWithAgents(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// テスト用のエージェントを作成
	coreType := domain.CoreType{
		ID:             "test_core",
		Name:           "テストコア",
		StatWeights:    map[string]float64{"STR": 1.0, "MAG": 1.0, "SPD": 1.0, "LUK": 1.0},
		PassiveSkillID: "test_passive",
		AllowedTags:    []string{"physical_low"},
		MinDropLevel:   1,
	}
	passiveSkill := domain.PassiveSkill{
		ID:          "test_passive",
		Name:        "テストパッシブ",
		Description: "テスト用",
	}
	core := domain.NewCore("core_001", "テストコア1", 5, coreType, passiveSkill)

	modules := []*domain.ModuleModel{
		domain.NewModule("mod_1", "モジュール1", domain.PhysicalAttack, 1, []string{"physical_low"}, 10.0, "STR", "説明1"),
		domain.NewModule("mod_2", "モジュール2", domain.MagicAttack, 1, []string{"magic_low"}, 10.0, "MAG", "説明2"),
		domain.NewModule("mod_3", "モジュール3", domain.Heal, 1, []string{"heal_low"}, 10.0, "MAG", "説明3"),
		domain.NewModule("mod_4", "モジュール4", domain.Buff, 1, []string{"buff_low"}, 10.0, "SPD", "説明4"),
	}

	agent := domain.NewAgent("agent_001", core, modules)

	// セーブデータを作成
	saveData := NewSaveData()
	saveData.Inventory.Agents = append(saveData.Inventory.Agents, agent)

	// セーブ
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// ロード
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// 検証
	if len(loadedData.Inventory.Agents) != 1 {
		t.Errorf("Agents: got %d, want 1", len(loadedData.Inventory.Agents))
	}
	if loadedData.Inventory.Agents[0].ID != "agent_001" {
		t.Errorf("Agent ID: got %s, want agent_001", loadedData.Inventory.Agents[0].ID)
	}
	if loadedData.Inventory.Agents[0].Level != 5 {
		t.Errorf("Agent Level: got %d, want 5", loadedData.Inventory.Agents[0].Level)
	}
}

// TestSaveDataTimestamp はタイムスタンプが更新されることをテストします。
// Requirement 17.2: バトル終了時に自動保存
func TestSaveDataTimestamp(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// 1回目のセーブ
	saveData1 := NewSaveData()
	time1 := saveData1.Timestamp
	if err := io.SaveGame(saveData1); err != nil {
		t.Fatalf("セーブ1に失敗: %v", err)
	}

	// 少し待機
	time.Sleep(10 * time.Millisecond)

	// 2回目のセーブ
	saveData2 := NewSaveData()
	if err := io.SaveGame(saveData2); err != nil {
		t.Fatalf("セーブ2に失敗: %v", err)
	}

	// ロード
	loadedData, err := io.LoadGame()
	if err != nil {
		t.Fatalf("ロードに失敗: %v", err)
	}

	// タイムスタンプが更新されていることを確認
	if !loadedData.Timestamp.After(time1) {
		t.Error("Timestampが更新されていません")
	}
}

// TestResetSaveData はセーブデータのリセットをテストします。
// Requirement 17.8: セーブをリセットして最初からやり直せる
func TestResetSaveData(t *testing.T) {
	tmpDir := t.TempDir()
	io := NewSaveDataIO(tmpDir)

	// セーブデータを作成
	saveData := NewSaveData()
	saveData.Statistics.TotalBattles = 100
	if err := io.SaveGame(saveData); err != nil {
		t.Fatalf("セーブに失敗: %v", err)
	}

	// リセット
	if err := io.ResetSaveData(); err != nil {
		t.Fatalf("リセットに失敗: %v", err)
	}

	// セーブファイルが存在しないことを確認
	_, err := io.LoadGame()
	if err == nil {
		t.Error("リセット後にセーブファイルが存在しています")
	}
}

// TestValidateSaveData はセーブデータのバリデーションをテストします。
func TestValidateSaveData(t *testing.T) {
	// 正常なデータ
	validData := NewSaveData()
	if err := ValidateSaveData(validData); err != nil {
		t.Errorf("正常なデータでエラー: %v", err)
	}

	// バージョンなし
	invalidData := NewSaveData()
	invalidData.Version = ""
	if err := ValidateSaveData(invalidData); err == nil {
		t.Error("Versionが空でもエラーにならない")
	}
}
