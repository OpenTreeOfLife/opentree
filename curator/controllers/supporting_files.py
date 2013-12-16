# -*- coding: utf-8 -*-

## a simple controller to handle AJAX uploads of study supporting files
## adapted from http://in10min.blogspot.com/2013/04/web2py-implement-multiple-files-upload.html

def upload_file():
    """
    File upload handler for the AJAX form of the plugin jquery-file-upload
    Return the response in JSON required by the plugin
    """
    try:
        # Get the file from the form
        f = request.vars['files[]']
         
        # Store file
        id = db.files.insert(doc = db.files.doc.store(f.file, f.filename))
         
        # Compute size of the file and update the record
        record = db.files[id]
        path_list = []
        path_list.append(request.folder)
        path_list.append('uploads')
        path_list.append(record['doc'])
        size =  shutil.os.path.getsize(shutil.os.path.join(*path_list))
        File = db(db.files.id==id).select()[0]
        db.files[id] = dict(sizeFile=size)
        db.files[id] = dict(sessionId=response.session_id)
         
        res = dict(files=[{"name": str(f.filename), "size": size, "url": URL(f='download', args=[File['doc']]), "thumbnail_url": URL(f='download', args=[File['thumb']]), "delete_url": URL(f='delete_file', args=[File['doc']]), "delete_type": "DELETE" }])
         
        return gluon.contrib.simplejson.dumps(res, separators=(',',':'))

    except:
        return dict(message=T('Upload error'))


def delete_file():
    """
    Delete an uploaded file
    """
    try:
        name = request.args[0]
        db(db.files.doc==name).delete()
        return dict(message=T('File deleted'))
    except:
        return dict(message=T('Deletion error'))


def upload():
    return dict()



