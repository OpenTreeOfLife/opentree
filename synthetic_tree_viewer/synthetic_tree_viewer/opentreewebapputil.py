# adapted from web2py (applications.opentree.modules.opentreewebapputil)
import os
import configparser

_CONF_OBJ_DICT = {}

def get_conf(request):
    # get app-specific settings (e.g. API URLs)
    global _CONF_OBJ_DICT

    app_name = request.registry.package_name
    c = _CONF_OBJ_DICT.get(app_name)
    if c is None:
        from configparser import ConfigParser
        conf = ConfigParser()
        # DON'T convert property names to lower-case!
        conf.optionxform = str
        test_config_paths = [
            os.path.abspath("../private/localconfig"),  # rarely used, but takes priority
            os.path.abspath("../private/config"),       # most common location
        ]
        config_file_found = None
        try:
            for test_path in test_config_paths:
                if os.path.isfile(test_path):
                    config_file_found = test_path
                    conf.read(test_path)
                    break;
            assert 'apis' in conf.sections()
            _CONF_OBJ_DICT[app_name] = conf
        except:
            print("\n=== WEB-APP CONFIG NOT FOUND, INVALID, OR INCOMPLETE ===")
            if config_file_found == None:
                err_msg = "Webapp config not found! Expecting it in one of these locations:\n  {}".format(test_config_paths)
                print(err_msg)
                raise Exception(err_msg)
            err_msg = "Webapp config file ({}) is broken or incomplete (missing [apis] section)".format(config_file_found)
            print(err_msg)
            raise Exception(err_msg)
    return c

def get_user_display_name():
    # TODO
    pass

def get_domain_banner_text(request):
    # Add an optional CSS banner to indicate a test domain, or none if
    # we're on a production server.
    if request.domain == 'tree.opentreeoflife.org':
        return ''
    # all other domains (including 'devtree.opentreeoflife.org') should present as dev servers
    return 'DEVELOPMENT'

def get_domain_banner_hovertext(request):
    # Return optional hover-text for dev+test domains, or none if
    # we're on a production server.
    if request.domain == 'tree.opentreeoflife.org':
        return ""
    # all other domains (including 'devtree.opentreeoflife.org') should present as dev servers
    # N.B. Line lengths gradually change, since this text fits diagonally in the page corner.
    # Be sure to test any changes!
    return '<br/>'.join(["This is a development version",
                         "of the Open Tree of Life website!",
                         "Data and services may be out of date or",
                         "untested. The production site (the place to",
                         "do real work) is <a href='https://tree.opentreeoflife.org/'>tree.opentreeoflife.org</a>."])

def get_currently_deployed_opentree_branch(request):
    """Read local git configuration and return the current branch"""
    # Backtrack to the real (vs. symlinked) filesystem path for this app
    this_file_dir = os.getcwd()
    infilepath = os.path.join(this_file_dir, '..', '.git', 'HEAD')
    branch_name = 'NOT FOUND (app is not inside a git repo?)'
    try:
        infile = open(infilepath)
        for line in infile:
            if 'ref:' in line:
                # FOR EXAMPLE:
                #   ref: refs/heads/mystery-branch\n
                branch_name = line.split('/')[-1].strip()
                break
        infile.close()
    except:
        pass
    return branch_name

def latest_CrossRef_URL():
    # TODO
    pass
