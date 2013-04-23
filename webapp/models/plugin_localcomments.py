if not 'db' in globals():
    raise HTTP(500,"plugin _localcomments requires 'db' and 'auth'")

# adapted from plugin_comments, to tie comments to a URL or fragment (to work with external data)
db.define_table('plugin_localcomments_comment',
                Field('url',readable=True,writable=False),
                ## Field('record_id','integer',readable=False,writable=False),
                ## Field('parent_node','integer',readable=False,writable=False),
                # allow for threaded/nested comments?
                Field('thread_parent_id','integer',default=0,readable=False,writable=False),
                # TODO: Either title OR text should be required
                Field('title','text'),
                Field('body','text'),
                Field('deleted','boolean',default=False,readable=False,writable=False),
                Field('claimed_expertise','boolean',default=False,readable=False,writable=False),
                Field('votes','integer',default=0,readable=False,writable=False),
                Field('created_by',db.auth_user,default=auth.user_id,readable=False,writable=False),  # OR 'reference auth_user'
                Field('created_on','datetime',default=request.now,readable=False,writable=False),
                ## format=lambda row: row.title if row.title else 'untitled')
                ## format='%(id)s'
                )

db.plugin_localcomments_comment.created_by.default=(auth.user and auth.user.id) or 0
db.plugin_localcomments_comment.created_by.requires = IS_NOT_EMPTY()
#db.plugin_localcomments_comment.email.requires = IS_EMAIL()

# simplify embedding in a page template
def plugin_localcomments(url='',parent_id=None):
    return LOAD('plugin_localcomments',vars=dict(url=url, thread_parent_id=parent_id))
