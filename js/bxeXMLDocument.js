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
// $Id: bxeXMLDocument.js,v 1.31 2003/11/18 21:41:10 chregu Exp $


XMLDocument.prototype.init = function (startNode) {
	if (!startNode) {
		startNode = this.documentElement;
	}
	this.XMLNode = new XMLNodeDocument();
	this.XMLNode._node = this;
	this.XMLNode.nodeType = 9;
	
	return startNode.init();
}

Node.prototype.init = function() {
	var walker = this.ownerDocument.createTreeWalker(
		this,NodeFilter.SHOW_ALL,
	{
		acceptNode : function(node) {			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);

	var node = this;
	var firstChild = false;

	do  {
		if (node.nodeType == 1) {
			node.XMLNode = new XMLNodeElement(node);
		} else {
			node.XMLNode = new XMLNode(node);
		}
		node = walker.nextNode();
	}  while(node );
	
	walker.currentNode = this;
	if (this == this.ownerDocument.documentElement) {
		this.ownerDocument.XMLNode.documentElement = this.ownerDocument.documentElement.XMLNode;
        this.ownerDocument.documentElement.XMLNode.parentNode = this.ownerDocument.XMLNode;
	} else {
	}
	
	node = walker.currentNode;
	do  {

		x = node.XMLNode;
		x.ownerDocument = this.ownerDocument.XMLNode;
		if (node.parentNode) {
			x.parentNode = node.parentNode.XMLNode;
		}
		if (node.previousSibling) {
			x.previousSibling = node.previousSibling.XMLNode;
		}
		if (node.nextSibling) {
			x.nextSibling = node.nextSibling.XMLNode;
		}
		if (node.firstChild) {
			x.firstChild = node.firstChild.XMLNode;
		}
		if (node.lastChild) {
			x.lastChild = node.lastChild.XMLNode;
		}
		x.nodeType = node.nodeType;
		x.prefix = node.prefix;
		node = walker.nextNode();
	}  while(node );
	return this.XMLNode;
/*	var xw = new XMLNodeWalker(this.documentElement.XMLNode.firstChild);
	node = xw.currentNode;
	while (node) {
		
		dump(node + node.localName + "\n");
		node = xw.nextNode();
		
	}*/
	
	
}


XMLDocument.prototype.insertIntoHTMLDocument = function(htmlnode) {

	var nsResolver = new bxe_nsResolver(this.documentElement);

	var nodes = bxe_getAllEditableAreas();
	var bxe_areaHolder;
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].removeAllChildren();
		var xpath = nodes[i].getAttribute("bxe_xpath");
		var xmlresult = this.evaluate(xpath, this.documentElement, nsResolver, 0, null);
		//get first xmlnode
		xmlnode = xmlresult.iterateNext();
		
		//FIXME: if node does not exist in XML document, make it editable anyway...
		if (xmlnode) {
			if (document.defaultView.getComputedStyle(nodes[i], null).getPropertyValue("display") == "inline") { 
				bxe_areaHolder = document.createElement("span");
				nodes[i].display = "inline";
			} else {
				bxe_areaHolder = document.createElement("div");
				nodes[i].display = "block";
			}
			bxe_areaHolder.setAttribute("name","bxe_areaHolder");
			nodes[i].parentNode.insertBefore(bxe_areaHolder,nodes[i]);
			bxe_areaHolder.appendChild(nodes[i]);
			
			var xmlresults = new Array;
			while (xmlnode) {
				xmlresults.push(xmlnode);
				xmlnode = xmlresult.iterateNext();
			}
			for (var j = 0; j < xmlresults.length; j++) {
				//dump ("result node type " + xmlresults[j].nodeType + xmlresults[j].nodeName+ "\n");
				xmlresults[j].XMLNode.xmlBridge = xmlresults[j]; 
				var menu = new Widget_AreaInfo(nodes[i]);
				bxe_alignAreaNode(menu,nodes[i]);
				nodes[i].AreaInfo = menu;
				menu.editableArea = nodes[i];
				
				if (xmlresults[j].nodeType == 1) {
					var fc = xmlresults[j].XMLNode.insertIntoHTMLDocument(nodes[i],true);
					
				} else {
					xmlresults[j].XMLNode.insertIntoHTMLDocument(nodes[i],false);
				}
				menu.MenuPopup.setTitle(xmlresults[j].XMLNode.getXPathString());
				
			}
		} else {
			nodes[i].removeAttribute("bxe_xpath");
			var noticeNode = document.createElementNS(XHTMLNS,"span");
			noticeNode.setAttribute("class","bxe_notice");
			noticeNode.appendChild(document.createTextNode("Node " + xpath + " was not found in the XML document"));
			nodes[i].insertBefore(noticeNode,nodes[i].firstChild);
		}
		
	}
	
	bxe_draw_widgets();
}

XMLDocument.prototype.checkParserError = function()
{
	alert("XMLDocument.prototype.checkParserError is deprecated!");
	return true;
}

