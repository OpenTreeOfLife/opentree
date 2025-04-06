# adapted from the plugin_comments provided with web2py
import logging
log = logging.getLogger(__name__)

import re

#from gluon.contrib.markdown.markdown2 import markdown
from markdown import markdown

from pyramid.view import view_config
import requests
import os.path
import urllib
import bleach
from bleach.sanitizer import Cleaner
import pytz   # explicit time-zone support
from datetime import datetime
import json
import synthetic_tree_viewer.opentreewebapputil

from synthetic_tree_viewer.opentreewebapputil import (fetch_github_app_auth_token, 
                                                      user_is_logged_in,
                                                      log_request_payloads,
                                                      get_auth_user,
                                                      pretty_date,
                                                     )
from pprint import pprint

from pyramid.events import subscriber
from pyramid.renderers import render_to_response
from pyramid_retry import IBeforeRetry
from pyramid.httpexceptions import HTTPNotFound

# these headers are set once request is available
GH_GET_HEADERS = None
GH_POST_HEADERS = None

@subscriber(IBeforeRetry)
def retry_event(event):
    log.debug("@@@@@ retry_event! event.exception: {}".format(type(event.exception)))
    log.debug("@@@@@ retry_event! event.response: {}".format(event.response))
    #print(f'A retry is about to occur due to {event.exception}.')

def error(msg="404 not found"):
    log.debug("@@@@@ raising 404 error: {}".format(msg))
    raise HTTPNotFound(body=msg)

# builds an organized list (UL) with threaded comments
def SUL(*a,**b): return UL(*[u for u in a if u],**b)


def show_type_icon(type):
    iconClass = "icon-comment"
    if type == 'Error in phylogeny':
        iconClass = "icon-move"
    elif type == 'Bug report':
        iconClass = "icon-warning-sign"
    elif type == 'Feature request':
        iconClass = "icon-wrench"
    elif type == 'Reply or general':
        iconClass = "icon-comment"
    icon_markup = '<i class="{}"></i>'.format(iconClass)
    return icon_markup

@view_config(route_name='local_comments',
             renderer='synthetic_tree_viewer:templates/local_comments.jinja2')
