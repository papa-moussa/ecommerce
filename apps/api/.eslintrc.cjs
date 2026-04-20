const path = require('path');

module.exports = {
  root: true,
  extends: [require.resolve('@ecommerce/config-eslint/nest')],
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: path.join(__dirname, 'tsconfig.eslint.json'),
      },
      node: true,
    },
  },
};
