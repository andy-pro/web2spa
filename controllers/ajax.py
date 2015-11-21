# -*- coding: utf-8 -*-

def lexicon():
    return dict(
    _ADMIN_DB_ = T('Direct edit DB'),
    _BACK_ = T('Back'),
    _BACKUP_ = T('Backup DB'),
    _BTNBACK_ = btnBack,
    _CANCEL_ = T('Cancel'),
    _CLEAR_DB_ = T('Clear DB'),
    _DB_UPD_ = T('Database update success!'),
    _DEL_ = T('Delete'),
    _DETAILS_ = T('Details'),
    _EDITOR_ = T('Editor'),
    _ERROR_ = T('Error'),
    _IMPORT_ = T('Import DB'),
    _FIND_ = T('Find'),
    _FNDRES_ = T('Found results for "%s"'),
    _FOR_ALL_ = T('Apply for all'),
    _FOUND_ = T('Found: '),
    _HELP_ = T('Help'),
    _HOME_ = T('Home'),
    _LAST_MOD_ = T('Last modified'),
    _MERGE_DB_ = T('Merge DB'),
    _NEWS_ = T('News'),
    _NOCHANGE_ = T('No changes'),
    _REPLACE_ = T('Replace'),
    _RESTORE_ = T('Restore DB'),
    _SEARCH_ = T('Search'),
    _TITLE_ = T('Title'),
    _TOOSHORT_ = T('too short query!'),
    _TOOLS_ = T('Tools'),
    _WRAP_ = T('Wrap text'),
    login = T('Log In'),
    logout = T('Log Out'),
    register = T('Sign Up'),
    request_reset_password = T('Request reset password'),
    profile = T('Profile'),
    change_password = T('Change Password'))

def templates():
    response.view = 'templates.html'
    return dict()

@auth.requires_membership('administrators')
def restore():
    return add_formkey(dict())

def add_formkey(data):
    s = request.function
    data.update(dict(formname=s, formkey=formUUID(s)))
    return data

def formUUID(formname):
    from gluon.utils import web2py_uuid
    formkey = web2py_uuid()
    keyname = '_formkey[%s]' % formname
    session[keyname] = list(session.get(keyname, []))[-9:] + [formkey]
    return formkey

@auth.requires_membership('managers')
def update():
    vars = request.vars
    try:
        msg = ''
        formname = vars.formname
        formkey = vars.formkey
        keyname = '_formkey[%s]' % formname
        formkeys = list(session.get(keyname, []))
        if formkey and formkeys and formkey in formkeys:  # check if user tampering with form and void CSRF
            session[keyname].remove(formkey)
        else:
            msg = T('Session expired!')
            raise   # usage of 'raise Exception(value)' calls 'TypeError ... is not JSON serializable' error
        if not auth.user:
            msg = T('UNAUTHORIZED!')
            raise
        if int(vars.user) != int(auth.user.id):
            msg = T('Access error!')
            raise
    except:
        return dict(status=False, details=msg if msg else T('Unexpected error!'))

    result = dict(status=True)
    changed = False
    try:
        if formname == 'formname1':
            # save formData from Controller 1
            pass
            #result['location'] = ''    # this will redirect to home page index/
            #result['location'] = 'somelocation'
        elif formname == 'formname2':
            # save formData from Controller 2
            pass
            #result['location'] = ''
            #result['location'] = 'somelocation'
        elif formname == 'restore':
            f = vars.upload.file
            db.import_from_csv_file(f, restore = not bool(vars.merge))
            msg = T('Database restored')
            result['location'] = ''
        else:
            pass
    except:
        msg = T('Error')
        result['status'] = False
        result['location'] = ''
    result['details'] = msg if msg else T('Database update success!') if changed else T('No changes')
    if result.has_key('location'):
        result['location'] = start_path + result['location']
    return result

def user():
    action = request.args(0) if request.args(0) else 'login'
    if action != 'logout':
        _next = request.env.http_web2py_component_location
        form = getattr(auth, action)()
        title = ''
        script = ''
        if action == 'login':
            title = T('Log In')
            if not 'register' in auth.settings.actions_disabled:
                form.add_button(T('Sign Up'), URL('default', 'user/register'), _class='btn btn-default')
            if not 'request_reset_password' in auth.settings.actions_disabled:
                form.add_button(T('Lost Password'), URL('default', 'user/request_reset_password'), _class='btn btn-default')
        elif action == 'register':
            title = T('Sign Up')
            script = 'web2py_validate_entropy(jQuery("#auth_user_password"),100);'
        elif action =='change_password':
            script = 'web2py_validate_entropy(jQuery("#no_table_new_password"),100);'
        if not title:
            title = T(action.replace('_',' ').title())
        return PFORM(title, form, script)   # defined in models, may be used in all controllers

def error():
    response.view='default/error.html'
    codes = ('401','UNAUTHORIZED'), ('403','Access denied'), ('404','Not found'), ('500','Internal server error')
    code = request.args(0) or ''
    msg = request.args(1) or 'Unknown error'
    res = dict(code=code, msg=msg)
    for code, msg in codes:
        if res['code']==code:
            res['msg'] = msg
    return res



