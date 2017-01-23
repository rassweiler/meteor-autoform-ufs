// Slow down the transfer to simulate slow connection
UploadFS.config.simulateWriteDelay = 0;

window.workers = {};

//Made this a global due to not being able to access template instance in UFS onCreate call, if anyone knows how to fix this create PR please.
var UFS_Files = new ReactiveVar( null );

Template.ufs_form.onCreated(function(){
	this.UFS_Publication = new ReactiveVar( this.data.atts.publication );
	this.UFS_StoreName = new ReactiveVar( this.data.atts.store );
	this.UFS_CollectionName = new ReactiveVar( this.data.atts.collection );
	this.UFS_FormItemName = new ReactiveVar( this.data.name );
	this.autorun(function () {
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
		let template = Template.instance();
		var userId = Meteor.userId();
		var imageCollection = getCollectionWithStore(template.UFS_StoreName.get());
		var parentCollection = getMongoCollection(template.parentContext.collection._name);

		//Need to check for parent doc as an insert form has no parent doc.
		if(template.parentContext.doc != null){
			var parentId = template.parentContext.doc._id;
			var parentDoc = parentCollection.findOne(parentId);
			UFS_Files.set(_.without(parentDoc[template.UFS_FormItemName.get()], null));
		}
	});
});

Template.ufs_form.helpers({
	files: function () {
		var template = Template.instance();
		var collection = getCollectionWithStore(template.data.atts.store);
		var fileIds = UFS_Files.get();
		if (collection && fileIds) {
			template.subscribe(template.UFS_Publication.get()); //TODO Check for this before doing the above
			return collection.find({_id: {$in: fileIds}}, {
				sort: {createdAt: 1, name: 1}
			});
		}
	},
	schemaKey: function () {
		return Template.instance().data.atts['data-schema-key'];
	},
	value: function () {
		return UFS_Files.get();
	},
	atts: function () {
		return Template.instance().data.atts;
	},
	allowImport:function(){
		return UploadFS.config.allowImport;
	}
});

Template.ufs_form.events({
	'click [name=import]': function (ev, tpl) {
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
	'click [name=upload]': function (ev, template) {
		ev.preventDefault();

		UploadFS.selectFiles(function (file) {
			const ONE_MB = 1024 * 100;
			var uploader = new UploadFS.Uploader({
				adaptive: false,
				chunkSize: ONE_MB * 16.66,
				maxChunkSize: ONE_MB * 20,
				data: file,
				file: file,
				store: template.data.atts.store,
				maxTries: 3
			},template);
			uploader.onAbort = function (file) {
				console.log(file.name + ' upload aborted');
			};
			uploader.onComplete = function (file) {
				console.log(file.name + ' upload completed');
			};
			uploader.onCreate = function (file, template) {
				UFS_Files.set(_.without(_.union(UFS_Files.get(), [file._id]), null));
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
		return workers.hasOwnProperty(this._id);
	},
	canDelete: function () {
		var userId = Meteor.userId();
		return userId && (userId === this.userId || !this.userId);
	},
	formatSize: function (bytes) {
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
		return (this.progress * 100).toFixed(2);
	},
	thumb: function () {
		var tpl = Template.parentData();
		if (tpl.atts.thumbnails) {
			return getCollection(tpl.atts.thumbnails).findOne({originalId: this._id});
		} else {
			return this;
		}
	}
});

Template.ufs_file.events({
	'click [name=remove]': function (ev) {
		ev.preventDefault();
		//Meteor.call('removeImage', (this._id));
		let id = this._id;
		let files = UFS_Files.get();
		console.log(files);
		var index = files.indexOf(id);
		if (index > -1) {
			files.splice(index, 1);
			UFS_Files.set(files);
		}
	},
	'click [name=abort]': function (ev) {
		ev.preventDefault();
		workers[this._id].abort();
	},
	'click [name=stop]': function (ev) {
		ev.preventDefault();
		workers[this._id].stop();
	},
	'click [name=start]': function (ev) {
		ev.preventDefault();
		workers[this._id].start();
	}
});