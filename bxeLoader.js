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

/*
 * mozileLoader V0.46
 *
 * Loads mozile for a page if in a Geiko browser. This is the only javascript
 * file that a user needs to explicitly include in a page. This shields Mozile
 * from IE. Ultimately it would only load Mozile if it wasn't already loaded
 * locally - though perhaps it would always load "mozileModify" or "per page"
 * customization mechanism.
 *
 * Method: http://devedge.netscape.com/viewsource/2002/browser-detection/
 *
 * POST04:
 * - if mozile installed => only load mozileModify.js?
 * - make work for more than XHTML (document.documentElement insert?)/ use name spaces?
 * - distinguish old Geiko browsers (once tested to see which have 
 * problems)
 * - if IE:
 *   - put up msg to upgrade to Geiko based browser
 *   - load IE toolbar
 */
 
 const BXE_VERSION = "0.1alpha"
mozile_js_files = new Array();
mozile_js_files.push("mozWrappers.js");
mozile_js_files.push("eDOM.js");
mozile_js_files.push("jsdav.js");
mozile_js_files.push("td/webdav.js");
mozile_js_files.push("widget.js");


mozile_js_files.push("eDOMXHTML.js");
mozile_js_files.push("bxeNodeElements.js");

mozile_js_files.push("bxeXMLDocument.js");

mozile_js_files.push("domlevel3.js");
mozile_js_files.push("mozCE.js");
mozile_js_files.push("mozIECE.js");
mozile_js_files.push("mozilekb.js");
mozile_js_files.push("bxehtmltb.js");
mozile_js_files.push("mozileModify.js");
mozile_js_files.push("mozClipboard.js");
mozile_js_files.push("eDOMEvents.js");
mozile_js_files.push("xsltTransformer.js");


mozile_js_files.push("bxeFunctions.js");

var mozile_root_dir = "./";
var bxe_xmlfile = "test.xml";
// Detect Gecko but exclude Safari (for now); for now, only support XHTML


function bxe_globals() {}

bxe_globals.prototype.loadXML = function(xmlfile) {
	
	
	var td = new BXE_TransportDriver_webdav();
	function callback (e) {
		e.target.td.Docu.xmldoc =  e.target.responseXML;
		e.target.td.Docu.xmldoc.insertIntoHTMLDocument()
	}
	td.Docu = this;
	td.load(xmlfile,callback);

	return true;
}
function foobar() {
	
	
}

function bxe_nsResolver (node) {
	this.metaTagNSResolver = null;
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
	//prefix not found
	return null;
}






if((navigator.product == 'Gecko') && (navigator.userAgent.indexOf("Safari") == -1))
{
	// navigator.productSub > '20020801' (test to see what the date should be)

	// POST04: if document.documentElement != HTML then ... or no "head" ...
	var head = document.getElementsByTagName("head")[0];

	if(head)
	{
		// get the location of this script and reuse it for the others
		for(var i=0; i<head.childNodes.length; i++)
		{
			var mozileLoaderRE = /(.*)mozileLoader.js$/;
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
			if (mozile_js_files[i] == "widget.js") {
				scr.onload = widget_loaded;
			}
			
			scr.setAttribute("src", src);
			
			scr.setAttribute("language","JavaScript");
			head.appendChild(scr);
		}
		//when last include src is loaded, call onload handler
		scr.onload = mozile_loaded;
		
	}
	else
		alert("*** ALERT: MozileLoader only works in XHTML - load Mozile JS explicitly in XML files");
}
function widget_loaded() {
	bxe_about_box = new Widget_AboutBox();
	bxe_about_box.draw();
	bxe_about_box.setText("Loading files ...");
}

function mozile_loaded() {
	bxe_about_box.addText("Scripts loaded ...");
	document.eDOMaddEventListener("toggleSourceMode",toggleSourceMode_bxe,false);
	document.eDOMaddEventListener("toggleTagMode",toggleTagMode_bxe,false);
	document.eDOMaddEventListener("toggleNormalMode",toggleNormalMode_bxe,false);
	document.eDOMaddEventListener("DocumentSave",__bxeSave,false);
	document.eDOMaddEventListener("ToggleTextClass",toggleTextClass_bxe,false);
	document.eDOMaddEventListener("changeLinesContainer",changeLinesContainer_bxe,false);
	bxe_about_box.addText("Load XML ...");
	bxe_globals = new bxe_globals();
	bxe_globals.loadXML(bxe_xmlfile);
//	document.addEventListener("click",onClick,false);
	bla = document.createElement("div");
	bla.setAttribute("name","bxe_AreaHolder");
	bla.appendChild(document.createTextNode("blabla"));
	document.getElementsByTagName("body")[0].appendChild(bla);
}




function bxe_not_yet_implemented() {
	alert("not yet implemented");
}
	

