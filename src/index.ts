#!/usr/bin/env node

import { Game } from './core/Game';

async function main() {
  console.log('🎮 TypEngQuest - Starting game...');

  // コマンドライン引数から開発者モードを判定
  const isDevMode = process.argv.includes('--dev-mode');

  if (isDevMode) {
    console.log('🧪 Running in dev mode with fixed directory structure...');
  }

  try {
    const game = new Game(isDevMode);
    await game.start();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
main();

export { main };
