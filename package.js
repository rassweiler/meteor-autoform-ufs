Package.describe({
	summary: "Autoform UFS",
	version: '1.0.0',
	name: "rassweiler:autoform-ufs",
	git: 'https://github.com/rassweiler/meteor-autoform-ufs',
	documentation: 'README.md'
});

Package.onUse(function (api) {

	api.use(['templating@1.1.5'], ['client']);

	api.use([
			'aldeed:autoform@5.8.1',
			'jalik:ufs@0.7.1',
			'underscore@1.0.9',
			'reactive-var@1.0.11'
	],
			['client', 'server']
	);

	api.addFiles([
		'lib/client/ufsAutoform.js',
		'lib/client/ufs.base.css',
		'lib/client/ufs_form.html',
		'lib/client/ufs_form.js'
	], ['client']);

	Npm.depends({
		gm: '1.22.0'
	})
});
