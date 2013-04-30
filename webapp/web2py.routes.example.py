# -*- coding: utf-8 -*-

# Copy this file (or just relevant lines below) to file 'routes.py' in the main web2py directory, to register
# this application's routes.py file.

# minimal routing, mainly to bounce /opentree requests to the routes defined in applications/opentree/routes.py
routes_app = ((r'/(?P<app>welcome|admin|app)\b.*', r'\g<app>'),
              (r'(.*)', r'opentree'),
              (r'/?(.*)', r'opentree'))
