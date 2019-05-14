const path = require('path');
require("babel-register");

module.exports = {
  entry: './src/index.js',
  mode:'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'react-webmapjs',
    libraryTarget: 'umd'
  },
  externals: {
    jquery: 'jQuery',
    moment: 'moment',
    proj4: 'proj4',
    react: 'react',
    'adaguc-webmapjs': 'adaguc-webmapjs'
  },
  module: {
    rules : [
      // JavaScript/JSX Files
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      // CSS Files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: []
};
module.loaders = [
  { test: /\.js$/, exclude: /node_modules/, use: "babel-loader" }
]
