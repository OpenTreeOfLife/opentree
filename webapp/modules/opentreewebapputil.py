#!/usr/env python
import logging
import os
import sys

_CONF_OBJ_DICT = {}

def get_conf(request):
    global _CONF_OBJ_DICT
    app_name = request.application
    c = _CONF_OBJ_DICT.get(app_name)
    if c is None:
        from ConfigParser import SafeConfigParser
        c = SafeConfigParser({})
        # DON'T convert property names to lower-case!
        c.optionxform = str        

        lcp = "applications/%s/private/localconfig" % app_name
        if os.path.isfile(lcp):
            c.read(lcp)
        else:
            c.read("applications/%s/private/config" % app_name)
        _CONF_OBJ_DICT[app_name] = c
    return c

def get_logging_level(request):
    '''
    Converts a config files logging section, level attribute to a logging modules' 
    value (default is logging.INFO)
    '''
    conf = get_conf(request)
    try:
        level_str = conf.get("logging", "level").upper()
        if level_str == "NOTSET":
            return logging.NOTSET
        elif level_str == "DEBUG":
            return logging.DEBUG
        elif level_str == "INFO":
            return logging.INFO
        elif level_str == "WARNING":
            return logging.WARNING
        elif level_str == "ERROR":
            return logging.ERROR
        elif level_str == "CRITICAL":
            return logging.CRITICAL
        else:
            return logging.NOTSET
    except:
        return logging.INFO
    
def get_logger(request, name):
    '''
    Returns a logger object with the level set based on the config file
    '''
    logger = logging.getLogger(name)
    if not hasattr(logger, 'is_configured'):
        logger.is_configured = False
    if not logger.is_configured:
        level = get_logging_level(request)
        logging_formatter = logging.Formatter("%(levelname) 8s: %(message)s")
        logging_formatter.datefmt='%H:%M:%S'
        logger.setLevel(level)
        ch = logging.StreamHandler()
        ch.setLevel(level)
        ch.setFormatter(logging_formatter)
        logger.addHandler(ch)
        logger.is_configured = True
    return logger

def get_opentree_services_domains(request):
    '''
    Reads the local configuration to get the domains and returns a dictionary
        with keys:
            treemachine_domain
            taxomachine_domain
        the values of the domain will contain the port (when needed)

    This is mainly useful for debugging because it lets developers use local
        instances of the service by tweaking private/conf (see private/conf.example)
    '''
    conf = get_conf(request)
    domain_pairs = conf.items('domains')
    domains = dict()
    for name, url in domain_pairs:
        domains[ "%s_domain" % name ] = url
    return domains

def get_opentree_services_method_urls(request):
    '''
    Reads the local configuration to build on domains and return a dictionary
        with keys:
            treemachine_domain
            taxomachine_domain
        whose values are URLs combining domain and partial paths

    This is useful for debugging and for adapting to different ways of 
        configuring services, eg, proxied through a single domain 
        (see private/conf.example)
    '''
    domains = get_opentree_services_domains(request)

    conf = get_conf(request)
    url_pairs = conf.items('method_urls')
    method_urls = dict()
    for mname, murl in url_pairs:
        # replace any domain tokens, eg, 'treemachine_domain'
        for dname, durl in domains.items():
            murl = murl.replace('{%s}' % dname, durl)
        method_urls[ mname ] = murl

    return method_urls
