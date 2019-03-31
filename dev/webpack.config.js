require('@babel/register')({
  rootMode: 'upward',
  // extends: '../babel.config.js',
  ignore: ['/node_modules/'],
});
module.exports = require('./webpack.config.babel').default;
