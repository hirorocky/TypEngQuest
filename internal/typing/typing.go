// Package typing はタイピングシステムを提供します。
// タイピングチャレンジの生成と評価を担当します。
// Requirements: 9.7-9.10, 10.6-10.8, 16.1-16.13
package typing

import (
	"math/rand"
	"time"
)

// 難易度定数
type Difficulty int

const (
	// DifficultyEasy は弱いモジュール用（3-6文字）
	// Requirement 16.6
	DifficultyEasy Difficulty = 1

	// DifficultyMedium は中程度のモジュール用（7-11文字）
	// Requirement 16.7
	DifficultyMedium Difficulty = 2

	// DifficultyHard は強力なモジュール用（12-20文字）
	// Requirement 16.8
	DifficultyHard Difficulty = 3
)

// SpeedFactorMax は速度係数の上限です。
// Requirement 10.8: 速度係数の上限2.0
const SpeedFactorMax = 2.0

// ==================== チャレンジ生成（Task 6.1） ====================

// Dictionary はタイピング辞書を表す構造体です。
// Requirements 16.1, 16.2: 英数字のチャレンジテキスト、デフォルト単語セット
type Dictionary struct {
	Easy   []string
	Medium []string
	Hard   []string
}

// Challenge はタイピングチャレンジを表す構造体です。
type Challenge struct {
	// Text はチャレンジテキストです。
	Text string

	// TimeLimit は制限時間です。
	// Requirement 16.10: 各モジュールにタイピング制限時間を設定
	TimeLimit time.Duration

	// Difficulty は難易度です。
	Difficulty Difficulty
}

// ChallengeGenerator はタイピングチャレンジを生成する構造体です。
// Requirements 16.5-16.9
type ChallengeGenerator struct {
	dictionary *Dictionary
	lastText   string
	rng        *rand.Rand
}

