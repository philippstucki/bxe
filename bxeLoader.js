// +----------------------------------------------------------------------+
// | Bitflux Editor                                                       |
// +----------------------------------------------------------------------+
// | Copyright (c) 2003 Bitflux GmbH                                      |
// +----------------------------------------------------------------------+
// | This software is published under the terms of the Apache Software    |
// | License a copy of which has been included with this distribution in  |
// | the LICENSE file and is available through the web at                 |
// | http://bitflux.ch/editor/license.html                                |
// +----------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>                        |
// +----------------------------------------------------------------------+
//
// $Id$

var BXE_VERSION = "0.9.6-dev";
var BXE_BUILD = "200409031016"
var BXE_REVISION = "$Rev$".replace(/\$Rev: ([0-9]+) \$/,"r$1");

var bxe_notSupportedText = "Bitflux Editor only works with Mozilla >= 1.4 / Firefox on any platform. \nCurrently we recommend Mozilla 1.6 or Firefox 0.8.";

if (window.location.protocol == "file:" || window.location.host.match(/localhost.*/)) {
	var DebugOutput = false;
} else {
	var DebugOutput = false;
}

mozile_js_files = new Array();

mozile_js_files.push("mozile/mozWrappers.js");
mozile_js_files.push("js/widget.js");

mozile_js_files.push("mozile/eDOM.js");
mozile_js_files.push("js/bxeConfig.js");
mozile_js_files.push("mozile/eDOMXHTML.js");
mozile_js_files.push("js/bxeXMLNode.js");
mozile_js_files.push("js/bxeNodeElements.js");
mozile_js_files.push("js/bxeXMLDocument.js");
mozile_js_files.push("mozile/mozileTransportDriver.js");
mozile_js_files.push("mozile/td/http.js");
mozile_js_files.push("mozile/domlevel3.js");
mozile_js_files.push("mozile/mozCE.js");
mozile_js_files.push("mozile/mozIECE.js");
//mozile_js_files.push("mozile/mozileModify.js");
mozile_js_files.push("js/eDOMEvents.js");
mozile_js_files.push("js/bxeFunctions.js");


var mozile_root_dir = "./";

// some global vars, no need to change them
var mozile_corescript_loaded = 0;
var bxe_plugin_script_loaded_counter  = 0;
var mozile_script_loaded = 0;
var bxe_config = new Object();
var bxe_about_box = null;
var bxe_format_list = null;
var bxe_context_menu = null;
var bxe_delayedUpdate = false;
var eDOM_bxe_mode = true; 
var bxe_editable_page = true;
var bxe_lastSavedXML = null;
var startTimer = new Date();

function bxe_start(config_file,fromUrl, configArray) {
	
	/*if (! (BX_checkUnsupportedBrowsers())) {
		return false;
	}*/
	if((navigator.product == 'Gecko') && (navigator.userAgent.indexOf("Safari") == -1))
	{
		if ( !bxe_checkSupportedBrowsers()) {
			alert(bxe_notSupportedText + "\n" + "If you think, your browser does meet this criteria, please report it to bx-editor-dev@lists.bitflux.ch")
		}
		// navigator.productSub > '20020801' (test to see what the date should be)
		
		// POST04: if document.documentElement != HTML then ... or no "head" ...
		var head = document.getElementsByTagName("head")[0];
		bxe_config.file = config_file;
		bxe_config.fromUrl = fromUrl;
		bxe_config.configArray = configArray;
		if(head)
		{
			// get the location of this script and reuse it for the others
			for(var i=0; i<head.childNodes.length; i++)
			{
				var mozileLoaderRE = /(.*)bxeLoader.js$/;
				if(head.childNodes[i].localName == "SCRIPT")
				{
					var src = head.childNodes[i].src;
					var result = mozileLoaderRE.exec(src);
					if(result)
					{
						mozile_root_dir = result[1];
						break;
					}
				}
			}
			for (var i=0; i < mozile_js_files.length; i++) 
			{
				var scr = document.createElementNS("http://www.w3.org/1999/xhtml","script");
				var src = mozile_root_dir + mozile_js_files[i];
				if (mozile_js_files[i] == "js/widget.js") {
					scr.onload = widget_loaded;
				} else {
					scr.onload = corescript_loaded;
				}
				scr.setAttribute("src", src);
				scr.setAttribute("language","JavaScript");
				head.appendChild(scr);
			}
			//when last include src is loaded, call onload handler
			
		}
		else {
			alert("*** ALERT: MozileLoader only works in (X)HTML - load Mozile JS explicitly in XML files");
		}
	} else {
		alert (bxe_notSupportedText);
	}
	
	
}

