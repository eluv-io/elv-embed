const webpack = require("webpack");
const Path = require("path");
const autoprefixer = require("autoprefixer");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const fs = require("fs");

module.exports = env => {
  const isDevelopment = !!env.WEBPACK_SERVE;

  let plugins = [
    new HtmlWebpackPlugin({
      title: "Eluvio Embedded Video",
      template: Path.join(__dirname, "src", "index.html"),
      inject: "body",
      cache: false,
      filename: "index.html",
      favicon: "./src/static/icons/favicon.png"
    }),
  ];

  if(process.env.ANALYZE_BUNDLE) {
    plugins.push(new BundleAnalyzerPlugin());
  }

  return {
    entry: "./src/index.js",
    target: "web",
    output: {
      path: Path.resolve(__dirname, "dist"),
      clean: true,
      filename: "[name].bundle.js",
      publicPath: "/",
      chunkFilename: "bundle.[id].[chunkhash].js"
    },
    devServer: {
      hot: true,
      historyApiFallback: true,
      allowedHosts: "all",
      port: 8088,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Access-Control-Allow-Methods": "POST"
      },
      // This is to allow configuration.js to be accessed
      static: {
        directory: Path.resolve(__dirname, "./config"),
        publicPath: "/"
      }
    },
    optimization: {
      splitChunks: {
        chunks: "all",
      },
    },
    resolve: {
      fallback: {
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url")
      },
      extensions: [".js", ".jsx", ".mjs", ".scss", ".png", ".svg"],
    },
    externals: {
      crypto: "crypto"
    },
    mode: "development",
    devtool: "eval-source-map",
    snapshot: {
      // Watch node_modules
      managedPaths: []
    },
    plugins,
    module: {
      rules: [
        {
          test: /\.(css|scss)$/,
          exclude: /\.(theme|font)\.(css|scss)$/i,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                importLoaders: 2
              }
            },
            "postcss-loader",
            "sass-loader"
          ]
        },
        {
          test: /\.(js|mjs|jsx)$/,
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
            ]
          }
        },
        {
          test: /\.svg$/,
          loader: "svg-inline-loader"
        },
        {
          test: /\.(gif|png|jpe?g|otf|woff2?|ttf)$/i,
          include: [Path.resolve(__dirname, "src/static/public")],
          type: "asset/inline",
          generator: {
            filename: "public/[name][ext]"
          }
        },
        {
          test: /\.(gif|png|jpe?g|otf|woff2?|ttf)$/i,
          type: "asset/resource",
        },
        {
          test: /\.(txt|bin|abi|html)$/i,
          exclude: [Path.resolve(__dirname, "src/index.html")],
          type: "asset/source"
        }
      ]
    }
  };
};

