// Slow down the transfer to simulate slow connection
UploadFS.config.simulateWriteDelay = 0;

window.workers = {};

Template.ufs_form.onCreated(function(){
   Session.set('UFS_images', null);
   this.UFS_images = new ReactiveVar( null );
});

Template.ufs_form.onRendered(function () {
    var tpl = this;
    console.log("ufs_form.js-onRendered:");
    tpl.UFS_Publication = this.data.atts.publication;

    tpl.autorun(function () {
        var userId = Meteor.userId(); // TODO: Remove as it's unused
        tpl.subscribe(tpl.UFS_Publication);
        tpl.parentContext = AutoForm.getCurrentDataForForm();

        var imageCollection = getCollectionwithStore(tpl.data.atts.store);
        console.log(imageCollection);
        var parentCollection = getMongoCollection(tpl.parentContext.collection._name);
        console.log(parentCollection);
        var parentId = tpl.parentContext.doc._id;
        var parentDoc = parentCollection.findOne(parentId);
        console.log(parentDoc);
        // console.log(tpl.parentContext.collection.findOne(parentId));
        Session.set('UFS_images', _.without(parentDoc.images, null));
        this.UFS_images.set(_.without(parentDoc.images, null));
        console.log(this.UFS_images.get());
    });

    // tpl.value = _.pluck(collection.find({_id: {$in: []}}).fetch(), '_id');
});

Template.ufs_form.helpers({
    files: function () {
        var tpl = Template.instance();
        console.log("ufs_form.js-helpers-files - tpl:");
        var collection = getCollection(tpl.data.atts.collection);
        console.log(collection);
        var imageIds = Session.get('UFS_images');
        console.log(imageIds);
        if (collection && imageIds) {
            tpl.subscribe(tpl.UFS_Publication);
            return collection.find({_id: {$in: imageIds}}, {
                sort: {createdAt: 1, name: 1}
            });
        }
    },
    schemaKey: function () {
        var tpl = Template.instance();
        return tpl.data.atts['data-schema-key'];
    },
    value: function () {
        return Session.get('UFS_images');
    },
    atts: function () {
        var tpl = Template.instance();
        return tpl.data.atts;
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
    'click [name=upload]': function (ev, tpl) {
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
                Session.set('UFS_images', _.without(_.union(Session.get('UFS_images'), [file._id]), null));
                this.UFS_images.set(_.without(_.union(Session.get('UFS_images'), [file._id]), null));
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
        ev.preventDefault();
        //todo: make this work differently
        Meteor.call('removeImage', (this._id));
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