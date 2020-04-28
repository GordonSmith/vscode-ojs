//@ts-check
'use strict';
const path = require('path');

/**@type {import('webpack').Configuration}*/
const BaseConfig = {
    target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    output: { // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',

    externals: {
        canvas: "commonjs canvas", // Important (2)
        jsdom: "commonjs JSDOM",
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                use: ["source-map-loader"],
                enforce: "pre"
            }
        ]
    },

    resolve: {
    },

    plugins: []
};

/**@type {import('webpack').Configuration}*/
const extension = {
    ...BaseConfig,
    entry: {
        extension: "./lib-es6/extension.js"
    }
};

/**@type {import('webpack').Configuration}*/
const webview = {
    ...BaseConfig,
    target: "web",
    entry: {
        webview: "./lib-es6/webview.js"
    },
    output: {
        ...BaseConfig.output,
        libraryTarget: "umd",
    }
};

module.exports = [extension, webview];