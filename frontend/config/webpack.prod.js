const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = (env) => merge(common, {
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production'),
                // In webpack 5, .env file is abandoned. Environment variables can be passed through webpack-cli and be accessed using 'env'
                'REACT_APP_BACKEND_IP': JSON.stringify(env.ip),
                'REACT_APP_BACKEND_PORT': JSON.stringify(env.port),
            },
        }),
    ],
});