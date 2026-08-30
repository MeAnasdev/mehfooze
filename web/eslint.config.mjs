/**
 * ESLint configuration for Mehfooze web app
 */
export default {
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: ['react-app', 'plugin:react/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: '18.3',
    },
  },
}