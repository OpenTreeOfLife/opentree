db.define_table('plugin_comments_comment',
                Field('tablename',readable=False,writable=False),
                Field('record_id','integer',readable=False,writable=False),
                Field('parent_node','integer',readable=False,writable=False),
                Field('body'),
                Field('deleted','boolean',default=False,readable=False,writable=False),
                Field('votes','integer',default=1,readable=False,writable=False),
                Field('created_by',db.auth_user,default=auth.user_id,readable=False,writable=False),
                Field('created_on','datetime',default=request.now,readable=False,writable=False))

def plugin_comments(tablanme='0',record_id=0):
    return LOAD('plugin_comments',args=[tablanme,record_id])