def index(request):
    # this is a tricky function that does simple display, handles POSTed comments, etc.

    update_github_headers(request)

    # TODO: break this up into more sensible functions, and refactor
    # display/markup generation to shared code?

    synthtree_id = request.POST.get('synthtree_id', None)
    synthtree_node_id = request.POST.get('synthtree_node_id', None)
    sourcetree_id = request.POST.get('sourcetree_id', None)
    ottol_id = request.POST.get('ottol_id', None)
    target_node_label = request.POST.get('target_node_label', None)

    url = (request.POST.get('url', None)  # ideal case, unambiguous
        or request.environ.get('original_url', None)    # for a subrequest (very common)
        or '')                            # empty as a last resort

    # NB - 'request.params' looks in both GET (query string) and POSTed vars
    filter = (request.params.get('filter', None)
        or request.environ.get('filter', None)
        or '')

    """
    log.debug(">>> request.POST.get('url'): {}".format(request.POST.get('url', None)));
    log.debug(">>> request.environ.get('original_url'): {}".format(request.environ.get('original_url', None)))
    log.debug("!!! best matching url: {}".format(url));
    log.debug(">>> filter: {}".format(filter));
    """

    auth_user = get_auth_user(request)

    # if anonymous user submitted identifying information, remember it
    visitor_name = request.POST.get('visitor_name', None) 
    if visitor_name:
        request.session['visitor_name'] = visitor_name
    visitor_email = request.POST.get('visitor_email', None)
    if visitor_email:
        request.session['visitor_email'] = visitor_email

    issue_or_comment = request.POST.get('issue_or_comment', None)
    thread_parent_id = request.POST.get('thread_parent_id', None) # can be None
    comment_id = request.POST.get('comment_id', None) # used for some operations (eg, delete)
    feedback_type = request.POST.get('feedback_type', None) # used for new comments
    reference_url = request.POST.get('reference_url', None) # used for phylo corrections only
    issue_title = request.POST.get('title', None) # used for new issues (threads)
    claims_expertise = request.POST.get('claimed_expertise', None) # used for new comments
    threads = [ ]
    def node(comment):
        # preload its comments (a separate API call)
        child_comments = [ ]
        if comment.get('comments') and comment.get('comments') > 0:
            get_children_url = comment['comments_url']
            resp = requests.get( get_children_url, headers=GH_GET_HEADERS, timeout=10)
            # N.B. Timeout is in seconds, and watches for *any* new data within that time (vs. whole response)
            try:
                resp.raise_for_status()
                try:
                    child_comments = resp.json()
                except:
                    child_comments = resp.json
            except:
                # WE need logging in the web app!
                try:
                    import sys
                    sys.stderr.write('Error: got a {c} from {u}\n'.format(c=resp.status_code,
                                                                        u=get_children_url))
                except:
                    pass # well that sucks, we failed to even write to stderr

        metadata = parse_comment_metadata(comment['body'])
        author_display_name, author_link = extract_best_author_details(comment, metadata=metadata)
        # Is this node for an issue (thread starter) or a comment (reply)?
        issue_node = 'number' in comment

        # Is the current user logged in? If so, what is their GitHub ID (login)?
        if user_is_logged_in(request):
            current_user_id = auth_user['login']
        else:
            current_user_id = None

        try:   # TODO: if not comment.deleted:
            # N.B. some missing information (e.g. supporting URL) will appear here as a string like "None"
            supporting_reference_url = metadata.get('Supporting reference', None)
            has_supporting_reference_url = supporting_reference_url and (supporting_reference_url != u'None')
            # Prepare a sanitized rendering of this user-submitted markup
            rendered_comment_markdown = extract_safe_html_comment(comment)
            markup = LI(
                    DIV(##T('posted by %(first_name)s %(last_name)s',comment.created_by),
                    # not sure why this doesn't work... db.auth record is not a mapping!?
                    ('title' in comment) and DIV( comment['title'], A(T('on GitHub'), _href=comment['html_url'], _target='_blank'), _class='topic-title') or '',
                    DIV( safe_comment_markup, _class=(issue_node and 'body issue-body' or 'body comment-body')),
                    DIV( A(T('Supporting reference (opens in a new window)'), _href=supporting_reference_url, _target='_blank'), _class='body issue-supporting-reference' ) if has_supporting_reference_url else '',
                    DIV(
                        A(T(author_display_name), _href=author_link, _target='_blank'),
                        # SPAN(' [local expertise]',_class='badge') if comment.claimed_expertise else '',
                        SPAN(' ',metadata.get('Feedback type'),' ',_class='badge') if metadata.get('Feedback type') else '',
                        T(' - %s',pretty_date(utc_to_local(datetime.strptime(comment['created_at'], GH_DATETIME_FORMAT)),T)),
                        SPAN(
                            issue_node and A(T(child_comments and 'Hide comments' or 'Show/add comments'),_class='toggle',_href='#') or '',
                            issue_node and comment['user']['login'] == current_user_id and SPAN(' | ') or '',
                            A(T('Delete'),_class='delete',_href='#') if comment['user']['login'] == current_user_id else '',
                        _class='controls'),
                    _class='byline'),
                    _id='r%s' % comment.get('number', comment['id']),
                    _class='msg-wrapper'),
                # child messages (toggle hides/shows these)
                issue_node and SUL(*[node(comment) for comment in child_comments], _style=("" if child_comments else "display: none;")) or '',
                issue_node and DIV(_class='reply', _style=("" if child_comments else "display: none;")) or '',
                _class=(issue_node and 'issue' or 'comment'))
            return markup
        except:
            import sys
            print("Unexpected error:", sys.exc_info()[0])
            raise

    log_request_payloads(request)

    #import pdb; pdb.set_trace()

    # Do final grooming of a single comment (incl. replies) before rendering
    def decorate_comment_for_display(comment):
        metadata = parse_comment_metadata(comment['body'])
        author_display_name, author_link = extract_best_author_details(comment, metadata=metadata)
        comment['author_display_name'] = author_display_name
        comment['author_link'] = author_link
        # render a friendly date, eg "6 days ago"
        # NB - GitHub API uses UTC (Zulu) timestamps, e.g. "2014-03-03T18:58:10Z"
        naiveDate = datetime.strptime(comment['created_at'], GH_DATETIME_FORMAT)
        utcDate = pytz.utc.localize(naiveDate)
        comment['pretty_date'] = pretty_date(utcDate)
        comment['safe_html_body'] = extract_safe_html_comment(comment)

    if thread_parent_id == 'delete':
        # delete the specified comment or close an issue...
        try:
            if issue_or_comment == 'issue':
                print("CLOSING ISSUE {0}".format(comment_id))
                close_issue(comment_id)
                clear_local_comments(request)
                return 'closed'
            else:
                print("DELETING COMMENT {0}".format(comment_id))
                delete_comment(comment_id)
                clear_local_comments(request)
                return 'deleted'
        except:
            clear_local_comments(request) # hopefully a cleaner result
            return error("Unable to delete comment")
    elif thread_parent_id:
        # add a new comment using the submitted vars
        if not request.POST.get('body'):
            print('MISSING BODY in POSTed data:')
            print(request.POST)
            return error("Missing body in POSTed data!")

        if not (visitor_name or auth_user):
            print('MISSING USER-ID:')
            print('  visitor_name:')
            print(visitor_name)
            print('  auth_user:')
            print(auth_user)
            return error("Missing user name/information in comment")

        # build useful links for some footer fields
        if user_is_logged_in(request):
            author_link = '[{0}]({1})'.format(auth_user['display_name'], auth_user['github_profile_url'])
        elif visitor_name and visitor_email: 
            author_link = '[{0}](mailto:{1})'.format(visitor_name, visitor_email)
        elif visitor_name: 
            # no email provided
            author_link = visitor_name
        elif visitor_email:
            # no name provided
            author_link = '[{0}](mailto:{1})'.format(visitor_email, visitor_email)
        else:
            # no identifying information provided
            author_link = 'Anonymous'

        if (thread_parent_id == '0'):
            # create a new issue (thread starter)
            msg_body = request.POST.get('body', '')
            if len(re.compile('\s+').sub('',msg_body))<1:
                return ''

            # more useful links for some footer fields
            if url.startswith('http'):
                # repeat full (absolute) URL as link text
                url_link = '[{0}]({1})'.format(url, url)
            else:
                # expand hidden link for root-relative URL
                url_link = '[{0}]({1}{2})'.format(url, request.environ.get('HTTP_ORIGIN','UNKNOWN_ORIGIN'), url)

            # add full metadata for an issue 
            footer = build_comment_metadata_footer(comment_type='starter', metadata={
                "Author": author_link,
                "Upvotes": 0,
                "URL": url_link,
                "Target node label": target_node_label,
                "Synthetic tree id": synthtree_id,
                "Synthetic tree node id": synthtree_node_id,
                "Source tree id": sourcetree_id,
                "Open Tree Taxonomy id": ottol_id,
                "Supporting reference": reference_url or 'None'
            })

            msg_data = {
                "title": issue_title,
                "body": "{0}\n{1}".format(msg_body, footer),
                "labels": [ ]
            }
            if feedback_type:
                # omit an empty value here!
                msg_data['labels'].append(feedback_type)
            new_msg = add_or_update_issue(msg_data)
        else:
            # attach this comment to an existing issue
            ##print("ADD A COMMENT")
            msg_body = request.POST.get('body', '')
            if len(re.compile('\s+').sub('',msg_body))<1:
                return ''
            # add abbreviated metadata for a comment
            footer = build_comment_metadata_footer(comment_type='reply', metadata={
                "Author" : author_link,
                "Upvotes" : 0,
            })
            msg_data = {
                "body": "{0}\n{1}".format(msg_body, footer)
            }
            new_msg = add_or_update_comment(msg_data, parent_issue_id=thread_parent_id)
        clear_local_comments(request)

        # For a new comment, we just want to return its bare HTML to be
        # inserted in the current client-side view.
        decorate_comment_for_display(new_msg)
        return render_to_response(
            renderer_name='synthetic_tree_viewer:templates/single_comment.jinja2',
            value={'comment': new_msg},
            request=request,
            package=None,
            response=None)

    # retrieve related comments, based on the chosen filter
    if filter == 'skip_comments':
        # sometimes we just want the markup/UI (eg, an empty page that's quickly updated by JS)
        comments = [ ]
    elif filter == 'synthtree_id,synthtree_node_id':
        comments = get_local_comments(request, {
            "Synthetic tree id": synthtree_id, 
            "Synthetic tree node id": synthtree_node_id})
    elif filter == 'sourcetree_id':
        comments = get_local_comments(request, {"Source tree id(s)": sourcetree_id})
    elif filter == 'ottol_id':
        comments = get_local_comments(request, {"Open Tree Taxonomy id": ottol_id})
    else:   # fall back to url
        log.debug(">>> no match for filter '{}'... using default comment filter (url?): ".format(filter));
        if 'parentWindowURL=' in url:
            #pprint("=== EXTRACTING parentWindowURL...")
            try:
                from urllib import unquote_plus
            except ImportError:
                from urllib.parse import unquote_plus
            # capture the absolute URL of a parent window (i.e. from OneZoom or the study-curation app)
            raw_qs_value = url.split('parentWindowURL=')[1];
            #pprint("=== raw_qs_value: %s" % raw_qs_value)
            url = unquote_plus(raw_qs_value)  # decode to a proper URL
            #pprint("=== NEW url: %s" % url)
        comments = get_local_comments(request, {"URL": url})

    for comment in comments:
        #thread[comment.thread_parent_id] = thread.get(comment.thread_parent_id,[])+[comment]
        comment['child_comments'] = [ ]  # by default, an empty list
        # load any replies BEFORE we move to the rendering template!
        if comment.get('comments') and comment.get('comments') > 0:
            get_children_url = comment['comments_url']
            resp = requests.get( get_children_url, headers=GH_GET_HEADERS, timeout=10)
            # N.B. Timeout is in seconds, and watches for *any* new data within that time (vs. whole response)
            try:
                resp.raise_for_status()
                # and now we append the child comments for rendering
                try:
                    comment['child_comments'] = resp.json()
                except:
                    comment['child_comments'] = resp.json
            except:
                # WE need logging in the web app!
                try:
                    import sys
                    sys.stderr.write('Error: got a {c} from {u}\n'.format(c=resp.status_code,
                                                                        u=get_children_url))
                except:
                    pass # well that sucks, we failed to even write to stderr
        threads.append(comment)

        for issue in threads:
            decorate_comment_for_display(issue)
            for reply in issue['child_comments']:
                decorate_comment_for_display(reply)

    view_dict = {'user_is_logged_in': user_is_logged_in(request),
                 'visitor_name': request.session.get('visitor_name',''),
                 'visitor_email': request.session.get('visitor_email',''),
                 'threads': threads,
                 'synthtree_id': synthtree_id,
                 'synthtree_node_id': synthtree_node_id,
                 'sourcetree_id': sourcetree_id,
                 'ottol_id': ottol_id,
                 'target_node_label': target_node_label,
                 'url': url,
                }
    return view_dict

