from pyramid.config import Configurator

# Use Pyramid's default cookie session implementation
# see <https://docs.pylonsproject.org/projects/pyramid/en/latest/narr/sessions.html#using-the-default-session-factory>
from pyramid.session import SignedCookieSessionFactory
my_session_factory = SignedCookieSessionFactory('secret sauce')


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    with Configurator(settings=settings) as config:
        ## Allow subrequests in your Pyramid application.
        #config.add_subrequest_handler()
        # Is this deprecated?!
        config.set_session_factory(my_session_factory)
        config.include('pyramid_jinja2')
        config.include('pyramid_retry')
        config.include('.routes')
        config.scan()
    return config.make_wsgi_app()
