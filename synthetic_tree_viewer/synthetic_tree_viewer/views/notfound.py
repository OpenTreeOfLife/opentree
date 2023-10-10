from pyramid.view import notfound_view_config
from synthetic_tree_viewer.opentreewebapputil import (
    get_conf,
    get_conf_as_dict,
    )


@notfound_view_config(renderer='synthetic_tree_viewer:templates/404.jinja2')
def notfound_view(request):
    request.response.status = 404
    view_dict = {
        'conf': get_conf(request),
        'conf_as_dict': get_conf_as_dict(request),
    }
    return {'body': "404 - Not Found"}
