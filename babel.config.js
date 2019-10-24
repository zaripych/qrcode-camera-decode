'use strict';

const { babelConfig } = require('ts-deps');

module.exports = {
  ...babelConfig(),
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '10',
        },
        modules: false,
      },
    ],
    '@babel/preset-typescript',
  ],
};
