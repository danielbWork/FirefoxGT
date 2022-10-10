// eslint-disable-next-line no-undef
module.exports = {
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2022,
    sourceType: "module",
  },
  env: { browser: true, es6: true, webextensions: true },
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:react/recommended",
    "plugin:jsx-a11y/recommended",
  ],
  plugins: ["react", "import", "jsx-a11y"],
};
