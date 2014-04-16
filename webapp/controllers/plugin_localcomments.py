# adapted from the plugin_comments provided with web2py
import re
from gluon.tools import prettydate
from gluon.contrib.markdown.markdown2 import markdown
import requests
import os.path
import urllib
from datetime import datetime
import json

dbco = db.plugin_localcomments_comment

def error(): raise HTTP(404)

# builds an organized list (UL) with threaded comments
def SUL(*a,**b): return UL(*[u for u in a if u],**b)

# client-side script to manage comment display and form behavior
script=SCRIPT("""
var action = null;
var formhtml = null;
function delete_all_forms() { 
    jQuery('div.plugin_localcomments div.reply').each(function() {
        if ($(this).closest('.issue').length === 0) {
            // this is the space for new topics, with a separate link
            $(this).html('<a class="btn btn-small reply" href="#">Add a new topic</a>');
        } else {
            // this is the prompt to add comments to an existing topic
            $(this).html('<a class="btn btn-small reply" href="#">Add a comment</a>');
        }
        $(this).find('a.reply').unbind('click').click(function() {
            $formHolder = $(this).parent();
            delete_all_forms();
            $formHolder.html(formhtml); 
            capture_form(); 
            return false;
        });
    });
}
function capture_form() {
    jQuery('div.plugin_localcomments a.msg-close').unbind('click').click(function(){
        delete_all_forms();
        return false;
    });

    // adjust UI for issues versus comments
    var threadParentID = 0;
    var $parentIssueContainer = $('.plugin_localcomments form').closest('li.issue');
    if ($parentIssueContainer.length > 0) {
        threadParentID = $parentIssueContainer.find('div:eq(0)').attr('id').split('r')[1];
    }
    console.log('threadParentID:'+ threadParentID);
    var isThreadStarter = threadParentID == 0;
    if (isThreadStarter) {
        //jQuery('div.plugin_localcomments select[name=feedback_type] option:eq(1)').text( 'General comment' );
        jQuery('div.plugin_localcomments select[name=feedback_type]').show();
        jQuery('div.plugin_localcomments select[name=intended_scope]').show();
        jQuery('div.plugin_localcomments select[name=issue_title]').show();
    } else {
        //jQuery('div.plugin_localcomments select[name=feedback_type] option:eq(1)').text( 'Reply or general comment' );
        jQuery('div.plugin_localcomments select[name=feedback_type]').hide();
        jQuery('div.plugin_localcomments select[name=intended_scope]').hide();
        jQuery('div.plugin_localcomments select[name=issue_title]').hide();
    }
    // always hide expertise checkbox and surrounding label (not currently needed)
    jQuery('div.plugin_localcomments label.expertise-option').hide();

    jQuery('div.plugin_localcomments :submit').unbind('click').click(function(){
        var $form = jQuery(this).closest('form');
        jQuery.post(action,
            {
               ////$'thread_parent_id': form.find('input[name="thread_parent_id"]').val(),
               'issue_or_comment': (isThreadStarter ? 'issue' : 'comment'),
               'thread_parent_id': threadParentID,    ///$form.parent().prev().attr('id').split('r')[1], 
               'synthtree_id': $form.find('input[name="synthtree_id"]').val(),
               'synthtree_node_id': $form.find('input[name="synthtree_node_id"]').val(),
               'sourcetree_id': $form.find('input[name="sourcetree_id"]').val(),
               'sourcetree_node_id': $form.find('input[name="sourcetree_node_id"]').val(),
               'ottol_id': $form.find('input[name="ottol_id"]').val(),
               'url': $form.find('input[name="url"]').val(),
               'title': $form.find('input[name="issue_title"]').val(),
               'body': $form.find('textarea[name="body"]').val(),
               'feedback_type': $form.find('select[name="feedback_type"]').val(),
               'intended_scope': $form.find('select[name="intended_scope"]').val(),
               'claimed_expertise': $form.find(':checkbox[name="claimed_expertise"]').is(':checked')
            },
            function(data,r){ 
               if(data) { 
                   var $refreshArea;
                   if (isThreadStarter) {
                       $refreshArea = $form.parent().nextAll('ul');
                       // add the new comment (LI) to the top of the list
                       $refreshArea.prepend(data);
                   } else {
                       $refreshArea = $form.parent().prevAll('ul');
                       // add the new comment (LI) to the end of the list
                       $refreshArea.append(data);
                   } 
                   $form.find('textarea[name="body"]').val('');
                   //$form.find('input[name="thread_parent_id"]').val('0');
                   plugin_localcomments_init(); 
                   delete_all_forms();
               }
            },
            'html'
        );
        return false;
    });
}

function plugin_localcomments_init() {
  jQuery('div.plugin_localcomments .toggle').unbind('click').click(function(){
     var $toggle = $(this);
     var $parentIssue = $toggle.closest('li.issue');
     var $collapsibleTargets = $parentIssue.find('ul').eq(0).add($parentIssue.find('div.reply'));
     $collapsibleTargets.slideToggle(250);  // duration in ms
     if ($toggle.text().indexOf('Show') == -1) {
        $toggle.text('Show/add comments');
     } else {
        $toggle.text('Hide comments');
     }
     return false;
  });
  jQuery('div.plugin_localcomments .delete').unbind('click').click(function(){
    delete_all_forms();
    var $commentDiv = jQuery(this).closest('.msg-wrapper');
    var $msgItem = $commentDiv.closest('li');
    var issueOrComment = ($msgItem.is('.issue') ? 'issue' : 'comment');
    jQuery.post(
        action,    // WAS: action+'/delete',
        {
            'thread_parent_id': 'delete',
            'comment_id': $commentDiv.attr('id').split('r')[1],
            'issue_or_comment': issueOrComment
        },
        function(data,r){
            $msgItem.fadeOut(function() {$(this).remove();});
        }
    );
    return false;
  });
}
jQuery(document).ready(function() {
  action = jQuery('div.plugin_localcomments form').attr('action');  
  formhtml = jQuery('div.plugin_localcomments form').parent().html();
  delete_all_forms();  // important! creates .reply buttons before init() below
  plugin_localcomments_init();
});
""")

