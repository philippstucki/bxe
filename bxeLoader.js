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
mozile_js_files.push("js/bxeNodeElements.js");
mozile_js_files.push("js/bxeXMLDocument.js");
mozile_js_files.push("td/http.js");
mozile_js_files.push("mozile/domlevel3.js");
mozile_js_files.push("mozile/mozCE.js");
mozile_js_files.push("mozile/mozIECE.js");
mozile_js_files.push("mozile/mozileModify.js");
mozile_js_files.push("js/eDOMEvents.js");
mozile_js_files.push("js/bxeFunctions.js");


var mozile_root_dir = "./";

// some global vars, no need to change them
var mozile_corescript_loaded = 0;
var mozile_script_loaded = 0;
var bxe_config = new Object();
var bxe_about_box = null;
var bxe_context_menu = null;

function bxe_start(config_file,fromUrl) {
	
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



function bxe_globals() {}

bxe_globals.prototype.loadXML = function(xmlfile) {
	
	
	var td = new BXE_TransportDriver_webdav();
	function callback (e) {
		e.target.td.Docu.xmldoc =  e.target.responseXML;
		bxe_config.xmldoc = e.target.td.Docu.xmldoc;
		if (bxe_config.xslfile) {
			e.target.td.Docu.xmldoc.transformToXPathMode(bxe_config.xslfile)
		} else {
			e.target.td.Docu.xmldoc.insertIntoHTMLDocument();
		}
		xml_loaded(e);
	}
	td.Docu = this;
	td.load(xmlfile,callback);
	
	return true;
}


function bxe_nsResolver (node) {
	this.metaTagNSResolver = null;
	this.metaTagNSResolverUri = null;
	
	//this.htmlDocNSResolver = null;
	this.xmlDocNSResolver = null;
	this.node = node;
	
	
}

bxe_nsResolver.prototype.lookupNamespaceURI = function (prefix) {
	var url = null;
	// if we never checked for meta bxeNS tags, do it here and save the values in an array for later reusal..
	if (!this.metaTagNSResolver) {
		var metas = document.getElementsByName("bxeNS");
		this.metaTagNSResolver = new Array();
		for (var i=0; i < metas.length; i++) {
			if (metas[i].localName.toLowerCase() == "meta") {
				var ns = metas[i].getAttribute("content").split("=");
				this.metaTagNSResolver[ns[0]] = ns[1]
			}
		}
	}
	//check if the prefix was there and return it
	if (this.metaTagNSResolver[prefix]) {
		return this.metaTagNSResolver[prefix];
	}
	/* there are no namespaces in even xhtml documents (or mozilla discards them somehow or i made a stupid mistake
	therefore no NS-lookup in document. */
	/*
	if (! this.htmlDocNSResolver) {
		this.htmlDocNSResolver = document.createNSResolver(document.documentElement);
	}
	url = this.htmlDocNSResolver.lookupNamespaceURI(prefix);
	if (url) {
		return url;
	}
	*/
	
	//create NSResolver, if not done yet
	if (! this.xmlDocNSResolver) {
		this.xmlDocNSResolver = this.node.ownerDocument.createNSResolver(this.node.ownerDocument.documentElement);
	}
	
	//lookup the prefix
	url = this.xmlDocNSResolver.lookupNamespaceURI(prefix);
	if (url) {
		return url;
	}
	// if still not found and we want the bxe prefix.. return that
	if (prefix == "bxe") {
		return BXENS;
	}
	
	//prefix not found
	return null;
}

bxe_nsResolver.prototype.lookupNamespacePrefix = function (uri) {
	
	if (!this.metaTagNSResolverUri) {
		var metas = document.getElementsByName("bxeNS");
		this.metaTagNSResolverUri = new Array();
		for (var i=0; i < metas.length; i++) {
			if (metas[i].localName.toLowerCase() == "meta") {
				var ns = metas[i].getAttribute("content").split("=");
				this.metaTagNSResolverUri[ns[1]] = ns[0]
			}
		}
	}
	//check if the prefix was there and return it
	if (this.metaTagNSResolverUri[uri]) {
		return this.metaTagNSResolverUri[uri];
	}
	return null;
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
	bxe_about_box.addText("Load Config ...");
	bxe_config = new bxeConfig(bxe_config.file, bxe_config.fromUrl);
}

function mozile_loaded() {
	bxe_about_box.addText("Load XML ...");
	bxe_globals = new bxe_globals();
	bxe_globals.loadXML(bxe_config.xmlfile);

	
}

function xml_loaded(e) {
	bxe_about_box.addText("Load RelaxNG ...");
	e.target.td.Docu.xmldoc.loadSchema(bxe_config.validationfile,validation_loaded);
	document.eDOMaddEventListener("toggleSourceMode",bxe_toggleSourceMode,false);
	document.eDOMaddEventListener("toggleTagMode",bxe_toggleTagMode,false);
	document.eDOMaddEventListener("toggleNormalMode",bxe_toggleNormalMode,false);
	document.eDOMaddEventListener("DocumentSave",__bxeSave,false);
	document.eDOMaddEventListener("ToggleTextClass",bxe_toggleTextClass,false);
	document.eDOMaddEventListener("InsertLink",bxe_InsertLink,false);
		document.eDOMaddEventListener("InsertTable",bxe_InsertTable,false);
	document.eDOMaddEventListener("InsertImage",bxe_InsertImage,false);
	document.eDOMaddEventListener("OrderedList",bxe_UnorderedList,false);
	document.eDOMaddEventListener("UnorderedList",bxe_OrderedList,false);

	document.eDOMaddEventListener("changeLinesContainer",bxe_changeLinesContainer,false);
	
	document.addEventListener("contextmenu",bxe_ContextMenuEvent, false);
	
	bxe_context_menu = new Widget_ContextMenu();
}

function validation_loaded(vdom) {
	bxe_about_box.addText("Validation Loaded ...");
	//dump(bxe_config.xmldoc.vdom.getStructure());
	if (bxe_config.xmldoc.validateDocument()) {
		bxe_about_box.addText("Document is valid.");
	}
	else {
		bxe_about_box.addText("Document is *not* valid.");
	}
}

function config_loaded(bxe_config_in) {
	
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



function bxe_not_yet_implemented() {
	alert("not yet implemented");
}


