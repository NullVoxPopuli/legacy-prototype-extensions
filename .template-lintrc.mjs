export default {
  extends: 'recommended',
  checkHbsTemplateLiterals: false,
  overrides: [
    {
      files: ['tests/**/*'],
      rules: {
        'no-array-prototype-extensions': false,
      },
    },
  ],
};