def moderation():
    comments = db().select(db.plugin_localcomments_comment.ALL, orderby=~db.plugin_localcomments_comment.created_on)  # =~ is DESCENDING ORDER
    form = SQLFORM.factory(Field('tag_name'))
    return dict(comments=comments, form=form)

def sqlform():
    # comments = db().select(db.plugin_localcomments_comment.ALL, orderby=~db.plugin_localcomments_comment.created_on)  # =~ is DESCENDING ORDER
    form = SQLFORM(db.plugin_localcomments_comment)
    return dict(form=form)
    
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
    return XML(I(_class=iconClass))

@auth.requires_membership(role='editor')
def grid():
    db.plugin_localcomments_comment.intended_scope.readable = True
    db.plugin_localcomments_comment.intended_scope.represent = lambda scope, row: scope and scope.capitalize() or XML(T('&mdash;'))
    db.plugin_localcomments_comment.feedback_type.represent = lambda row, value: show_type_icon(value)

    grid = SQLFORM.grid( db.plugin_localcomments_comment,

        # formstyle controls only the Add/Edit forms for individual records! not the main grid :(
        formstyle='bootstrap',
        #formstyle='table3cols',
        #formstyle='table2cols',
        #formstyle='inline',
        #formstyle='divs',
        #formstyle='ul',

        user_signature = False,  # False means *anyone* can edit, delete, etc! if they can use the method (see @auth.requires above)
        # editable=auth.has_membership(role='editor'),  # use this instead of @auth above, to allow others to search all comments

        create=False,
        deletable=False,  # we'll flip the hidden flag, but not truly delete..?
        orderby=~db.plugin_localcomments_comment.created_on,


        fields=[ 
            #db.plugin_localcomments_comment.id, 
            db.plugin_localcomments_comment.feedback_type, 
            db.plugin_localcomments_comment.body, 
            db.plugin_localcomments_comment.url, 
            db.plugin_localcomments_comment.ottol_id, 
            db.plugin_localcomments_comment.synthtree_id, 
            db.plugin_localcomments_comment.synthtree_node_id,
            db.plugin_localcomments_comment.created_on,
            db.plugin_localcomments_comment.intended_scope,
        ],
        headers = { 
            # NOTE the funky key format used here
            'plugin_localcomments_comment.feedback_type' : 'Type',
        }
        # TODO: add "virtual field" to show compound locations (treeID@nodeID), and hide underlying fields?

        # TODO: add custom rendering (via lambdas) for some fields, eg, icons for feedback_type:
        #   https://groups.google.com/forum/#!searchin/web2py/grid$20HTML/web2py/3KhSI4Ps5Tw/Ay4Nc0ti3g0J
        #   https://groups.google.com/forum/#!searchin/web2py/grid$20HTML/web2py/4-rgcM9FNcA/NFpIyZdj4OkJ
        #   http://web2py.com/books/default/chapter/29/06?search=represent#Record-representation

    )
    return locals()
    
