import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import jsdoc from 'eslint-plugin-jsdoc'

const sourceType = 'module'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // Base JS rules for TS and Vue scripts.
  {
    files: ['src/**/*.{ts,vue}'],
    ...js.configs.recommended,
  },

  // TypeScript rules (applied to TS + Vue; parser overridden for Vue by vue plugin processor).
  ...tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['src/**/*.{ts,vue}'],
  })),

  // Vue SFC rules and processor.
  ...vue.configs['flat/essential'].map((config) => ({
    ...config,
    files: ['src/**/*.vue'],
  })),

  // Ensure Vue <script> is parsed as TypeScript.
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType,
      },
    },
  },

  // TypeScript parser for .ts files.
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType,
      },
    },
  },

  // JSDoc rules (with project-specific enforcement).
  {
    files: ['src/**/*.{ts,vue}'],
    ...jsdoc.configs['flat/recommended-typescript'],
    rules: {
      ...jsdoc.configs['flat/recommended-typescript'].rules,

      // Force: file-level overview.
      'jsdoc/require-file-overview': [
        'error',
        {
          tags: {
            file: {
              mustExist: true,
            },
          },
        },
      ],

      // Force: method-level (functions/methods) + constant-level (exported const/let).
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: [
            'FunctionDeclaration',
            'MethodDefinition',
            'TSDeclareFunction',
            'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
          ],
        },
      ],
    },
  },
]
