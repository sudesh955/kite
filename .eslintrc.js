'use strict';

module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    es6: true,
    jest: true,
  },
  plugins: [
    'babel',
    'flowtype-errors',
  ],
  rules: {
    'no-console': 'off',

    'babel/camelcase': 'error',
    'babel/no-invalid-this': 'error',
    'babel/object-curly-spacing': 'error',
    'babel/quotes': ['error', 'single', {allowTemplateLiterals: true}],
    'babel/semi': 'error',
    'babel/no-unused-expressions': 'error',
    'babel/valid-typeof': 'error',

    'camelcase': 0,
    'no-invalid-this': 0,
    'object-curly-spacing': 0,
    'quotes': 0,
    'semi': 0,
    'no-unused-expressions': 0,
    'valid-typeof': 0,

    'flowtype-errors/show-errors': 'error',
    'flowtype-errors/show-warnings': 'warn'
  },
};
