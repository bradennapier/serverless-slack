module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 10,
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true,
    },
  },
  extends: ['airbnb-base', 'plugin:flowtype/recommended'],
  env: {
    node: true,
  },
  rules: {
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'no-use-before-define': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-expressions': 'off',

    // this rule breaks prettier when used with max-len
    'implicit-arrow-linebreak': 'off',

    'consistent-return': 'off',
    'arrow-parens': 'off',

    'max-len': [
      'error',
      {
        code: 100,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],

    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    // cant handle our configuration
    'import/no-extraneous-dependencies': 'off',
  },
  plugins: ['flowtype', 'promise', 'import'],
};
