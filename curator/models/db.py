# -*- coding: utf-8 -*-
from pprint import pprint
import sys
import os
from ConfigParser import SafeConfigParser
import urllib2
import json

conf = SafeConfigParser({})
try:
    if os.path.isfile("applications/%s/private/localconfig" % request.application):
        conf.read("applications/%s/private/localconfig" % request.application)
    else:
        conf.read("applications/%s/private/config" % request.application)
except:
    pass  #@TEMP probably should log this event...


#########################################################################
## This scaffolding model makes your app work on Google App Engine too
## File is released under public domain and you can use without limitations
#########################################################################

## if SSL/HTTPS is properly configured and you want all HTTP requests to
## be redirected to HTTPS, uncomment the line below:
# request.requires_https()

if not request.env.web2py_runtime_gae:
    ## if NOT running on Google App Engine use SQLite or other DB
    db = DAL('sqlite://storage.sqlite',pool_size=1,check_reserved=['all'])
else:
    ## connect to Google BigTable (optional 'google:datastore://namespace')
    db = DAL('google:datastore')
    ## store sessions and tickets there
    session.connect(request, response, db=db)
    ## or store session in Memcache, Redis, etc.
    ## from gluon.contrib.memdb import MEMDB
    ## from google.appengine.api.memcache import Client
    ## session.connect(request, response, db = MEMDB(Client()))

## by default give a view/generic.extension to all actions from localhost
## none otherwise. a pattern can be 'controller/function.extension'
response.generic_patterns = ['*'] if request.is_local else []
## (optional) optimize handling of static files
# response.optimize_css = 'concat,minify,inline'
# response.optimize_js = 'concat,minify,inline'

#########################################################################
## Here is sample code if you need for
## - email capabilities
## - authentication (registration, login, logout, ... )
## - authorization (role based authorization)
## - services (xml, csv, json, xmlrpc, jsonrpc, amf, rss)
## - old style crud actions
## (more options discussed in gluon/tools.py)
#########################################################################

from gluon.tools import Auth, Crud, Service, PluginManager, prettydate
auth = Auth(db)
crud, service, plugins = Crud(db), Service(), PluginManager()



#
# OAuth2 for Github (API v3), based on the FB sample provided in gluon/contrib/login_methods/oauth20_account.py
# 

# You need to override the get_user method to match your auth provider needs.
# define the auth_table before call to auth.define_tables()
auth_table = db.define_table(
   auth.settings.table_user_name,
   Field('name', length=256, default=""),          # "Charles Darwin"
   Field('email', length=128, default=""),         # "chuck@beagle.net"
   Field('github_login', length=128, default=""),  # "chuckd"  [Github calls this 'login']
   Field('github_url', length=256, default=""),    # "https://github.com/chuckd"  [Github calls this 'html_url']
   Field('avatar_url', length=256, default=""),    # "http://0.gravatar.com/avatar/805...9689b.png"
   #Field('password', 'password', length=256, readable=False, label='Password'),
   Field('github_auth_token', length=128, default= "", writable=False, readable=False),

   ## Some fields are expected by web2py, so repeat some values above..?
   Field('first_name', length=128, default=""),
   Field('last_name', length=128, default=""),
   Field('username', length=128, default="", ),  # unique=True not allowed in sqlite3
   Field('password', 'password', length=256, readable=False, label='Password'),
   Field('registration_key', length=128, default= "", writable=False, readable=False),
   )
   # is there another 'auth_token' field here already?

auth_table.github_login.requires = IS_NOT_IN_DB(db, auth_table.github_login)
auth.define_tables()
# OR auth.define_tables(username=False, signature=False)
# see https://code.google.com/p/web2py/issues/detail?id=1260

# Looking for your app's client ID and secret in {app}/private/config
try:
    CLIENT_ID = conf.get("apis", "github_client_id")
    CLIENT_SECRET = conf.get("apis", "github_client_secret")
    REDIRECT_URI = conf.get("apis", "github_redirect_uri")
except: 
    CLIENT_ID = "CLIENT_ID_NOT_FOUND"
    CLIENT_SECRET = "CLIENT_SECRET_NOT_FOUND"
    REDIRECT_URI = "REDIRECT_URI_NOT_FOUND"

AUTH_URL="http://..."
TOKEN_URL="http://..."

