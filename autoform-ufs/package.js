Package.describe({
  name: 'rassweiler:autoform-ufs',
  version: '1.0.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4');
  api.use('ecmascript');
  api.mainModule('autoform-ufs.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('rassweiler:autoform-ufs');
  api.mainModule('autoform-ufs-tests.js');
});
