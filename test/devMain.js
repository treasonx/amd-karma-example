var FILE_PTRN = /.+/;

//filter your specs here!
//FILE_PTRN = /Utils/;

require.config({
	baseUrl: '/base/src',
});
require(['paths'], function(p) {
	require.config({paths: p});
	require(['utils'], function(utils) {

		var keys = utils.keys(window.__karma__.files);
		var specs = utils.filter(keys, function(spec) {
			return /Spec.js/.test(spec);
		});
		require(utils.filter(specs, function(filename) {
			return FILE_PTRN.test(filename);
		}),function(){
			window.__karma__.start();
		});
	});
});