""" MOVED this markup to the Pyramid template 'local_comments.jinja2'!

    return DIV(#script,
               DIV(FORM(# anonymous users should see be encouraged to login or add a name-or-email to their comments
                        '' if auth.user_id else A(T('Login'),_href=URL(r=request,c='default',f='user',args=['login']),_class='login-logout reply'),
                        '' if auth.user_id else T(' or '),
                        '' if auth.user_id else INPUT(_type='text',_id='visitor_name',_name='visitor_name',_value=session.get('visitor_name',''),_placeholder="Enter your name"),
                        '' if auth.user_id else T(' '),
                        '' if auth.user_id else INPUT(_type='text',_id='visitor_email',_name='visitor_email',_value=session.get('visitor_email',''),_placeholder="Your email (visible on GitHub)"),
                        '' if auth.user_id else BR(),
                        SELECT(
                            OPTION('What kind of feedback is this?', _value=''),
                            OPTION('General feedback'),
                            OPTION('Correction to relationships in the synthetic tree'),
                            OPTION('Suggest a phylogeny to incorporate'),
                            OPTION('Correction to names (taxonomy)'),
                            OPTION('Extinct/extant issue (taxonomy)'),
                            OPTION('Bug report (website behavior)'),
                            OPTION('New feature request'),
                        _name='feedback_type',value='',_style='width: 100%; margin-right: -4px;'),
                        LABEL(INPUT(_type='checkbox',_name=T('claimed_expertise')), T(' I claim expertise in this area'),_style='float: right;',_class='expertise-option'),
                        INPUT(_type='text',_id='issue_title',_name='issue_title',_value='',_placeholder="Give this topic a title"),   # should appear for proper issues only
                        TEXTAREA(_name='body',_placeholder="Add more to this topic, using Markdown (click 'Markdown help' below to learn more)."),
                        INPUT(_type='text',_id='reference_url',_name='reference_url',_value='',_placeholder="..."),   # visibility (and placeholder) depends on feedback type
                        INPUT(_type='hidden',_name='synthtree_id',_value=synthtree_id),
                        INPUT(_type='hidden',_name='synthtree_node_id',_value=synthtree_node_id),
                        INPUT(_type='hidden',_name='sourcetree_id',_value=sourcetree_id),
                        INPUT(_type='hidden',_name='ottol_id',_value=ottol_id),
                        INPUT(_type='hidden',_name='target_node_label',_value=target_node_label),
                        INPUT(_type='hidden',_name='url',_value=url),
                        # INPUT(_type='text',_name='thread_parent_id',_value=0),   # we'll get this from a nearby id, eg 'r8'
                        DIV(A(T('Close'),_class='msg-close',_href='#',_style='margin-right: 6px'),
                            SPAN(' | ',_style='margin-right: 6px'),
                            A(T('Markdown help'),_href='https://help.github.com/articles/markdown-basics',
                              _target='_blank',_style='margin-right: 10px'),
                            INPUT(_type='submit',_value=T('Post'),_class='btn btn-info btn-small',_style=''), 
                            _class='msg-footer'),
                        _method='post',_action=URL(r=request,args=[])),_class='reply'),
               SUL(*[node(comment) for comment in threads]),_class='plugin_localcomments')
"""

