import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'caughtErrorsIgnorePattern': '^_',
          'ignoreRestSiblings': false,
          'args': 'all',
          'vars': 'all',
          'caughtErrors': 'all'
        }
      ],

      // General rules
      'no-console': 'off', // Allow console.log for CLI game
      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',

      // Code quality
      'complexity': ['error', 10],
      'max-depth': ['error', 4],
      'max-params': ['error', 4]
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'src/tests/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        setTimeout: 'readonly',
        require: 'readonly',
        NodeJS: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript
    },
    rules: {
      // Disable base rule as it can report incorrect errors
      'no-unused-vars': 'off',

      // Inherit all rules from the base configuration
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'argsIgnorePattern': '^_',
          'varsIgnorePattern': '^_',
          'caughtErrorsIgnorePattern': '^_',
          'ignoreRestSiblings': false,
          'args': 'all',
          'vars': 'all',
          'caughtErrors': 'all'
        }
      ],

      'prefer-const': 'error',
      'no-var': 'error',
      'no-duplicate-imports': 'error',
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js',
      'jest.config.js',
      'eslint.config.js',
      '__mocks__/'
    ]
  },
  prettier
];