
How to make changes to the files.opentreeoflife.org site
====

The site is currently deployed on ot10.opentreeoflife.org (a.k.a
devapi.opentreeoflife.org), with a web root directory of
~opentree/files.opentreeoflife.org/.

There are two kinds of files in this tree: "large" and "small".  The
large files (e.g. versions of OTT or the synthetic tree) are simply
copied into place.  The small files - mostly index.html files - can be
updated in either of two ways:

### Push method 1

Update the small files you want to change in your local clone of the
opentree repository, under deploy/files.opentreeoflifeorg/, and then
copy files into place using scp or rsync:

    scp -p foo/index.html opentree@ot10.opentreeoflife.org:files.opentreeoflife.org/foo/

Commit your local changes, push to a branch, and submit a pull request.

### Push method 2

Update the small files you want to change in your local clone of the
opentree repository, under deploy/files.opentreeoflifeorg/, and then
do

    cd opentree/deploy
    ./push.sh -c ../../deployed-systems/development/devapi.config files

(Be sure you give the 'files' command.)

This assumes you've checked out the deployed-systems repo in a sibling
directory of where the opentree repo is checked out.

Commit your local changes, push, and submit a pull request.

### Pull method

Edit the files in place on ot10.  Then copy them using scp from ot10
into your local checkout of the opentree repo.  Commit, push, PR.


### Checking your markdown

Here is how I check my markdown (on OS X)

    perl ~/Downloads/Markdown_1.0.1/Markdown.pl README.md  >foo.html && open foo.html

The download link is [here](http://daringfireball.net/projects/markdown/).
