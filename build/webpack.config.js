import TerserPlugin from "terser-webpack-plugin"

export default {
    mode: "production",
    entry: './source/init.ts',
    output: {
        filename: 'init.js',
        library: "default",
        libraryTarget: 'umd',
        chunkFormat: "module"
    },
    target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true
                }
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    optimization: {
        minimize: false,
        minimizer: [
            new TerserPlugin(),
        ],
    }
}
