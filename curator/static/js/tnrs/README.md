The bulk-TNRS tool is included in the curation app for convenience and re-use
of its main page template, Bootstrap, etc. To manage complexity, the TNRS tool
uses npm and Node modules. 

This directory holds the JS source and dependencies used for bulk TNRS, which
can be managed from the local package.json file. Note that all scripts used
here will be bundled into a single file `tnrs-bundle.js` in the parent
directory.

To install all dependencies using npm:
```sh
 $ cd curator/statis/js/tnrs
 $ npm install
```

To update the JS bundle automatically after edits:
```sh
 $ cd curator/statis/js/tnrs
 $ npm run watch
```

See other commands in package.json for building leaner production bundle:
```sh
 $ cd curator/statis/js/tnrs
 $ npm run build
 $ npm run uglify
```