#
# Perform basic CRUD for local comments, using GitHub Issues API
#
GH_BASE_URL = 'https://api.github.com'

# if the current user is logged in, use their auth token instead
USER_AUTH_TOKEN = None    # will be initialized once we have the request

# Specify the media-type from GitHub, to freeze v3 API responses and get
# the comment body as markdown (vs. plaintext or HTML)
PREFERRED_MEDIA_TYPE = 'application/vnd.github.v3.raw+json, application/vnd.github.machine-man-preview+json'
# to get markdown AND html body, use 'application/vnd.github.v3.full+json'

GH_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%SZ'

def get_auth_header_value(request):
    global USER_AUTH_TOKEN
    if USER_AUTH_TOKEN:
        auth_header_value = 'token %s' % USER_AUTH_TOKEN
    else:
        GITHUB_APP_INSTALLATION_TOKEN = fetch_github_app_auth_token(request)
        auth_header_value = 'token %s' % GITHUB_APP_INSTALLATION_TOKEN
    return auth_header_value

def update_github_headers(request):
    global GH_GET_HEADERS
    global GH_POST_HEADERS
    if GH_GET_HEADERS:
        pass  # already updated in this request
    GH_GET_HEADERS = {'Authorization': get_auth_header_value(request),
                      'Accept': PREFERRED_MEDIA_TYPE}
    GH_POST_HEADERS = {'Authorization': get_auth_header_value(request),
                       'Content-Type': 'application/json',
                       'Accept': PREFERRED_MEDIA_TYPE}

