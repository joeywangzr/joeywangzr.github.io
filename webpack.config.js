const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname + '/javascript'),
    filename: 'main.js',
  },
  module: {
    rules: [
     {
       test: /\.(png|svg|jpg|jpeg|gif)$/i,
       type: 'asset/resource',
     },
    ],
  },
};
