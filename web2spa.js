/*** Single Page Application approach for web2py framework ***/
var web2spa = {
  // aliases for bootstrap panel color classes
  $clrp: 'panel-primary',
  $clrs: 'panel-success',
  $clri: 'panel-info',
  $clrw: 'panel-warning',
  $clrd: 'panel-danger',
  msg_color: {
    default: '#eee', // grey
    danger: '#fbb', // red
    success: '#bfb' // green
  },
  init: function(opts) {
    /* opts's keys:
        app: application name, e.g. 'welcome',
        mainctrl: default controller, 'default' by default,
        mainpage: default function, 'index' by default,
        api: controller for api request, mainctrl by default,
        lexicon: type 'lexicon' for 'welcome/ajax/lexicon.json',
        post_url: POST form request path; type 'update'(default) for 'welcome/ajax/update',
        target: type 'content' for '<div id='content'>, 'target' by default,
        templates: default 'templates' for 'welcome/static/templates.html',
        post_back: enable automatic history.back() when forms are posted,
        esc_back: enable history.back() when 'ESC' key pressed,
        routes: [ ['Route1', opts], ['Route2', opts], ... ], opts see in 'add_route'
        selector: this hyperlinks will be redirect to javascript calls instead url, 'a.web2spa' is default
        beforeStart: callback perform before application start, but after application load & init
        beforeNavigate: callback perform before route choose
        afterNavigate: callback perform after controller execute
    */
    /*** Global vars & objects: ***/
    $scope = {}; // controller data
    //$userId, $Admin - each ajax request set this vars
    $route = {};	// {title, url, templateId, controller, login_req, target, targetEl}
    $request = {};	/* keys:
        args:[], vars:{}, url, path, query:var1=value1&var2=value2..., (url=path/arg1/arg2/../argn+&+query),
        json: if true(default), request will be e.g. 'welcome/ajax/func.json',
        clearpath: if true, args and vars not added to url,
        type: default GET,
        unescape: if true, data will be as is; by default all data escaped,
        animate: show 'loading.gif' while ajax go on,
        txdata: transmit to server
    */
    // !!! important: urls or url's parts in opts object must be without slashes
    this.app = opts.app;    // e.g. 'welcome'
    this.mega = opts.mega; // 'controller/function' model
    this.mainctrl = opts.mega ? opts.mainctrl||'default' : '';  // main controller or empty
    this.mainpage = opts.mainpage||'index';  // default 'index'
    this.root_path = '/%s/%s/'.format(this.app,this.mainctrl);       // e.g. '/welcome/default/'
    this.start_path = '%s%s/'.format(this.root_path,this.mainpage);	// e.g. '/welcome/default/index/'
    this.static_path = '/%s/static/'.format(this.app);               // e.g. '/welcome/static/'
    this.json_api = opts.json_api; // if server require '.json' ext
    // this.api = '/%s/%s/'.format(this.app,opts.api||this.mainctrl);   // e.g. '/welcome/ajax/'
    this.api = '/%s/%s'.format(this.app, (opts.json_api ? (opts.api||this.mainctrl)+'/' : '')); // e.g. '/welcome/ajax/'
    this.post_url = opts.post_url||'update';	// form POST url request, e.g. 'update' become '/welcome/ajax/update/'
    this.target = opts.target||'target';
    this.targetEl = $('#'+this.target);
    this.gif = $('div#gif');
    this.msg_div = $("div.flash");
    this.msg_box = ($.web2py) ? this.msg_div : this.msg_div.find('span');
    //if (!($.web2py)) $('body').on('click', '.flash', function(e) { $(this).slideUp(); });
    if (!($.web2py)) this.msg_div.click(function() { $(this).slideUp(); });
    this.post_back = opts.post_back;
    this.beforeNavigate = opts.beforeNavigate;
    this.afterNavigate = opts.afterNavigate;
    this.set_title = opts.set_title;
    if (opts.esc_back) document.onkeydown = function(e) {   // enable history.back() when 'ESC' key pressed
        if (e.keyCode == 27) { history.back(); return false; }  // escape key code check
    }
    var self = this, promises = [$.ready];   // waiting document ready
    if (opts.lexicon) {
        this.lexicon = {url:opts.lexicon, unescape:true, data:true};
        promises.push(this.load(this.lexicon));
    }
    if (opts.templates_json) promises.push($.get(this.static_path + opts.templates_json + '.json', function(data) { self.add_json_pack(data); } ));
    else promises.push($.get(this.static_path + (opts.templates || 'templates') + '.html', function(data) { self.add_pack(data); } ));
    this._TMPLS_ = opts._TMPLS_; // convert templates to JSON format, copy from console
    $.when.apply($, promises).always(function() {
        $.each(opts.routes, function () { self.add_route(this); });
        /*** add custom live events ***/
        $('body').on('click', opts.selector||'a.web2spa', function(e) { e.data = {url:$(this).attr('href'), add:true}; self.ajax_nav(e); });
        $('body').on('click', 'a[href*="default\/user"]', function(e) {  // here begin spikes :(, ajax auth implementation is very bent
            e.data = {url:$(this).attr('href'), add:true, no_vars:true};
            if (e.data.url.indexOf('logout')==-1) self.ajax_nav(e);  // all 'user/...' function performed via ajax, but not 'logout'
        });
        window.addEventListener("popstate", function(e) { e.data={url:self.get_location()}; self.ajax_nav(e) });
        run(opts.beforeStart);  // performing user defined actions before app start
        self.navigate();	//*** START APPLICATION ***, get url from browser location bar by default
    });
  },

  ajax_nav: function(e)  { e.preventDefault(); /*e.stopPropagation();*/ this.navigate(e.data.url, e.data); /*return false;*/ },

  get_location: function() { return location.pathname + location.search; },

  loadHTML: function(url) {
    this.load({
      url: url,
      json: false,
      unescape: true,
      onload: function() {
        if ($scope && typeof $scope == 'string') $route.targetEl.html($scope);
      }
    });
  },

  compose_url: function(_url, params) {
      params || (params = $request);
      var url = '';
      var json = (params.json === false || !this.json_api) ? '' : '.json';
      if (!params.clearpath) {
          for(var i in params.args) url += '/' + params.args[i];
          if (!$.isEmptyObject(params.vars)) url += '?' + $.param(params.vars);
      }
      return this.api + _url + json + url;
  },

  load: function(opts) {    /*** Ajax async Load  ***/
      opts || (opts = {});
      opts.args = opts.args || $request.args;
      opts.vars = opts.vars || $request.vars;
      var self = this;
      return $.ajax({
          url: this.compose_url(opts.url || $route.url, opts),
          type: opts.type || 'GET',
          data: opts.txdata,
          processData: false,
          contentType: false,
          dataFilter: opts.unescape ? undefined : function(data) { return data.escapeHTML(); },
          beforeSend: function() { if (opts.animate) self.gif.show(); }
      }).always(function(data, status, xhr) {
          self.gif.hide();
          if (status=='success') {
              $userId=parseInt(xhr.getResponseHeader('User-Id'));  // userId = NaN or > 0
              $Admin=Boolean(xhr.getResponseHeader('Admin'));   // if user has membership 'administrator'
          } else {
              console.warn(data, status, xhr);
              self.raise_error(data.status, status);
              data = false; // substitution data to false, if error
          }
          if (opts.data) opts.data = data;
          else $scope = data;
          if (typeof opts.onload === 'function') opts.onload.call(self, data);
      });
  },

  /*** Router ***/
  routes: {},
  login_path: '',
  login_request: function(next) { return this.login_path + 'login?_next=' + (next || this.start_path); },
  raise_error: function (s, txt) {  // status: 401 - UNAUTHORIZED; 403 - FORBIDDEN; 404 - NOT FOUND
      this.navigate((s==401) ? this.login_request() : this.error_path + '%s/%s'.format(s, txt || ''));
  },
  add_route: function(args) {
  /*  add route, path=name.toLowerCase, templateId=(template or name)+Tmpl, controller=name+Ctrl
      opts is:
          index=true: path is empty, e.g. 'welcome/default/index:'
          index=false:  path=controller, e.g. 'welcome/default/index:lorem'; option is default
          master=true: is a individual server controller function: e.g. 'welcome/default:restore' or 'welcome/default:user'
          master=false: uses controller function defined in opts.page (or mainpage, if opts.page is empty): e.g. 'welcome/default/index:ipsum',
              in so doing perform calling 'welcome/default/index' function, after that perform JS IpsumCtrl(); option is default
          ctrl: server controller for this route, mainctrl if empty
          page: server function for this route, mainpage if empty
          target: id of the html element for content, web2spa.target by default
          template: id of the template, route title by default
          shortcuts: shortcut urls for this route, e.g. 'welcome/default/index', 'welcome/default', 'welcome'
          login_req=true: will be redirect to login path, if not authorized
          login_path=true: this route is login path pluralistically
          error_path=true: this route is used for error handling, master=true for this, so e.g. 'welcome/default:error'
  */
      var title = args[0], opts = args[1] || {};
      var lowtitle = title.toLowerCase();
      var ctrl = opts.index ? '' : lowtitle;
      var path = '%s/%s'.format(this.app,opts.ctrl||this.mainctrl);
      if (opts.error_path) opts.master = true;
      if (!opts.master) path += '/%s'.format(opts.page||this.mainpage);
      var route = (this.mega ? path : this.app) + ':' + ctrl;
      var target = opts.target || this.target;
      this.routes[route] = {
          title: title,
          url: lowtitle,
          templateId: (opts.template||title)+'Tmpl',
          controller: window[title+'Ctrl'],
          login_req: opts.login_req,
          target: target,
          targetEl: $('#'+target)
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
      run(this.beforeNavigate);
      url = url || this.get_location();
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
                      $scope = {};
                      $route.controller();	// START Controller;
                  }
                  break; // if route found
              }
          }
      }
      run(this.afterNavigate);
  },
  /* end Router */

  /*** Simple JavaScript Templating John Resig ================= http://ejohn.org/ - MIT Licensed ***/
  /*** we must to build monument him, while he alive :) ***/
  // prefer use "" in templates, be careful with included quotes!
  cache: {},
  tmpls_json: {},
  render_set: [[/[\r\t\n]/g, " "],[/<%/g, "\t"],[/((^|%>)[^\t]*)'/g, "$1\r"],[/\t=(.*?)%>/g, "',$1,'"],[/\t/g, "');"],[/%>/g, "p.push('"],[/\r/g, "\\'"]],
  min_set: [[/<!--[\s\S]*?-->/g,'']/*remove comments*/,[/\s*([=;<>(){}\[\]&|])\s*/g,'$1'],[/\s*(<%|%>)\s*/g,'$1']/*whitespaces*/],
  add: function(id, str, compile) {
      //str = str.replace_set(this.min_set).replace_set(this.render_set);
      //this.cache[id] = new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" + "with(obj){p.push('" + str + "');}return p.join('');");
      if (compile) str = "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
          str.replace_set(this.min_set).replace_set(this.render_set) +
          "');}return p.join('');";
      this.cache[id] = new Function("obj", str);
      if (this._TMPLS_) this.tmpls_json[id] = str;
  },
  add_pack: function(pack) {
      //console.time('compile');
      pack = $(pack).filter('script');
      var self = this;
      $.each(pack, function(){ self.add(this.id, this.text, true); });
      //console.timeEnd('compile');
      if (self._TMPLS_) {
          this.tmpls_json = JSON.stringify(this.tmpls_json);
          console.log(this.tmpls_json);
      }
  },
  add_json_pack: function(pack) { for(var id in pack) this.add(id, pack[id]); },
  render: function(_o) {
    /** render object to element:
    reserved keys:
      templateId - template id in cache or html
      targetEl - element id in DOM for rendering into
      append - append or replace content
      doctitle - if exist, rewrite document title
    **/
      _o = _o || $scope;
      _o.templateId = _o.templateId || $route.templateId;
      var El = _o.targetEl ? $('#'+_o.targetEl) : $route.targetEl,
          st = this._render(_o);
      if (_o.append)  El.append(st); // add rendering to element
      else {
        El.html(st); // replace
        if (this.set_title) document.title = (_o.doctitle || $route.title).unescapeHTML();
      }
  },
  _render: function(_o) { // render to string from templates cache
      var id = _o.templateId;
      if (!this.cache[id]) this.add(id, document.getElementById(id).innerHTML, true);   // try search template in current html document, if not found in cache
      return (typeof this.cache[id] === 'function') ? this.cache[id](_o || {}) : '';
  },
  load_and_render: function()	{
    /** arguments:
    [0] - object for template or function that returns such object, $scope accepted if empty
    [1]...[n] - all these functions are performed in the order after template rendering **/
    var args = arguments; // for using in child function
    this.load({onload:function(data){
      if (data) {
        var f = args[0];
        this.render(typeof f === 'function' ? f() : f); // checking first argument - 'onLoad complete' handler or render object
        if (args.length > 1) for (var i=1; i < args.length; i++) run(args[i]); // 'onRender complete' handlers, if exists
      }
    }});
  },
  /* end Resig template system */

  /*** web2py flash message Helper ***/
  hide_msg: function() { this.msg_div.slideUp().html(''); },
  /* message, color(danger), delay(0-infinity) */
  show_msg: function(msg, color, delay) {
      if ($.web2py) msg = '<button type="button" class="close" aria-hidden="true">&times;</button>' + msg;
      this.msg_box.html(msg);
      this.msg_div.css({'background-color': this.msg_color[color] || this.msg_color.danger});
      if (delay) this.msg_div.slideDown().delay(delay*1000).slideUp();
      else this.msg_div.slideDown();
  }
}
/* end web2spa */

//================================================
/*** Prototype: Form, performs form setup actions ***/
    /* constructor, usage: var form = new Form(hS, opts);
    opts is:
      submit - form submit handler
      form - form id; find first form in panel, if empty
      safe - do not send secure form data CSRF to server & no multipart form-data, default 'false'
      action - POST request url
      onpost - on POST request complete handler
      events -
        if function: input change handler - callback, will be performed, when any input changing occured
        if object: key 'event selector', value 'event handler'
    */
function Form(opts) {
    opts = opts || {};
    this.panel = $('div.panel').filter(':first');
    this.form = opts.form ? $('#'+opts.form) : this.panel.find('form');
    this.inputfirst = this.form.find("input:text:visible:first");
    this.inputfirst.focus();
    this.safe = opts.safe;
    this.onpost = opts.onpost;
    //console.log(this.form);
    // individual url for each form || <form id="form" action="action" || common post url
    var act = this.form[0].attributes.action;
    this.post_url = opts.action || (act ? act.value : false) || web2spa.post_url;
    this.inputs = {};
    this.inputstext = this.form.find('input[type!=checkbox][name]').data('this',this).on('input', this.change);
    this.inputscheckbox = this.form.find('input:checkbox[name]').data('this',this).on('change', this.change);
    var self = this,
        hS = opts.submit,
        hC = opts.events;
    if (typeof hS !== 'function') hS = function () { return self.post(this); }
    this.form.submit(hS);	// register submit
    if (typeof hC === 'function') this.hI = hC;
    else if (typeof hC ==='object'){
        $.each(hC, function(k, v) {
            var e = k.splitOnce(' ');
            self.form.find(e[1]).on(e[0], v);
        });
    }
}

Form.prototype = {
    init: function() { this.inputfirst.trigger('input'); },    // emulate input change handler run, fill all inputs fields
    change: function(event) {
        var self = $(this).data('this');	// Form
        self.inputstext.each(function() { self.inputs[this.name] = this.value; });
        self.inputscheckbox.each(function() { self.inputs[this.name] = Number(this.checked); });
        if (this.classList.contains('delete')) {
            var del = self.inputs.delete;
            self.panel.removeClass(del ? web2spa.$clrp : web2spa.$clrd);
            self.panel.addClass(del ? web2spa.$clrd : web2spa.$clrp);
        }
        if (typeof self.hI == 'function') run_hE(self.hI, this, event);
        return false;
    },
    /*** Form.post - add formname, formkey, send formData to server via ajax(POST), flash status result; ***/
    post: function(form) {
        var reply = {},
            promise = true,
            onpost = this.onpost;
        if (this.safe) { // form is non security
          promise = $.post(web2spa.compose_url(this.post_url), $(form).serializeArray())
            .always(function(data, status) {
              reply.data = status==='success' ? data : false;
            });
        } else {
          if ($scope.formkey && $userId) {	// if form security information exist and user is authorized
            reply.txdata = new FormData(form);
            reply.txdata.append('user', $userId);
            reply.txdata.append('formname', $scope.formname);
            reply.txdata.append('formkey', $scope.formkey);
            if ($scope.formData) for(var fd in $scope.formData) reply.txdata.append(fd, $scope.formData[fd]);
            $.extend(reply, {url: this.post_url, type: 'POST', animate: form && form.name=='upload', data: true});
            promise = web2spa.load(reply);
          } else {
            promise = $.Deferred();
            promise.resolve({data: {details:'Security error!', status:false, location:web2spa.start_path}});
          }
        }
        $.when(promise).always(function() {
            if (reply.data) { // reply obj modyfied in web2spa 'load' function
              if (reply.data.show) web2spa.show_msg(reply.data.details, reply.data.status ? 'success' : 'danger', 5);
              if (reply.data.location) web2spa.navigate(reply.data.location, {add:true}); else if (web2spa.post_back) history.back();
              if (typeof onpost === 'function') onpost(reply.data);
            }
        });
        return false;
    }
}
/* end form class */

//======================================
/*** log Helper  ***/
function log() { console.log.apply(console, arguments); }
/*** run Helpers, using: run(function), if no arguments; run.call(function, arguments...) instead. Method 'apply' pass arguments as collection ***/
function run() { if (this === window) { if (typeof arguments[0] === 'function') arguments[0](); } else if (typeof this === 'function') this.apply(window, arguments); }
function run_hE(f, El, event) { if (typeof f === 'function') f.call(El, event); }
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
String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
};
String.prototype.frontZero = function(count) {
    var newStr = this;
    while (newStr.length < count) newStr = '0' + newStr;
    return newStr;
}
//======================================
/*** Prototype: CheckBox, performs set/get data to/from localStorage ***/
    /* constructor, usage: var flag = new CheckBox(id, hC);
    id -checkbox id
    hC - checkbox click event handler
    */
