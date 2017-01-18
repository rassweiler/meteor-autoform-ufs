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
