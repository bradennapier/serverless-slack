module.exports = function getBabelConfiguration(api) {
  // console.log('Babel Setup');
  api.cache.never();
  return {
    ignore: [/node_modules/],
    presets: [
      '@babel/preset-flow',
      [
        '@babel/preset-env',
        {
          useBuiltIns: 'usage',
          corejs: '3',
          shippedProposals: true,
          targets: {
            node: '8.10',
          },
        },
      ],
    ],
    plugins: [
      'source-map-support',
      [
        'module-resolver',
        {
          root: ['./src/packages'],
        },
      ],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-optional-chaining',
    ],
  };
};
