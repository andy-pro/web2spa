# -*- coding: utf-8 -*-

def index():
    return dict()

@auth.requires_membership('administrators')
def restoredb():
    response.view='default/index.html'
    return dict()

def user():
    response.view='default/index.html'
    return dict(form=auth()) if request.args(0) == 'logout' else dict()

def error():
    response.view='default/index.html'
    return dict()

@cache.action()
def download():
    return response.download(request, db)

def call():
    return service()
