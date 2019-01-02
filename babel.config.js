'use strict';

/* eslint-env node */

module.exports = function(api) {
  api.cache.using(() => process.env.NODE_ENV);
  const presets = ['@babel/preset-flow'];
  if (api.env('test')) {
    presets.push([
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        useBuiltIns: 'usage',
      },
    ]);
  }
  return {
    presets,
  };
};
