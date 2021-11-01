const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	mode: 'development',
	entry: './src/main.ts',
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: {
					loader: "ts-loader",
					options: {
						transpileOnly: false,
						projectReferences: false
					}
				},
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
		plugins: [
			new TsconfigPathsPlugin({})
		]
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}
};
