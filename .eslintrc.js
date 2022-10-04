module.exports = {
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2022,
    sourceType: "module",
  },
  env: { browser: true, es6: true, webextensions: true },
  root: true,
};
