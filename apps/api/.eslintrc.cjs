module.exports = {
  root: true,
  extends: ['@ecommerce/config-eslint/nest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
