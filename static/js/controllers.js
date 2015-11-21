/*** ErrorController ***/
function ErrorCtrl() {
    document.title = L._ERROR_;	    // L - global var, containing lexicon
    web2spa.loadHTML();
}
/* end ErrorController */

//======================================
/*** UserController ***/
function UserCtrl() {
    document.title = L[$request.args[0]];   // login, logout, profile, change_password, register, request_reset_password
    $request.json = false;
    web2py_component(web2spa.get_ajax_url($route.ajaxurl), $route.target);	// as $.load, but provide form submit
}
/* end UserController */

//======================================

// next defines for example only!

/*** LoremController ***/
function LoremCtrl() {

    //$scope = web2spa.load();	// all data exchange performed via global object $scope
    //web2spa.render({data:{dataset:$scope.dataset}});

    // this two function we can write shorter:
    web2spa.load_and_render(function() { return {data:{dataset:$scope.dataset}};});
}
/* end LoremController */

//======================================
/*** IpsumController ***/
function IpsumCtrl() {

    showEditor = function() {
        console.log('show editor');
    }

    web2spa.load_and_render(function() { return {title:$scope.address, data:{data:$scope}}; });
    var form = new Form(function() {	// callback, performed at form submit
	$scope.formData = {/* any user vars */};	// use this if you want send custom userdata to server
	return form.post(this);	// this - form context
    });
}
/* end edit pair controller */

//======================================
/*** RestoreController ***/
function RestoreCtrl() {

    function handleFileSelect(e) {
	file = e.target.files[0];
	document.getElementById('prop').innerHTML = file.size + ' bytes, last modified: ' +
	    (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a');
    }

    var file, title, ft = 'csv';
    if ($request.vars.merge) title = L._MERGE_DB_;
    else if ($request.vars.txt) { title = L._IMPORT_; ft = 'txt'; }
    else title = L._RESTORE_;

    web2spa.load_and_render(function() { return {title:title, data:{title:title, hint:`Select ${ft} file`}}; });
    var form = new Form(function() { return file ? form.post(this) : false; }); // restore ctrl
    document.getElementById('upload').addEventListener('change', handleFileSelect, false);
}
/* end RestoreController */

//======================================
//***---------- jQuery extension function ---------------***
$.fn.settofirst = function() { $(':nth-child(1)', this).attr('selected', 'selected'); }

$.fn.settovalue = function(value) { $('[value='+value+']' , this).attr('selected', 'selected'); }
