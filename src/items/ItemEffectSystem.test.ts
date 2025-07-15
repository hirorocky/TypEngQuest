import { ItemEffectSystem } from './ItemEffectSystem';
import { ConsumableItem, EffectType, EffectTarget } from './ConsumableItem';
import { ItemType, ItemRarity } from './Item';
import { Player } from '../player/Player';

describe('ItemEffectSystem', () => {
  let player: Player;
  let effectSystem: ItemEffectSystem;

  beforeEach(() => {
    player = new Player('TestPlayer');
    effectSystem = new ItemEffectSystem();
  });

  describe('HP回復効果の統合テスト', () => {
    it('HP回復アイテムを使用してHPが回復する', async () => {
      const healingPotion = new ConsumableItem({
        id: 'healing_potion',
        name: 'Healing Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 50,
          },
        ],
      });

      // HPを減らす
      player.getStats().takeDamage(30);
      const damagedHP = player.getStats().getCurrentHP();

      // アイテムを使用
      await effectSystem.applyItemEffects(healingPotion, player);

      // HPが回復したことを確認
      expect(player.getStats().getCurrentHP()).toBeGreaterThan(damagedHP);
    });

    it('HP回復アイテムは最大HPを超えない', async () => {
      const healingPotion = new ConsumableItem({
        id: 'mega_healing_potion',
        name: 'Mega Healing Potion',
        description: 'Restores 200 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 200,
          },
        ],
      });

      // HPを少し減らす
      player.getStats().takeDamage(10);
      const maxHP = player.getStats().getMaxHP();

      // アイテムを使用
      await effectSystem.applyItemEffects(healingPotion, player);

      // HPが最大HPを超えないことを確認
      expect(player.getStats().getCurrentHP()).toBe(maxHP);
    });
  });

  describe('MP回復効果の統合テスト', () => {
    it('MP回復アイテムを使用してMPが回復する', async () => {
      const manaPotion = new ConsumableItem({
        id: 'mana_potion',
        name: 'Mana Potion',
        description: 'Restores 30 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_MP,
            target: EffectTarget.SELF,
            value: 30,
          },
        ],
      });

      // MPを減らす
      player.getStats().consumeMP(20);
      const consumedMP = player.getStats().getCurrentMP();

      // アイテムを使用
      await effectSystem.applyItemEffects(manaPotion, player);

      // MPが回復したことを確認
      expect(player.getStats().getCurrentMP()).toBeGreaterThan(consumedMP);
    });

    it('MP回復アイテムは最大MPを超えない', async () => {
      const megaManaPotion = new ConsumableItem({
        id: 'mega_mana_potion',
        name: 'Mega Mana Potion',
        description: 'Restores 100 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.RARE,
        effects: [
          {
            type: EffectType.HEAL_MP,
            target: EffectTarget.SELF,
            value: 100,
          },
        ],
      });

      // MPを少し減らす
      player.getStats().consumeMP(5);
      const maxMP = player.getStats().getMaxMP();

      // アイテムを使用
      await effectSystem.applyItemEffects(megaManaPotion, player);

      // MPが最大MPを超えないことを確認
      expect(player.getStats().getCurrentMP()).toBe(maxMP);
    });
  });

  describe('バフ効果の統合テスト', () => {
    it('攻撃力バフアイテムを使用して攻撃力が上がる', async () => {
      const attackBoost = new ConsumableItem({
        id: 'attack_boost',
        name: 'Attack Boost',
        description: 'Increases attack by 15',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.BUFF_ATTACK,
            target: EffectTarget.SELF,
            value: 15,
            duration: 5,
          },
        ],
      });

      const initialAttack = player.getStats().getAttack();

      // アイテムを使用
      await effectSystem.applyItemEffects(attackBoost, player);

      // 攻撃力が上がったことを確認
      expect(player.getStats().getAttack()).toBe(initialAttack + 15);
    });

    it('防御力バフアイテムを使用して防御力が上がる', async () => {
      const defenseBoost = new ConsumableItem({
        id: 'defense_boost',
        name: 'Defense Boost',
        description: 'Increases defense by 10',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.BUFF_DEFENSE,
            target: EffectTarget.SELF,
            value: 10,
            duration: 3,
          },
        ],
      });

      const initialDefense = player.getStats().getDefense();

      // アイテムを使用
      await effectSystem.applyItemEffects(defenseBoost, player);

      // 防御力が上がったことを確認
      expect(player.getStats().getDefense()).toBe(initialDefense + 10);
    });

    it('バフ効果は一時ステータスとして追加される', async () => {
      const speedBoost = new ConsumableItem({
        id: 'speed_boost',
        name: 'Speed Boost',
        description: 'Increases speed by 8',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.BUFF_SPEED,
            target: EffectTarget.SELF,
            value: 8,
            duration: 4,
          },
        ],
      });

      const initialStatusCount = player.getStats().getTemporaryStatuses().length;

      // アイテムを使用
      await effectSystem.applyItemEffects(speedBoost, player);

      // 一時ステータスが追加されたことを確認
      expect(player.getStats().getTemporaryStatuses().length).toBe(initialStatusCount + 1);
    });
  });

  describe('複数効果の統合テスト', () => {
    it('HP回復とMP回復を同時に行う', async () => {
      const elixir = new ConsumableItem({
        id: 'elixir',
        name: 'Elixir',
        description: 'Restores 80 HP and 40 MP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.EPIC,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 80,
          },
          {
            type: EffectType.HEAL_MP,
            target: EffectTarget.SELF,
            value: 40,
          },
        ],
      });

      // HPとMPを減らす
      player.getStats().takeDamage(50);
      player.getStats().consumeMP(30);
      const damagedHP = player.getStats().getCurrentHP();
      const consumedMP = player.getStats().getCurrentMP();

      // アイテムを使用
      await effectSystem.applyItemEffects(elixir, player);

      // HPとMPが回復したことを確認
      expect(player.getStats().getCurrentHP()).toBeGreaterThan(damagedHP);
      expect(player.getStats().getCurrentMP()).toBeGreaterThan(consumedMP);
    });

    it('回復とバフを同時に行う', async () => {
      const holyElixir = new ConsumableItem({
        id: 'holy_elixir',
        name: 'Holy Elixir',
        description: 'Restores 60 HP and increases all stats',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.LEGENDARY,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 60,
          },
          {
            type: EffectType.BUFF_ATTACK,
            target: EffectTarget.SELF,
            value: 5,
            duration: 10,
          },
          {
            type: EffectType.BUFF_DEFENSE,
            target: EffectTarget.SELF,
            value: 5,
            duration: 10,
          },
        ],
      });

      // HPを減らす
      player.getStats().takeDamage(40);
      const damagedHP = player.getStats().getCurrentHP();
      const initialAttack = player.getStats().getAttack();
      const initialDefense = player.getStats().getDefense();

      // アイテムを使用
      await effectSystem.applyItemEffects(holyElixir, player);

      // HPが回復し、攻撃力と防御力が上がったことを確認
      expect(player.getStats().getCurrentHP()).toBeGreaterThan(damagedHP);
      expect(player.getStats().getAttack()).toBe(initialAttack + 5);
      expect(player.getStats().getDefense()).toBe(initialDefense + 5);
    });
  });

  describe('効果の適用可能性チェック', () => {
    it('使用可能なアイテムの効果が適用される', async () => {
      const healingPotion = new ConsumableItem({
        id: 'healing_potion',
        name: 'Healing Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 50,
          },
        ],
      });

      // HPを減らして使用可能な状態にする
      player.getStats().takeDamage(30);

      // アイテムが使用可能かチェック
      expect(effectSystem.canApplyItemEffects(healingPotion, player)).toBe(true);

      // アイテムを使用
      await effectSystem.applyItemEffects(healingPotion, player);

      // 効果が適用されたことを確認（例外が発生しないこと）
      expect(true).toBe(true);
    });

    it('使用不可能なアイテムの効果適用時にエラーが発生する', async () => {
      const healingPotion = new ConsumableItem({
        id: 'healing_potion',
        name: 'Healing Potion',
        description: 'Restores 50 HP',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.HEAL_HP,
            target: EffectTarget.SELF,
            value: 50,
          },
        ],
      });

      // HPは満タンのまま（使用不可能な状態）
      expect(effectSystem.canApplyItemEffects(healingPotion, player)).toBe(false);

      // アイテムを使用しようとするとエラーが発生
      await expect(effectSystem.applyItemEffects(healingPotion, player)).rejects.toThrow();
    });
  });

  describe('効果システムの統合', () => {
    it('ItemEffectSystemが正しく初期化される', () => {
      expect(effectSystem).toBeInstanceOf(ItemEffectSystem);
    });

    it('ItemEffectSystemが消費アイテムを正しく処理する', async () => {
      const testItem = new ConsumableItem({
        id: 'test_item',
        name: 'Test Item',
        description: 'Test item for system verification',
        type: ItemType.CONSUMABLE,
        rarity: ItemRarity.COMMON,
        effects: [
          {
            type: EffectType.BUFF_ACCURACY,
            target: EffectTarget.SELF,
            value: 3,
            duration: 2,
          },
        ],
      });

      const initialAccuracy = player.getStats().getAccuracy();

      // アイテムを使用
      await effectSystem.applyItemEffects(testItem, player);

      // 効果が適用されたことを確認
      expect(player.getStats().getAccuracy()).toBe(initialAccuracy + 3);
    });
  });
});
