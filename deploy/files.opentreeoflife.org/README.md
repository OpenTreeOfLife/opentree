
How to make changes to the files.opentreeoflife.org site
====

The site is currently deployed on ot10.opentreeoflife.org (a.k.a
devapi.opentreeoflife.org), with a web root directory there of
~opentree/files.opentreeoflife.org/.

There are two kinds of files in this tree on ot10: "large" and "small".  The
large files (e.g. versions of OTT or the synthetic tree) are simply
copied from wherever they originate to the appropriate place on ot10.
The small files - mostly index.html files - are mirrored manually 
in the opentree repo on github.  These can be
updated on ot10 in any of three ways:

### Push method 1

Clone the opentree repository, or make sure it's up to date ('git pull').
Update the small files you want to change in your local clone, 
under deploy/files.opentreeoflifeorg/.  Then
copy files into place on ot10 using scp or rsync:

    scp -p foo/index.html opentree@ot10.opentreeoflife.org:files.opentreeoflife.org/foo/

Commit your local changes, push to a branch, and submit a pull request.

### Push method 2

May be better for more complicated changes.
As above, clone or update the opentree repo.
Update the small files you want to change in your local clone, 
under deploy/files.opentreeoflifeorg/, and then do

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
