/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  plugins: ['import'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'import/no-unresolved': 'off',
  },
};
