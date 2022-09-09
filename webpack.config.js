/* eslint-disable */
const path = require("path");
const webpack = require("webpack");

const makeConfig = (argv, { entry, target = "node", library = { type: "commonjs" }, dist = "dist", externals = {} }) => ({
    mode: argv.mode,
    devtool: argv.mode === "production" ? false : "source-map",
    target,

    entry,

    output: {
        path: path.resolve(__dirname, dist),
        filename: "[name].js",
        library,
        globalObject: "this",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },

    externals: {
        "vscode": "commonjs vscode", // ignored because it doesn't exist
        "applicationinsights-native-metrics": "commonjs applicationinsights-native-metrics", // ignored because we don't ship native module
        ...externals
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
            "@hpcc-js": path.resolve(__dirname, "../hpcc-js/packages"),
            assert: require.resolve('assert'),
            buffer: require.resolve('buffer'),
            // console: require.resolve('console-browserify'),
            // constants: require.resolve('constants-browserify'),
            // crypto: require.resolve('crypto-browserify'),
            // domain: require.resolve('domain-browser'),
            // events: require.resolve('events'),
            // http: require.resolve('stream-http'),
            // https: require.resolve('https-browserify'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
            // punycode: require.resolve('punycode'),
            // process: require.resolve('process/browser'),
            // querystring: require.resolve('querystring-es3'),
            stream: require.resolve('stream-browserify'),
            // string_decoder: require.resolve('string_decoder'),
            // sys: require.resolve('util'),
            // timers: require.resolve('timers-browserify'),
            // tty: require.resolve('tty-browserify'),
            // url: require.resolve('url'),
            // util: require.resolve('util'),
            // vm: require.resolve('vm-browserify'),
            zlib: require.resolve('browserify-zlib')
        }
    },

    experiments: {
        outputModule: library?.type === "module"
    },

    plugins: [
        new webpack.DefinePlugin({
            'window': 'globalThis',
            'navigator': 'globalThis'
        })
    ],

    performance: {
        hints: false
    }
});

module.exports = (env, argv) => [
    makeConfig(argv, {
        entry: {
            extension: "./lib-es6/extension.js"
        }
    }),
    // makeConfig(argv, {
    //     entry: {
    //         "extension": "./lib-es6/extension.js"
    //     },
    //     target: "webworker",
    //     dist: "dist-web",
    //     externals: {
    //         fs: "commonjs fs"
    //     }
    // })
];
