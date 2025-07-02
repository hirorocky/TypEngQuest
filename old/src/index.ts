#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { Game } from './core/game.js';

const program = new Command();

// ASCII Art Title Display
function displayTitle() {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync('CodeQuest RPG', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
  console.log(chalk.yellow('✨ A Typing RPG Adventure for Engineers ✨\n'));
}

// Main Application Entry Point
async function main() {
  displayTitle();
  
  const game = new Game();
  await game.start();
}

// CLI Command Setup
program
  .name('codequest')
  .description('CodeQuest RPG - A typing RPG game for engineers')
  .version('1.0.0')
  .action(main);

// Global Error Handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Fatal Error:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Promise Rejection:'), reason);
  process.exit(1);
});

// Start the CLI application
program.parse(process.argv);