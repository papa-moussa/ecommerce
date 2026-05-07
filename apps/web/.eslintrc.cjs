const path = require('path');

module.exports = {
  root: true,
  ignorePatterns: ['next-env.d.ts', '.next/**'],
  extends: [require.resolve('@ecommerce/config-eslint/next')],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: path.join(__dirname, 'tsconfig.json'),
  },
  settings: {
    next: { rootDir: __dirname },
    'import/resolver': {
      typescript: { project: path.join(__dirname, 'tsconfig.eslint.json') },
      node: true,
    },
  },
};
