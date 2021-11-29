The bulk-TNRS tool is included in the curation app for convenience and re-use
of its main page template, Bootstrap, etc. To manage complexity, the TNRS tool
uses npm and Node modules. 

This directory holds the JS source and dependencies used for bulk TNRS, which
can be managed from the local package.json file. Note that all scripts used
here will be bundled into a single file `tnrs-bundle.js` in the parent
directory.

NB - Simply merging changes to master will *not* correctly update the active JS
bundle file. Instead, we should rebuild the latest bundle in a feature branch,
then completely replace all related files in master. For example, if changes
were made and tested in `development` branch, commit them there, then...
```sh
 $ git checkout master
 $ cd curator/statis/js/tnrs
 $ git checkout development package.json
 $ git checkout development package-lock.json
 $ git checkout development ../tnrs-bundle.js
 $ git commit -a
```
Further explanation of the git steps here:
https://riptutorial.com/git/example/2895/overwrite-single-file-in-current-working-directory-with-the-same-from-another-branch

To install all dependencies using npm:
```sh
 $ cd curator/statis/js/tnrs
 $ npm install
```

To check for vulnerabilities in the current package specs:
```sh
 $ cd curator/statis/js/tnrs
 $ npm audit
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
