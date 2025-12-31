// Package startup は初回起動時の初期化処理を担当します。
// 新規ゲーム開始時の初期エージェントの提供を行います。

package startup

import (
	"log/slog"

	"hirorocky/type-battle/internal/domain"
	"hirorocky/type-battle/internal/infra/masterdata"
	"hirorocky/type-battle/internal/infra/savedata"
)

// NewGameInitializer は新規ゲーム初期化を担当する構造体です。
type NewGameInitializer struct {
	// externalData は外部マスタデータです。
	externalData *masterdata.ExternalData
}

// NewNewGameInitializer は新しいNewGameInitializerを作成します。
// externalData はマスタデータを含む外部データです。
func NewNewGameInitializer(externalData *masterdata.ExternalData) *NewGameInitializer {
	return &NewGameInitializer{
		externalData: externalData,
	}
}

// CreateInitialAgent は初期エージェントを作成します。
// マスタデータから初期エージェントを構築します。
func (i *NewGameInitializer) CreateInitialAgent() *domain.AgentModel {
	if i.externalData == nil || i.externalData.FirstAgent == nil {
		slog.Error("初期エージェントデータがありません")
		return nil
	}

	firstAgentData := i.externalData.FirstAgent

	// コア特性を検索
	var coreType domain.CoreType
	for _, ct := range i.externalData.CoreTypes {
		if ct.ID == firstAgentData.CoreTypeID {
			coreType = ct.ToDomain()
			break
		}
	}

	// パッシブスキルを検索
	var passiveSkill domain.PassiveSkill
	for _, ps := range i.externalData.PassiveSkills {
		if ps.ID == coreType.PassiveSkillID {
			passiveSkill = domain.PassiveSkill{
				ID:          ps.ID,
				Name:        ps.Name,
				Description: ps.Description,
			}
			break
		}
	}

	// コアを作成
	core := domain.NewCoreWithTypeID(
		firstAgentData.CoreTypeID,
		firstAgentData.CoreLevel,
		coreType,
		passiveSkill,
	)

	// モジュールを作成
	modules := make([]*domain.ModuleModel, 0, len(firstAgentData.Modules))
	for _, modData := range firstAgentData.Modules {
		// モジュール定義を検索
		var moduleDef *masterdata.ModuleDefinitionData
		for j := range i.externalData.ModuleDefinitions {
			if i.externalData.ModuleDefinitions[j].ID == modData.TypeID {
				moduleDef = &i.externalData.ModuleDefinitions[j]
				break
			}
		}
		if moduleDef == nil {
			slog.Warn("モジュール定義が見つかりません",
				slog.String("type_id", modData.TypeID),
			)
			continue
		}

		// チェイン効果を作成
		var chainEffect *domain.ChainEffect
		if modData.HasChainEffect() {
			ce := domain.NewChainEffect(
				convertChainEffectType(modData.ChainEffectType),
				modData.ChainEffectValue,
			)
			chainEffect = &ce
		}

		// モジュールを作成
		module := domain.NewModuleFromType(moduleDef.ToDomainType(), chainEffect)
		modules = append(modules, module)
	}

	return domain.NewAgent(firstAgentData.ID, core, modules)
}

// convertChainEffectType は文字列をChainEffectTypeに変換します。
func convertChainEffectType(s string) domain.ChainEffectType {
	switch s {
	case "damage_bonus":
		return domain.ChainEffectDamageBonus
	case "heal_bonus":
		return domain.ChainEffectHealBonus
	case "buff_extend":
		return domain.ChainEffectBuffExtend
	case "debuff_extend":
		return domain.ChainEffectDebuffExtend
	case "damage_amp":
		return domain.ChainEffectDamageAmp
	case "armor_pierce":
		return domain.ChainEffectArmorPierce
	case "life_steal":
		return domain.ChainEffectLifeSteal
	case "damage_cut":
		return domain.ChainEffectDamageCut
	case "evasion":
		return domain.ChainEffectEvasion
	case "reflect":
		return domain.ChainEffectReflect
	case "regen":
		return domain.ChainEffectRegen
	case "heal_amp":
		return domain.ChainEffectHealAmp
	case "overheal":
		return domain.ChainEffectOverheal
	case "time_extend":
		return domain.ChainEffectTimeExtend
	case "auto_correct":
		return domain.ChainEffectAutoCorrect
	case "cooldown_reduce":
		return domain.ChainEffectCooldownReduce
	case "buff_duration":
		return domain.ChainEffectBuffDuration
	case "debuff_duration":
		return domain.ChainEffectDebuffDuration
	case "double_cast":
		return domain.ChainEffectDoubleCast
	default:
		return domain.ChainEffectDamageBonus
	}
}

