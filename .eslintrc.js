module.exports = {
  env: {
    jest: true,
    node: true,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'jest',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: '2018',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'prettier',
  ],
  ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', '*.generated.ts'],
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
    'jest/expect-expect': 'off',
    'prettier/prettier': 'error',
  },
};