// NewChallengeGenerator は新しいChallengeGeneratorを作成します。
func NewChallengeGenerator(dict *Dictionary) *ChallengeGenerator {
	return &ChallengeGenerator{
		dictionary: dict,
		lastText:   "",
		rng:        rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Generate はチャレンジを生成します。
// Requirements 16.5-16.9: 難易度に応じたテキスト生成、連続重複回避
func (g *ChallengeGenerator) Generate(difficulty Difficulty, timeLimit time.Duration) *Challenge {
	var candidates []string

	switch difficulty {
	case DifficultyEasy:
		candidates = g.filterByLength(g.dictionary.Easy, 3, 6)
	case DifficultyMedium:
		candidates = g.filterByLength(g.dictionary.Medium, 7, 11)
	case DifficultyHard:
		candidates = g.filterByLength(g.dictionary.Hard, 12, 20)
	}

	if len(candidates) == 0 {
		// フォールバック：指定難易度の辞書が空の場合
		candidates = g.getAllCandidates(difficulty)
	}

	if len(candidates) == 0 {
		return nil
	}

	// Requirement 16.9: 連続同一テキスト回避
	text := g.selectWithoutDuplication(candidates)
	g.lastText = text

	return &Challenge{
		Text:       text,
		TimeLimit:  timeLimit,
		Difficulty: difficulty,
	}
}

// filterByLength は指定された長さ範囲の単語をフィルタリングします。
func (g *ChallengeGenerator) filterByLength(words []string, minLen, maxLen int) []string {
	result := make([]string, 0)
	for _, word := range words {
		if len(word) >= minLen && len(word) <= maxLen {
			result = append(result, word)
		}
	}
	return result
}

// getAllCandidates は難易度に応じた全候補を取得します。
func (g *ChallengeGenerator) getAllCandidates(difficulty Difficulty) []string {
	switch difficulty {
	case DifficultyEasy:
		return g.dictionary.Easy
	case DifficultyMedium:
		return g.dictionary.Medium
	case DifficultyHard:
		return g.dictionary.Hard
	}
	return nil
}

// selectWithoutDuplication は前回と異なるテキストを選択します。
// Requirement 16.9: 同じチャレンジテキストが連続しない
func (g *ChallengeGenerator) selectWithoutDuplication(candidates []string) string {
	if len(candidates) == 1 {
		return candidates[0]
	}

	maxAttempts := 10
	for i := 0; i < maxAttempts; i++ {
		idx := g.rng.Intn(len(candidates))
		text := candidates[idx]
		if text != g.lastText {
			return text
		}
	}

	// 最大試行回数を超えた場合は最初と異なるものを選ぶ
	for _, text := range candidates {
		if text != g.lastText {
			return text
		}
	}

	return candidates[0]
}

// GetDifficultyForModuleLevel はモジュールレベルに応じた難易度を返します。
// Requirement 16.5, 16.13: モジュールの難易度に応じた制限時間
func GetDifficultyForModuleLevel(level int) Difficulty {
	switch level {
	case 1:
		return DifficultyEasy
	case 2:
		return DifficultyMedium
	default:
		return DifficultyHard
	}
}

// GetDefaultTimeLimit はモジュール難易度に応じたデフォルト制限時間を返します。
// Requirement 16.13: 制限時間をモジュールの難易度に応じて設定
func GetDefaultTimeLimit(difficulty Difficulty) time.Duration {
	switch difficulty {
	case DifficultyEasy:
		return 5 * time.Second
	case DifficultyMedium:
		return 8 * time.Second
	case DifficultyHard:
		return 12 * time.Second
	default:
		return 10 * time.Second
	}
}

// ==================== タイピング評価エンジン（Task 6.2） ====================

// ChallengeState はタイピングチャレンジの進行状態を表す構造体です。
type ChallengeState struct {
	// Challenge はチャレンジ情報です。
	Challenge *Challenge

	// StartTime はチャレンジ開始時刻です。
	// Requirement 9.7: チャレンジ開始時のタイムスタンプ記録
	StartTime time.Time

	// CurrentIndex は現在の入力位置です。
	CurrentIndex int

	// CorrectCount は正解入力数です。
	CorrectCount int

	// TotalInputCount は総入力数です。
	TotalInputCount int

	// Mistakes は誤入力の位置リストです。
	Mistakes []int
}

// TypingResult はタイピング評価結果を表す構造体です。
type TypingResult struct {
	// Completed はチャレンジが完了したかどうかです。
	Completed bool

	// WPM はWords Per Minuteです。
	// Requirement 10.6: WPM計算
	WPM float64

	// Accuracy は正確性（0.0〜1.0）です。
	// Requirement 10.7: 正確性計算
	Accuracy float64

	// SpeedFactor は速度係数（上限2.0）です。
	// Requirement 10.8: 速度係数計算
	SpeedFactor float64

	// AccuracyFactor は正確性係数です。
	AccuracyFactor float64

	// CompletionTime は完了までの時間です。
	CompletionTime time.Duration

	// Timeout はタイムアウトしたかどうかです。
	Timeout bool
}

// Evaluator はタイピング評価を担当する構造体です。
// Requirements 9.7-9.10, 10.6-10.8
type Evaluator struct{}

// NewEvaluator は新しいEvaluatorを作成します。
func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// StartChallenge はチャレンジを開始します。
// Requirement 9.7: チャレンジ開始時のタイムスタンプ記録
func (e *Evaluator) StartChallenge(challenge *Challenge) *ChallengeState {
	return &ChallengeState{
		Challenge:       challenge,
		StartTime:       time.Now(),
		CurrentIndex:    0,
		CorrectCount:    0,
		TotalInputCount: 0,
		Mistakes:        make([]int, 0),
	}
}

// ProcessInput は入力を処理します。
// Requirements 9.8, 9.9: 正誤判定、入力進捗の更新
func (e *Evaluator) ProcessInput(state *ChallengeState, input rune) *ChallengeState {
	if state.CurrentIndex >= len(state.Challenge.Text) {
		return state // 既に完了
	}

	expectedChar := rune(state.Challenge.Text[state.CurrentIndex])
	state.TotalInputCount++

	if input == expectedChar {
		// Requirement 9.8: 正しい文字入力 - 進捗を更新
		state.CorrectCount++
		state.CurrentIndex++
	} else {
		// Requirement 9.9: 誤った文字入力 - 誤字として記録
		state.Mistakes = append(state.Mistakes, state.CurrentIndex)
	}

	return state
}

// CompleteChallenge はチャレンジを完了し、結果を計算します。
// Requirements 10.6-10.8: WPM、正確性、速度係数の計算
func (e *Evaluator) CompleteChallenge(state *ChallengeState) *TypingResult {
	completionTime := time.Since(state.StartTime)

	// Requirement 10.6: WPM = (正しい文字数 / 完了時間(秒) × 60) / 5
	wpm := 0.0
	if completionTime.Seconds() > 0 {
		wpm = (float64(state.CorrectCount) / completionTime.Seconds() * 60) / 5
	}

	// Requirement 10.7: 正確性 = 正しい入力数 / 総入力数
	accuracy := 1.0
	if state.TotalInputCount > 0 {
		accuracy = float64(state.CorrectCount) / float64(state.TotalInputCount)
	}

	// Requirement 10.8: 速度係数 = 基準時間 / 実際時間（上限2.0）
	speedFactor := 1.0
	if completionTime.Seconds() > 0 {
		speedFactor = state.Challenge.TimeLimit.Seconds() / completionTime.Seconds()
	}
	if speedFactor > SpeedFactorMax {
		speedFactor = SpeedFactorMax
	}

	return &TypingResult{
		Completed:      state.CurrentIndex >= len(state.Challenge.Text),
		WPM:            wpm,
		Accuracy:       accuracy,
		SpeedFactor:    speedFactor,
		AccuracyFactor: accuracy,
		CompletionTime: completionTime,
		Timeout:        false,
	}
}

// IsTimeout は制限時間を超過したかを判定します。
// Requirement 16.11: 制限時間超過の検出
func (e *Evaluator) IsTimeout(state *ChallengeState) bool {
	elapsed := time.Since(state.StartTime)
	return elapsed >= state.Challenge.TimeLimit
}

// IsCompleted はチャレンジが完了したかを判定します。
func (e *Evaluator) IsCompleted(state *ChallengeState) bool {
	return state.CurrentIndex >= len(state.Challenge.Text)
}

// GetProgress は入力進捗（0.0〜1.0）を返します。
func (e *Evaluator) GetProgress(state *ChallengeState) float64 {
	if len(state.Challenge.Text) == 0 {
		return 1.0
	}
	return float64(state.CurrentIndex) / float64(len(state.Challenge.Text))
}

// GetRemainingTime は残り時間を返します。
// Requirement 16.12: タイピング中に残り時間をリアルタイムで表示
func (e *Evaluator) GetRemainingTime(state *ChallengeState) time.Duration {
	elapsed := time.Since(state.StartTime)
	remaining := state.Challenge.TimeLimit - elapsed
	if remaining < 0 {
		return 0
	}
	return remaining
}

// GetTimeoutResult はタイムアウト時の結果を返します。
// Requirement 16.11: タイムアウト時のキャンセル処理
func (e *Evaluator) GetTimeoutResult(state *ChallengeState) *TypingResult {
	return &TypingResult{
		Completed:      false,
		WPM:            0,
		Accuracy:       0,
		SpeedFactor:    0,
		AccuracyFactor: 0,
		CompletionTime: state.Challenge.TimeLimit,
		Timeout:        true,
	}
}
