const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const srcPath = path.resolve(__dirname, 'src');
const publicPath = path.resolve(__dirname, 'public');

module.exports = env => {
  return {
    mode: env.development ? 'development' : 'production',
    devtool: 'eval-source-map',
    devServer: { hot: true },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@src': srcPath,
        '@components': path.resolve(srcPath, 'components')
      },
      fallback: { stream: false }
    },
    cache: {
      type: 'filesystem'
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                presets: ['@babel/preset-react', '@babel/preset-env']
              }
            }
          ]
        },
        {
          test: /\.(css|scss)$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
        },
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(env.development ? 'development' : 'production')
        }
      }),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({ hash: true, template: `${publicPath}/index.html` })
    ]
  };
};
