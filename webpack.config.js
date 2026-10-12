const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production' || process.env.NODE_ENV === 'production';
  return {
    entry: './client/src/index.js',
    devtool: isProd ? 'source-map' : 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      publicPath: '/',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          type: 'javascript/auto',
          use: {
            loader: 'babel-loader',
            options: {
              sourceType: 'module'
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './client/public/index.html',
        title: 'IntervAI - AI Interview Coach'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development')
      })
    ],
  devServer: {
    port: 3000,
    historyApiFallback: true,
    hot: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    ]
  }
};
};