// InitializeNewGame は新規ゲームを初期化してセーブデータを作成します。

// ID化最適化に対応：フルオブジェクトではなくID参照を保存
func (i *NewGameInitializer) InitializeNewGame() *savedata.SaveData {
	// 基本のセーブデータを作成
	saveData := savedata.NewSaveData()

	// 初期エージェントを作成
	initialAgent := i.CreateInitialAgent()

	// インベントリにエージェントを追加（コア情報を直接埋め込み）
	modules := make([]savedata.ModuleInstanceSave, len(initialAgent.Modules))
	for idx, m := range initialAgent.Modules {
		modules[idx] = savedata.ModuleInstanceSave{
			TypeID: m.TypeID,
		}
		// チェイン効果があれば変換
		if m.ChainEffect != nil {
			modules[idx].ChainEffect = &savedata.ChainEffectSave{
				Type:  string(m.ChainEffect.Type),
				Value: m.ChainEffect.Value,
			}
		}
	}
	saveData.Inventory.AgentInstances = []savedata.AgentInstanceSave{
		{
			ID: initialAgent.ID,
			Core: savedata.CoreInstanceSave{
				CoreTypeID: initialAgent.Core.TypeID,
				Level:      initialAgent.Core.Level,
			},
			Modules: modules,
		},
	}

	// インベントリのコアは空（エージェントのコアはエージェント内に保持される）
	saveData.Inventory.CoreInstances = []savedata.CoreInstanceSave{}

	// コアとモジュールはエージェント合成で消費されるため、インベントリには追加しない
	// （エージェントに含まれているコアとモジュールは参照として保持される）

	// 初期エージェントを装備（スロット0に装備）
	saveData.Player.EquippedAgentIDs = [3]string{initialAgent.ID, "", ""}

	return saveData
}

// CreateNewGameWithExtraItems は追加アイテム付きで新規ゲームを初期化します。
// デバッグや特殊条件での開始用
// v1.0.0形式に対応：TypeIDとLevelのみを保存
func (i *NewGameInitializer) CreateNewGameWithExtraItems() *savedata.SaveData {
	saveData := i.InitializeNewGame()

	// 追加のエージェントから情報を取得（初期エージェントと同じ構成を使用）
	extraAgent := i.CreateInitialAgent()
	if extraAgent == nil {
		return saveData
	}

	// 追加のコアをインベントリに追加
	saveData.Inventory.CoreInstances = append(saveData.Inventory.CoreInstances, savedata.CoreInstanceSave{
		CoreTypeID: extraAgent.Core.TypeID,
		Level:      extraAgent.Core.Level,
	})

	// 追加のモジュールをインベントリにModuleInstancesとして追加
	for _, module := range extraAgent.Modules {
		modSave := savedata.ModuleInstanceSave{
			TypeID: module.TypeID,
		}
		// チェイン効果があれば変換
		if module.ChainEffect != nil {
			modSave.ChainEffect = &savedata.ChainEffectSave{
				Type:  string(module.ChainEffect.Type),
				Value: module.ChainEffect.Value,
			}
		}
		saveData.Inventory.ModuleInstances = append(saveData.Inventory.ModuleInstances, modSave)
	}

	return saveData
}
