# -*- coding: utf-8 -*-

start_path = '/application/default/index/';   # URL function give wrong result for ajax.json request!!! (add '.json')

users = {}  # global dictionary, cashe type, contains printable user name

def get_user_name(uid):
    if uid:
        who = users.get(uid)
        if not who:
            who = uid.first_name + ' ' + uid.last_name
            users[uid] = who
    else:
        who = ''
    return who

user_id = auth.user.id if auth.user else False
is_admin = auth.has_membership('administrators')
if is_admin: response.headers['Admin'] = True
response.headers['User-Id'] = user_id
btnBack = XML('<button type="button" class="close" aria-hidden="true" onclick="history.back();return false;" title="%s (Esc)">&times;</button>' % T("Back"))
PFORM = lambda title, form, script='': DIV(DIV(DIV(title, btnBack, _class="panel-heading"), DIV(form, _class="panel-body"), _class="panel panel-info"), SCRIPT('$("div.panel input:visible:first").focus();', script, _type='text/javascript'), _class="container cont-mid")
itext = lambda c, t: I(_class='glyphicon glyphicon-'+c) + ' ' + t

if not request.ajax:
    response.title = request.application.replace('_',' ').title()
    response.subtitle = ''
    ## read more at http://dev.w3.org/html5/markup/meta.name.html
    response.meta.author = 'Andrey Protsenko <andy.pro.1972@gmail.com>'
    response.meta.description = 'web2py single page application'
    response.meta.keywords = 'web2py, web2spa, single page application, python, framework, javascript, ajax, jquery, andy-pro'
    response.meta.generator = 'Web2py Web Framework'
    response.appmenu = [
        ('', False, A(B('web2spa'), XML('&trade;&nbsp;'), _class='navbar-brand web2spa',_href=URL('default', 'index'))),
        ('', False, A(T('News'), _class="nav navbar-nav web2spa", _href=URL('default', 'index/news')))
    ]

    if auth.has_membership('managers'):
        toolsmenu = [('', False, A(itext('th-list', T('New item')), _class='web2spa', _href=URL('default', 'index/edititem', vars={'new':'true'})))]
        if is_admin:
            response.headers['Admin'] = True
            hr = LI(_class="divider")
            toolsmenu += [hr, (itext('upload', T('Backup DB')), False, URL('default', 'backup')), hr,
                ('', False, A(itext('download', T('Restore DB')), _class='web2spa', _href=URL('default', 'restore'))),
                ('', False, A(itext('plus', T('Merge DB')), _class='web2spa', _href=URL('default', 'restore', vars={'merge':'true'}))),
                ('', False, A(itext('import', T('Import DB')), _class='web2spa', _href=URL('default', 'restore', vars={'txt':'true'}))), hr,
                (itext('warning-sign', T('Direct edit DB')), False, URL('appadmin', 'index')),
                (itext('remove', T('Clear DB')), False, 'javascript:db_clear()'), hr,
                (itext('cog', 'RESTful API'), False, URL('default', 'api/patterns'))]
        response.toolsmenu = [(T('Tools'), False, '#', toolsmenu)]
