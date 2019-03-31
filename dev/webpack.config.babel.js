import path from 'path';
// eslint-disable-next-line import/no-unresolved
import slsw from 'serverless-webpack';
// Capture the root directory of the application
import getRootDir from 'app-root-dir';
import nodeExternals from 'webpack-node-externals';

const rootDir = getRootDir.get();

console.log('Root Dir: ', rootDir);

export default {
  context: rootDir,

  devtool: 'source-map',

  /* Do Not Change */
  // entry: slsw.lib.entries,

  /* Used so that we resolve files using async fs instead of node require() */
  target: 'async-node',

  /* Main addition to Webpack 4, provides zero-config presets for production / development */
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',

  /* aws-sdk included in lambda so we dont want to expect that it is packaged */
  externals: [
    'aws-sdk',
    nodeExternals({
      modulesDir: rootDir,
    }),
  ],

  optimization: {
    minimize: false,
  },

  module: {
    rules: [
      {
        test: /((?!\.flow)\.jsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              // comments: false,
              /* Don't use the babelrc file */
              babelrc: false,
              // cache is not good here with how workspaces works?
              // cacheDirectory: false,
              presets: [
                /* Strips any FlowTypes */
                '@babel/preset-flow',
                [
                  /* Automatically determine required polyfills, add where needed */
                  '@babel/preset-env',
                  {
                    useBuiltIns: 'usage',
                    shippedProposals: true,
                    modules: false, // needed for tree-shaking
                    targets: {
                      node: '8.10', // current lambda runtime
                    },
                  },
                ],
              ],
              plugins: [
                'source-map-support',
                '@babel/plugin-proposal-optional-chaining',
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        ],
      },
    ],
  },
  resolve: {
    /* Treat our `packages` directory as a module folder for absolute requires */
    modules: [
      path.resolve(`${rootDir}/src/packages`),
      path.resolve(`${rootDir}/node_modules`),
      'node_modules',
    ],
  },

  output: {
    libraryTarget: 'commonjs',
    path: path.join(rootDir, '.webpack'),
    filename: '[name].js',
  },
};
