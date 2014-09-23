# Use with 'source' command
# Variable CONTROLLER is an implicit parameter (name of user who ran the 'push.sh' command)

set -e

# Utilities.
# Source this file from another bash script.

# ---------- JAVA HOME ----------

if false; then
    # DOES NOT WORK ON UBUNTU, but preferred on Debian.
    javalink=`readlink /etc/alternatives/java`
    # => /usr/lib/jvm/java-7-openjdk-amd64/jre/bin/java
    javalink=`dirname $javalink`
    # => /usr/lib/jvm/java-7-openjdk-amd64/jre/bin
    javalink=`dirname $javalink`
    # => /usr/lib/jvm/java-7-openjdk-amd64/jre
    javalink=`dirname $javalink`
    # => /usr/lib/jvm/java-7-openjdk-amd64
else
    javalink=/usr/lib/jvm/java-7-openjdk-amd64
fi

export JAVA_HOME=$javalink

# ---------- HOST NAME ----------
# Remember the host name

HOSTFILE=hostname
if [ -e $HOSTFILE ]; then
    OPENTREE_HOST=`cat $HOSTFILE`
elif [ x$OPENTREE_HOST != x ]; then
    echo $OPENTREE_HOST >$HOSTFILE
else
    echo "OPENTREE_HOST shell variable isn't set !?"
    exit 1
fi

# ---------- OUR VIRTUALENV ----------
# Set up python env
if [ ! -d venv ]; then
    virtualenv venv
fi
source venv/bin/activate

# ---------- LOGGING ----------

function log() {
    if [ x$CONTROLLER = x ]; then
    echo "CONTROLLER shell variable is not set !?"
    exit 1
    fi
    mkdir -p log
    (echo `date` $CONTROLLER $OPENTREE_TAG " $*") >>log/messages
}

# ---------- WORKSPACES ----------

# Temporary locations for things downloaded from web.  Can delete this
# after server is up and running.

mkdir -p downloads

REPOS_DIR=repo
mkdir -p $REPOS_DIR

# ---------- SHELL FUNCTIONS ----------

declare -A OPENTREE_BRANCHES

function opentree_branch {
    OPENTREE_BRANCHES[$1]=$2
    echo Set branch for $1 to be ${OPENTREE_BRANCHES[$1]}
}

. setup/CONFIG

# Refresh a git repo

# We clone via https instead of ssh, because ssh cloning fails with
# "Permission denied (publickey)".  This means we won't be able to
# push changes very easily, which is OK because we don't expect to be
# making any changes that need to be kept.

# Returns true if any change was made.

function git_refresh() {
    guser=$1    # OpenTreeOfLife
    reponame=$2
    branch=$3
    repos_par_arg=$4

    if [ x$branch = x ]; then
    branch=${OPENTREE_BRANCHES[$reponame]}
    if [ x$branch = x ]; then
        branch='master'
    fi
    fi
    echo "Using branch $branch of repo $reponame"

    # Directory in which all local checkouts of git repos reside
    if [ x${repos_par_arg} = x ]; then
        repo_par=${REPOS_DIR}
    else
        repo_par=${repos_par_arg}
    fi
    repo_dir=$repo_par/$reponame
    # Exit 0 (true) means has changed
    changed=0
    if [ ! -d $repo_dir ] ; then
        (cd $repo_par; \
         git clone --branch $branch https://github.com/$guser/$reponame.git)
    log Clone: $reponame `cd $repo_dir; git log | head -1`
    else
        before=`cd $repo_dir; git log | head -1`
        # What if branch doesn't exist locally, or doesn't track origin branch?
        # This will need some tweaking...
        (cd $repo_dir; git fetch; git checkout $branch; git checkout .; git pull)
        after=`cd $repo_dir; git log | head -1`
        if [ "$before" = "$after" ] ; then
            echo "Repository $reponame is unchanged since last time"
            changed=1
        else
            echo "Repository $reponame has changed"
        log Checkout: $reponame `cd $repo_dir; git log | head -1`
        fi
    fi
    return $changed
}

# See http://stackoverflow.com/questions/1741143/git-pull-origin-mybranch-leaves-local-mybranch-n-commits-ahead-of-origin-why

# Runs "python setup.py develop" from a git repo version of a 
#   python package. Also runs pip install -r requirements.txt
#   if there is a "requirements.txt" file at the top level of
#   the repo. Used to install the peyotl dependency of the
#   most recent branches of the api repo.
function py_package_setup_install() {
    reponame=$1
    # Directory in which all local checkouts of git repos reside
    repo_dir=$REPOS_DIR/$reponame
    # returns true (0) if the installation was performed
    installed=0
    if [ ! -d $repo_dir ] ; then
        log Install: $reponame "failed no parent"
        installed=1
    else
        (cd $repo_dir; \
         if test -f requirements.txt ; then pip install -r requirements.txt ; fi ; \
         python setup.py develop)
        log Install: $reponame "setup.py develop run"
    fi
    return $installed
}