def add_or_update_issue(msg_data, issue_id=None):
    # WATCH for accidental creation of bogus labels!
    if issue_id:
        # edit an existing issue via the GitHub API
        url = '{0}/repos/OpenTreeOfLife/feedback/issues/{1}'.format(GH_BASE_URL)
        resp = requests.patch( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    else:
        # create a new issue
        url = '{0}/repos/OpenTreeOfLife/feedback/issues'.format(GH_BASE_URL)
        resp = requests.post( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    try:
        new_msg = resp.json()
    except:
        new_msg = resp.json
    resp.raise_for_status()
    return new_msg


def add_or_update_comment(msg_data, comment_id=None, parent_issue_id=None ):
    # comment on an existing issue via the GitHub API
    if comment_id:
        # edit an existing comment
        url = '{0}/repos/OpenTreeOfLife/feedback/issues/comments/{1}'.format(GH_BASE_URL, comment_id)
        resp = requests.patch( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    else:
        # create a new comment
        url = '{0}/repos/OpenTreeOfLife/feedback/issues/{1}/comments'.format(GH_BASE_URL, parent_issue_id)
        resp = requests.post( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    resp.raise_for_status()
    try:
        new_msg = resp.json()
    except:
        new_msg = resp.json
    return new_msg

def close_issue(issue_id):
    # close a thread (issue) on GitHub
    url = '{0}/repos/OpenTreeOfLife/feedback/issues/{1}'.format(GH_BASE_URL, issue_id)
    resp = requests.patch( url, 
        headers=GH_POST_HEADERS,
        data=json.dumps({"state":"closed"})
    )
    resp.raise_for_status()
    try:
        resp_json = resp.json()
    except:
        resp_json = resp.json
    return resp_json

def delete_comment(comment_id):
    # delete a comment on GitHub
    url = '{0}/repos/OpenTreeOfLife/feedback/issues/comments/{1}'.format(GH_BASE_URL, comment_id)
    resp = requests.delete( url, 
        headers=GH_GET_HEADERS
    )
    resp.raise_for_status()
    try:
        resp_json = resp.json()
    except:
        resp_json = resp.json
    # clobber all cached comments (since we have no metadata)
    clear_matching_cache_keys("^localcomments:")
    return resp_json

def build_localcomments_key(request):
    return 'localcomments:'+ request.url +'?'+ repr(request.POST)

def clear_matching_cache_keys(key_pattern):
    # ASSUMES we're working with RAM cache
    # NOTE that we apparently need to "clear" (using a bogus regex) to get a fresh view of the cache
    """ TODO: restore RAM cache behaviors!
    cache.ram.clear(regex='^_BOGUS_CACHE_KEY_$')
    item_count_before = len(cache.ram.storage.keys())
    pprint("=== %d RAM cache keys BEFORE clearing: ===" % item_count_before)
    for k in cache.ram.storage.keys():
        pprint(k)
    pprint("===")
    pprint("> clearing cached items matching [%s]" % key_pattern)
    cache.ram.clear(regex=key_pattern)
    item_count_after = len(cache.ram.storage.keys())
    pprint("=== %d RAM cache keys AFTER clearing: ===" % item_count_after)
    for k in cache.ram.storage.keys():
        pprint(k)
    pprint("===")
    pprint("  %d items removed" % (item_count_before - item_count_after,))
    """
    pprint("TODO: clear_matching_cache_keys")

""" TODO: restore caching features!
@cache(key=build_localcomments_key(request), 
       time_expire=60*5, 
       cache_model=cache.ram)
"""
def get_local_comments(request, location={}):
    # Use the Search API to get all comments for this location. 
    # See https://developer.github.com/v3/search/#search-issues
    # build and encode search text (location "filter")
    print('>> location data provided:')
    print(location)
    print('>> its cache key would be:')
    print(build_localcomments_key(request))
    search_text = '' 
    for k,v in location.items():
        search_text = '{0}"{1} | {2} " '.format( search_text, k, v )
    print("RAW search_text:")
    print(search_text)
    try:
        from urllib import quote_plus
    except ImportError:
        from urllib.parse import quote_plus
    search_text = quote_plus(search_text.encode('utf-8'), safe='~')
    print("ENCODED search_text:")
    print(search_text)
    print('>> calling GitHub API for local issues...')
    url = '{0}/search/issues?q={1}repo:OpenTreeOfLife%2Ffeedback+state:open&sort=created&order=desc'
    ##TODO: search only within body?
    ## url = '{0}/search/issues?q={1}repo:OpenTreeOfLife%2Ffeedback+in:body+state:open&sort=created&order=asc'
    url = url.format(GH_BASE_URL, search_text)

    try:
        # 21 Apr, 2020: bug fix: keep this .get in a try block, because a HTTPSConnectionPool can be
        #   raised here (e.g. when GitHub is down)
        resp = requests.get(url, headers=GH_GET_HEADERS, timeout=10)
        # N.B. Timeout is in seconds, and watches for *any* new data within that time (vs. whole response)
        print(url)
        print(resp)
        resp.raise_for_status()
    except:
        print('call to {u} failed. Returning empty comments list'.format(u=url))
        return []
    try:
        results = resp.json()
    except:
        results = resp.json
    ##pprint(results)
    ##print("Returned {0} issues ({1})".format(
    ##  results["total_count"],
    ##  results["incomplete_results"] and 'INCOMPLETE' or 'COMPLETE'
    ##  ))
    return results['items']

def clear_local_comments(request):
    # Examine the JSON payload (now in request.POST) to see if we can clear
    # only the affected localcomments. If not, play it safe and clear all 
    # comments in the cache.
    if 'markdown_body' in request.POST:
        # If we receive issue Markdown, parse it to recover metadata fields.
        # N.B. this is not currently used, but handy to keep in mind!
        metadata = parse_comment_metadata(request.POST.markdown_body)
        local_url = metadata.get('URL', None)
        local_ott_id = metadata.get('Open Tree Taxonomy id', None)
        local_synth_node_id = metadata.get('Synthetic tree node id', None)
    else:
        # normally we'll examine the request.POST as-is
        metadata = request.POST;
        local_url = metadata.get('url', None)
        local_ott_id = metadata.get('ottol_id', None)
        local_synth_node_id = metadata.get('synthtree_node_id', None)

    if local_url or local_ott_id or local_synth_node_id:
        # Clobber any cached comment keyed to its metadata, in a way that 
        # handles Markdown or the more typical form variables.
        # N.B. that we err on the side of clobbering, since reloading the
        # comment cache is no big deal, while we definitely don't want to show
        # stale (cached) comments!
        if local_url:
            # Extract a root-relative URL from markdown strings like 
            # "[devtree.opentreeoflife.org/opentree/argus/otol.draft.22@132](http://devtree.opentreeoflife.org/opentree/argus/otol.draft.22@132)"
            markdown_url = local_url
            parts = markdown_url.split('[')
            if len(parts) > 1:
                markdown_url = parts[1]
                parts = markdown_url.split(']')
                markdown_url = parts[0]
                parts = markdown_url.split('/')[1:]
                root_relative_url = '/' + '/'.join(parts)
            else:
                # assume we have an absolute URL, and remove three slashes
                parts = markdown_url.split('/')[3:]
                root_relative_url = '/' + '/'.join(parts)
            #print('root_relative_url:')
            #print(root_relative_url)
            clear_matching_cache_keys("^localcomments:.*'url': '%s'.*" % root_relative_url)
        if local_ott_id:
            clear_matching_cache_keys("^localcomments:.*'ottol_id': '%s'.*" % local_ott_id)
        if local_synth_node_id:
            clear_matching_cache_keys("^localcomments:.*'synthtree_node_id': '%s'.*" % local_synth_node_id)
    else:
        # Play it safe and clobber *all* local comments in cache.
        print(">>> No metadata found. CLEARING ALL cached localcomments!")
        clear_matching_cache_keys("^localcomments:")


# Build and parse metadata for comments (stored as markdown in GitHub). 
# The full footer is used for a thread starter (GitHub issue), while replies
# (appended GitHub comments) use an abbreviated version.

full_footer = """
================================================
Metadata   |   Do not edit below this line
:------------|:----------
Author   |   %(Author)s 
Upvotes   |   %(Upvotes)d 
URL   |   %(URL)s 
Target node label   |   %(Target node label)s 
Synthetic tree id   |   %(Synthetic tree id)s 
Synthetic tree node id   |   %(Synthetic tree node id)s 
Source tree id(s)   |   %(Source tree id)s 
Open Tree Taxonomy id   |   %(Open Tree Taxonomy id)s 
Supporting reference   |   %(Supporting reference)s 
"""
reply_footer = """
================================================
Metadata   |   Do not edit below this line
:------------|:----------
Author   |   %(Author)s 
Upvotes   |   %(Upvotes)s 
"""

# TODO: Restore the expertise flag to both footers?
#   Claimed Expertise   |   %(Claimed Expertise)s 
# TODO: Move 'Feedback type' from labels to footer?
#   Feedback type   |   %(Feedback type)s 

def build_comment_metadata_footer(comment_type='starter', metadata={}):
    # build full footer (for starter) or abbreviated (for replies), 
    # and return the string
    if comment_type == 'starter':
        # it's a thread starter (a proper GitHub issue)
        footer_template = full_footer
    else:
        # it's a reply (GitHub comment)
        footer_template = reply_footer
    return footer_template % metadata

def parse_comment_metadata(comment_body):
    # extract metadata from comment body, return as dict
    metadata = { }
    looking_for_footer = True
    for line in comment_body.split('\n'):
        if looking_for_footer:
            if line.startswith('Metadata   |   '):
                looking_for_footer = False
        else:
            try:
                key, value = line.split('|')
            except ValueError:
                # we're past the footer?
                break
            key = key.strip()
            value = value.strip()
            if key.startswith(':---'):
                # skip this divider row
                continue
            metadata[key] = value
    return metadata

def extract_best_author_details(comment, metadata=None):
    # Examine the comment metadata (if any) to get the best display name
    # and URL for its author. Guests should appear here as the name and
    # email address they entered when creating a comment, rather than the
    # GitHub app (bot).
    #
    # Default values are what we can fetch from the issues API
    #  check this?  if comment['user']['type'] == 'Bot'
    author_display_name = comment['user']['login']
    author_link = comment['user']['html_url']
    # Now let's try for something more friendly...
    if not metadata:
        metadata = parse_comment_metadata(comment['body'])
    if metadata:
        meta_author_info = metadata.get('Author', None)
        if meta_author_info:
            # Try to parse this fron a Markdown hyperlink. Typical values include:
            #   u'opentreeapi'
            #   u'11'
            #   u'[Jim Allman](https://github.com/jimallman)'
            #   u'[John Smith](mailto:example.guest@gmail.com)'
            regex = re.compile(r'\[(.*)\]\((.*)\)')
            markdown_fields = regex.findall(meta_author_info)
            if len(markdown_fields) > 0:
                # look for parts of a markdown link
                author_display_name, author_link = markdown_fields[0]
            else:
                # it's not a markdown link, just a bare name or numeric userid
                if meta_author_info.isdigit():
                    # ignore ugly userid (login is better)
                    pass
                else:
                    author_display_name = meta_author_info
    return author_display_name, author_link

def extract_safe_html_comment(comment):
    # Cook up some reasonably strong regular expressions to detect bare
    # URLs and wrap them in hyperlinks. Adapted from
    # http://stackoverflow.com/questions/1071191/detect-urls-in-a-string-and-wrap-with-a-href-tag
    link_regex = re.compile(  r'''
                         (?x)( # verbose identify URLs within text
                  (http|https) # make sure we find a resource type
                           :// # ...needs to be followed by colon-slash-slash
                (\w+[:.]?){2,} # at least two domain groups, e.g. (gnosis.)(cx)
                          (/?| # could be just the domain name (maybe w/ slash)
                    [^ \n\r"]+ # or stuff then space, newline, tab, quote
                        [\w/]) # resource name ends in alphanumeric or slash
         (?=([\s\.,>)'"\]]|$)) # assert: followed by white or clause ending OR end of line
                             ) # end of match group
                               ''')
    # link_replace = r'<a href="\1" />\1</a>'
    # let's try this do-nothing version
    link_replace = r'\1'
    # NOTE the funky constructor required to use this below

    # Define a consistent cleaner to sanitize user input. We need a few
    # elements that are common in our markdown but missing from the Bleach
    # whitelist.
    # N.B. HTML comments are stripped by default. Non-allowed tags will appear
    # "naked" in output, so we can identify any bad actors.
    common_feedback_tags = [u'p', u'br',
                            u'h1', u'h2', u'h3', u'h4', u'h5', u'h6',
                            ]
    ot_markdown_tags = list(set( bleach.sanitizer.ALLOWED_TAGS + common_feedback_tags))
    ot_cleaner = Cleaner(tags=ot_markdown_tags)

    # and now we use all that to clean up the HTML
    rendered_comment_markdown = markdown(
        get_visible_comment_body(comment['body'] or ''),
        extras={'link-patterns':None},
        link_patterns=[(link_regex, link_replace)])   #.encode('utf-8')
    safe_comment_markup = ot_cleaner.clean(str(rendered_comment_markdown))
    return safe_comment_markup

def get_visible_comment_body(comment_body):
    # discard the footer (starting at line '=========...')
    visible_lines = [ ]
    for line in comment_body.split('\n'):
        if line.startswith('======='):
            break
        visible_lines.append(line)
    return '\n'.join(visible_lines)
    
# Time-zone converstion from UTC to local time (needed for GitHub date-strings),
# adapted from code found here: http://stackoverflow.com/a/13287083
import calendar
from datetime import datetime, timedelta
def utc_to_local(utc_dt):
    # get integer timestamp to avoid precision lost
    timestamp = calendar.timegm(utc_dt.timetuple())
    local_dt = datetime.fromtimestamp(timestamp)
    assert utc_dt.resolution >= timedelta(microseconds=1)
    return local_dt.replace(microsecond=utc_dt.microsecond)

