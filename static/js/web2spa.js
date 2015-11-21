/*** Single Page Application approach for web2py framework ***/
var web2spa = {
    init: function(settings, callback) {   // callback, perform after application load & init
	/*** settings's keys:
	    app: application name, e.g. 'welcome',
	    mainctrl: default controller, 'default' by default,
	    mainpage: default function, 'index' by default,
	    ajaxctrl: ajax request controller, 'ajax' by default,
	    lexicon_url: type 'lexicon' for 'welcome/ajax/lexicon.json',
	    post_url: type 'update'(default) for 'welcome/ajax/update',
	    target: type 'content' for '<div id='content'>, 'target' by default,
	    templates: type 'templates' for 'welcome/views/templates.html',
	    esc_back: enable history.back() when 'ESC' key pressed,
	    routes: [ ['Route1', opts], ['Route2', opts], ... ], opts see in 'add_route'
	    selector: this hyperlinks will be redirect to javascript, 'a.web2spa' is default
	***/
	/*** Global vars & objects: ***/
	//$scope - controller data
	//$userId, $Admin - each ajax request set this vars
	$route = {};	// {title, ajaxurl, templateId, controller, login_req, target, targetEl}
	$request = {};	/*** keys:
	    args:[], vars:{}, url, path, query:var1=value1&var2=value2..., (url=path/arg1/arg2/../argn+&+query),
	    json: if true(default), request will be e.g. 'welcome/ajax/func.json',
	    clearpath: if true, args and vars not added to url,
	    type: default GET,
	    unescape: if true, data will be as is; by default all data escaped,
	    animate: show 'loading.gif' while ajax go on,
	    data: send to server
	***/
	// !!! important: urls or url's parts in settings object must be without slashes
	this.app = settings.app;    // e.g. 'welcome'
	this.mainctrl = settings.mainctrl||'default';  // dafault 'default'
	this.mainpage = settings.mainpage||'index';  // default 'index'
	this.root_path = '/%s/%s/'.format(this.app,this.mainctrl);       // e.g. '/welcome/default/'
	this.start_path = '%s%s/'.format(this.root_path,this.mainpage);	// e.g. '/welcome/default/index/'
	this.static_path = '/%s/static/'.format(this.app);               // e.g. '/welcome/static/'
	this.ajax_path = '/%s/%s/'.format(this.app,settings.ajaxctrl||'ajax');	// e.g. '/welcome/ajax/'
	this.post_url = settings.post_url||'update';	// form POST url request, e.g. 'update' become '/welcome/ajax/update/'
	this.target = settings.target||'target';
	this.targetEl = document.getElementById(this.target);
	//this.body = $('body');
	this.gif = $('div#gif');
	this.msg_div = $("div.flash");
	this.$clrp = 'panel-primary';	// shortcuts for bootstrap panel color classes
	this.$clrs = 'panel-success';
	this.$clri = 'panel-info';
	this.$clrw = 'panel-warning';
	this.$clrd = 'panel-danger';
	if (settings.esc_back) document.onkeydown = function(e)	{   // enable history.back() when 'ESC' key pressed
	    if (e.keyCode == 27) { history.back(); return false; }  // escape key code check
	}
	var self = this;    // for use inside jQuery functions, were 'this' changed
	if (settings.lexicon_url) this.lexicon = this.load(settings.lexicon_url, {unescape:true});
	$(function() {	// waiting full application loading
	    if (settings.templates) self.add_pack(self.load(settings.templates, {unescape:true, json:false}));
	    $.each(settings.routes, function () { self.add_route(this); });
	    //console.info(self);
	    /*** add custom live events ***/
	    $('body').on('click', settings.selector||'a.web2spa', {add:true}, self.ajax_nav);
	    $('body').on('click', 'a[href*="default\/user"]', function(e){  // here begin spikes :(, ajax auth implementation is very bent
		e.data = {url:$(this).attr('href'), add:true, no_vars:true};
		if (e.data.url.indexOf('logout')==-1) self.ajax_nav(e);  // all 'user/...' function performed via ajax, but not 'logout'
	    });
	    window.addEventListener("popstate", function(e) { e.data={url:self.get_url()}; self.ajax_nav(e) });
	    if (typeof callback == 'function') callback();	    // performing user defined actions
	    self.navigate();	//*** START APPLICATION ***, get url from browser location bar by default
	});
    },

    ajax_nav: function(e)  { e.preventDefault(); /*e.stopPropagation();*/ web2spa.navigate(e.data.url || $(this).attr('href'), e.data); /*return false;*/ },

    get_url: function() { return location.pathname + location.search; },

    get_ajax_url: function(ajaxurl, params) {
	params = params || $request;
	var url = '';
	var json = params.json === false ? '' : '.json';
	if (!params.clearpath) {
	    for(var i in params.args) url += '/' + params.args[i];
	    if (!$.isEmptyObject(params.vars)) url += '?' + $.param(params.vars);
	}
	return this.ajax_path + ajaxurl + json + url;
    },

    loadHTML: function(ajaxurl) {
	$scope = this.load(ajaxurl, {json:false, unescape:true});
	if ($scope) $route.targetEl.innerHTML = $scope;
    },

    load: function(ajaxurl, params) {    /*** Ajax sync Load  ***/
	ajaxurl = ajaxurl || $route.ajaxurl;
	params = params || {};
	$.extend(params, $request);
	//if (params.animate) this.body.addClass('loading');
	var out, self = this;
	$.ajax({
	    url: this.get_ajax_url(ajaxurl, params),
	    type: params.type || 'GET',
	    async: false,
	    data: params.data,
	    processData: false,
	    contentType: false,
	    dataFilter: params.unescape ? undefined : function(data) { return data.escapeHTML(); },
	    beforeSend: function() { if (params.animate) self.gif.show(); },
	    success: function(data, textStatus, jqXHR) {
		out=data;
		//console.info(out);
		$userId=parseInt(jqXHR.getResponseHeader('User-Id'));  // userId = NaN or > 0
		$Admin=Boolean(jqXHR.getResponseHeader('Admin'));   // if user has membership 'administrator'
	    },
	    error: function(jqXHR, txt, obj) {
		console.warn(jqXHR); console.warn(txt); console.warn(obj);
		self.raise_error(jqXHR.status, txt);
		out = false;
	    },
	    complete: function() { /*self.body.removeClass('loading');*/ self.gif.hide(); }
	});
	return out;
    },

    /*** Router ***/
    routes: {},
    login_path: '',
    login_request: function(next) { return this.login_path + 'login?_next=' + (next || this.start_path); },
    raise_error: function (s, txt) {  // status: 401 - UNAUTHORIZED; 403 - FORBIDDEN; 404 - NOT FOUND
	this.navigate((s==401) ? this.login_request() : this.error_path + '%s/%s'.format(s, txt || ''));
    },
    add_route: function(args) {
    /***  add route, path=name.toLowerCase, templateId=name+Tmpl, controller=name+Ctrl
	opts is:
	    index=true: path is empty, e.g. 'welcome/default/index:'
	    index=false:  path=controller, e.g. 'welcome/default/index:lorem'; option is default
	    master=true: is a individual server controller function: e.g. 'welcome/default:restore' or 'welcome/default:user'
	    master=false: uses controller function defined in opts.page (or mainpage, if opts.page is empty): e.g. 'welcome/default/index:ipsum',
		in so doing perform calling 'welcome/default/index' function, after that perform JS IpsumCtrl(); option is default
	    ctrl: server controller for this route, mainctrl if empty
	    page: server function for this route, mainpage if empty
	    login_req=true: will be redirect to login path, if not authorized
	    login_path=true: this route is login path pluralistically
	    error_path=true: this route is used for error handling, master=true for this, so e.g. 'welcome/default:error'
    ***/
	var title = args[0], opts = args[1] || {};
	var lowtitle = title.toLowerCase();
	var ctrl = opts.index ? '' : lowtitle;
	var path = '%s/%s'.format(this.app,opts.ctrl||this.mainctrl);
	if (opts.error_path) opts.master = true;
	if (!opts.master) path += '/%s'.format(opts.page||this.mainpage);
	var route = path+':'+ctrl;
	var target = opts.target || this.target;
	this.routes[route] = {
	    title: title,
	    ajaxurl: lowtitle,
	    templateId: title+'Tmpl',
	    controller: window[title+'Ctrl'],
	    login_req: opts.login_req,
	    target: target,
	    targetEl: document.getElementById(target)
	}
	if (opts.login_path) this.login_path = '/%s/%s/'.format(path,ctrl);
	if (opts.error_path) this.error_path = '/%s/%s/'.format(path,ctrl);
	if (opts.shortcuts) {
	    path = path.split('/');
	    title = '';
	    for(var i=0; i<path.length-1; i++) {
		title += path[i] + '/';
		this.routes[title.clearSlashes()+':'+ctrl] = this.routes[route];
	    }
	}
    },
    navigate: function(url, params) {
	url = url || this.get_url();
	params = params || {};
	url = decodeURIComponent(url);
	//console.info(url)
	var parts = url.splitOnce('?');
	var request = {vars:{}, path:parts[0].clearSlashes(), query:''};
	//console.warn(request);
	for(var i in this.routes) {
	    var rt = i.split(':');
	    var re = request.path.match("^"+rt[0]+"(\.*)");
	    if (re) {
		request.args = re[1].clearSlashes().split('/');
		var ctrl = request.args.shift();
		if (ctrl == rt[1]) {
		    $route = this.routes[i];
		    if (parts.length > 1 && !params.no_vars) {  // variables exist
			request.query = parts[1];
			$.each(request.query.split('&'), function() { re=this.splitOnce('='); request.vars[re[0]]=re[1]; });
		    }
		    if ($route.login_req && !$userId) this.navigate(this.login_request(url));
		    else {
			if (params.add) { history.pushState(null, null, url); }
			request.url = url;
			$request = request;
			//console.info($request);
			$route.controller();
		    }
		    break; // if route found
		}
	    }
	}
    },
    /* end Router */

    /*** Simple JavaScript Templating John Resig ================= http://ejohn.org/ - MIT Licensed ***/
    /*** we must to build monument him, while he alive :) ***/
    // prefer use "" in templates, be careful with included quotes!
    cache: {},
    render_set: [[/[\r\t\n]/g, " "],[/<%/g, "\t"],[/((^|%>)[^\t]*)'/g, "$1\r"],[/\t=(.*?)%>/g, "',$1,'"],[/\t/g, "');"],[/%>/g, "p.push('"],[/\r/g, "\\'"]],
    min_set: [[/<!--[\s\S]*?-->/g,'']/*remove comments*/,[/\s*([=;<>(){}\[\]&|])\s*/g,'$1'],[/\s*(<%|%>)\s*/g,'$1']/*whitespaces*/],
    add: function(id, str) {
	str = str.replace_set(this.min_set).replace_set(this.render_set);
	//str = str.replace_set(this.min_set).replace(/[\r\t\n]/g, " ").split("<%").join("\t").replace(/((^|%>)[^\t]*)'/g, "$1\r").replace(/\t=(.*?)%>/g, "',$1,'").split("\t").join("');").split("%>").join("p.push('").split("\r").join("\\'");
	//console.log(str);
	this.cache[id] = new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str + "');}return p.join('');");
    },
    add_pack: function(pack) {
	//console.time("tmpl");
	pack = $(pack).filter('script');
	var self = this;
	$.each(pack, function(){ self.add(this.id, this.text); });
	//console.timeEnd("tmpl");
	//console.info(this.cache.CrossTmpl);
    },
    render: function (o){    // render to element
	o = o || {};
	o.id = o.id || $route.templateId;
	var El = o.target ? document.getElementById(o.target) : $route.targetEl,
	    st = this._render(o);
	if (o.append)  El.insertAdjacentHTML('beforeend', st);	// add rendering to element
	else {
	    El.innerHTML = st;
	    document.title = (o.title || $route.title).unescapeHTML();
	}
    },
    _render: function (o) {     // render to string
	var id = o.id;
	if (!this.cache[id]) this.add(id, document.getElementById(id).innerHTML);   // try search template in current html document, if not found in cache
	return (typeof this.cache[id] == 'function') ? this.cache[id](o.data || {}) : '';
    },
    load_and_render: function(cb) {
	$scope = this.load();
	if ($scope) web2spa.render(typeof cb == 'function' ? cb() : {});
    },
    /* end Resig template system */

    /*** web2py flash message Helper ***/
    hide_msg: function() { this.msg_div.slideUp().html(''); },
    show_msg: function(msg, status, delay) {
	status = typeof status !== 'undefined' ? status : 'success';
	delay = typeof delay !== 'undefined' ? delay : 5000;
	this.msg_div.html('<button type="button" class="close" aria-hidden="true">&times;</button>' + msg);
	var color;
	switch (status) {
	    case 'danger': color = '#fbb'; break;   // red
	    case 'default': color = '#eee'; break;  // grey
	    case 'success': color = '#bfb'; break;  // green
	    default: color = '#bfb';	// grey
	}
	this.msg_div.css({'background-color':color});
	if (delay) this.msg_div.slideDown().delay(delay).slideUp();
	else this.msg_div.slideDown();
    }
}
/* end web2spa */

//================================================
/*** Class: Form, performs form setup actions ***/
    /* constructor, usage: var form = new Form(hS, hC);
    hS - form submit handler
    hC - input change handler - callback, will be performed, when any input changing occured */
function Form(hS, hC) {
    this.panel = $('div.panel').filter(':first');
    this.form = this.panel.find('form');
    this.chaintable = $("#chaintable");
    this.cache = {};     // use own data cache for ajax request
    this.inputfirst = this.form.find("input:text:visible:first");
    this.inputfirst.focus();
    this.hC = hC;
    this.inputs = {};
    this.inputstext = this.form.find('input[type!=checkbox][name]').on('input', {form:this}, $inputChange); // .on('input change', ...
    this.inputscheckbox = this.form.find('input:checkbox[name]').on('change', {form:this}, $inputChange);
    if (typeof hS == 'function') this.form.submit(hS);	// register hS function as submit
}

/*** Form.post - add formname, formkey, send formData to server via ajax(POST), flash status result; ***/
Form.prototype.post = function(form) {
    //console.log(form);
    var reply = {};
    if ($scope.formkey && $userId) {	// if form security information exist and user is authorized
	var formData = new FormData(form);
	formData.append('user', $userId);
	formData.append('formname', $scope.formname);
	formData.append('formkey', $scope.formkey);
	if ($scope.formData) for(var fd in $scope.formData) formData.append(fd, $scope.formData[fd]);
	//var xhr = new XMLHttpRequest();
	//xhr.open('POST', get_ajax_url('update'), false);    // false - ajax operation is synchronous, we must be sure db is updated
	//xhr.onload = function(event) { if(event.target.status == 200) reply = JSON.parse(xhr.responseText); }
	////xhr.onerror = function() { console.log('error');	}   // ?
	//xhr.send(formData);
	reply = web2spa.load(web2spa.post_url, {data:formData, type:'POST', animate:form && form.name=='upload'});
    } else {
	reply.details = 'Security error!';
	reply.status = false;
	reply.location = web2spa.start_path;
    }
    if (reply) {
	web2spa.show_msg(reply.details, reply.status ? 'success' : 'danger');
	if (reply.location) web2spa.navigate(reply.location, {add:true}); else history.back();
    }
    return false;
}

// emulate input change handler run, fill all inputs fields
Form.prototype.init = function() { this.inputfirst.trigger('input'); }

var $inputChange = function(event) {
    var El = $(this);
    var form = event.data.form;    // retrieve object 'this'
    form.inputstext.each(function() { form.inputs[this.name] = this.value; });
    form.inputscheckbox.each(function() { form.inputs[this.name] = Number(this.checked); });
    //console.info(form.inputs);
    if (El.hasClass('delete')) {
	var del = form.inputs.delete;
	form.panel.removeClass(del ? web2spa.$clrp : web2spa.$clrd);
	form.panel.addClass(del ? web2spa.$clrd : web2spa.$clrp);
    }
    if (typeof form.hC == 'function') form.hC(event, El);
    return false;
}
/* end form class */

//======================================
/*** log Helper  ***/
function log(msg) { console.log(msg); }

//======================================
/*** String Helpers  ***/
String.prototype.escapeHTML = function() { return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\"/g,'&quot;'); }
String.prototype.unescapeHTML = function() { return this.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"'); }
String.prototype.clearSlashes = function() { return this.replace(/\/$/, '').replace(/^\//, ''); }
String.prototype.format = function() {	// or use javascript embedded expression format: `string1${arg1}string2${arg2}string3`
    var newStr = this, i = 0;
    while (/%s/.test(newStr)) newStr = newStr.replace("%s", arguments[i++]);
    return newStr;
}
String.prototype.splitOnce = function(dt) {
  var pos = this.indexOf(dt);
  return (pos >=0 ) ? [this.substr(0, pos), this.substr(pos+dt.length)] : [this];
}
String.prototype.replace_set = function(set) {	// replace by array of regex rules
    var newStr = this;
    for(var i in set) newStr = newStr.replace(set[i][0], set[i][1]);
    return newStr;
};
//======================================
