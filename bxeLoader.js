/* ***** BEGIN LICENSE BLOCK *****
* Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
* Full Terms at http://mozile.mozdev.org/license.html
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is Playsophy code.
*
* The Initial Developer of the Original Code is Playsophy
* Portions created by the Initial Developer are Copyright (C) 2002-2003
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
*
* ***** END LICENSE BLOCK ***** */

const BXE_VERSION = "0.1alpha"
mozile_js_files = new Array();

mozile_js_files.push("mozile/mozWrappers.js");
mozile_js_files.push("js/widget.js");

mozile_js_files.push("mozile/eDOM.js");
mozile_js_files.push("js/bxeConfig.js");
mozile_js_files.push("mozile/eDOMXHTML.js");
mozile_js_files.push("js/bxeXMLNode.js");
mozile_js_files.push("js/bxeNodeElements.js");
mozile_js_files.push("js/bxeXMLDocument.js");
mozile_js_files.push("td/http.js");
mozile_js_files.push("mozile/domlevel3.js");
mozile_js_files.push("mozile/mozCE.js");
mozile_js_files.push("mozile/mozIECE.js");
//mozile_js_files.push("mozile/mozileModify.js");
mozile_js_files.push("js/eDOMEvents.js");
mozile_js_files.push("js/bxeFunctions.js");


var mozile_root_dir = "./";

// some global vars, no need to change them
var mozile_corescript_loaded = 0;
var mozile_script_loaded = 0;
var bxe_config = new Object();
var bxe_about_box = null;
var bxe_format_list = null;
var bxe_context_menu = null;
var bxe_delayedUpdate = false;
var eDOM_bxe_mode = true; 

function bxe_start(config_file,fromUrl, configArray) {

	/*if (! (BX_checkUnsupportedBrowsers())) {
		return false;
	}*/
	
	if((navigator.product == 'Gecko') && (navigator.userAgent.indexOf("Safari") == -1))
	{
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
			alert("*** ALERT: MozileLoader only works in XHTML - load Mozile JS explicitly in XML files");
		}
	}
	
}

// Detect Gecko but exclude Safari (for now); for now, only support XHTML

function bxe_load_xml (xmlfile) {
	
	
	var td = new BXE_TransportDriver_webdav();
	function callback (e) {
		e.target.td.Docu.xmldoc =  e.target.responseXML;
		bxe_config.xmldoc = e.target.td.Docu.xmldoc;
		e.target.td.Docu.xmldoc.init();
		if (bxe_config.xhtmlfile) {
			e.target.td.Docu.xmldoc.importXHTMLDocument(bxe_config.xhtmlfile)
		} else if (bxe_config.xslfile) {
			e.target.td.Docu.xmldoc.transformToXPathMode(bxe_config.xslfile)
		} else {
			e.target.td.Docu.xmldoc.insertIntoHTMLDocument();
			xml_loaded(e.target.td.Docu.xmldoc);
		}
	
	}
	td.Docu = this;
	td.load(xmlfile,callback);
	
	return true;
}

function widget_loaded() {
	mozile_corescript_loaded++;
	bxe_about_box = new Widget_AboutBox();
	bxe_about_box.draw();
	bxe_about_box.setText("Loading files ...");
	
}

function corescript_loaded() {
	mozile_corescript_loaded++;
	if ( mozile_js_files.length == mozile_corescript_loaded) {
		mozile_core_loaded();
	} else {
		if (bxe_about_box) {
			bxe_about_box.addText(mozile_corescript_loaded );
		}
	}
}

function script_loaded() {
	mozile_script_loaded++;
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
	bxe_about_box.addText("Load XML ...");
	bxe_load_xml(bxe_config.xmlfile);
	
}

function xml_loaded(xmldoc) {
	bxe_about_box.addText("Load RelaxNG ...");
	if (!(bxe_config.validationfile && xmldoc.XMLNode.loadSchema(bxe_config.validationfile,validation_loaded))) {
		bxe_about_box.addText("RelaxNG File was not found");
	}
	document.eDOMaddEventListener("toggleSourceMode",bxe_toggleSourceMode,false);
	document.eDOMaddEventListener("toggleTagMode",bxe_toggleTagMode,false);
	document.eDOMaddEventListener("toggleNormalMode",bxe_toggleNormalMode,false);
	document.eDOMaddEventListener("DocumentSave",__bxeSave,false);
	document.eDOMaddEventListener("ToggleTextClass",bxe_toggleTextClass,false);
	document.eDOMaddEventListener("appendNode",bxe_appendNode,false);
	document.eDOMaddEventListener("InsertLink",bxe_InsertLink,false);
	document.eDOMaddEventListener("InsertTable",bxe_InsertTable,false);
	document.eDOMaddEventListener("InsertImage",bxe_InsertImage,false);
	document.eDOMaddEventListener("OrderedList",bxe_OrderedList,false);
	document.eDOMaddEventListener("UnorderedList",bxe_UnorderedList,false);

	document.eDOMaddEventListener("changeLinesContainer",bxe_changeLinesContainer,false);
	document.eDOMaddEventListener("Exit",bxe_exit,false);
	
	document.eDOMaddEventListener("ClipboardCopy",function(e) { window.getSelection().copy()},false);
	document.eDOMaddEventListener("ClipboardPaste",function(e) { window.getSelection().paste()},false);
	document.eDOMaddEventListener("ClipboardCut",function(e) { window.getSelection().cut()},false);
	
	document.eDOMaddEventListener("Undo",function(e) { bxe_not_yet_implemented()}, false);
	document.eDOMaddEventListener("Redo",function(e) { bxe_not_yet_implemented()}, false);
	document.eDOMaddEventListener("NodeInsertedParent",bxe_NodeInsertedParent, false);
	document.eDOMaddEventListener("NodeInsertedBefore",bxe_NodeInsertedBefore,false);

	
	
	document.addEventListener("contextmenu",bxe_ContextMenuEvent, false);
	
	bxe_context_menu = new Widget_ContextMenu();
}

function validation_loaded(vdom) {
	bxe_about_box.addText("Validation Loaded ...");

	var vali = bxe_config.xmldoc.XMLNode.validateDocument();
	if (vali.isError) {
		bxe_about_box.addText("Document is *not* valid.");
		//alert(vali.getErrorMessagesAsText());
	}
	else {
		bxe_about_box.addText("Document is valid.");
		
	}
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
		var src = mozile_root_dir + bxe_config.scriptfiles[i];
		scr.onload = script_loaded;
		scr.setAttribute("src", src);
		scr.setAttribute("language","JavaScript");
		head.appendChild(scr);
	}

}




