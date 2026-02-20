const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: {
      main: path.resolve(__dirname, 'src', 'index.js'),
      'vendor-bundle': ['lodash', 'moment'],
    },

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash:8].js',
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js',
      publicPath: '/',
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.json', '.scss', '.css'],
      alias: {
        '@components': path.resolve(__dirname, 'src', 'components'),
        '@styles': path.resolve(__dirname, 'src', 'styles'),
        '@utils': path.resolve(__dirname, 'src', 'utils'),
        '@assets': path.resolve(__dirname, 'src', 'assets'),
        '@src': path.resolve(__dirname, 'src'),
      },
      fallback: {
        path: false,
        fs: false,
        crypto: false,
      },
    },

    module: {
      rules: [
        // JavaScript - Babel
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: '> 0.25%, not dead',
                  useBuiltIns: false,
                }],
              ],
              cacheDirectory: true,
            },
          },
        },

        // SCSS files
        {
          test: /\.scss$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: isDev,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: isDev,
              },
            },
          ],
        },

        // CSS files
        {
          test: /\.css$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },

        // Images
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
          generator: {
            filename: 'images/[name].[hash:8][ext]',
          },
        },

        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[hash:8][ext]',
          },
        },

        // CSV
        {
          test: /\.csv$/,
          loader: 'csv-loader',
          options: {
            dynamicTyping: true,
            header: true,
            skipEmptyLines: true,
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src', 'index.html'),
        title: 'BugBase - Issue Tracker',
        favicon: false,
        minify: isDev ? false : {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
        },
      }),

      new MiniCssExtractPlugin({
        filename: isDev ? '[name].css' : '[name].[contenthash:8].css',
        chunkFilename: isDev ? '[name].css' : '[name].[contenthash:8].css',
      }),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'src', 'assets'),
            to: 'assets',
            noErrorOnMissing: true,
          },
        ],
      }),

      new webpack.DefinePlugin({
        'process.env.API_URL': JSON.stringify(isDev ? 'http://localhost:3000/api' : '/api'),
        'process.env.APP_VERSION': JSON.stringify('1.2.3'),
      }),

      // only enable analyzer when explicitly requested
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html',
      })] : []),
    ],

    optimization: {
      minimize: !isDev,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: !isDev,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10,
          },
          common: {
            minChunks: 2,
            chunks: 'all',
            name: 'common',
            priority: 5,
            reuseExistingChunk: true,
          },
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },

    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      port: 8080,
      hot: true,
      open: false,
      historyApiFallback: true,
      proxy: [
        {
          context: ['/api', '/health'],
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      ],
    },

    devtool: isDev ? 'eval-source-map' : false,

    stats: isDev ? 'minimal' : 'normal',
  };
};
