# adapted from the plugin_comments provided with web2py
import re

dbco = db.plugin_localcomments_comment

def error(): raise HTTP(404)

# builds an organized list (UL) with threaded comments
def SUL(*a,**b): return UL(*[u for u in a if u],**b)

# client-side script to manage comment display and form behavior
script=SCRIPT("""
var action = null;
var formhtml = null;
function plugin_localcomments_init() {
  function delete_all_forms() { jQuery('div.plugin_localcomments .reply').html(''); }
  function capture_form() {
     jQuery('div.plugin_localcomments #close').click(function(){
       delete_all_forms();
     });
    jQuery('div.plugin_localcomments :submit').click(function(){
      var $form = jQuery(this).parent();
      jQuery.post(action+'/'+$form.parent().prev().attr('id'),
           {
               'thread_parent_id': $form.find('input[name="thread_parent_id"]').val(),
               'url': $form.find('input[name="url"]').val(),
               'body': $form.find('textarea[name="body"]').val()
           },
           function(data,r){ 
               if(data) { 
                   var $refreshArea = $form.parent().next();
                   alert($refreshArea);
                   $refreshArea.prepend(data);
                   $form.find('textarea[name="body"]').val('');
                   delete_all_forms();
                   plugin_localcomments_init(); 
               }
           },
           'html'
       );
      return false;
    });
  }
  jQuery('div.plugin_localcomments #toggle').click(function(){
     jQuery(this).parent().next().next().slideToggle();
  });
  jQuery('div.plugin_localcomments #reply').click(function(){
     delete_all_forms();
     jQuery(this).parent().next().next().slideDown();
     jQuery(this).parent().next().html(formhtml); capture_form(); 
  });
  jQuery('div.plugin_localcomments #delete').click(function(){
    delete_all_forms();
    var parent = jQuery(this).parent()
    jQuery.post(action+'/delete/'+parent.attr('id'),null,function(data,r){parent.html('deleted');});
  });
}
jQuery(document).ready(function() {
  action = jQuery('div.plugin_localcomments form').attr('action');  
  formhtml = jQuery('div.plugin_localcomments form').parent().html();
  jQuery('div.plugin_localcomments #toggle').parent().next().next().hide();
  jQuery('div.plugin_localcomments .reply').html('');
  plugin_localcomments_init()}
);
""")

def SIMPLEindex():
    comments = db().select(db.plugin_localcomments_comment.ALL, orderby=db.plugin_localcomments_comment.created_on)
    return dict(comments=comments)

def index():
    url = request.vars['url'] # if not provided, show all
    thread_parent_id = request.vars['thread_parent_id'] # can be None
    thread = {0:[]}
    def node(comment):
        if not comment.deleted:
            #return T('COMMENT')
            return LI(
                DIV(I('"'+comment.body+'"'),BR(),
                    ##T('posted by %(first_name)s %(last_name)s',comment.created_by),
                    # not sure why this doesn't work... db.auth record is not a mapping!?
                    T('Posted by %s',comment.created_by.first_name),
                    ' ', comment.created_by.last_name, 

                    ' ',T('on %s',comment.created_on),' [',
                    A(T('toggle'),_id='toggle'),
                    '|' if auth.user_id else '',
                    A(T('reply'),_id='reply') if auth.user_id else '',
                    '|' if comment.created_by == auth.user_id else '',
                    A(T('delete'),_id='delete') if comment.created_by == auth.user_id else '',
                    ']',_id='r%s' % comment.id),
                DIV(_class='reply'),
                SUL(*[node(comment) for comment in thread.get(comment.id,[])])
                )
        elif comment.id in thread:
            return LI(
                DIV(T('DELETED'),' [',
                    A(T('toggle'),_id='toggle'),']'),
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
    ##return DIV(T(url and ('url:'+url) or 'no url provided'))
    comments = db(dbco.url==url).select(orderby=~dbco.created_on)
    ##return DIV(len(comments))
    for comment in comments:
        thread[comment.thread_parent_id] = thread.get(comment.thread_parent_id,[])+[comment]
    return DIV(script,
               DIV(A(T('post'),_id='reply'),_id='r0') if auth.user_id \
                   else A(T('login to post'),_href=URL(r=request,c='default',f='user')),
               DIV(FORM(TEXTAREA(_name='body',_style='width:100%; height: 40px'),
                        INPUT(_type='text',_name='url',_value=url),  # OR _value=comment.url
                        INPUT(_type='text',_name='thread_parent_id',_value=0),   # we'll change this value on-the-fly
                        INPUT(_type='submit',_value=T('post'),_style='float:right'), 
                        LABEL(INPUT(_type='checkbox',_value=T('claimed_expertise')), T('I claim expertise in this area'),_style='float:left; margin-right: 40px;'),
                        A(T('help'),_href='http://daringfireball.net/projects/markdown/',
                          _target='_blank',_style='float:right; padding-right: 10px'),
                        A(T('close'),_id='close',_style='float:right; padding-right: 10px'),
                        _method='post',_action=URL(r=request,args=[])),_class='reply'),
               SUL(*[node(comment) for comment in thread[0]]),_class='plugin_localcomments')
