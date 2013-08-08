
module.exports = function(config) {
	'use strict';
	config.set({
		basePath: '../',
		frameworks: [
			'jasmine',
			'requirejs'
		],
		files: [
			'test/devMain.js',

			// all the sources, tests
			{pattern: 'src/**/*.js', included: false},
			{pattern: 'test/specs/**', included: false},
		],
		exclude: [],
		preprocessors: {
			'src/utils.js': 'coverage'
		},
		reporters: ['progress'],
		singleRun: false,
		captureTimeout: 60000,
		browsers: [],
		autoWatch: true,
		logLevel: config.LOG_INFO,
		colors: true,
		port: 9876

	});
};

