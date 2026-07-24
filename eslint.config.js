// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Config plugins de Expo corren en Node durante prebuild/EAS Build,
    // no en el runtime de la app -- mismo tratamiento que metro.config.js
    // en eslint-config-expo.
    files: ['plugins/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
