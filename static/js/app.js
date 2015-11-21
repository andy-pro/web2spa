/*** Global constants  ***/
// global constants here

web2spa.init(
    {	// application settings, !!! important: urls or url's parts without slashes
    app: 'app',
    lexicon_url: 'lexicon', // lexicon url: 'app/ajax/lexicon.json'
    target: 'apphome',	// main div for content
    templates: 'templates', // templates url: 'app/views/templates.html'
    esc_back: true, // enable history.back() when 'ESC' key pressed
    routes: [
	['Lorem', {index:true, shortcuts:true}],    // urls: 'app/default/index', 'app/default', 'app'; JS controller: LoremCtrl; template: LoremTmpl, index=true means: path is empty, but controller is a string
	['Ipsum'],	// url: 'app/default/index/ipsum'; JS controller: IpsumCtrl; template: IpsumTmpl
	['Dolor'],  // and so on ...
	['Sit', {login_req:true}],    // will be redirect to login path, if not authorized
	['Amet', {login_req:true}],
	['Restore', {master: true, login_req:true}],	// url: 'app/default/restore', because master=true
	['User', {master: true, login_path:true}],  // url: 'app/default/user' and this is login path pluralistically
	['Error', {error_path: true}]]
    },
    function ()	{   // callback, perform after application load & init
	L = web2spa.lexicon;   // L - global shortcut to lexicon
	btnOkCancel = web2spa._render({id:'btnOkCancelTmpl'}), btnBack = L._BTNBACK_;	// helpers, inline templates for common buttons
    }
);
