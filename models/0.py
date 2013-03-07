from gluon.storage import Storage
settings = Storage()

settings.migrate = True
settings.title = 'opentree'
settings.subtitle = 'front page of web site and web services associated with the Open Tree of Life project'
settings.author = 'Mark Holder'
settings.author_email = 'mtholder@gmail.com'
settings.keywords = 'bioinformatics, evolutionary biology, phylogenetics'
settings.description = 'The goal of the Open Tree of Life project is to make phylogenetic knowledge more accessible. This site will allow you to explore previously published tree estimates and synthetic estimates of phylogenies that are created from many datasets. You can help make the system more comprehensive by uploading trees or linking trees in the system to the data on which they are based.'
settings.layout_theme = 'Simpletex'
settings.database_uri = 'sqlite://storage.sqlite'
settings.security_key = 'c424b180-c7ef-49cd-82c4-4ab21945bb48'
settings.email_server = 'localhost'
settings.email_sender = 'you@example.com'
settings.email_login = ''
settings.login_method = 'local'
settings.login_config = ''
settings.plugins = ['wiki', 'comments', 'tagging']
