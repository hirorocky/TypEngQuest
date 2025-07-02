import { Player } from '../player';

describe('Equipment System Integration', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player('Test Player');
  });

  describe('Word Stats and Balance', () => {
    test('should have balanced word stats', () => {
      const words = ['the', 'quick', 'brown', 'fox', 'jumps'];
      const wordStats = words.map(word => {
        const testPlayer = new Player();
        testPlayer.equipWord(1, word);
        const stats = testPlayer.getStats();
        return {
          word,
          attack: stats.equipmentAttack,
          defense: stats.equipmentDefense,
          speed: stats.equipmentSpeed,
          accuracy: stats.equipmentAccuracy,
          critical: stats.equipmentCritical
        };
      });

      // Verify all words have some positive stats
      wordStats.forEach(stat => {
        const totalStats = stat.attack + stat.defense + stat.speed + stat.accuracy + stat.critical;
        expect(totalStats).toBeGreaterThan(0);
      });

      // Verify high-tier words like 'quick' have higher total values
      const quickStats = wordStats.find(w => w.word === 'quick');
      const theStats = wordStats.find(w => w.word === 'the');
      
      expect(quickStats!.speed).toBeGreaterThan(theStats!.speed);
      expect(quickStats!.critical).toBeGreaterThan(theStats!.critical);
    });

    test('should handle unknown word stats gracefully', () => {
      // Create a new player with unknown word in inventory
      const testPlayer = new Player('Test');
      // Access private inventory directly for testing
      (testPlayer as any).inventory.push('unknown');
      testPlayer.equipWord(1, 'unknown');
      
      const stats = testPlayer.getStats();
      // Unknown words should get default stats (1 for each)
      expect(stats.equipmentAttack).toBe(1);
      expect(stats.equipmentDefense).toBe(1);
      expect(stats.equipmentSpeed).toBe(1);
      expect(stats.equipmentAccuracy).toBe(1);
      expect(stats.equipmentCritical).toBe(1);
    });
  });

  describe('Multi-Word Equipment Scenarios', () => {
    test('should handle full equipment setup', () => {
      const words = ['the', 'quick', 'brown', 'fox', 'jumps'];
      
      words.forEach((word, index) => {
        const result = player.equipWord(index + 1, word);
        expect(result).toBe(true);
      });

      const equipment = player.getEquipment();
      equipment.forEach((slot, index) => {
        expect(slot.word).toBe(words[index]);
        expect(slot.wordType).not.toBeNull();
      });

      const stats = player.getStats();
      expect(stats.equipmentAttack).toBeGreaterThan(0);
      expect(stats.equipmentSpeed).toBeGreaterThan(0);
    });

    test('should calculate cumulative stats correctly', () => {
      // Test progressive equipment
      player.equipWord(1, 'the');
      const stats1 = player.getStats();
      
      player.equipWord(2, 'quick');
      const stats2 = player.getStats();
      
      // Stats should increase
      expect(stats2.equipmentAttack).toBeGreaterThan(stats1.equipmentAttack);
      expect(stats2.equipmentSpeed).toBeGreaterThan(stats1.equipmentSpeed);
      
      // Should be cumulative
      expect(stats2.equipmentAttack).toBe(5); // the(2) + quick(3)
      expect(stats2.equipmentSpeed).toBe(8); // the(0) + quick(8)
    });

    test('should handle equipment swapping correctly', () => {
      player.equipWord(1, 'the');
      const initialStats = player.getStats();
      
      // Swap for a more powerful word
      player.equipWord(1, 'quick');
      const swappedStats = player.getStats();
      
      expect(swappedStats.equipmentSpeed).toBeGreaterThan(initialStats.equipmentSpeed);
      expect(swappedStats.equipmentCritical).toBeGreaterThan(initialStats.equipmentCritical);
      
      // 'the' should be back in inventory
      expect(player.getInventory()).toContain('the');
      expect(player.getInventory()).not.toContain('quick');
    });
  });

  describe('Equipment Persistence and State', () => {
    test('should maintain equipment state through operations', () => {
      player.equipWord(1, 'the');
      player.equipWord(2, 'quick');
      
      // Perform other operations
      player.addExperience(50);
      player.takeDamage(10);
      player.heal(5);
      
      // Equipment should remain unchanged
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBe('the');
      expect(equipment[1].word).toBe('quick');
      
      const stats = player.getStats();
      expect(stats.equipmentAttack).toBe(5);
    });

    test('should recalculate stats after level up', async () => {
      player.equipWord(1, 'quick');
      const preLevel = player.getTotalStats();
      
      player.addExperience(100); // Level up
      const postLevel = player.getTotalStats();
      
      // Base stats should increase but equipment stats remain same
      expect(postLevel.attack).toBeGreaterThan(preLevel.attack);
      expect(postLevel.speed - player.getStats().baseSpeed).toBe(8); // quick's speed bonus unchanged
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty slots gracefully', () => {
      const stats = player.getStats();
      
      // All equipment stats should be 0 initially
      expect(stats.equipmentAttack).toBe(0);
      expect(stats.equipmentDefense).toBe(0);
      expect(stats.equipmentSpeed).toBe(0);
      expect(stats.equipmentAccuracy).toBe(0);
      expect(stats.equipmentCritical).toBe(0);
    });

    test('should handle mixed empty and filled slots', () => {
      player.equipWord(1, 'the');
      player.equipWord(3, 'fox');
      player.equipWord(5, 'jumps');
      
      const equipment = player.getEquipment();
      expect(equipment[0].word).toBe('the');
      expect(equipment[1].word).toBeNull();
      expect(equipment[2].word).toBe('fox');
      expect(equipment[3].word).toBeNull();
      expect(equipment[4].word).toBe('jumps');
      
      const stats = player.getStats();
      expect(stats.equipmentAttack).toBe(16); // the(2) + fox(6) + jumps(8)
    });

    test('should handle rapid equipment changes', () => {
      const words = ['the', 'quick', 'brown', 'fox', 'jumps'];
      
      // Rapid equip/unequip cycle
      for (let i = 0; i < 10; i++) {
        const word = words[i % words.length];
        const slot = (i % 5) + 1;
        
        player.equipWord(slot, word);
        if (i % 2 === 0) {
          player.unequipWord(slot);
        }
      }
      
      // Should not crash and maintain valid state
      const equipment = player.getEquipment();
      const inventory = player.getInventory();
      const allWords = [
        ...equipment.filter(e => e.word).map(e => e.word),
        ...inventory
      ];
      
      // All original words should still exist somewhere
      words.forEach(word => {
        expect(allWords).toContain(word);
      });
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle stat calculations efficiently', () => {
      const startTime = performance.now();
      
      // Perform many equipment operations
      for (let i = 0; i < 100; i++) {
        player.equipWord(1, 'the');
        player.getTotalStats();
        player.unequipWord(1);
        player.getTotalStats();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should maintain data consistency under stress', () => {
      const words = ['the', 'quick', 'brown', 'fox', 'jumps'];
      
      // Perform many random operations
      for (let i = 0; i < 50; i++) {
        const operation = Math.random();
        const slot = Math.floor(Math.random() * 5) + 1;
        
        if (operation < 0.6) {
          // 60% chance to equip
          const availableWords = player.getInventory();
          if (availableWords.length > 0) {
            const word = availableWords[Math.floor(Math.random() * availableWords.length)];
            player.equipWord(slot, word);
          }
        } else {
          // 40% chance to unequip
          player.unequipWord(slot);
        }
      }
      
      // Verify data consistency
      const inventory = player.getInventory();
      const equipment = player.getEquipment();
      const equippedWords = equipment.filter(e => e.word).map(e => e.word);
      const allWords = [...inventory, ...equippedWords];
      
      // Should have exactly the original words
      expect(allWords.sort()).toEqual(words.sort());
      
      // No duplicates
      const uniqueWords = [...new Set(allWords)];
      expect(uniqueWords.length).toBe(words.length);
    });
  });
});