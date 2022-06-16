const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const fs = require('fs');

const scssLoader = INLINE_CSS
    ? [
      { loader: 'style-loader', options: { injectType: 'styleTag' } },
      'css-loader',
      'sass-loader'
    ]
    : [
      {
        loader: 'file-loader',
        options: {
          name: '../css/theme/' + _THEME + '.css'
        }
      },
      'sass-loader'
    ];

module.exports = {
  entry: {
    'gamification-ux-package.v3.js': INLINE_CSS ? [
      './src/javascript/gamification-ux-package.v3.js',
    ] : [
      './src/javascript/gamification-ux-package.v3.js',
      './src/scss/' + _THEME + '/style.scss'
    ],
    'gamification-ux-package.v3-selfinit.js': './src/javascript/gamification-ux-package.v3-selfinit.js',
    'loader.js': './src/javascript/loader.js'
  },
  output: {
    filename: '[name]',
    path: path.resolve(__dirname, '../build/javascript')
  },
  mode: 'production', // production | development
  optimization: {
    minimize: true
  },
  watch: false,
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /(node_modules|jsSHA\.js)/,
        loader: 'eslint-loader'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|tests)/,
        use: ['babel-loader']
      },
      {
        test: /\.scss$/i,
        use: scssLoader
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'svg-url-loader',
        options: {
          limit: 8192,
          mimetype: 'application/svg+xml'
        }
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader',
        options: {
          helperDirs: path.join(__dirname, '../src/templates/helpers'),
          precompileOptions: {
            knownHelpersOnly: false
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.PRODUCTION': JSON.stringify(PRODUCTION),
      'process.env.LANG': JSON.stringify(LANG),
      'process.env.INLINE_CSS': INLINE_CSS,
      'process.env.THEME': JSON.stringify(_THEME)
    }),
    new BundleAnalyzerPlugin(),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/i18n', to: '../i18n' },
        { from: 'src/images', to: '../images' },
        { from: 'src/cl-black-theme/images', to: '../cl-black-theme/images' }
      ]
    }),
    {
      apply: (compiler) => {
        const buildPath = compiler.options.output.path;

        // hook name
        compiler.hooks.assetEmitted.tap('assetEmittedPlugin', (file, { content, source, outputPath, compilation, targetPath }) => {
          if (file.indexOf(".css") > -1) {
            const fileParts = file.split('/');
            const fileName = fileParts[fileParts.length -1];

            fs.copyFile(buildPath + '/' + file, __dirname + "/../gamification-ux-package-examples/themes/css/theme/" + fileName, function (){});
          }
        });
      }
    }
  ]
};
