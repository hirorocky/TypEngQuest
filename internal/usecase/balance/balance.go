// Package balance はゲームバランスパラメータを管理します。
// HP係数、敵ステータススケーリング、ドロップ確率などのゲーム調整値を集約管理します。

// シーン定義とシーン遷移ルールはapp/scene.goで管理されます。
package balance

// ==================================================
// ゲームバランス設定
// ==================================================

// Config はゲームバランスの設定を保持する構造体です。
type Config struct {
	// HPCoefficient はプレイヤーHP計算の係数です。

	HPCoefficient float64

	// EnemyAttackPowerScale は敵攻撃力のレベルスケーリング係数です。

	EnemyAttackPowerScale float64

	// EnemyAttackIntervalScale は敵攻撃間隔のレベルスケーリング係数です。

	EnemyAttackIntervalScale float64

	// MinAttackIntervalMS は敵攻撃間隔の最小値（ミリ秒）です。

	MinAttackIntervalMS int

	// CoreDropRate はコアのドロップ確率です。

	CoreDropRate float64

	// ModuleDropRate はモジュールのドロップ確率です。
	ModuleDropRate float64

	// MaxLevel は敵の最大レベルです。

	MaxLevel int

	// MaxEquippedAgents は装備可能なエージェント数です。
	MaxEquippedAgents int

	// ModulesPerAgent はエージェントあたりのモジュール数です。
	ModulesPerAgent int

	// TextLengthByDifficulty は難易度ごとのテキスト長さ範囲[min, max]です。

	TextLengthByDifficulty map[int][2]int

	// TimeLimitByDifficulty は難易度ごとの制限時間（ミリ秒）です。
	TimeLimitByDifficulty map[int]int
}

// DefaultConfig はデフォルトのゲームバランス設定を返します。
func DefaultConfig() *Config {
	return &Config{
		HPCoefficient:            20.0, // 適度なHP
		EnemyAttackPowerScale:    1.1,  // レベルごとに10%増加
		EnemyAttackIntervalScale: 0.95, // レベルごとに5%短縮
		MinAttackIntervalMS:      1000, // 最小1秒
		CoreDropRate:             0.5,  // 50%
		ModuleDropRate:           0.7,  // 70%
		MaxLevel:                 100,
		MaxEquippedAgents:        3,
		ModulesPerAgent:          4,
		TextLengthByDifficulty: map[int][2]int{
			1: {3, 6},   // Easy
			2: {7, 11},  // Medium
			3: {12, 20}, // Hard
		},
		TimeLimitByDifficulty: map[int]int{
			1: 10000, // Easy: 10秒
			2: 7000,  // Medium: 7秒
			3: 5000,  // Hard: 5秒
		},
	}
}

// ConfigOption は設定のカスタマイズオプションです。
type ConfigOption func(*Config)

// NewConfig はカスタム設定を持つConfigを作成します。
func NewConfig(opts ...ConfigOption) *Config {
	config := DefaultConfig()
	for _, opt := range opts {
		opt(config)
	}
	return config
}

// WithHPCoefficient はHP係数を設定するオプションです。
func WithHPCoefficient(coeff float64) ConfigOption {
	return func(c *Config) {
		c.HPCoefficient = coeff
	}
}

// WithCoreDropRate はコアドロップ率を設定するオプションです。
func WithCoreDropRate(rate float64) ConfigOption {
	return func(c *Config) {
		c.CoreDropRate = rate
	}
}

// WithModuleDropRate はモジュールドロップ率を設定するオプションです。
func WithModuleDropRate(rate float64) ConfigOption {
	return func(c *Config) {
		c.ModuleDropRate = rate
	}
}

// ==================================================
// 計算メソッド
// ==================================================

// CalculateEnemyAttackPower は敵の攻撃力を計算します。

func (c *Config) CalculateEnemyAttackPower(baseAttackPower int, level int) int {
	// 基礎攻撃力 × (スケーリング係数 ^ (レベル - 1))
	scale := 1.0
	for i := 1; i < level; i++ {
		scale *= c.EnemyAttackPowerScale
	}
	return int(float64(baseAttackPower) * scale)
}

// CalculateEnemyAttackInterval は敵の攻撃間隔を計算します。

func (c *Config) CalculateEnemyAttackInterval(baseIntervalMS int, level int) int {
	// 基礎間隔 × (スケーリング係数 ^ (レベル - 1))
	scale := 1.0
	for i := 1; i < level; i++ {
		scale *= c.EnemyAttackIntervalScale
	}
	interval := int(float64(baseIntervalMS) * scale)

	// 最小間隔を保証
	if interval < c.MinAttackIntervalMS {
		return c.MinAttackIntervalMS
	}
	return interval
}

// GetTextLengthRange は指定難易度のテキスト長さ範囲を返します。

func (c *Config) GetTextLengthRange(difficulty int) (min, max int) {
	if range_, exists := c.TextLengthByDifficulty[difficulty]; exists {
		return range_[0], range_[1]
	}
	// デフォルト（Easy）
	return 3, 6
}

// GetTimeLimit は指定難易度の制限時間を返します（ミリ秒）。
func (c *Config) GetTimeLimit(difficulty int) int {
	if limit, exists := c.TimeLimitByDifficulty[difficulty]; exists {
		return limit
	}
	// デフォルト（Easy）
	return 10000
}
