const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootPath = path.resolve(__dirname, '../');
const distPath = path.resolve(rootPath, 'dist');
const assetsPath = path.resolve(rootPath, 'public');

const srcPath = path.resolve(rootPath, 'src');
const entryPath = path.resolve(rootPath, 'src', 'app.js');
const uiBeanPath = path.resolve(rootPath, 'src', 'components', 'BeanUILibrary');

require('babel-polyfill');

module.exports = {
  entry: [
    'babel-polyfill',
    entryPath,
  ],
  output: {
    path: distPath,
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/env',
              '@babel/react',
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-object-rest-spread",
              ["@babel/plugin-proposal-decorators", { "legacy": true }],
              "@babel/plugin-proposal-function-sent",
              "@babel/plugin-proposal-export-namespace-from",
              "@babel/plugin-proposal-numeric-separator",
              "@babel/plugin-proposal-throw-expressions"
            ]
          },
        },
      },
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.(png|jp(e*)g|svg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            limit: 25000, // Convert images < 8kb to base64 strings
            name: 'images/[hash]-[name].[ext]',
          },
        },],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [{
          loader: 'file-loader',
          options: {
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'fonts/[hash]-[name].[ext]',
          },
        },],
      },
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
          'postcss-loader'
        ]
      }
    ],
  },
  resolve: {
    modules: [srcPath, 'node_modules'],
    alias: {
      'UIBean': uiBeanPath,
      'VizIoT': srcPath,
    },
    extensions: ['.js', '.jsx',],
  },
  plugins: [
    new CleanWebpackPlugin({
      root: rootPath,
      verbose: true,
      dry: false,
    }),
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: assetsPath, to: distPath }
      ]
    }),
  ],
};