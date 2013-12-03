
# Utilities.
# Source this file from another bash script.

# Refresh a git repo

# We clone via https instead of ssh, because ssh cloning fails with
# "Permission denied (publickey)".  This means we won't be able to
# push changes very easily, which is OK because we don't expect to be
# making any...

function git_refresh() {
    guser=$1    # OpenTreeOfLife
    reponame=$2
    branch=$3
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
        # What if branch doesn't exist locally, or doesn't track origin branch?
        # This will need some tweaking...
        (cd $repo_dir; git checkout $branch; git checkout .; git pull)
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
