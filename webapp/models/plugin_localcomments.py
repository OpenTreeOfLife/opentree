if not 'db' in globals():
    raise HTTP(500,"plugin _localcomments requires 'db' and 'auth'")

# adapted from plugin_comments, to tie comments a URL or fragment (to work with external data)

# For flexibility in OpenTree, we should cross-index each comment by the current context (node) in
# the currently viewed tree, plus any additional context provided by the view. This means:
#
#   * our current node in a synthetic tree, if any
#   * the corresponding node in a source tree (or current node if we're viewing the source tree)
#   * the corresponding ottol node i(or current node if we're viewing the ottol taxonomy)
#
# We'll retain the 'url' field to allow comments on static or "about" page of the site.
db.define_table('plugin_localcomments_comment',
                # add as much of each context as we can find
                Field('synthtree_id',readable=True,writable=False),
                Field('synthtree_node_id',readable=True,writable=False),
                Field('sourcetree_id',readable=True,writable=False),
                Field('sourcetree_node_id',readable=True,writable=False),
                Field('ottol_id',readable=True,writable=False),
                # first comment in thread can suggest scope (re: synthetic tree placement? OTT taxon?)
                # NOTE that we're disabling this, but will leave this field for now
                #Field('intended_scope','text'),
                # fallback 'url' for other web pages (vs tree-views)
                Field('url',readable=True,writable=False),
                # allow for threaded/nested comments?
                Field('thread_parent_id','integer',default=0,readable=False,writable=False),
                # TODO: Either title OR text should be required
                Field('title','text'),
                Field('body','text'),
                Field('deleted','boolean',default=False,readable=False,writable=False),
                Field('feedback_type','text'),
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
def plugin_localcomments(filter='synthtree_id,synthtree_node',url='',synthtree_id='',synthtree_node_id='',sourcetree_id='',ottol_id='',target_node_label='',parent_id=None):
    return LOAD('plugin_localcomments',vars=dict(
        filter=filter,  # show messages matching on these fields
        url=url,
        synthtree_id=synthtree_id,
        synthtree_node_id=synthtree_node_id,
        sourcetree_id=sourcetree_id,
        ottol_id=ottol_id,
        target_node_label=target_node_label,
        thread_parent_id=parent_id))
