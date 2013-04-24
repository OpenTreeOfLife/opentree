# adapted from the plugin_comments provided with web2py
import re
from gluon.tools import prettydate

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
    jQuery('div.plugin_localcomments :submit').unbind('click').click(function(){
      var $form = jQuery(this).parent();
      jQuery.post(action,
           {
               ////$'thread_parent_id': form.find('input[name="thread_parent_id"]').val(),
               'thread_parent_id': $form.parent().prev().attr('id').split('r')[1], 
               'url': $form.find('input[name="url"]').val(),
               'body': $form.find('textarea[name="body"]').val()
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
  jQuery('div.plugin_localcomments a.reply').unbind('click').click(function(){
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
    var parent = jQuery(this).parent()
    jQuery.post(action+'/delete/'+parent.attr('id'),null,function(data,r){parent.addClass('deleted').html('[deleted comment]');});
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

def SIMPLEindex():
    comments = db().select(db.plugin_localcomments_comment.ALL, orderby=db.plugin_localcomments_comment.created_on)
    return dict(comments=comments)

def index():
    # this is a tricky function that does simple display, handles POSTed comments, moderation, etc.

    # TODO: break this up into more sensible functions, and refactor
    # display/markup generation to shared code?

    url = request.vars['url'] # if not provided, show all
    thread_parent_id = request.vars['thread_parent_id'] # can be None
    thread = {0:[]}
    def node(comment):
        if not comment.deleted:
            #return T('COMMENT')
            return LI(
                DIV(##T('posted by %(first_name)s %(last_name)s',comment.created_by),
                    # not sure why this doesn't work... db.auth record is not a mapping!?
                    DIV(comment.body,_class='body'),
                    DIV(T('%s ',comment.created_by.first_name),T('%s',comment.created_by.last_name), T(' - %s',prettydate(comment.created_on,T)),
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
                DIV(T('DELETED'),' [',
                    A(T('toggle'),_class='toggle',_href='#'),']'),
                DIV(_class='reply'),
                SUL(*[node(comment) for comment in thread.get(comment.id,[])]))
        else: 
            return None

    if thread_parent_id == 'delete':
        # delete the specified comment
        if db(dbco.created_by==auth.user_id)(dbco.url==url)\
                (dbco.id==request.args(3)[1:]).update(deleted=True):
            return 'deleted'
        else:
            return error()
    elif thread_parent_id:
        # add a new comment using the submitted vars
        if not request.vars.body or not auth.user_id:
            return error()
        dbco.thread_parent_id.default = thread_parent_id
        dbco.url.default = url.strip()
        dbco.created_by.default = auth.user_id
        # TODO: add expertise checkbox, others
        dbco.claimed_expertise.default = False
        if len(re.compile('\s+').sub('',request.vars.body))<1:
            return ''
        item = dbco.insert(body=request.vars.body.strip())
        return node(item)                
    comments = db(dbco.url==url).select(orderby=~dbco.created_on)
    for comment in comments:
        thread[comment.thread_parent_id] = thread.get(comment.thread_parent_id,[])+[comment]
    return DIV(script,
               DIV(A(T('Add a comment'),_class='reply',_href='#'),_id='r0') if auth.user_id \
                   else A(T('Login to add comments'),_href=URL(r=request,c='default',f='user',args=['login'])),
               DIV(FORM(TEXTAREA(_name='body',_style='width:100%; height: 40px'),
                        INPUT(_type='text',_name='url',_value=url),  # OR _value=comment.url
                        # INPUT(_type='text',_name='thread_parent_id',_value=0),   # we'll get this from a nearby id, eg 'r8'
                        INPUT(_type='submit',_value=T('post'),_style='float:right'), 
                        LABEL(INPUT(_type='checkbox',_value=T('claimed_expertise')), T(' I claim expertise in this area'),_style='float:left; margin-right: 40px;'),
                        A(T('help'),_href='http://daringfireball.net/projects/markdown/',
                          _target='_blank',_style='float:right; padding-right: 10px'),
                        SPAN(' | ',_style='float:right; padding-right: 6px'),
                        A(T('close'),_class='close',_href='#',_style='float:right; padding-right: 6px'),
                        _method='post',_action=URL(r=request,args=[])),_class='reply'),
               SUL(*[node(comment) for comment in thread[0]]),_class='plugin_localcomments')