def smartgrid():
    # comments = db().select(db.plugin_localcomments_comment.ALL, orderby=~db.plugin_localcomments_comment.created_on)  # =~ is DESCENDING ORDER
    grid = SQLFORM.smartgrid(db.plugin_localcomments_comment)
    return locals()
    

def index():
    # this is a tricky function that does simple display, handles POSTed comments, moderation, etc.

    # TODO: break this up into more sensible functions, and refactor
    # display/markup generation to shared code?

    synthtree_id = request.vars['synthtree_id']
    synthtree_node_id = request.vars['synthtree_node_id']
    sourcetree_id = request.vars['sourcetree_id']
    sourcetree_node_id = request.vars['sourcetree_node_id']
    ottol_id = request.vars['ottol_id']
    url = request.vars['url']

    filter = request.vars['filter']
    issue_or_comment = request.vars['issue_or_comment']
    thread_parent_id = request.vars['thread_parent_id'] # can be None
    comment_id = request.vars['comment_id'] # used for some operations (eg, delete)
    feedback_type = request.vars['feedback_type'] # used for new comments
    intended_scope = request.vars['intended_scope'] # used for new comments
    issue_title = request.vars['title'] # used for new issues (threads)
    claims_expertise = request.vars['claimed_expertise'] # used for new comments
    threads = [ ]
    def node(comment):
        ##print("building node for comment id={0}...".format(comment.get('number', comment['id'])))
        # preload its comments (a separate API call)
        child_comments = [ ]
        if comment.get('comments') and comment.get('comments') > 0:
            get_children_url = comment['comments_url']
            resp = requests.get( get_children_url, headers=GH_GET_HEADERS)
            resp.raise_for_status()
            try:
                child_comments = resp.json()
            except:
                child_comments = resp.json
            print("found {0} child comments".format(len(child_comments)))

        metadata = parse_comment_metadata(comment['body'])
        ##print(metadata)

        # Is this node for an issue (thread starter) or a comment (reply)?
        issue_node = 'number' in comment

        # Is the current user logged in? If so, what is their GitHub ID (login)?
        current_user_id = auth.user and auth.user.github_login or None

        try:   # TODO: if not comment.deleted:
            #import pdb; pdb.set_trace()
            markup = LI(
                    DIV(##T('posted by %(first_name)s %(last_name)s',comment.created_by),
                    # not sure why this doesn't work... db.auth record is not a mapping!?
                    ('title' in comment) and DIV( comment['title'], A(T('on GitHub'), _href=comment['html_url'], _target='_blank'), _class='topic-title') or '',
                    DIV( XML(markdown(get_visible_comment_body(comment['body'] or '')).encode('utf-8'), sanitize=False),_class=(issue_node and 'body issue-body' or 'body comment-body')),
                    DIV(
                        A(T(comment['user']['login']), _href=comment['user']['html_url'], _target='_blank'),
                        # SPAN(' [local expertise]',_class='badge') if comment.claimed_expertise else '',
                        SPAN(' ',metadata.get('Feedback type'),' ',_class='badge') if metadata.get('Feedback type') else '',
                        SPAN(' ',metadata.get('Intended scope'),' ',_class='badge') if metadata.get('Intended scope') else '',
                        T(' - %s',prettydate(utc_to_local(datetime.strptime(comment['created_at'], GH_DATETIME_FORMAT)),T)),
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
            print "Unexpected error:", sys.exc_info()[0]
            raise

    if thread_parent_id == 'delete':
        # delete the specified comment ... ADD(dbco.url==url)?
        # import pdb; pdb.set_trace()
        try:
            if issue_or_comment == 'issue':
                print("CLOSING ISSUE: ")
                print(comment_id)
                close_issue(comment_id)
                return 'closed'
            else:
                print("DELETING COMMENT: ")
                print(comment_id)
                delete_comment(comment_id)
                return 'deleted'
        except:
            return error()
    elif thread_parent_id:
        # add a new comment using the submitted vars
        if not request.vars.body or not auth.user_id:
            print('MISSING BODY OR USER_ID')
            print('  BODY:')
            print(request.vars.body)
            print('  USER_ID:')
            print(auth.user_id)
            return error()
        if (thread_parent_id == '0'):
            # create a new issue (thread starter)
            ##print("ADD AN ISSUE")
            msg_body = request.vars.body
            if len(re.compile('\s+').sub('',msg_body))<1:
                return ''
            # add full metadata for an issue 
            footer = build_comment_metadata_footer(metadata={
                "Author": auth.user_id,
                "Upvotes": 0,
                "URL": url.strip(),
                "Target node label": '',
                "Synthetic tree id": synthtree_id,
                "Synthetic tree node id": synthtree_node_id,
                "Source tree id": sourcetree_id,
                "Source tree node id": sourcetree_node_id,
                "Open Tree Taxonomy id": ottol_id,
                "Intended scope": intended_scope
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
            ##print("BACK FROM add_or_update")
        else:
            # attach this comment to an existing issue
            ##print("ADD A COMMENT")
            msg_body = request.vars.body
            if len(re.compile('\s+').sub('',msg_body))<1:
                return ''
            # add abbreviated metadata for a comment
            footer = build_comment_metadata_footer(metadata={
                "Author" : auth.user,
                "Upvotes" : 0,
            })
            msg_data = {
                "body": "{0}\n{1}".format(msg_body, footer)
            }
            new_msg = add_or_update_comment(msg_data, parent_issue_id=thread_parent_id)

        #dbco.thread_parent_id.default = thread_parent_id
        #dbco.synthtree_id.default = synthtree_id
        #dbco.synthtree_node_id.default = synthtree_node_id
        #dbco.sourcetree_id.default = sourcetree_id
        #dbco.sourcetree_node_id.default = sourcetree_node_id
        #dbco.ottol_id.default = ottol_id
        ## TODO: normalize URLs to handle trailing '/', fragments, etc.
        #dbco.url.default = url.strip()
        #dbco.created_by.default = auth.user_id
        #dbco.feedback_type.default = feedback_type
        #dbco.intended_scope.default = intended_scope
        #dbco.claimed_expertise.default = claims_expertise
        #if len(re.compile('\s+').sub('',request.vars.body))<1:
        #    return ''
        #item = dbco.insert(body=request.vars.body.strip())
        # submit for rendering as a "node" in comment list
        ##print("TODO: BUILD A NODE...")
        ##print(new_msg)
        return node(new_msg)                

    # retrieve related comments, based on the chosen filter
    print("retrieving local comments using this filter:")
    print(filter)
    if filter == 'synthtree_id,synthtree_node_id':
        #comments = db((dbco.synthtree_id==synthtree_id) & (dbco.synthtree_node_id==synthtree_node_id)).select(orderby=~dbco.created_on)
        comments = get_local_comments({
            "Synthetic tree id": synthtree_id, 
            "Synthetic tree node id": synthtree_node_id})
    elif filter == 'sourcetree_id,sourcetree_node_id':
        #comments = db((dbco.sourcetree_id==sourcetree_id) & (dbco.sourcetree_node_id==sourcetree_node_id)).select(orderby=~dbco.created_on)
        comments = get_local_comments({
            "Source tree id": sourcetree_id, 
            "Source tree node id": sourcetree_node_id})
    elif filter == 'ottol_id':
        #comments = db(dbco.ottol_id==ottol_id).select(orderby=~dbco.created_on)
        comments = get_local_comments({"Open Tree Taxonomy id": ottol_id})
    else:   # fall back to url
        #comments = db(dbco.url==url).select(orderby=~dbco.created_on)
        comments = get_local_comments({"URL": url})

    for comment in comments:
        #thread[comment.thread_parent_id] = thread.get(comment.thread_parent_id,[])+[comment]
        threads.append(comment)
    ##from pprint import pprint
    ##pprint('{0} threads loaded'.format(len(threads)))
    return DIV(script,
               DIV(FORM(# anonymous users should see be encouraged to login or add a name-or-email to their comments
                        '' if auth.user_id else A(T('Login'),_href=URL(r=request,c='default',f='user',args=['login']),_class='login-logout reply'),
                        '' if auth.user_id else T(' or '),
                        '' if auth.user_id else INPUT(_type='text',_id='anon_name',_name='anon_name',_value='',_placeholder="Enter your name"),
                        '' if auth.user_id else T(' '),
                        '' if auth.user_id else INPUT(_type='text',_id='anon_email',_name='anon_email',_value='',_placeholder="Your email (will be public)"),
                        '' if auth.user_id else BR(),
                        SELECT(
                            OPTION('What kind of feedback is this?', _value=''),
                            OPTION('Reply or general comment', _value=''),
                            OPTION('Reporting an error in phylogeny', _value='Error in phylogeny'),
                            OPTION('Bug report (website behavior)', _value='Bug report'),
                            OPTION('New feature request', _value='Feature request'),
                        _name='feedback_type', value=''),
                        T(' '),
                        SELECT(
                            OPTION('about node placement in the synthetic tree', _value='Re: synthetic tree'),
                            OPTION('about node placement in the source tree', _value='Re: source tree'),
                            OPTION('about taxon data in OTT', _value='Re: OTT taxon'),
                            OPTION('general feedback (none of the above)', _value=''),
                        _name='intended_scope', value='synthtree'),
                        LABEL(INPUT(_type='checkbox',_name=T('claimed_expertise')), T(' I claim expertise in this area'),_style='float: right;',_class='expertise-option'),
                        INPUT(_type='text',_id='issue_title',_name='issue_title',_value='',_placeholder="Give this topic a title"),   # should appear for proper issues only
                        TEXTAREA(_name='body',_placeholder="Add more to this topic, using Markdown (click 'Markdown help' below to learn more)."),
                        INPUT(_type='hidden',_name='synthtree_id',_value=synthtree_id),
                        INPUT(_type='hidden',_name='synthtree_node_id',_value=synthtree_node_id),
                        INPUT(_type='hidden',_name='sourcetree_id',_value=sourcetree_id),
                        INPUT(_type='hidden',_name='sourcetree_node_id',_value=sourcetree_node_id),
                        INPUT(_type='hidden',_name='ottol_id',_value=ottol_id),
                        INPUT(_type='hidden',_name='url',_value=url),
                        # INPUT(_type='text',_name='thread_parent_id',_value=0),   # we'll get this from a nearby id, eg 'r8'
                        DIV(A(T('Close'),_class='msg-close',_href='#',_style='margin-right: 6px'),
                            SPAN(' | ',_style='margin-right: 6px'),
                            A(T('Markdown help'),_href='https://help.github.com/articles/markdown-basics',
                              _target='_blank',_style='margin-right: 10px'),
                            INPUT(_type='submit',_value=T('Post'),_class='btn btn-small',_style=''), 
                            _class='msg-footer'),
                        _method='post',_action=URL(r=request,args=[])),_class='reply'),
               SUL(*[node(comment) for comment in threads]),_class='plugin_localcomments')

#
# Perform basic CRUD for local comments, using GitHub Issues API
#
GH_BASE_URL = 'https://api.github.com'
oauth_token_path = os.path.expanduser('~/.ssh/OPENTREEAPI_OAUTH_TOKEN')
try:
    OPENTREEAPI_AUTH_TOKEN = open(oauth_token_path).read().strip()
except:
    OPENTREEAPI_AUTH_TOKEN = ''
    print("OAuth token (%s) not found!" % oauth_token_path)

# if the current user is logged in, use their auth token instead
USER_AUTH_TOKEN = auth.user and auth.user.github_auth_token or None

# Specify the media-type from GitHub, to freeze v3 API responses and get
# the comment body as markdown (vs. plaintext or HTML)
PREFERRED_MEDIA_TYPE = 'application/vnd.github.v3.raw+json'
# to get markdown AND html body, use 'application/vnd.github.v3.full+json'

GH_DATETIME_FORMAT = '%Y-%m-%dT%H:%M:%SZ'
GH_GET_HEADERS = {'Authorization': ('token %s' % (USER_AUTH_TOKEN or OPENTREEAPI_AUTH_TOKEN)),
                  'Accept': PREFERRED_MEDIA_TYPE}
GH_POST_HEADERS = {'Authorization': ('token %s' % (USER_AUTH_TOKEN or OPENTREEAPI_AUTH_TOKEN)),
                   'Content-Type': 'application/json',
                   'Accept': PREFERRED_MEDIA_TYPE}

def add_or_update_issue(msg_data, issue_id=None):
    # WATCH for accidental creation of bogus labels!
    from pprint import pprint
    pprint(msg_data)
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
    pprint(resp)
    try:
        new_msg = resp.json()
    except:
        new_msg = resp.json
    pprint(new_msg)
    resp.raise_for_status()
    return new_msg


def add_or_update_comment(msg_data, comment_id=None, parent_issue_id=None ):
    # comment on an existing issue via the GitHub API
    if comment_id:
        # edit an existing comment
        url = '{0}/repos/OpenTreeOfLife/feedback/issues/comments/{1}'.format(GH_BASE_URL, comment_id)
        print('URL for editing an existing comment:')
        print(url)
        resp = requests.patch( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    else:
        # create a new comment
        url = '{0}/repos/OpenTreeOfLife/feedback/issues/{1}/comments'.format(GH_BASE_URL, parent_issue_id)
        print('URL for adding a new comment:')
        print(url)
        resp = requests.post( url, 
            headers=GH_POST_HEADERS,
            data=json.dumps(msg_data)
        )
    from pprint import pprint
    pprint(resp)
    resp.raise_for_status()
    try:
        new_msg = resp.json()
    except:
        new_msg = resp.json
    return new_msg

def close_issue(issue_id):
    # close a thread (issue) on GitHub
    url = '{0}/repos/OpenTreeOfLife/feedback/issues/{1}'.format(GH_BASE_URL, issue_id)
    print('URL for closing an existing issue:')
    print(url)
    resp = requests.patch( url, 
        headers=GH_POST_HEADERS,
        data=json.dumps({"state":"closed"})
    )
    from pprint import pprint
    pprint(resp)
    resp.raise_for_status()
    try:
        resp_json = resp.json()
    except:
        resp_json = resp.json
    return resp_json

def delete_comment(comment_id):
    # delete a comment on GitHub
    url = '{0}/repos/OpenTreeOfLife/feedback/issues/comments/{1}'.format(GH_BASE_URL, comment_id)
    print('URL for deleting an existing comment:')
    print(url)
    resp = requests.delete( url, 
        headers=GH_GET_HEADERS
    )
    from pprint import pprint
    pprint(resp)
    resp.raise_for_status()
    try:
        resp_json = resp.json()
    except:
        resp_json = resp.json
    return resp_json

def get_local_comments(location={}):
    # Use the Search API to get all comments for this location. 
    # See https://developer.github.com/v3/search/#search-issues
    # build and encode search text (location "filter")
    search_text = '' 
    for k,v in location.items():
        search_text = '{0}"{1} | {2} " '.format( search_text, k, v )
        print search_text
    search_text = urllib.quote_plus(search_text.encode('utf-8'), safe='~')
    url = '{0}/search/issues?q={1}repo:OpenTreeOfLife%2Ffeedback+state:open&sort=created&order=desc'
    ##TODO: search only within body?
    ## url = '{0}/search/issues?q={1}repo:OpenTreeOfLife%2Ffeedback+in:body+state:open&sort=created&order=asc'
    url = url.format(GH_BASE_URL, search_text)
    print(url)
    resp = requests.get( url, headers=GH_GET_HEADERS)
    ##print(resp)
    resp.raise_for_status()
    try:
        results = resp.json()
    except:
        results = resp.json
    ##from pprint import pprint
    ##pprint(results)
    print("Returned {0} issues ({1})".format(
        results["total_count"],
        results["incomplete_results"] and 'INCOMPLETE' or 'COMPLETE'
        ))
    return results['items']

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
Source tree id   |   %(Source tree id)s 
Source tree node id   |   %(Source tree node id)s 
Open Tree Taxonomy id   |   %(Open Tree Taxonomy id)s 
Intended scope   |   %(Intended scope)s 
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

def build_comment_metadata_footer(metadata={}):
    # build full footer (for starter) or abbreviated (for replies), 
    # and return the string
    if 'Intended scope' in metadata:
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
