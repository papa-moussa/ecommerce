module.exports = {
  root: true,
  extends: ['@ecommerce/config-eslint/next'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
};
