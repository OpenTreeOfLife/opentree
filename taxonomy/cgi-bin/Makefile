QUERY=name=Opisthokonta

test:
	@QUERY_STRING=$(QUERY) ./browse.py | grep Holozoa

# For testing on OS X with the apple built-in apache installation
# (enable with 'sudo apachectl start')
local-install:
	cp -p browse.py /Library/WebServer/CGI-Executables/browse

# Browse locally (assumes OS X 'open' command)
local-browse:
	open http://localhost/cgi-bin/browse?$(QUERY)

# Install to some remote system
REMOTE=varela.csail.mit.edu
install:
	scp -p browse.py $(REMOTE):/usr/lib/cgi-bin/browse

# Browse on remote system (assumes OS X 'open' command)
browse:
	open http://$(REMOTE)/cgi-bin/browse?$(QUERY)

