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

````javascript
Schemas.Collection = new SimpleSchema({
  images: {
        type: [String],
        optional: true,
        autoform: {
            type: 'ufs',
            collection: 'images',
            store: 'ImageStore',
            publication: 'images',
            thumbnails: 'thumbnails'
        }
    }
});
````

## Todo
- Troubleshoot why original was not working. Seems to just be outdated. failing at getCollection, added new function to use store name instead.
- ~~Replace sessions with reactive vars~~.
- Replace hard coded collection item names with logic