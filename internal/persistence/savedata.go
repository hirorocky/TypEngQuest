// Package persistence はセーブデータの永続化を担当します。
// 原子的書き込みパターンとバックアップによるセーブデータの整合性を保証します。
// Requirements: 17.1-17.8, 19.1-19.3
package persistence

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"hirorocky/type-battle/internal/domain"
)

// CurrentSaveDataVersion は現在のセーブデータバージョンです。
// セーブデータの形式が変更された場合にインクリメントします。
const CurrentSaveDataVersion = "1.0.0"

// SaveFileName はセーブファイル名です。
const SaveFileName = "save.json"

// TempSaveFileName は一時セーブファイル名です（原子的書き込み用）。
const TempSaveFileName = "save.json.tmp"

// MaxBackupCount はバックアップの最大世代数です。
// Requirement 17.7: 直近3世代保持
const MaxBackupCount = 3

// SaveData はゲームのセーブデータを表す構造体です。
// Requirements 17.4: バージョン、タイムスタンプ、プレイヤー、インベントリ、統計、実績、設定
type SaveData struct {
	// Version はセーブデータのバージョンです。
	// スキーマ変更時のマイグレーションに使用します。
	Version string `json:"version"`

	// Timestamp はセーブした日時です。
	Timestamp time.Time `json:"timestamp"`

	// Player はプレイヤーの状態です。
	// 注: バトル中のHP等は保存せず、装備エージェントから再計算
	Player *PlayerSaveData `json:"player"`

	// Inventory は所持アイテム（コア、モジュール、エージェント）です。
	// Requirement 17.4: 所持コア・モジュール・エージェントを保存
	Inventory *InventorySaveData `json:"inventory"`

	// Statistics は統計データです。
	// Requirement 17.4: 統計データを保存
	Statistics *StatisticsSaveData `json:"statistics"`

	// Achievements は実績データです。
	// Requirement 17.4: 実績データを保存
	Achievements *AchievementsSaveData `json:"achievements"`

	// Settings はゲーム設定です。
	// Requirement 17.4: 設定を保存
	Settings *SettingsSaveData `json:"settings"`
}

// PlayerSaveData はプレイヤーのセーブデータです。
type PlayerSaveData struct {
	// EquippedAgentIDs は装備中のエージェントIDリストです。
	// Requirement 17.4: 装備エージェントを保存
	EquippedAgentIDs []string `json:"equipped_agent_ids"`
}

// InventorySaveData はインベントリのセーブデータです。
type InventorySaveData struct {
	// Cores は所持コアリストです。
	Cores []*domain.CoreModel `json:"cores"`

	// Modules は所持モジュールリストです。
	Modules []*domain.ModuleModel `json:"modules"`

	// Agents は所持エージェントリストです。
	Agents []*domain.AgentModel `json:"agents"`

	// MaxCoreSlots はコアの最大所持数です。
	MaxCoreSlots int `json:"max_core_slots"`

	// MaxModuleSlots はモジュールの最大所持数です。
	MaxModuleSlots int `json:"max_module_slots"`

	// MaxAgentSlots はエージェントの最大所持数です。
	// Requirement 20.6: エージェントの保有上限（最低20体）
	MaxAgentSlots int `json:"max_agent_slots"`
}

// StatisticsSaveData は統計のセーブデータです。
type StatisticsSaveData struct {
	// TotalBattles は総バトル数です。
	TotalBattles int `json:"total_battles"`

	// Victories は勝利数です。
	Victories int `json:"victories"`

	// Defeats は敗北数です。
	Defeats int `json:"defeats"`

	// MaxLevelReached は到達最高レベルです。
	// Requirement 17.4: 到達最高レベルを保存
	MaxLevelReached int `json:"max_level_reached"`

	// HighestWPM は最高WPMです。
	HighestWPM float64 `json:"highest_wpm"`

	// AverageWPM は平均WPMです。
	AverageWPM float64 `json:"average_wpm"`

	// PerfectAccuracyCount は100%正確性達成回数です。
	PerfectAccuracyCount int `json:"perfect_accuracy_count"`

	// TotalCharactersTyped は総タイプ文字数です。
	TotalCharactersTyped int `json:"total_characters_typed"`

	// EncounteredEnemies はエンカウントした敵のIDリストです（敵図鑑用）。
	EncounteredEnemies []string `json:"encountered_enemies"`
}

