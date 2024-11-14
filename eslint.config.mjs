import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: ['*', '!src', 'src/protobuf'],
	},
	...compat
		.extends(
			'eslint:recommended',
			'plugin:@typescript-eslint/eslint-recommended',
			'plugin:@typescript-eslint/recommended',
			'prettier',
		)
		.map((config) => ({
			...config,
			files: ['src/**/*.ts'],
		})),
	{
		files: ['src/**/*.ts'],

		plugins: {
			'@typescript-eslint': typescriptEslint,
		},

		languageOptions: {
			globals: {
				...globals.commonjs,
				...globals.node,
				...globals.jest,
			},

			parser: tsParser,
			ecmaVersion: 2022,
			sourceType: 'commonjs',

			parserOptions: {
				project: './tsconfig.json',
				tsconfigRootDir: '.',
			},
		},

		rules: {
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'no-redeclare': 'off', // disable rule because Typescript already has similar logic. See https://eslint.org/docs/latest/rules/no-redeclare#handled_by_typescript
			'eol-last': ['error', 'always'],
			'newline-before-return': 'error',
			camelcase: 'error',
			'no-var': 'error',
			'prefer-const': 'error',

			'space-before-function-paren': [
				'error',
				{
					anonymous: 'always',
					named: 'never',
					asyncArrow: 'always',
				},
			],

			'space-before-blocks': ['error', 'always'],
			'func-call-spacing': ['error', 'never'],

			'arrow-spacing': [
				'error',
				{
					before: true,
					after: true,
				},
			],

			'for-direction': 'error',
			'getter-return': 'error',
			'no-await-in-loop': 'error',
			'no-console': 'warn',
			'no-constant-condition': 'warn',
			'no-loss-of-precision': 'error',
			'no-promise-executor-return': 'error',
			'no-template-curly-in-string': 'error',
			'no-unreachable': 'warn',
			'no-unreachable-loop': 'error',
			'class-methods-use-this': 0,
			'consistent-return': 0,
			curly: 'error',
			'default-param-last': 'error',
			'dot-notation': 'error',
			eqeqeq: 'error',
			'grouped-accessor-pairs': 'error',
			'no-caller': 'error',
			'no-alert': 'error',
			'no-constructor-return': 'error',
			'no-else-return': 'error',

			'no-empty-function': [
				'error',
				{
					allow: ['constructors'],
				},
			],

			'no-eq-null': 'error',
			'no-extend-native': 'error',
			'no-extra-bind': 'error',
			'no-loop-func': 'error',
			'no-multi-spaces': 'error',
			'no-return-assign': 'error',
			'no-return-await': 'error',
			'no-throw-literal': 'error',
			'no-unmodified-loop-condition': 'error',
			'no-useless-concat': 'error',
			'no-useless-escape': 'error',
			'no-warning-comments': 'warn',
			'prefer-promise-reject-errors': 'error',
			'require-await': 'error',
			yoda: 'error',
			'block-spacing': 'error',

			'comma-spacing': [
				'error',
				{
					before: false,
					after: true,
				},
			],

			'comma-style': ['error', 'last'],

			'key-spacing': [
				'error',
				{
					beforeColon: false,
					afterColon: true,
				},
			],

			'linebreak-style': ['error', 'unix'],

			'lines-between-class-members': [
				'error',
				'always',
				{
					exceptAfterSingleLine: true,
				},
			],

			'new-cap': [
				'error',
				{
					newIsCap: true,
				},
			],

			'no-lonely-if': 'error',
			'no-multi-assign': 'error',

			'no-multiple-empty-lines': [
				'error',
				{
					max: 3,
					maxEOF: 0,
				},
			],

			'no-negated-condition': 'error',
			'no-unneeded-ternary': 'error',
			'no-whitespace-before-property': 'error',
			'one-var': ['error', 'never'],
			'one-var-declaration-per-line': ['error', 'always'],
			'prefer-object-spread': 'error',
			'semi-spacing': 'error',
			'semi-style': ['error', 'last'],
			'space-unary-ops': 'error',
			'arrow-parens': ['error', 'always'],
			'constructor-super': 'error',
			'no-class-assign': 'error',
			'no-confusing-arrow': 'error',

			'prefer-arrow-callback': [
				'warn',
				{
					allowNamedFunctions: true,
				},
			],

			'prefer-rest-params': 'warn',
			'prefer-spread': 'error',
			'prefer-template': 'warn',
			'rest-spread-spacing': ['error', 'never'],
			'template-curly-spacing': 'error',
			'max-depth': ['warn', 4],
			'space-infix-ops': ['error'],
			'@typescript-eslint/no-var-requires': 0,
			'@typescript-eslint/no-unused-vars': 0,
			'no-use-before-define': 'off',
			'@typescript-eslint/no-use-before-define': 'error',

			'@typescript-eslint/no-empty-function': [
				'error',
				{
					allow: ['private-constructors'],
				},
			],

			'@typescript-eslint/no-explicit-any': 'warn',
		},
	},
];
