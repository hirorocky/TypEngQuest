#!/usr/bin/env node

import { Game } from './core/Game';

async function main() {
  console.log('🎮 TypEngQuest - Starting game...');

  // コマンドライン引数からテストモードを判定
  const isTestMode = process.argv.includes('--test-mode');
  
  if (isTestMode) {
    console.log('🧪 Running in test mode with fixed directory structure...');
  }

  try {
    const game = new Game(isTestMode);
    await game.start();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
main();

export { main };