// AchievementsSaveData は実績のセーブデータです。
type AchievementsSaveData struct {
	// Unlocked は解除済み実績IDリストです。
	Unlocked []string `json:"unlocked"`

	// Progress は実績の進捗状況です（実績ID→進捗値）。
	Progress map[string]int `json:"progress"`
}

// SettingsSaveData は設定のセーブデータです。
type SettingsSaveData struct {
	// KeyBindings はキーバインド設定です。
	KeyBindings map[string]string `json:"key_bindings"`
}

// NewSaveData は新しいセーブデータを作成します。
func NewSaveData() *SaveData {
	return &SaveData{
		Version:   CurrentSaveDataVersion,
		Timestamp: time.Now(),
		Player: &PlayerSaveData{
			EquippedAgentIDs: make([]string, 0),
		},
		Inventory: &InventorySaveData{
			Cores:          make([]*domain.CoreModel, 0),
			Modules:        make([]*domain.ModuleModel, 0),
			Agents:         make([]*domain.AgentModel, 0),
			MaxCoreSlots:   100,
			MaxModuleSlots: 200,
			MaxAgentSlots:  20, // Requirement 20.6
		},
		Statistics: &StatisticsSaveData{
			TotalBattles:         0,
			Victories:            0,
			Defeats:              0,
			MaxLevelReached:      0,
			HighestWPM:           0,
			AverageWPM:           0,
			PerfectAccuracyCount: 0,
			TotalCharactersTyped: 0,
		},
		Achievements: &AchievementsSaveData{
			Unlocked: make([]string, 0),
			Progress: make(map[string]int),
		},
		Settings: &SettingsSaveData{
			KeyBindings: make(map[string]string),
		},
	}
}

// SaveDataIO はセーブデータのI/Oを担当する構造体です。
type SaveDataIO struct {
	// saveDir はセーブファイルを保存するディレクトリパスです。
	saveDir string
}

// NewSaveDataIO は新しいSaveDataIOを作成します。
func NewSaveDataIO(saveDir string) *SaveDataIO {
	return &SaveDataIO{
		saveDir: saveDir,
	}
}

// SaveGame はセーブデータをファイルに保存します。
// Requirement 17.3: 原子的書き込み処理（一時ファイル→検証→リネーム）
// Requirement 17.1, 17.2: 自動セーブ機能、バトル終了時に自動保存
func (io *SaveDataIO) SaveGame(data *SaveData) error {
	// タイムスタンプを更新
	data.Timestamp = time.Now()

	// JSONにシリアライズ
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("セーブデータのシリアライズに失敗: %w", err)
	}

	// ディレクトリが存在しない場合は作成
	if err := os.MkdirAll(io.saveDir, 0755); err != nil {
		return fmt.Errorf("セーブディレクトリの作成に失敗: %w", err)
	}

	// 一時ファイルに書き込み
	tmpPath := filepath.Join(io.saveDir, TempSaveFileName)
	if err := os.WriteFile(tmpPath, jsonData, 0644); err != nil {
		return fmt.Errorf("一時ファイルへの書き込みに失敗: %w", err)
	}

	// 一時ファイルの検証（読み込んでパースできるか確認）
	tmpData, err := os.ReadFile(tmpPath)
	if err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("一時ファイルの検証読み込みに失敗: %w", err)
	}
	var validateData SaveData
	if err := json.Unmarshal(tmpData, &validateData); err != nil {
		os.Remove(tmpPath)
		return fmt.Errorf("一時ファイルの検証パースに失敗: %w", err)
	}

	// バックアップローテーション
	if err := io.RotateBackups(); err != nil {
		// バックアップの失敗はログに記録するが、セーブは続行
		// 実際のアプリケーションではログ出力を追加
	}

	// 原子的リネーム
	savePath := filepath.Join(io.saveDir, SaveFileName)
	if err := os.Rename(tmpPath, savePath); err != nil {
		return fmt.Errorf("セーブファイルのリネームに失敗: %w", err)
	}

	return nil
}

// LoadGame はセーブデータをファイルから読み込みます。
// Requirement 17.5: 起動時にセーブデータを自動読み込み
// Requirement 17.6: ロード時のバージョンチェックとデータ検証
// Requirement 19.2: 破損時のバックアップ復元試行
func (io *SaveDataIO) LoadGame() (*SaveData, error) {
	savePath := filepath.Join(io.saveDir, SaveFileName)

	// メインのセーブファイルを読み込み
	data, err := io.loadFromFile(savePath)
	if err == nil {
		return data, nil
	}

	// メインファイルの読み込みに失敗した場合、バックアップから復元を試みる
	for i := 1; i <= MaxBackupCount; i++ {
		backupPath := filepath.Join(io.saveDir, fmt.Sprintf("save.json.bak%d", i))
		data, err := io.loadFromFile(backupPath)
		if err == nil {
			// バックアップからの復元に成功
			// メインファイルを復元
			if jsonData, marshalErr := json.MarshalIndent(data, "", "  "); marshalErr == nil {
				os.WriteFile(savePath, jsonData, 0644)
			}
			return data, nil
		}
	}

	return nil, fmt.Errorf("セーブデータのロードに失敗: %w", err)
}

// loadFromFile は指定されたファイルからセーブデータを読み込みます。
func (io *SaveDataIO) loadFromFile(filePath string) (*SaveData, error) {
	jsonData, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("ファイル読み込みに失敗: %w", err)
	}

	var data SaveData
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return nil, fmt.Errorf("JSONパースに失敗: %w", err)
	}

	// バージョンチェック
	if data.Version == "" {
		return nil, fmt.Errorf("セーブデータのバージョンが不正です")
	}

	// 将来的なバージョンマイグレーションはここで実装

	return &data, nil
}

// LoadFromBackup は指定したバックアップインデックスからセーブデータを読み込みます。
func (io *SaveDataIO) LoadFromBackup(backupIndex int) (*SaveData, error) {
	if backupIndex < 1 || backupIndex > MaxBackupCount {
		return nil, fmt.Errorf("不正なバックアップインデックス: %d", backupIndex)
	}

	backupPath := filepath.Join(io.saveDir, fmt.Sprintf("save.json.bak%d", backupIndex))
	return io.loadFromFile(backupPath)
}

// RotateBackups はバックアップファイルをローテーションします。
// Requirement 17.7: バックアップローテーション（直近3世代保持）
// save.json → save.json.bak1 → save.json.bak2 → save.json.bak3 (削除)
func (io *SaveDataIO) RotateBackups() error {
	// 古いバックアップを削除
	bak3 := filepath.Join(io.saveDir, "save.json.bak3")
	os.Remove(bak3) // エラーは無視（存在しない場合）

	// バックアップをシフト
	for i := MaxBackupCount - 1; i >= 1; i-- {
		oldPath := filepath.Join(io.saveDir, fmt.Sprintf("save.json.bak%d", i))
		newPath := filepath.Join(io.saveDir, fmt.Sprintf("save.json.bak%d", i+1))
		if _, err := os.Stat(oldPath); err == nil {
			os.Rename(oldPath, newPath)
		}
	}

	// 現在のセーブファイルをbak1にコピー
	savePath := filepath.Join(io.saveDir, SaveFileName)
	bak1 := filepath.Join(io.saveDir, "save.json.bak1")
	if _, err := os.Stat(savePath); err == nil {
		data, err := os.ReadFile(savePath)
		if err == nil {
			os.WriteFile(bak1, data, 0644)
		}
	}

	return nil
}

// ResetSaveData はセーブデータをリセットします。
// Requirement 17.8: セーブをリセットして最初からやり直せる
func (io *SaveDataIO) ResetSaveData() error {
	// メインセーブファイルを削除
	savePath := filepath.Join(io.saveDir, SaveFileName)
	os.Remove(savePath)

	// バックアップファイルも削除
	for i := 1; i <= MaxBackupCount; i++ {
		backupPath := filepath.Join(io.saveDir, fmt.Sprintf("save.json.bak%d", i))
		os.Remove(backupPath)
	}

	return nil
}

// ValidateSaveData はセーブデータのバリデーションを行います。
// Requirement 19.4: 不正な入力値を検証
func ValidateSaveData(data *SaveData) error {
	if data.Version == "" {
		return fmt.Errorf("セーブデータのバージョンが空です")
	}
	if data.Player == nil {
		return fmt.Errorf("プレイヤーデータがnilです")
	}
	if data.Inventory == nil {
		return fmt.Errorf("インベントリデータがnilです")
	}
	if data.Statistics == nil {
		return fmt.Errorf("統計データがnilです")
	}
	if data.Achievements == nil {
		return fmt.Errorf("実績データがnilです")
	}
	if data.Settings == nil {
		return fmt.Errorf("設定データがnilです")
	}
	return nil
}

// Exists はセーブファイルが存在するかどうかを確認します。
func (io *SaveDataIO) Exists() bool {
	savePath := filepath.Join(io.saveDir, SaveFileName)
	_, err := os.Stat(savePath)
	return err == nil
}
