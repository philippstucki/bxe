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
mozile_js_files = new Array();
mozile_js_files.push("eDOM.js");
mozile_js_files.push("eDOMXHTML.js");
mozile_js_files.push("domlevel3.js");
mozile_js_files.push("mozCE.js");
mozile_js_files.push("mozWrappers.js");
mozile_js_files.push("mozIECE.js");
mozile_js_files.push("mozilekb.js");
mozile_js_files.push("bxehtmltb.js");
mozile_js_files.push("mozileModify.js");
mozile_js_files.push("mozClipboard.js");
mozile_js_files.push("widget.js");
mozile_js_files.push("eDOMEvents.js");

var mozile_root_dir = "./";
var bxe_xmlfile = "test.xml";
// Detect Gecko but exclude Safari (for now); for now, only support XHTML


function bxe_globals() {}

bxe_globals.prototype.loadXML = function(xmlfile) {
	
	// make XMLDocument
	this.xmldoc = document.implementation.createDocument("","",null);
	// set onload handler (async = false doesn't work in mozilla AFAIK)
	this.xmldoc.onload = function(e) {e.currentTarget.insertIntoHTMLDocument()};
	//set a reference to the DocumentVDOM, so we can access it in the callback
	this.xmldoc.filename = xmlfile;
	// load schema file
	this.xmldoc.load(xmlfile);
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

XMLDocument.prototype.insertIntoHTMLDocument = function() {
	
	//var nsResolver = this.createNSResolver(this.documentElement);
	var nsResolver = new bxe_nsResolver(this.documentElement);
	
	
	var nodes = bxe_getAllEditableAreas();
	
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].removeAllChildren();
		var xpath = nodes[i].getAttribute("bxe_xpath");
		var xmlresult = document.evaluate(xpath, this.documentElement, nsResolver, 0, null);
		if (document.defaultView.getComputedStyle(nodes[i], null).getPropertyValue("display") == "inline") { 
			var bxe_areaHolder = document.createElement("span");
			nodes[i].display = "inline";
		} else {
			var bxe_areaHolder = document.createElement("div");
			nodes[i].display = "block";
		}
		bxe_areaHolder.setAttribute("name","bxe_areaHolder");
		nodes[i].parentNode.insertBefore(bxe_areaHolder,nodes[i]);
		bxe_areaHolder.appendChild(nodes[i]);
		while (xmlnode = xmlresult.iterateNext()) {
			
			if (xmlnode.nodeType == 1) {
				nodes[i].xmlNode = xmlnode;
				
				xmlnode.insertIntoHTMLDocument(nodes[i],true);
			} else {
				nodes[i].xmlNode = xmlnode.parentNode;
				xmlnode.insertIntoHTMLDocument(nodes[i]);
			}
			nodes[i].XPath = nodes[i].xmlNode.getXPathString();
			var menu = new Widget_AreaInfo(nodes[i]);
			bxe_alignAreaNode(menu,nodes[i]);
			nodes[i].AreaInfo = menu;
			menu.editableArea = nodes[i];
		}
		
	}
	
	// make menubar
	var menubar = new Widget_MenuBar();
	var img = document.createElement("img");
	img.setAttribute("src","bxe.png");
	
	//imgspan.appendChild(img);
	img.setAttribute("align","right");
	menubar.node.appendChild(img);
	var submenu = new Array("Save",function() {alert("hello")},"Load","load");
	menubar.addMenu("File",submenu);

	var submenu = new Array("Undo",bxe_not_yet_implemented,"Redo",bxe_not_yet_implemented);
	menubar.addMenu("Edit",submenu);
	

	menubar.draw();
	
	//make toolbar
	
	var toolbar = new Widget_ToolBar();
	var menulist = new Widget_MenuList("m",function(e) {eDOMEventCall("changeLinesContainer",document,this.value)});
	menulist.appendItem("H1","h1");
	menulist.appendItem("bar","foo");
	menulist.appendItem("blbla","foo");
	toolbar.addItem(menulist);
	
	
	toolbar.addButtons(buttons);
	

	
	

	
	
	//var button = new Widget_ToolBarButton("italic",1,2);
	//alert(toolbar.node.saveXML(toolbar.node));
	//toolbar.addItem(button);
	
	toolbar.draw();
	
	
	
	
}
function bxe_getAllEditableAreas() {
	
	var result = document.evaluate("/html/body//*[@bxe_xpath]", document.documentElement,null, 0, null);
	var node = null;
	var nodes = new Array();
	while (node = result.iterateNext()) {
		nodes.push(node);
	}
	return nodes;
}

function bxe_alignAllAreaNodes() {
	var nodes = bxe_getAllEditableAreas();
	for (var i = 0; i < nodes.length; i++) {
		bxe_alignAreaNode(nodes[i].parentNode,nodes[i]);
	}
}

