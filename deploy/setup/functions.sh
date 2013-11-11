
# Utilities.
# Source this file from another bash script.

# Refresh a git repo

function git_refresh() {
    guser=$1    # OpenTreeOfLife
    reponame=$2
    # Directory in which all local checkouts of git repos reside
    repos_dir=repo
    repo_dir=$repos_dir/$reponame
    # Exit 0 (true) means has changed
    changed=0
    if [ ! -d $repo_dir ] ; then
	(cd $repos_dir; \
	 git clone https://github.com/$guser/$reponame.git)
    else
	before=`cd $repo_dir; git log | head -1`
	(cd $repo_dir; git checkout master; git checkout .; git pull)
	after=`cd $repo_dir; git log | head -1`
	if [ "$before" = "$after" ] ; then
	    echo "Repository $reponame is unchanged since last time"
	    changed=1
	else
	    echo "Repository $reponame has changed"
	fi
    fi
    return $changed
}

# See http://stackoverflow.com/questions/1741143/git-pull-origin-mybranch-leaves-local-mybranch-n-commits-ahead-of-origin-why
