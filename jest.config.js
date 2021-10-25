module.exports =
{
	transform:
	{
		"^.+\\.tsx?$": "ts-jest",
	},
	testEnvironment: 'node',
	testRegex: '/test/.*\\.(test|spec)?\\.(ts|tsx)$',
	testPathIgnorePatterns: [
		"/dist/",
		"/node_modules/"
	],
	moduleFileExtensions: [
		"ts", 
		"tsx", 
		"js", 
		"jsx", 
		"json", 
		"node"
	],
	collectCoverage: true
};
