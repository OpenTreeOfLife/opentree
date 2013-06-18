# adapted from the plugin_comments provided with web2py
import re
from gluon.tools import prettydate
from gluon.contrib.markdown.markdown2 import markdown

dbco = db.plugin_localcomments_comment

def error(): raise HTTP(404)

# builds an organized list (UL) with threaded comments
def SUL(*a,**b): return UL(*[u for u in a if u],**b)

# client-side script to manage comment display and form behavior
script=SCRIPT("""
var action = null;
var formhtml = null;
function plugin_localcomments_init() {
  function delete_all_forms() { jQuery('div.plugin_localcomments div.reply').html(''); }
  function capture_form() {
     jQuery('div.plugin_localcomments a.close').unbind('click').click(function(){
       delete_all_forms();
       return false;
     });

     // adjust UI for thread starters versus replies
     var threadParentID = $('.plugin_localcomments form').parent().prev().attr('id').split('r')[1];
     console.log('threadParentID:'+ threadParentID);
     var isThreadStarter = threadParentID == 0;
     if (isThreadStarter) {
         //jQuery('div.plugin_localcomments select[name=feedback_type] option:eq(1)').text( 'General comment' );
         jQuery('div.plugin_localcomments select[name=feedback_type]').show();
         jQuery('div.plugin_localcomments select[name=intended_scope]').show();
     } else {
         //jQuery('div.plugin_localcomments select[name=feedback_type] option:eq(1)').text( 'Reply or general comment' );
         jQuery('div.plugin_localcomments select[name=feedback_type]').hide();
         jQuery('div.plugin_localcomments select[name=intended_scope]').hide();
     }
     // always hide expertise checkbox and surrounding label (not currently needed)
     jQuery('div.plugin_localcomments label.expertise-option').hide();

     jQuery('div.plugin_localcomments :submit').unbind('click').click(function(){
      var $form = jQuery(this).parent();
      jQuery.post(action,
           {
               ////$'thread_parent_id': form.find('input[name="thread_parent_id"]').val(),
               'thread_parent_id': threadParentID,    ///$form.parent().prev().attr('id').split('r')[1], 
               'synthtree_id': $form.find('input[name="synthtree_id"]').val(),
               'synthtree_node_id': $form.find('input[name="synthtree_node_id"]').val(),
               'sourcetree_id': $form.find('input[name="sourcetree_id"]').val(),
               'sourcetree_node_id': $form.find('input[name="sourcetree_node_id"]').val(),
               'ottol_id': $form.find('input[name="ottol_id"]').val(),
               'url': $form.find('input[name="url"]').val(),
               'body': $form.find('textarea[name="body"]').val(),
               'feedback_type': $form.find('select[name="feedback_type"]').val(),
               'intended_scope': $form.find('select[name="intended_scope"]').val(),
               'claimed_expertise': $form.find(':checkbox[name="claimed_expertise"]').is(':checked')
           },
           function(data,r){ 
               if(data) { 
                   var $refreshArea = $form.parent().next();
                   $refreshArea.prepend(data);
                   $form.find('textarea[name="body"]').val('');
                   //$form.find('input[name="thread_parent_id"]').val('0');
                   delete_all_forms();
                   plugin_localcomments_init(); 
               }
           },
           'html'
       );
      return false;
    });
  }
  // hide unwanted toggles (for comments with no reply)
  jQuery('div.plugin_localcomments .toggle').each(function() {
     var $toggle = $(this);
     var $replyHolder = $toggle.closest('li').find('ul');
     if ($replyHolder.find('li').length === 0) {
        $toggle.next('span').andSelf().hide();
     } else {
        $toggle.next('span').andSelf().show();
     }
  });
  jQuery('div.plugin_localcomments .toggle').unbind('click').click(function(){
     var $toggle = $(this);
     var $replyHolder = $toggle.closest('li').find('ul').eq(0);
     $replyHolder.slideToggle();
     if ($toggle.text().indexOf('show') == -1) {
        $toggle.text('show replies');
     } else {
        $toggle.text('hide replies');
     }
     return false;
  });
  jQuery('div.plugin_localcomments a.reply:not(.login-logout)').unbind('click').click(function(){
     delete_all_forms();
     if ($(this).closest('.controls').length > 0) {
        // this is a typical Reply link
        $formHolder = $(this).parent().parent().parent().next();
     } else {
        // this is the initial 'Add a comment' link
        $formHolder = $(this).parent().next();
     }
     $formFollower = $formHolder.next();
     $formFollower.slideDown();
     $formHolder.html(formhtml); 
     capture_form(); 
     return false;
  });
  jQuery('div.plugin_localcomments .delete').unbind('click').click(function(){
    delete_all_forms();
    var $commentDiv = jQuery(this).parent().parent().parent();
    jQuery.post(
        action+'/delete',
        {
            'thread_parent_id': 'delete',
            'comment_id': $commentDiv.attr('id').split('r')[1]
        },
        function(data,r){
            $commentDiv.addClass('deleted').find('.body').html('[deleted comment]');
        }
    );
    return false;
  });
}
jQuery(document).ready(function() {
  action = jQuery('div.plugin_localcomments form').attr('action');  
  formhtml = jQuery('div.plugin_localcomments form').parent().html();
  ///jQuery('div.plugin_localcomments .toggle').parent().next().next().hide();
  jQuery('div.plugin_localcomments div.reply').html('');
  plugin_localcomments_init()}
);
""")