XMLDocument.prototype.transformToXPathMode = function(xslfile) {
	bxe_about_box.addText("Load XSLT ...");
	var xsldoc = document.implementation.createDocument("", "", null);
	xsldoc.addEventListener("load", onload_xsl, false);
	xsldoc.xmldoc = this;
	try {
		xsldoc.load(xslfile);
	} catch(e) {
		alert("The xslfile: '" + xslfile + "' was not found");
	}

	function onload_xsl(e) {
		bxe_about_box.addText("XSLT loaded...");
		xsldoc = e.currentTarget;
		var xsltransformdoc = document.implementation.createDocument("", "", null);
		xsltransformdoc.addEventListener("load", onload_xsltransform, false);
		xsltransformdoc.xsldoc = xsldoc;
		xsltransformdoc.load(mozile_root_dir + "xsl/transformxsl.xsl");
	}
	
	function onload_xsltransform (e) {
		var processor = new XSLTProcessor();
		xsltransformdoc = e.currentTarget;
		processor.importStylesheet(xsltransformdoc);
		try {
			var newDocument = processor.transformToDocument(xsltransformdoc.xsldoc);
		}
		catch (e) {
			alert ( e + "\n\n xsltransformdoc.xsldoc is : " + xsltransformdoc.xsldoc);
		}
		processor = new XSLTProcessor();
		try {
			processor.importStylesheet(newDocument);
		} catch(e) {
			alert("Something went wrong during importing the XSLT document.\n" + bxe_catch_alert_message(e) + "\n" + newDocument.saveXML(newDocument));
		}
		var xmldoc = processor.transformToFragment(xsltransformdoc.xsldoc.xmldoc,document);
		var bxe_area = document.getElementById("bxe_area");
		bxe_area.parentNode.replaceChild(xmldoc,bxe_area);
		xsltransformdoc.xsldoc.xmldoc.insertIntoHTMLDocument();
		xml_loaded(xsltransformdoc.xsldoc.xmldoc);
	}
	
}


XMLDocument.prototype.importXHTMLDocument = function(xhtmlfile) {
	
	function onload_xhtml(e) {
		var xhtmldoc = e.currentTarget;
		debug ("XHTML loaded");
		
		bxe_about_box.addText("XHTML loaded...");
		var bxe_area = document.getElementsByTagName("body")[0];
		var bodyInXhtml = xhtmldoc.getElementsByTagName("body");
		if (!(bodyInXhtml && bodyInXhtml.length > 0)) {
			bxe_about_box.addText(" Loading Failed. no 'body' element found in your external XHTML document.");
			alert("no 'body' element found in your external XHTML document. ");
			return false; 
		}
		var new_body = document.importNode(bodyInXhtml[0],true);
		bxe_about_box.node = new_body.appendChild(bxe_about_box.node);
		bxe_area.removeAllChildren();
		bxe_area.appendAllChildren(new_body);
		xhtmldoc.xmldoc.insertIntoHTMLDocument();
		xml_loaded(xhtmldoc.xmldoc);
	}
	
	bxe_about_box.addText("Import external XHTML ...");
	var xhtmldoc = document.implementation.createDocument("", "", null);
	xhtmldoc.addEventListener("load", onload_xhtml, false);
	xhtmldoc.xmldoc = this;
	dump("start loading " + xhtmlfile + "\n");
	try {
		xhtmldoc.load(xhtmlfile);
	} catch(e) {
		alert("The xhtmlfile: '" + xhtmlfile + "' was not found");
	}

	
}



function XMLNodeDocument () {
	
}


XMLNodeDocument.prototype.__defineGetter__( 
	"documentElement",
	function()
	{
		return this._documentElement;
	}
);

XMLNodeDocument.prototype.__defineSetter__( 
	"documentElement",
	function(value)
	{
		this._documentElement = value;
	}
);

XMLNodeDocument.prototype.buildXML = function() {
	
	var node = this.documentElement.buildXML();
	return node.ownerDocument;
}

XMLNode.prototype.buildXML = function () {
	debug("buildXML " + this.localName)
	var nsResolver = new bxe_nsResolver(this.ownerDocument.documentElement);
	
	var walker = new XMLNodeWalker(this);
	var srcNode;
	if (this.xmlBridge) {
		srcNode = this.xmlBridge;
	} else {
		srcNode = this._node;
	}
	
	
	srcNode.removeAllChildren();
	var xmldoc = srcNode.ownerDocument;
	var node = walker.nextNode();
	
	srcNode.XMLNode._sernode = srcNode;
	var child ;
	var attribs;
	while (node) {
		if (node.nodeType == 1 && node.localName != 0){
			child = xmldoc.createElementNS(node.namespaceURI, node.localName);
			if (node.namespaceURI  != XHTMLNS) {
				child.prefix = nsResolver.lookupNamespacePrefix(node.namespaceURI);
			}
			attribs = node.attributes;
			for (var i = 0; i< attribs.length; i++) {
				child.setAttributeNode(attribs[i]);
			}
			if (node.namespaceURI == XHTMLNS && child.getAttribute("class") == node.localName) {
				child.removeAttribute("class");
			}
		} else if (node.nodeType == 3) {
			child = xmldoc.createTextNode(node.data);
		} else {
			child = xmldoc.importNode(node._node.cloneNode(true),true);
		}
		
		node._sernode = child;
		if (node.parentNode && node.parentNode._sernode) {
			try {
				node.parentNode._sernode.appendChild(child);
			} catch(e) {
				debug (child + " could not be appended to " + node.parentNode);
			}
		}
		node = walker.nextNode();
	}
	
	return srcNode;
}


