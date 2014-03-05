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
            oti_domain
            opentree_api_domain
        the values of the domain will contain the port (when needed)

    This is mainly useful for debugging because it lets developers use local
        instances of the service by tweaking private/conf (see private/conf.example)
    '''
    conf = get_conf(request)
    ret = {
        'treemachine_domain' : 'http://opentree-dev.bio.ku.edu:7474',
        'taxomachine_domain' : 'http://opentree-dev.bio.ku.edu:7476',
        'oti_domain' : 'http://oti.opentreeoflife.org',
        'opentree_api_domain' : 'http://api.opentreeoflife.org',
    }
    if conf.has_section('domains'):
        try:
            ret['treemachine_domain'] = conf.get('domains', 'treemachine')
        except:
            pass
        try:
            ret['taxomachine_domain'] = conf.get('domains', 'taxomachine')
        except:
            pass
        try:
            ret['oti_domain'] = conf.get('domains', 'oti')
        except:
            pass
        try:
            ret['opentree_api_domain'] = conf.get('domains', 'opentree_api')
        except:
            pass
    return ret

def get_opentree_services_method_urls(request):
    '''
    Reads the local configuration to build on domains and return a dictionary
        with keys for all domains AND their service methods
            treemachine_domain
            taxomachine_domain
        whose values are URLs combining domain and partial paths

    This is useful for debugging and for adapting to different ways of 
        configuring services, eg, proxied through a single domain 
        (see private/conf.example)
    '''
    domains = get_opentree_services_domains(request)

    conf = get_conf(request)
    ret = {
        'treemachine_domain' : domains['treemachine_domain'],
        'taxomachine_domain' : domains['taxomachine_domain'],
        'oti_domain' : domains['oti_domain'],
        'opentree_api_domain' : domains['opentree_api_domain'],
        'getDraftTreeID_url' : conf.get('method_urls', 'getDraftTreeID_url'),
        'getSyntheticTree_url' : conf.get('method_urls', 'getSyntheticTree_url'),
        'getSourceTree_url' : conf.get('method_urls', 'getSourceTree_url'),
        'getConflictTaxJsonAltRel_url' :conf.get('method_urls', 'getConflictTaxJsonAltRel_url'),
        'getDraftTreeForOttolID_url' : conf.get('method_urls', 'getDraftTreeForOttolID_url'),
        'getDraftTreeForNodeID_url' : conf.get('method_urls', 'getDraftTreeForNodeID_url'),
        'doTNRSForNames_url' : conf.get('method_urls', 'doTNRSForNames_url'),
        'getContextsJSON_url' : conf.get('method_urls', 'getContextsJSON_url'),  # current contextName values for TNRS
        'getNodeIDForOttolID_url' : conf.get('method_urls', 'getNodeIDForOttolID_url'),
        'getJSONFromNode_url' : conf.get('method_urls', 'getJSONFromNode_url'),
        'findAllStudies_url' : conf.get('method_urls', 'findAllStudies_url'),
        # Open Tree API methods
        'API_create_study_POST_url' : conf.get('method_urls', 'API_create_study_POST_url'),
        'API_load_study_GET_url' : conf.get('method_urls', 'API_load_study_GET_url'),
        'API_update_study_PUT_url' : conf.get('method_urls', 'API_update_study_PUT_url'),
        'API_remove_study_DELETE_url' : conf.get('method_urls', 'API_remove_study_DELETE_url'),
        'API_create_file_POST_url' : conf.get('method_urls', 'API_create_file_POST_url'),
        'API_load_file_GET_url' : conf.get('method_urls', 'API_load_file_GET_url'),
        'API_update_file_PUT_url' : conf.get('method_urls', 'API_update_file_PUT_url'),
        'API_remove_file_DELETE_url' : conf.get('method_urls', 'API_remove_file_DELETE_url'),
    }
    # for property, value in vars(ret).iteritems():
    for k,v in ret.iteritems():
        ret[k] = v.replace('{treemachine_domain}', domains['treemachine_domain']).replace('{taxomachine_domain}', domains['taxomachine_domain']).replace('{oti_domain}', domains['oti_domain']).replace('{opentree_api_domain}', domains['opentree_api_domain'])

    return ret
