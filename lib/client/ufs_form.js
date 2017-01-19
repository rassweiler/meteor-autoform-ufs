// Slow down the transfer to simulate slow connection
UploadFS.config.simulateWriteDelay = 0;

window.workers = {};

Template.ufs_form.onCreated(function(){
	debugger;
	//Session.set('UFS_images', null);
	this.UFS_Files = new ReactiveVar( null );
	this.UFS_Publication = new ReactiveVar( this.data.atts.publication );
	this.UFS_StoreName = new ReactiveVar( this.data.atts.store );
	this.UFS_CollectionName = new ReactiveVar( this.data.atts.collection );
	this.UFS_FormItemName = new ReactiveVar( this.data.name );
	this.autorun(function () {
		debugger;
		var template = Template.instance();
		var publication = template.UFS_Publication.get();
		if(publication != null){
			template.subscribe(publication);
			template.parentContext = AutoForm.getCurrentDataForForm();
		}
	});
});

Template.ufs_form.onRendered(function () {
	this.autorun(function () {
		debugger;
		let template = Template.instance();
		var userId = Meteor.userId();
		var imageCollection = getCollectionWithStore(template.UFS_StoreName.get());
		var parentCollection = getMongoCollection(template.parentContext.collection._name);

		//Need to check for parent doc as an insert form has no parent doc.
		if(template.parentContext.doc != null){
			var parentId = template.parentContext.doc._id;
			var parentDoc = parentCollection.findOne(parentId);
			template.UFS_Files.set(_.without(parentDoc[template.UFS_FormItemName.get()], null));
		}
	});
});

Template.ufs_form.helpers({
	files: function () {
		debugger;
		var template = Template.instance();
		var collection = getCollectionWithStore(template.data.atts.store);
		var fileIds = template.UFS_Files.get();
		if (collection && fileIds) {
			template.subscribe(template.UFS_Publication.get()); //TODO Check for this before doing the above
			return collection.find({_id: {$in: fileIds}}, {
				sort: {createdAt: 1, name: 1}
			});
		}
	},
	schemaKey: function () {
		debugger;
		return Template.instance().data.atts['data-schema-key'];
	},
	value: function () {
		debugger;
		return Template.instance().UFS_Files.get();
	},
	atts: function () {
		debugger;
		return Template.instance().data.atts;
	}
});

Template.ufs_form.events({
	'click [name=import]': function (ev, tpl) {
		debugger;
		ev.preventDefault();

		var url = tpl.$('[name=url]').val();
		UploadFS.importFromURL(url, {}, getImageStore(tpl.data), function (err, file) {
			if (err) {
				console.error(err);
			} else if (file) {
				tpl.$('[name=url]').val('');
				console.log('file successfully imported : ', file);
			}
		});
	},
	'click [name=upload]': function (ev, tpl) {
		debugger;
		ev.preventDefault();

		UploadFS.selectFiles(function (file) {
			console.log("ufs_form.js-events-upload-selectFiles - tpl:");
			console.log(tpl);
			const ONE_MB = 1024 * 100;
			// file.book_id = '';
			var uploader = new UploadFS.Uploader({
				adaptive: false,
				chunkSize: ONE_MB * 16.66,
				maxChunkSize: ONE_MB * 20,
				data: file,
				file: file,
				store: tpl.data.atts.store,
				maxTries: 3
			});
			uploader.onAbort = function (file) {
				console.log(file.name + ' upload aborted');
			};
			uploader.onComplete = function (file) {
				console.log(file.name + ' upload completed');
			};
			uploader.onCreate = function (file) {
				this.UFS_Files.set(_.without(_.union(this.UFS_Files.get(), [file._id]), null));
				console.log(file.name + ' created');
				workers[file._id] = this;
			};
			uploader.onError = function (err, file) {
				console.error(file.name + ' could not be uploaded', err);
			};
			uploader.onProgress = function (file, progress) {
				console.log(file.name + ' :'
					+ "\n" + (progress * 100).toFixed(2) + '%'
					+ "\n" + (this.getSpeed() / 1024).toFixed(2) + 'KB/s'
					+ "\n" + 'elapsed: ' + (this.getElapsedTime() / 1000).toFixed(2) + 's'
					+ "\n" + 'remaining: ' + (this.getRemainingTime() / 1000).toFixed(2) + 's'
				);
			};
			uploader.start();
		});
	}
});

Template.ufs_file.helpers({
	canAbort: function () {
		debugger;
		return workers.hasOwnProperty(this._id);
	},
	canDelete: function () {
		debugger;
		var userId = Meteor.userId();
		return userId && (userId === this.userId || !this.userId);
	},
	formatSize: function (bytes) {
		debugger;
		if (bytes >= 1000000000) {
			return (bytes / 1000000000).toFixed(2) + ' GB';
		}
		if (bytes >= 1000000) {
			return (bytes / 1000000).toFixed(2) + ' MB';
		}
		if (bytes >= 1000) {
			return (bytes / 1000).toFixed(2) + ' KB';
		}
		return bytes + ' B';
	},
	progress: function () {
		debugger;
		return (this.progress * 100).toFixed(2);
	},
	thumb: function () {
		debugger;
		var tpl = Template.parentData();
		// console.log(tpl.atts);
		if (tpl.atts.thumbnails) {
			// console.log('thumbs exist');
			return getCollection(tpl.atts.thumbnails).findOne({originalId: this._id});
		} else {
			// console.log('no thumbs exist');
			return this;
		}
	}
});

Template.ufs_file.events({
	'click [name=delete]': function (ev) {
		debugger;
		ev.preventDefault();
		//todo: make this work differently
		Meteor.call('removeImage', (this._id));
	},
	'click [name=abort]': function (ev) {
		debugger;
		ev.preventDefault();
		workers[this._id].abort();
	},
	'click [name=stop]': function (ev) {
		debugger;
		ev.preventDefault();
		workers[this._id].stop();
	},
	'click [name=start]': function (ev) {
		debugger;
		ev.preventDefault();
		workers[this._id].start();
	}
});