# Meteor Autoform-UFS
a ufs addon package for autoform and simple schema

## Contents
- [Installation](#installation)
- [Usage](#usage)

## Installation
```bash
meteor add rassweiler:autoform-ufs
```

## Usage
- File collection is seperate from collection with autoform.
- Made the form item name dynamic instead of hard coded as 'images' for the collection that has autoform.

Collection using autoform:
````javascript
Schemas.Collection = new SimpleSchema({
  images: {
		type: [String],
		optional: true,
		autoform: {
			type: 'ufs',
			collection: 'files', //Collection name that will store the file data
			store: 'ImageStore', //Store used for above collection
			publication: 'files.all', //Publication used for retrieving file collection documents
			thumbnails: 'thumbnails' //Optional if you have collections for thumbnails, set to collection name.
		}
	}
});
````

## Todo
- ~~Troubleshoot why original was not working~~. Seems to just be outdated. failing at getCollection, added new function to use store name instead.
- ~~Replace sessions with reactive vars~~.
- Replace hard coded collection item names with logic
- Complete the incomplete delete method