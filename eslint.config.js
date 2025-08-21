import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      'semi-style': ['error', 'last'],
      '@stylistic/semi': ['error', 'always'],
      'no-var': 'error'
    }
  }
];