AutoForm.addInputType('ufs', {
	template: 'ufs_form',
	valueIsArray: true,
	valueOut: function () {
		return this.val();
	}
});

getCollection = function (collection) {
	if (typeof collection === 'string') {
		var stores = UploadFS.getStores();
		var store = stores[collection];
		return store.getCollection() || window[context.atts.collection];
	}
};

getCollectionWithStore = function (store) {
	if (typeof store === 'string') {
		var store = UploadFS.getStore(store);
		return store.getCollection() || window[context.atts.collection];
	}
};


getMongoCollection = function (collection) {
	if (typeof collection === 'string') {
		return Meteor.connection._stores[collection]._getCollection();
	}
};

getImageStore = function (context) {
	var store = context.atts.store;
	var root = Meteor.isClient ? window : global;
	return root[store];
};