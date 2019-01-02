'use strict';

/* eslint-env node */

module.exports = {
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  transform: {
    '\\.js$': '<rootDir>/babel-jest.js',
  },
};