function CheckBox(name, hC) {
    this.name = name;
    this.id = '#' + name;
    this.value = (localStorage[name] == 'true');
    this.init(hC);
}
CheckBox.prototype = {
    init: function(hC, runonce) {
        this.handler = hC;
        var self = this;
        this.El = $(this.id);
        this.El.prop('checked', this.value).off();
        if (hC) {
            this.El.click(function() { self.click(this.checked); });
            if (runonce) this.click(this.value);
        }
    },
    click: function(checked) {
        localStorage[this.name] = checked;
        this.value = checked;
        run.call(this.handler, checked);
    },
    reset_handler: function() { this.handler = null; }
}
//==========================================================
/* Set caret position easily in jQuery. Written by and Copyright of Luke Morton, 2011. Licensed under MIT */
$(function () {
  $.caretTo = function(el, index) {
    if (el.createTextRange) {
      var range = el.createTextRange();
      range.move("character", index);
      range.select();
    } else if (el.selectionStart != null) {
      el.focus();
      el.setSelectionRange(index, index);
    }
  }
  $.caretPos = function(el) { // collects the current caret position for an element
    if ("selection" in document) {
      var range = el.createTextRange();
      try {
        range.setEndPoint("EndToStart", document.selection.createRange());
      } catch (e) {
        return 0; // Catch IE failure here, return 0 like other browsers
      }
      return range.text.length;
    } else if (el.selectionStart != null) return el.selectionStart;
  }
  /* The following methods are queued under fx for more
     flexibility when combining with $.fn.delay() and jQuery effects. */
  $.fn.caret = function(index, offset) { // Set caret to a particular index
    if (typeof(index) === "undefined") return $.caretPos(this.get(0));
    return this.queue(function(next) {
      if (isNaN(index)) {
        var i = $(this).val().indexOf(index);
        if (offset === true) i += index.length;
        else if (typeof(offset) !== "undefined") i += offset;
        $.caretTo(this, i);
      } else $.caretTo(this, index);
      next();
    });
  }
  $.fn.caretToStart = function() { // Set caret to beginning of an element
    return this.caret(0);
  }
  $.fn.caretToEnd = function() { // Set caret to the end of an element
    return this.queue(function(next) {
      $.caretTo(this, $(this).val().length);
      next();
    });
  }
});
