For local testing of the taxonomy browser, there are two options:

1. **Use the Makefile and local Apache**
   This assumes you're using OS X, with the system Apache server running and
   configured for CGI.
   ```bash
   cd taxonomy/cgi-bin
   make local-install
   make local-browse
   ```
   This should open your default web browser to a node.

2. **Use Python's `http.server`**
   This assumes you have Python 3 available.
   ```bash
   cd ./taxonomy
   python3 cgiserver.py
   ```
   Now open a browser to a typical URL, like so:
   http://localhost:8888/cgi-bin/browse?name=Mammalia