function bxe_saveOnPart(evt) { 
	var xmlstr = bxe_getXmlDocument();
	if (bxe_editable_page && xmlstr && xmlstr != bxe_lastSavedXML) {
		if (confirm('You have unsaved changes. Do you want to save before leaving the page?\n Click Cancel for leaving the page and not saving \n Click Ok for leaving the page and saving')) {
			eDOMEventCall("DocumentSave",document);
		}
	}
}


function bxe_checkSupportedBrowsers() {
	var mozillaRvVersion = navigator.userAgent.match(/rv:([[0-9a-z\.]*)/)[1];
	var mozillaRvVersionInt = parseFloat(mozillaRvVersion);

	if (mozillaRvVersionInt >= 1.4) {
		if (bxe_bug248172_check()) {
			alert ("You are using a Mozilla release with a broken XMLSerializer implementation.\n SAVE (and others) WILL NOT WORK!\nMozilla 1.7.x and Firefox 0.9.x are known to have this bug.\n Please up- or downgrade.");
		}
		//register beforeOnload handler
        if (mozillaRvVersionInt > 1.6) {
			window.onbeforeunload = bxe_saveOnPart;
        } else {
            window.addEventListener( 'unload', bxe_saveOnPart, false);
        };
		return true;
		
		
	}
	return false;
}
/*
* broken xml serializer. see
* http://bugzilla.mozilla.org/show_bug.cgi?id=248172
*/
function bxe_bug248172_check() {
	parser = new DOMParser();
	serializer = new XMLSerializer();

	parsedTree = parser.parseFromString('<xhtml:html xmlns:xhtml="http://www.w3.org/1999/xhtml"/>','text/xml');
	resultStr = serializer.serializeToString(parsedTree);
	if (resultStr.match(/xmlns:xhtml/)) {
		return false;
	} else {
		return true;
	}
	
}


function bxe_load_xml (xmlfile) {
	
	
	var td = new mozileTransportDriver("webdav");
	function callback (e) {
		if (e.isError) {
			alert("Error loading xml file \n"+e.statusText);
			return false;
		}
		var xmldoc =  e.document;
		bxe_config.xmldoc = xmldoc;
		xmldoc.init();
		if (bxe_config.xhtmlfile) {
			xmldoc.importXHTMLDocument(bxe_config.xhtmlfile)
		} else if (bxe_config.xslfile) {
			xmldoc.transformToXPathMode(bxe_config.xslfile)
		} else {
			xmldoc.insertIntoHTMLDocument();
			xml_loaded(xmldoc);
		}
	
	}
	td.load(xmlfile,callback);
	
	return true;
}

function widget_loaded(e) {
	bxe_about_box = new Widget_AboutBox();
	bxe_about_box.draw();
	bxe_about_box.setText("Loading files ...");
	corescript_loaded(e);
	
}

function corescript_loaded(e) {
	mozile_corescript_loaded++;
	debug("from core script " + mozile_corescript_loaded + " of " + mozile_js_files.length  + "loaded: " + e.currentTarget.src);
	if ( mozile_js_files.length == mozile_corescript_loaded) {
		debug("call mozile_core_loaded()");
		mozile_core_loaded();
	} else {
		if (bxe_about_box) {
			bxe_about_box.addText(mozile_corescript_loaded );
		}
	}
}


function bxe_plugin_script_loaded(e) {
	bxe_plugin_script_loaded_counter++;
	if ( bxe_plugin_scripts.length == bxe_plugin_script_loaded_counter ) {
		bxe_init_plugins();
	} else {
		//bxe_about_box.addText(bxe_plugin_script_loaded_counter );
	}
}

function script_loaded(e) {
	mozile_script_loaded++;
	debug("from config script " + mozile_script_loaded + " loaded: " + e.currentTarget.src );
	if ( bxe_config.scriptfiles.length == mozile_script_loaded ) {
		mozile_loaded();
	} else {
		bxe_about_box.addText(mozile_script_loaded );
	}
}

function mozile_core_loaded() {
	bxe_about_box.addText("Scripts loaded ...");
	bxe_about_box.addText("Load Config ");
	try {
		bxe_config = new bxeConfig(bxe_config.file, bxe_config.fromUrl, bxe_config.configArray);
	} catch (e) {
		bxe_catch_alert(e);
	}
}

function mozile_loaded() {
	defaultContainerName = "p";
	bxe_load_plugins();
	bxe_about_box.addText("Load XML ...");
	
	
	bxe_load_xml(bxe_config.xmlfile);
	//k_init();
}

function bxe_load_plugins() {
	var ps = bxe_config.getPlugins();
	
	if (ps.length > 0) {
		bxe_about_box.addText("Load Plugins");
		bxe_plugin_scripts = new Array();
		var head = document.getElementsByTagName("head")[0];
		for (var i = 0; i < ps.length; i++) {
			var p = eval ("new Bxe" + ps[i]);
			// load css
			var css = p.getCss();
			for (var i=0; i < css.length; i++) {
				var scr = document.createElementNS(XHTMLNS,"link");
				scr.setAttribute("type","text/css");
				scr.setAttribute("rel","stylesheet");
				if (css[i].substring(0,1) == "/" || css[i].indexOf("://") > 0) {
					var src = css[i];
				} else {
					var src = mozile_root_dir +css[i];
				}
				scr.setAttribute("href",src);
				head.appendChild(scr);
			}
			
			var js = p.getScripts();
			for (var i=0; i < js.length; i++) 
			{
				bxe_plugin_scripts.push(mozile_root_dir +js[i]);
			}
			
		}
		// load scripts
		for (var i = 0; i < bxe_plugin_scripts.length; i++) {
				var scr = document.createElementNS("http://www.w3.org/1999/xhtml","script");
				scr.setAttribute("src", bxe_plugin_scripts[i]);
				scr.setAttribute("language","JavaScript");
				scr.onload = bxe_plugin_script_loaded;
				head.appendChild(scr);
		}
	}
	
}

function bxe_init_plugins () {
	var ps = bxe_config.getPlugins();
	
	if (ps.length > 0) {
		for (var i = 0; i < ps.length; i++) {
			var p = eval ("new Bxe" + ps[i]);
			p.init(bxe_config.getPluginOptions(ps[i]));
		}
	}
	bxe_about_box.addText("Plugins initialized");
}

function xml_loaded(xmldoc) {
	bxe_about_box.addText("Load RelaxNG " + bxe_config.validationfile + " ");
	if (!(bxe_config.validationfile && xmldoc.XMLNode.loadSchema(bxe_config.validationfile,validation_loaded))) {
		bxe_about_box.addText("RelaxNG File was not found");
	}
	bxe_history_snapshot();
	document.eDOMaddEventListener("toggleSourceMode",bxe_toggleSourceMode,false);
	document.eDOMaddEventListener("toggleTagMode",bxe_toggleTagMode,false);
	document.eDOMaddEventListener("toggleNormalMode",bxe_toggleNormalMode,false);
	document.eDOMaddEventListener("DocumentSave",__bxeSave,false);
	document.eDOMaddEventListener("ToggleTextClass",bxe_toggleTextClass,false);
	document.eDOMaddEventListener("appendNode",bxe_appendNode,false);
	document.eDOMaddEventListener("appendChildNode",bxe_appendChildNode,false);
	document.eDOMaddEventListener("InsertLink",bxe_InsertLink,false);
	document.eDOMaddEventListener("DeleteLink",bxe_DeleteLink,false);
	document.eDOMaddEventListener("CleanInline",bxe_CleanInline,false);
	document.eDOMaddEventListener("InsertTable",bxe_InsertTable,false);
	document.eDOMaddEventListener("InsertImage",bxe_InsertObject,false);
	document.eDOMaddEventListener("InsertAsset",bxe_InsertAsset,false);
	document.eDOMaddEventListener("OrderedList",bxe_OrderedList,false);
	document.eDOMaddEventListener("UnorderedList",bxe_UnorderedList,false);

	document.eDOMaddEventListener("changeLinesContainer",bxe_changeLinesContainer,false);
	document.eDOMaddEventListener("Exit",bxe_exit,false);
	
	document.eDOMaddEventListener("ClipboardCopy",function(e) { window.getSelection().copy()},false);
	document.eDOMaddEventListener("ClipboardPaste",function(e) { window.getSelection().paste()},false);
	document.eDOMaddEventListener("ClipboardCut",function(e) { window.getSelection().cut()},false);
	
	document.eDOMaddEventListener("Undo",function(e) { bxe_history_undo()}, false);
	document.eDOMaddEventListener("Redo",function(e) { bxe_history_redo()}, false);

	//document.eDOMaddEventListener("NodeInsertedParent",bxe_NodeInsertedParent, false);
	document.eDOMaddEventListener("NodeInsertedBefore",bxe_NodeInsertedBefore,false);
	document.eDOMaddEventListener("NodeBeforeDelete",bxe_NodeBeforeDelete,false);
	/*document.eDOMaddEventListener("NodeChanged",bxe_NodeChanged,false);
	
	document.eDOMaddEventListener("NodeRemovedChildOnly",bxe_NodeRemovedChildOnly,false);
	*/
	//document.eDOMaddEventListener("NodeAppendedChild",bxe_NodeAppendedChild,false);
	document.eDOMaddEventListener("NodePositionChanged",bxe_NodePositionChanged,false);
	
	document.eDOMaddEventListener("ContextPopup",bxe_ContextPopup,false);
	document.addEventListener("contextmenu",bxe_ContextMenuEvent, false);
	bxe_context_menu = new Widget_ContextMenu();
	
}

function validation_loaded(vdom) {
	bxe_about_box.addText("Validation Loaded ...");

	var vali = bxe_config.xmldoc.XMLNode.validateDocument();
	if (!vali) {
		bxe_about_box.addText("Document is *not* valid.");
		//alert(vali.getErrorMessagesAsText());
		bxe_disableEditablePage();
	}
	else {
		bxe_about_box.addText("Document is valid.");
		bxe_lastSavedXML = bxe_getXmlDocument();
	}
	var endTimer = new Date();
	debug ("startTime: " + startTimer);
	debug ("endTime  : " + endTimer);
	dump ("Total Start Time: " + (endTimer - startTimer)/1000 + " sec\n"); 
}

function config_loaded(bxe_config_in) {
	bxe_about_box.addText("& Parsed ...");

	bxe_config = bxe_config_in;
	var head = document.getElementsByTagName("head")[0];
	for (var i=0; i < bxe_config.cssfiles.length; i++) 
	{
		var scr = document.createElementNS(XHTMLNS,"link");
		scr.setAttribute("type","text/css");
		scr.setAttribute("rel","stylesheet");
		scr.setAttribute("href",bxe_config.cssfiles[i]);
		head.appendChild(scr);
	}
	
	for (var i=0; i < bxe_config.scriptfiles.length; i++) 
	{
		var scr = document.createElementNS("http://www.w3.org/1999/xhtml","script");
		if (bxe_config.scriptfiles[i].substr(0,1) == "/") {
			var src = bxe_config.scriptfiles[i];
		} else {
			var src = mozile_root_dir + bxe_config.scriptfiles[i];
		}
		scr.onload = script_loaded;
		scr.setAttribute("src", src);
		scr.setAttribute("language","JavaScript");
		head.appendChild(scr);
	}
}

debug = function (text, options) {
	
	if (DebugOutput) {
		
		fn =  bxe_getCaller(debug);

		dump( fn.getName() +  ": " + text + "\n");
		if (options) {
			
			if (options.evalArguments) {
				var fname= fn.getName();
					dump("  Arguments: (");
					for (var i = 0; i < fn.arguments.length; i++) {
						dump("[" + typeof fn.arguments[i] + "] "); 
						switch( typeof( fn.arguments[i] )) {
							case "function":
								dump (fn.arguments[i].getName());
								break;
							case "string":
								dump('"' + fn.arguments[i] + '"');
								break;
							default: 
								dump(fn.arguments[i]);
						}
						if (i < fn.arguments.length - 1 ) {
							dump(", ");
						}
					}
					dump (")\n");
				
			}
			
			if (options.callstack) {
				var callstack =  new Array();
				dump ("  Callstack: \n");
				dump ("  ----------\n");
				while (fn) {
					
					callstack.unshift(fn.getName() + "\n");
					var newfn = JsUtil_getCaller(fn);
					if (fn == newfn) {
						callstack.unshift ("  [javascript recursion]\n");
						break;
					}
					fn = newfn;
				}
				for (var i = 0; i < callstack.length; i++) {
					dump("  " +i +": " +callstack[i]);
				}
				dump ("  ----------\n");
				
			}

		}

	}
}

Function.prototype.getName = function () {
	var r = /function (\w*)([^\{\}]*\))/
	var s = new String( this);
	var m = s.match( r );
	if (m) {
		var f = "";
		if (m[1]) {
			f = m[1];
		} else {
			r = /var id = "(.+)"/;
			var n = s.match(r);
			if (n && n[1]) {
				f = n[1];
			} else {
				f = "anoynmous function";
			}
		}
		var args = m[2];
		return (f+args);
	} else {
		return "anonymous function";
	}
}

function bxe_getCaller( fn )
{
	switch( typeof( fn ))
	{
		case "undefined":
			return bxe_getCaller( bxe_getCaller );
			
		case "function":
			if( fn.caller )
				return fn.caller;
			if( fn.arguments && fn.arguments.caller )
				return fn.arguments.caller;
	}
	return undefined;
}

