/* eslint-disable */
const path = require("path");

const makeConfig = (argv, { entry, target = "node", libraryTarget = "commonjs" }) => ({
    mode: argv.mode,
    devtool: argv.mode === "production" ? false : "source-map",
    target,

    entry,

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        libraryTarget,
        globalObject: "this",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },

    externals: {
        vscode: "commonjs vscode" // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },

    module: {
        rules: [{
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        }, {
            test: /\.js$/,
            use: ["source-map-loader"],
            enforce: "pre"
        }]
    },

    resolve: {
        fallback: {
            "@hpcc-js": path.resolve(__dirname, "../hpcc-js/packages")
        }
    },

    experiments: {
        outputModule: libraryTarget === "module"
    },

    plugins: []
});

module.exports = (env, argv) => [
    makeConfig(argv, {
        entry: {
            extension: "./lib-es6/extension.js"
        }
    }),
    makeConfig(argv, {
        entry: {
            webview: "./lib-es6/webview.js"
        },
        target: "web",
        libraryTarget: "module"
    })
];
