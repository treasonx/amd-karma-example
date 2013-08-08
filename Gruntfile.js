module.exports = function (grunt) {
	'use strict';
	grunt.initConfig({
		karma: {
			unit: {
				configFile: 'test/testacular.conf.js',
				reporters: ['progress'],
				autoWatch: true,
				keepalive: true,
				preprocessors: {}
			},
			phantom: {
				configFile: 'test/testacular.conf.js',
				reporters: ['progress'],
				browsers: ['PhantomJS'],
				autoWatch: true,
				keepalive: true
			},
			coverage: {
				configFile: 'test/testacular.conf.js',
				coverageReporter: {
					type : 'html',
					dir : 'coverage/'
				},
				reporters: ['coverage', 'progress']
			}
		},
		connect: {
			coverage: {
				options: {
					port: 9877,
					base: 'coverage'
				}
			}
		}
	});
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-karma');

	grunt.registerTask('coverage', ['connect:coverage', 'karma:coverage']);
	grunt.registerTask('testPhantom', ['karma:phantom']);
	grunt.registerTask('test', ['karma:unit']);
};
