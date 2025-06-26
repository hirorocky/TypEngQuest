import { Player } from '../player';

describe('Player', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('Test Player');
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      const stats = player.getStats();
      expect(player.getName()).toBe('Test Player');
      expect(stats.level).toBe(1);
      expect(stats.experience).toBe(0);
      expect(stats.experienceToNext).toBe(100);
      expect(stats.baseAttack).toBe(10);
      expect(stats.currentHealth).toBe(50);
      expect(stats.maxHealth).toBe(50);
    });

    test('should initialize with default name if not provided', () => {
      const defaultPlayer = new Player();
      expect(defaultPlayer.getName()).toBe('Code Warrior');
    });

    test('should initialize with empty equipment slots', () => {
      const equipment = player.getEquipment();
      expect(equipment).toHaveLength(5);
      equipment.forEach((slot, index) => {
        expect(slot.slotNumber).toBe(index + 1);
        expect(slot.word).toBeNull();
        expect(slot.wordType).toBeNull();
      });
    });

    test('should initialize with starting inventory', () => {
      const inventory = player.getInventory();
      expect(inventory).toEqual(['the', 'quick', 'brown', 'fox', 'jumps']);
    });
  });

  describe('Equipment Management', () => {
    test('should equip word successfully', () => {
      const result = player.equipWord(1, 'the');
      expect(result).toBe(true);
      
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBe('the');
      expect(equipment[0].wordType).toBe('article');
      
      const inventory = player.getInventory();
      expect(inventory).not.toContain('the');
    });

    test('should not equip word not in inventory', () => {
      const result = player.equipWord(1, 'nonexistent');
      expect(result).toBe(false);
      
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBeNull();
    });

    test('should not equip to invalid slot number', () => {
      expect(player.equipWord(0, 'the')).toBe(false);
      expect(player.equipWord(6, 'the')).toBe(false);
      expect(player.equipWord(-1, 'the')).toBe(false);
    });

    test('should replace word in occupied slot and return old word to inventory', () => {
      player.equipWord(1, 'the');
      const result = player.equipWord(1, 'quick');
      
      expect(result).toBe(true);
      
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBe('quick');
      
      const inventory = player.getInventory();
      expect(inventory).toContain('the');
      expect(inventory).not.toContain('quick');
    });

    test('should unequip word successfully', () => {
      player.equipWord(1, 'the');
      const result = player.unequipWord(1);
      
      expect(result).toBe(true);
      
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBeNull();
      expect(equipment[0].wordType).toBeNull();
      
      const inventory = player.getInventory();
      expect(inventory).toContain('the');
    });

    test('should not unequip from empty slot', () => {
      const result = player.unequipWord(1);
      expect(result).toBe(false);
    });

    test('should not unequip from invalid slot number', () => {
      expect(player.unequipWord(0)).toBe(false);
      expect(player.unequipWord(6)).toBe(false);
      expect(player.unequipWord(-1)).toBe(false);
    });
  });

  describe('Word Type Determination', () => {
    test('should determine word types correctly', () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      player.equipWord(3, 'fox');
      player.equipWord(4, 'jumps');
      
      const equipment = player.getEquipment();
      expect(equipment[0].wordType).toBe('article');
      expect(equipment[1].wordType).toBe('adjective');
      expect(equipment[2].wordType).toBe('noun');
      expect(equipment[3].wordType).toBe('verb');
    });

    test('should default to noun for unknown words', () => {
      // Create a new player with unknown word in inventory
      const testPlayer = new Player('Test');
      // Access private inventory directly for testing
      (testPlayer as any).inventory.push('unknown');
      testPlayer.equipWord(1, 'unknown');
      
      const equipment = testPlayer.getEquipment();
      expect(equipment[0].wordType).toBe('noun');
    });
  });

  describe('Stats Calculation', () => {
    test('should calculate equipment bonuses correctly', () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      
      const stats = player.getStats();
      expect(stats.equipmentAttack).toBe(5); // the(2) + quick(3)
      expect(stats.equipmentSpeed).toBe(8); // the(0) + quick(8)
      expect(stats.equipmentCritical).toBe(5); // the(0) + quick(5)
    });

    test('should calculate total stats correctly', () => {
      player.equipWord(1, 'the');
      
      const totalStats = player.getTotalStats();
      expect(totalStats.attack).toBe(12); // base(10) + equipment(2)
      expect(totalStats.defense).toBe(6); // base(5) + equipment(1)
      expect(totalStats.speed).toBe(8); // base(8) + equipment(0)
    });

    test('should recalculate stats when equipment changes', () => {
      player.equipWord(1, 'the');
      let stats = player.getStats();
      expect(stats.equipmentAttack).toBe(2);
      
      player.equipWord(2, 'quick');
      stats = player.getStats();
      expect(stats.equipmentAttack).toBe(5);
      
      player.unequipWord(1);
      stats = player.getStats();
      expect(stats.equipmentAttack).toBe(3);
    });
  });

  describe('Experience and Leveling', () => {
    test('should add experience correctly', () => {
      const leveledUp = player.addExperience(50);
      
      expect(leveledUp).toBe(false);
      const stats = player.getStats();
      expect(stats.experience).toBe(50);
      expect(stats.level).toBe(1);
    });

    test('should level up when experience threshold is reached', () => {
      const leveledUp = player.addExperience(100);
      
      expect(leveledUp).toBe(true);
      const stats = player.getStats();
      expect(stats.level).toBe(2);
      expect(stats.experience).toBe(0);
      expect(stats.experienceToNext).toBe(150); // 100 * 1.5
    });

    test('should increase stats on level up', () => {
      const initialStats = player.getStats();
      player.addExperience(100);
      const newStats = player.getStats();
      
      expect(newStats.baseAttack).toBe(initialStats.baseAttack + 2);
      expect(newStats.baseDefense).toBe(initialStats.baseDefense + 2);
      expect(newStats.baseSpeed).toBe(initialStats.baseSpeed + 1);
      expect(newStats.baseAccuracy).toBe(initialStats.baseAccuracy + 1);
      expect(newStats.baseCritical).toBe(initialStats.baseCritical + 1);
    });

    test('should restore health and mana on level up', () => {
      player.takeDamage(10);
      player.spendMana(5);
      
      const initialStats = player.getStats();
      player.addExperience(100);
      const newStats = player.getStats();
      
      expect(newStats.maxHealth).toBe(initialStats.maxHealth + 10);
      expect(newStats.maxMana).toBe(initialStats.maxMana + 5);
      expect(newStats.currentHealth).toBe(newStats.maxHealth);
      expect(newStats.currentMana).toBe(newStats.maxMana);
    });
  });

  describe('Health and Mana Management', () => {
    test('should take damage correctly', () => {
      player.takeDamage(20);
      const stats = player.getStats();
      expect(stats.currentHealth).toBe(30);
    });

    test('should not reduce health below 0', () => {
      player.takeDamage(100);
      const stats = player.getStats();
      expect(stats.currentHealth).toBe(0);
    });

    test('should heal correctly', () => {
      player.takeDamage(20);
      player.heal(10);
      const stats = player.getStats();
      expect(stats.currentHealth).toBe(40);
    });

    test('should not heal above max health', () => {
      player.heal(100);
      const stats = player.getStats();
      expect(stats.currentHealth).toBe(stats.maxHealth);
    });

    test('should spend mana correctly', () => {
      const result = player.spendMana(10);
      expect(result).toBe(true);
      
      const stats = player.getStats();
      expect(stats.currentMana).toBe(10);
    });

    test('should not spend more mana than available', () => {
      const result = player.spendMana(30);
      expect(result).toBe(false);
      
      const stats = player.getStats();
      expect(stats.currentMana).toBe(20);
    });

    test('should restore mana correctly', () => {
      player.spendMana(10);
      player.restoreMana(5);
      const stats = player.getStats();
      expect(stats.currentMana).toBe(15);
    });

    test('should not restore mana above max', () => {
      player.restoreMana(100);
      const stats = player.getStats();
      expect(stats.currentMana).toBe(stats.maxMana);
    });

    test('should correctly report if player is alive', () => {
      expect(player.isAlive()).toBe(true);
      
      player.takeDamage(50);
      expect(player.isAlive()).toBe(false);
      
      player.heal(10);
      expect(player.isAlive()).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    test('should return defensive copies of data', () => {
      const stats1 = player.getStats();
      const stats2 = player.getStats();
      
      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
      
      stats1.level = 999;
      expect(player.getStats().level).toBe(1);
    });

    test('should return defensive copies of equipment', () => {
      const equipment1 = player.getEquipment();
      const equipment2 = player.getEquipment();
      
      expect(equipment1).not.toBe(equipment2);
      expect(equipment1).toEqual(equipment2);
    });

    test('should return defensive copies of inventory', () => {
      const inventory1 = player.getInventory();
      const inventory2 = player.getInventory();
      
      expect(inventory1).not.toBe(inventory2);
      expect(inventory1).toEqual(inventory2);
      
      inventory1.push('hacked');
      expect(player.getInventory()).not.toContain('hacked');
    });
  });
});