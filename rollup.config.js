import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';
import postcss from "rollup-plugin-postcss";

export default [{
    input: "lib-es6/runtime",
    output: [{
        file: "dist/runtime.js",
        format: "iife",
        sourcemap: true,
        name: "runtime"
    }],
    treeshake: {
        moduleSideEffects: (id, external) => {
            if (id.indexOf(".css") >= 0) return true;
            return false;
        }
    },
    plugins: [
        alias({
            entries: [
                { find: "@hpcc-js/observable-md", replacement: "@hpcc-js/observable-md/lib-es6/index.js" },
                { find: "@hpcc-js/util", replacement: "@hpcc-js/util/lib-es6/index.js" }
            ],
        }),
        nodeResolve({
            preferBuiltins: true
        }),
        commonjs({
        }),
        sourcemaps(),
        postcss({
            extensions: [".css"],
            minimize: true
        })
    ]
}];
