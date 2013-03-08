if not 'db' in globals():
    raise HTTP(500,"plugin _tagging requires 'db' and 'auth'")

db.define_table('plugin_tagging_tag',
    Field('name'),
    Field('links','integer',default=0,writable=False),
    Field('created_by',db.auth_user,writable=False,readable=False),
    Field('created_on','datetime',default=request.now,writable=False,readable=False),
    format='%(name)s')

db.plugin_tagging_tag.created_by.default=(auth.user and auth.user.id) or 0

db.define_table('plugin_tagging_link', 
    Field('tag',db.plugin_tagging_tag),   
    Field('table_name'),
    Field('record_id','integer'))

db.define_table('plugin_tagging_subscription',
    Field('auth_user',db.auth_user),
    Field('tag',db.plugin_tagging_tag))

   
db.plugin_tagging_tag.name.requires = IS_NOT_EMPTY()
db.plugin_tagging_link.tag.requires = IS_IN_DB(db,'plugin_tagging_tag.id','%(name)s')


def plugin_tagging(table_name=None,record_id=0):
    """
    You can tag a record of a table by embedding this::

    {{=tag('mytable',45)}}

    where 'mytable' is a table name and 45 is a record id.
    It will display a tagging widget.
    """
    return LOAD('plugin_tagging',args=(table_name,record_id),ajax=True)

def plugin_tagging_cloud():
    return LOAD('plugin_tagging','tag_cloud')