from gluon import current
from gluon.contrib.login_methods.oauth20_account import OAuthAccount
class GitHubAccount(OAuthAccount):
    '''OAuth impl for GitHub'''
    # http://developer.github.com/v3/oauth/
    AUTH_URL="https://github.com/login/oauth/authorize"
    TOKEN_URL="https://github.com/login/oauth/access_token"

    def __init__(self):
        OAuthAccount.__init__(self, 
                              g=globals(),
                              client_id=CLIENT_ID,
                              client_secret=CLIENT_SECRET,
                              auth_url=self.AUTH_URL,
                              token_url=self.TOKEN_URL,
                              redirect_uri=REDIRECT_URI,
                              state=os.urandom(16).encode('hex'),
                                  # random string to detect cross-site request forgery
                              scope='public_repo')  # add ',repo' if including private repos

        # adding session here, since older OAuthAccount doesn't seem to have it.. :-/
        self.session = globals()['session']
     

    def __redirect_uri(self, next=None):
        """
        Build the uri used by the authenticating server to redirect
        the client back to the page originating the auth request.
        Appends the _next action to the generated url so the flows continues.

        NOTE that this is patched to use the redirect_uri originally passed in.
        This prevents 'redirect_uri_mismatch' errors during GitHub authentication.
        """
        r = current.request

        if 'redirect_uri' in self.args and self.args['redirect_uri']:
            # avoid problems with proxied servers ('localhost:8000')
            uri = self.args['redirect_uri']

            ##sys.stderr.write('> using PRESET self.redirect_uri: '+ uri +'\n')

        else:
            # no preset redirect_uri, try to construct one

            ##sys.stderr.write('> using FOUND r.env.http_host: '+ r.env.http_host +'\n')

            http_host = r.env.http_host

            if r.env.https == 'on':
                url_scheme = 'https'
            else:
                url_scheme = r.env.wsgi_url_scheme
            if next:
                path_info = next
            else:
                path_info = r.env.path_info
            uri = '%s://%s%s' % (url_scheme, http_host, path_info)

        if r.get_vars and not next:
            uri += '?' + urlencode(r.get_vars)

        ##sys.stderr.write('> redirect_uri: '+ uri +'\n')
        return uri

    def get_user(self):
        '''Returns the user using the GitHub User API.'''
        ##sys.stderr.write('get_user STARTING...\n')
        access_token = self.accessToken()
        if not access_token:
            ##sys.stderr.write('get_user NO TOKEN FOUND\n')
            return None
         
        ##sys.stderr.write('get_user FOUND access_token:\n')
        ##pprint(access_token)

        ##sys.stderr.write('> get_user, finishing with this CURRENT.session.token:\n')
        ##pprint(current.session.token)
        ##sys.stderr.write('> get_user, trying SELF.session.token:\n')
        ##pprint(self.session.token)
        ##sys.stderr.write('> what about just session.token?\n')
        ##pprint(session.token)

        # fetch full user info from GitHub, to add/update user data
        user_request = urllib2.Request("https://api.github.com/user", headers={"Authorization" : ("token %s" % access_token)})
        data = urllib2.urlopen(user_request).read()
        user_json = {}
        try:
            user_json = json.loads(data)
        except Exception, e:
            raise Exception("Cannot parse oauth server response %s %s" % (data, e))
            return None

        ##pprint('----------- user_json ----------')
        ##pprint(user_json)
        ##pprint('----------- auth_user_fields ----------')

        # remap to our chosen auth_user fields
        auth_user_fields = dict(name = user_json['name'],
                                email = user_json['email'],
                                github_login = user_json['login'],
                                registration_id = user_json['login'],
                                #   required? see https://groups.google.com/forum/#!topic/web2py/yd4_yExPwXg/discussion
                                github_url = user_json['html_url'],
                                avatar_url = user_json['avatar_url'],
                                github_auth_token = access_token,
                                #   adding more (apparently) standard web2py fields, to make this work..
                                first_name = user_json['login'],
                                last_name = ("(%s)" % user_json['name']),
                                username = user_json['login'],
                                #password = 'TOP-SECRET',
                                registration_key = user_json['login'],  
                                )

        ##pprint(auth_user_fields)
        ##pprint('--------------------------------')

        return dict(auth_user_fields)


# use the class above to build a new login form
auth.settings.login_form=GitHubAccount()

# specify which auth_user fields can be modified on SECOND and subsequent logins
auth.settings.update_fields = ['name', 
                               'email', 
                               'github_login', 
                               #'registration_id', 
                               'github_url', 
                               'avatar_url', 
                               'github_auth_token', 
                               'first_name', 
                               'last_name', 
                               'username', 
                               #'password', 
                               'registration_key']

# there's no point in offer other user-management actions (we just shadow users in GitHub)
auth.settings.actions_disabled=['register', 'change_password','request_reset_password','profile']

## configure email
mail = auth.settings.mailer
mail.settings.server = 'logging' or 'smtp.gmail.com:587'
mail.settings.sender = 'you@gmail.com'
mail.settings.login = 'username:password'

## configure auth policy
auth.settings.registration_requires_verification = False
auth.settings.registration_requires_approval = False
auth.settings.reset_password_requires_verification = True

## if you need to use OpenID, Facebook, MySpace, Twitter, Linkedin, etc.
## register with janrain.com, write your domain:api_key in private/janrain.key
from gluon.contrib.login_methods.rpx_account import use_janrain
use_janrain(auth, filename='private/janrain.key')

#########################################################################
## Define your tables below (or better in another model file) for example
##
## >>> db.define_table('mytable',Field('myfield','string'))
##
## Fields can be 'string','text','password','integer','double','boolean'
##       'date','time','datetime','blob','upload', 'reference TABLENAME'
## There is an implicit 'id integer autoincrement' field
## Consult manual for more options, validators, etc.
##
## More API examples for controllers:
##
## >>> db.mytable.insert(myfield='value')
## >>> rows=db(db.mytable.myfield=='value').select(db.mytable.ALL)
## >>> for row in rows: print row.id, row.myfield
#########################################################################

## after defining tables, uncomment below to enable auditing
# auth.enable_record_versioning(db)