function bxe_alignAreaNode(menuNode,areaNode) {
	if (areaNode.display == "block") {
		menuNode.position("-8","5");
	} else {
		menuNode.position("0","0");
	}
	menuNode.draw();
  
	
}



Node.prototype.insertIntoHTMLDocument = function(htmlnode,onlyChildren) {
	
	var walker = document.createTreeWalker(
	 this,NodeFilter.SHOW_ALL,
	{
		acceptNode : function(node) {
			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);
	if(onlyChildren) {
		var node = walker.nextNode();
	} else {
		var node = this;
	}
	do  {
			if (node.parentNode && node.parentNode.nodeType == 1 && node.parentNode.htmlNode) {
				parentN = node.parentNode.htmlNode;
			} else {
				parentN = htmlnode;
			}
			if (node.nodeType == 1 ) {
				dump (node.namespaceURI + "\n");
				if (node.namespaceURI == "http://www.w3.org/1999/xhtml") {
					var newElement = document.createElement(node.localName);
					newElement.xmlNodeName = node.localName;
				} else {
					var newElement = document.createElement("span");
					newElement.setAttribute("class",node.localName);
					newElement.xmlNodeName = node.localName;
				}
				if (node.hasAttributes()) {
					var attribs = node.attributes;
					for (var i = 0; i < attribs.length; i++) {
						if (attribs[i].namespaceURI != "http://www.w3.org/2000/xmlns/") {
						   newElement.setAttributeNode(attribs[i]);
						}
					}
				}
					
				newElement.xmlNamespaceURI = node.namespaceURI;
				var newNode = parentN.appendChild(newElement);
			} else {
				var newNode = parentN.appendChild(document.importNode(node,true));
			}
			newNode.xmlNode = node;
			node.htmlNode = newNode;
			if (this.nodeType == 3) {
				return;
			}
	}  while(node = walker.nextNode() );
}


function bxe_load(xmlfile) {
	
	// make XMLDocument
	this.xmldoc = document.implementation.createDocument("","",null);
	// set onload handler (async = false doesn't work in mozilla AFAIK)
	this.xmldoc.onload = function(e) {e.currentTarget.DocumentVDOM.parseSchema();};
	//set a reference to the DocumentVDOM, so we can access it in the callback
	this.xmldoc.DocumentVDOM = this;
	this.filename = file;
	// load schema file
	this.xmldoc.load(file);
	
	return true;
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
function onClick(e) {
	if (e.target.nodeType == 1) {
	//e.target.getXMLInfo();
	}
}



Element.prototype.getXMLInfo = function() {
	
	alert(this.localName + "\n" + this.xmlNamespaceURI + "\n" + this.xmlNodeName);
}



function BX_debug(object)
{
    var win = window.open("","debug");
	bla = "";
    for (b in object)
    {

        bla += b;
        try {

            bla +=  ": "+object.eval(b) ;
        }
        catch(e)
        {
            bla += ": NOT EVALED";
        };
        bla += "\n";
    }
    win.document.innerHTML = "";

    win.document.writeln("<pre>");
    win.document.writeln(bla);
    win.document.writeln("<hr>");
}


function mozile_loaded() {
  document.eDOMaddEventListener("toggleSourceMode",toggleSourceMode_bxe,false);
  document.eDOMaddEventListener("toggleTagMode",toggleTagMode_bxe,false);
  document.eDOMaddEventListener("toggleNormalMode",toggleNormalMode_bxe,false);
  document.eDOMaddEventListener("DocumentSave",__bxeSave,false);
  document.eDOMaddEventListener("ToggleTextClass",toggleTextClass_bxe,false);
  document.eDOMaddEventListener("changeLinesContainer",changeLinesContainer_bxe,false);
  bxe_globals = new bxe_globals();
  bxe_globals.loadXML(bxe_xmlfile);
  document.addEventListener("click",onClick,false);
  bla = document.createElement("div");
  bla.setAttribute("name","bxe_AreaHolder");
  bla.appendChild(document.createTextNode("blabla"));
  document.getElementsByTagName("body")[0].appendChild(bla);
  
}

function MozEvent() {};

function getDomNodeInsertedEvents(e) {
	
	
}

Element.prototype.cloneNode = function (deep) {
	
	alert("here");
}


function bla (e) {		
	dump("target " + e.target);
	dump("\n");
	dump("nodename " + e.target.localName);
	dump("\n");
	dump("nodecontent " + e.target.getContent());
	dump("\n");
	dump("parentnode " + e.target.parentNode);
	dump("\n");
	dump("parentnodecontent " + e.target.parentNode.getContent());
	dump("\n");
	if (e.target.nodeType == 3) {
		e.target.parentNode.style.backgroundColor = "blue";
	} else {
		e.target.style.backgroundColor = "yellow";
	}
}

function __bxeSave(e) {
	
	var cssr = window.getSelection().getEditableRange();
	if(!cssr)
	{
		alert("*mozileModify.js:mozileSave: this default implementation only works if the current selection is in an editable area");
		return;
	}
	var editableArea = cssr.top;
	var xmldoc = editableArea.convertToXMLDocFrag();
	/*editableArea.xmlNode.removeAllChildren();
	var docfrag = xmldoc.transformToDocumentFragment();
	editableArea.xmlNode.appendChild(docfrag);
	*/
	alert(bxe_globals.xmldoc.saveXML(bxe_globals.xmldoc));
}

Node.prototype.transformToDocumentFragment = function () {
	
	var docfrag = this.ownerDocument.createDocumentFragment();
	var child = this.firstChild;
	var oldchild = null;
	do {
		oldchild = child;
		child = child.nextSibling
		docfrag.appendChild(oldchild);
	} while (child )
	return docfrag;
}

Node.prototype.convertToXMLDocFrag = function () {
	
	this.xmlNode.removeAllChildren();
	var walker = document.createTreeWalker(
		this,
		NodeFilter.SHOW_ALL,
		{
			acceptNode : function(node) {
				return NodeFilter.FILTER_ACCEPT;
			}
		}
		, true);
		
	var node = walker.nextNode();
	do {
	dump("node : " + node.nodeName + "\n");
			var parentN = null;
			if (node.parentNode.xmlNodeNew) {
				parentN = node.parentNode.xmlNodeNew;
			} else {
				parentN = this.xmlNode;
			}
			var newNode = node.convertToXMLNode(document);
			parentN.appendChild(newNode);
			
			var lastChild = null;
			while ( lastChild = newNode.firstChild) {
				newNode = lastChild;
			}
			node.xmlNodeNew = newNode;
	
	} while(node = walker.nextNode() )
	return this.xmlNode;
}

Node.prototype.convertToXMLNode = function(xmldoc) {
	var newElement = null;
	if (this.nodeType == 1 ) {
		if (!this.xmlNamespaceURI) { this.xmlNamespaceURI = null;}
		if (this.localName.toLowerCase() != "span" && (this.namespaceURI == XHTMLNS )) {
			newElement = xmldoc.createElementNS(this.xmlNamespaceURI,this.localName);
		} else {
			var classes = this.getClasses();
			if (classes.length > 0) {
				for (var i = classes.length - 1; i >= 0; i--) {
					if (newElement != null) {
						newElement.appendChild(xmldoc.createElementNS(this.xmlNamespaceURI,classes[i]));
					} else {
						newElement = xmldoc.createElementNS(this.xmlNamespaceURI,classes[i]);
					}
				}
			} else {
				newElement = xmldoc.createElementNS(this.xmlNamespaceURI,this.localName);
			}
		}
		if (this.hasAttributes()) {
			var attribs = this.attributes;
			for (var i = 0; i < attribs.length; i++) {
				if (!(this.namespaceURI != XHTMLNS && attribs[i].localName == "class")) {
					if (attribs[i].localName.substr(0,5) != "_edom") {
						newElement.setAttributeNode(attribs[i]);
					}
				}
			}
		}
		
	} else {
		newElement = this.cloneNode(true);
	}

	return newElement;
}


function toggleTagMode_bxe(e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	var xmldoc = document.implementation.createDocument("","",null);
	
	if (!editableArea._TagMode) {
		createTagNameAttributes(editableArea);
		var x = document.styleSheets[0];
		x.insertRule('#' + editableArea.id + ' *:before {content: attr(_edom_tagnameopen); margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		x.insertRule('#' + editableArea.id + ' *:after {content:  attr(_edom_tagnameclose) ; margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		editableArea.addEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.addEventListener("DOMNodeRemoved",addTagnames_bxe,false);
		editableArea.addEventListener("DOMAttrModified",addTagnames_bxe,false);
		editableArea._TagMode = true;
		editableArea.AreaInfo.TagModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else {
		var walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			true);
		var node =editableArea;
		editableArea.removeEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMAttrModified",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMNodeRemoved",addTagnames_bxe,false);
		
		do {
			node.removeAttribute("_edom_tagnameopen");
			node.removeAttribute("_edom_tagnameclose");
		}while(node =   walker.nextNode() )
		var x = document.styleSheets[0];
		x.deleteRule(x.cssRules.length-1);
		x.deleteRule(x.cssRules.length-1);
		editableArea._TagMode = false;
		editableArea.AreaInfo.TagModeMenu.Checked = false;
		editableArea.AreaInfo.NormalModeMenu.Checked = true;
	}
	}
	catch(e) {alert(e);}

}

function toggleNormalMode_bxe (e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	if (editableArea._TagMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleTagMode");
	}
	editableArea.AreaInfo.NormalModeMenu.Checked = true;
	}
	catch(e) {alert(e);}

}

function addTagnames_bxe (e) {		
	
	e.currentTarget.removeEventListener("DOMAttrModified",addTagnames_bxe,false);
	
	var nodeTarget = e.target; 

	createTagNameAttributes(nodeTarget.parentNode);
	e.currentTarget.addEventListener("DOMAttrModified",addTagnames_bxe,false);
	
}

function createTagNameAttributes(startNode) {
	var xmldoc = startNode.ownerDocument;
	var walker = document.createTreeWalker(
		startNode,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode : function(node) {
				return NodeFilter.FILTER_ACCEPT;
			}
		}
		, true);
		
	var node = walker.nextNode();
	do {
			var parentN = null;
			if (node.parentNode.xmlNodeNew) {
				parentN = node.parentNode.xmlNodeNew;
			} else {
				parentN = startNode.xmlNode;
			}
			var newNode = node.convertToXMLNode(document);
			parentN.removeAllChildren();
			parentN.appendChild(newNode);
			
			var lastChild = newNode;
			while ( lastChild.firstChild) {
				lastChild = lastChild.firstChild;
			}
			//node.xmlNodeNew = lastChild;
			lastChild.appendChild(xmldoc.createTextNode("::"));
			var xmlstring = xmldoc.saveChildrenXML(parentN,true).split("::");
			node.setAttribute("_edom_tagnameopen", xmlstring[0]);
			node.setAttribute("_edom_tagnameclose", xmlstring[1]);
			node.xmlNodeNew = lastChild;
	} while(node = walker.nextNode() )
	
	/*var xmldoc = document.implementation.createDocument("","",null);
	var walker = document.createTreeWalker(
	startNode, NodeFilter.SHOW_ELEMENT,
	null, 
	true);
	var node = walker.nextNode();
	do {
		var foo = node.convertToXMLNode(xmldoc);
		var lastChild = foo;
		while ( lastChild.firstChild) {
			lastChild = lastChild.firstChild;
		}
		lastChild.appendChild(xmldoc.createTextNode("::"));
		var xmlstring = xmldoc.saveXML(foo).split("::");
		node.setAttribute("_edom_tagnameopen", xmlstring[0]);
		node.setAttribute("_edom_tagnameclose", xmlstring[1]);
	} while(node = walker.nextNode() )*/
	
}

