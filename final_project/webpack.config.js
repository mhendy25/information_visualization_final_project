const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: path.join(__dirname, 'src', 'index.js'),
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", "index.html")
        }),
    ],
    module: {
        rules:[ {
            test: /\.?js$/,
            exclude: /node_modules/,
            use: {
                loader: "babel-loader",
                options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
            {
                test: /\.csv$/,
                use: ['csv-loader'],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                      limit: 8192, // Convert images < 8kb to base64 strings
                      name: '[name].[ext]',
                      outputPath: 'images', // Output path for images (relative to the output directory)
                    },
                  },
                ],
              },
            {
                test: /\.(png|jp(e*)g|svg|gif)$/,
                use: ["file-loader"],
            },
            {
                test: /\.svg$/,
                use:['@svgr/webpack'],
            },
            {
                test:/\.js$/,
                enforce: 'pre',
                use: ["source-map-loader"]
            },
        ],
    },
    devServer:{
        port: 9000
    },
    devtool: "source-map"
}