def moderation():
    comments = db().select(db.plugin_localcomments_comment.ALL, orderby=~db.plugin_localcomments_comment.created_on)  # =~ is DESCENDING ORDER
    form = SQLFORM.factory(Field('tag_name'))
    return dict(comments=comments, form=form)

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
    thread_parent_id = request.vars['thread_parent_id'] # can be None
    comment_id = request.vars['comment_id'] # used for some operations (eg, delete)
    feedback_type = request.vars['feedback_type'] # used for new comments
    intended_scope = request.vars['intended_scope'] # used for new comments
    claims_expertise = request.vars['claimed_expertise'] # used for new comments
    thread = {0:[]}
    def node(comment):
        if not comment.deleted:
            #return T('COMMENT')
            return LI(
                DIV(##T('posted by %(first_name)s %(last_name)s',comment.created_by),
                    # not sure why this doesn't work... db.auth record is not a mapping!?
                    DIV( XML(markdown(comment.body or ''), sanitize=True),_class='body'),
                    DIV(T('%s ',comment.created_by.first_name),T('%s',comment.created_by.last_name), 
                        # SPAN(' [local expertise]',_class='badge') if comment.claimed_expertise else '',
                        SPAN(' [',comment.feedback_type,']',_class='badge') if comment.feedback_type else '',
                        SPAN(' [',comment.intended_scope,']',_class='badge') if comment.intended_scope else '',
                        T(' - %s',prettydate(comment.created_on,T)),
                        SPAN(
                            A(T('hide replies'),_class='toggle',_href='#'),
                            SPAN(' | ') if auth.user_id else '',
                            A(T('reply'),_class='reply',_href='#') if auth.user_id else '',
                            SPAN(' | ') if comment.created_by == auth.user_id else '',
                            A(T('delete'),_class='delete',_href='#') if comment.created_by == auth.user_id else '',
                        _class='controls'),
                    _class='byline'),
                    _id='r%s' % comment.id),
                DIV(_class='reply'),
                # child messages (toggle hides/shows these)
                SUL(*[node(comment) for comment in thread.get(comment.id,[])])
                )
        elif comment.id in thread:
            return LI(
                DIV(SPAN(T('[deleted comment]'),_class='body'),' ',
                    SPAN(
                        A(T('hide replies'),_class='toggle',_href='#'),
                    _class='controls'),
                _class='deleted'),
                DIV(_class='reply'),
                SUL(*[node(comment) for comment in thread.get(comment.id,[])]))
        else: 
            return None

    if thread_parent_id == 'delete':
        # delete the specified comment ... ADD(dbco.url==url)?
        if db(dbco.created_by==auth.user_id)\
                (dbco.id==comment_id).update(deleted=True):
            return 'deleted'
        else:
            return error()
    elif thread_parent_id:
        # add a new comment using the submitted vars
        if not request.vars.body or not auth.user_id:
            return error()
        dbco.thread_parent_id.default = thread_parent_id
        dbco.synthtree_id.default = synthtree_id
        dbco.synthtree_node_id.default = synthtree_node_id
        dbco.sourcetree_id.default = sourcetree_id
        dbco.sourcetree_node_id.default = sourcetree_node_id
        dbco.ottol_id.default = ottol_id
        # TODO: normalize URLs to handle trailing '/', fragments, etc.
        dbco.url.default = url.strip()
        dbco.created_by.default = auth.user_id
        dbco.feedback_type.default = feedback_type
        dbco.intended_scope.default = intended_scope
        dbco.claimed_expertise.default = claims_expertise
        if len(re.compile('\s+').sub('',request.vars.body))<1:
            return ''
        item = dbco.insert(body=request.vars.body.strip())
        return node(item)                

    # retrieve related comments, based on the chosen filter
    if filter == 'synthtree_id,synthtree_node_id':
        comments = db((dbco.synthtree_id==synthtree_id) & (dbco.synthtree_node_id==synthtree_node_id)).select(orderby=~dbco.created_on)
    elif filter == 'sourcetree_id,sourcetree_node_id':
        comments = db((dbco.sourcetree_id==sourcetree_id) & (dbco.sourcetree_node_id==sourcetree_node_id)).select(orderby=~dbco.created_on)
    elif filter == 'ottol_id':
        comments = db(dbco.ottol_id==ottol_id).select(orderby=~dbco.created_on)
    else:   # fall back to url
        comments = db(dbco.url==url).select(orderby=~dbco.created_on)

    for comment in comments:
        thread[comment.thread_parent_id] = thread.get(comment.thread_parent_id,[])+[comment]
    return DIV(script,
               DIV(
                   A(T('Add a comment'),_class='reply',_href='#') if auth.user_id \
                   else A(T('Add a comment'),_href=URL(r=request,c='default',f='user',args=['login']),_class='login-logout reply'),
               _id='r0'),
               DIV(FORM(SELECT(
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
                        TEXTAREA(_name='body',_style='width:100%; height: 50px; margin-top: 4px;'),
                        INPUT(_type='hidden',_name='synthtree_id',_value=synthtree_id),
                        INPUT(_type='hidden',_name='synthtree_node_id',_value=synthtree_node_id),
                        INPUT(_type='hidden',_name='sourcetree_id',_value=sourcetree_id),
                        INPUT(_type='hidden',_name='sourcetree_node_id',_value=sourcetree_node_id),
                        INPUT(_type='hidden',_name='ottol_id',_value=ottol_id),
                        INPUT(_type='hidden',_name='url',_value=url),
                        # INPUT(_type='text',_name='thread_parent_id',_value=0),   # we'll get this from a nearby id, eg 'r8'
                        INPUT(_type='submit',_value=T('post'),_style='float:right'), 
                        A(T('help'),_href='http://daringfireball.net/projects/markdown/',
                          _target='_blank',_style='float:right; padding-right: 10px'),
                        SPAN(' | ',_style='float:right; padding-right: 6px'),
                        A(T('close'),_class='close',_href='#',_style='float:right; padding-right: 6px'),
                        _method='post',_action=URL(r=request,args=[])),_class='reply'),
               SUL(*[node(comment) for comment in thread[0]]),_class='plugin_localcomments')
