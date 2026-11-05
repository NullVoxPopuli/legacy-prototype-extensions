'use strict';

module.exports = {
  extends: 'recommended',
  overrides: [
    {
      files: ['tests/**/*'],
      rules: {
        'no-array-prototype-extensions': false,
      },
    },
  ],
};