function toggleSourceMode_bxe(e) {
	try {
	var editableArea = e.target;

	if (editableArea._TagMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleTagMode");
	}
	if (!editableArea._SourceMode) {
		var xmldoc = editableArea.convertToXMLDocFrag();
		editableArea.removeAllChildren();
		editableArea.setStyle("white-space","-moz-pre-wrap");
		editableArea.appendChild(document.createTextNode(document.saveChildrenXML(xmldoc,true)));
		editableArea._SourceMode = true;
		editableArea.AreaInfo.SourceModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else { 
		var innerhtmlValue = documentLoadXML('<'+editableArea.xmlNode.localName+' xmlns="' + editableArea.xmlNode.namespaceURI +'">'+editableArea.getContent()+'</'+editableArea.xmlNode.localName+'>');
		if (innerhtmlValue) {
			editableArea.removeAllChildren();
			innerhtmlValue.documentElement.insertIntoHTMLDocument(editableArea,true);
			editableArea.setStyle("white-space",null);
			editableArea._SourceMode = false;
			editableArea.AreaInfo.SourceModeMenu.Checked = false;
			editableArea.AreaInfo.NormalModeMenu.Checked = true;
		}
	}
	}
	catch (e) {alert(e);}

}

Node.prototype.getXPathString = function() {
	
	var prevSibling = this;
	var position = 1;
	var xpathstring = "";
	if (this.parentNode.nodeType == 1) {
		xpathstring = this.parentNode.getXPathString() ;
	}
	if (this.nodeType == 3 ) {
		xpathstring += "/text()";
	}
	else {
		while (prevSibling = prevSibling.previousSibling) {
			if (prevSibling.nodeName == this.nodeName) {
				position++;
			}
		}
		xpathstring += "/" + this.nodeName +"[" + position + "]";
	}
	return xpathstring;
}

Element.prototype.getCStyle = function(style) {
	return document.defaultView.getComputedStyle(this, null).getPropertyValue(style);
}

function bxe_not_yet_implemented() {
	alert("not yet implemented");
}
	
function toggleTextClass_bxe(e) {
	window.getSelection().toggleTextClass(e.additionalInfo);
}

function changeLinesContainer_bxe(e) {
	window.getSelection().changeLinesContainer(e.additionalInfo);
}

