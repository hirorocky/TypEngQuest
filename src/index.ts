#!/usr/bin/env node

import { Game } from './core/Game';

async function main() {
  console.log('🎮 TypEngQuest - Starting game...');
  
  try {
    const game = new Game();
    await game.start();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };