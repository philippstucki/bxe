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
// $Id: bxeNodeElements.js,v 1.37 2004/01/19 16:41:47 chregu Exp $

Node.prototype.insertIntoHTMLDocument = function(htmlnode,onlyChildren) {
	alert("Node.prototype.insertIntoHTMLDocument is deprecated");
	return;
	var walker = document.createTreeWalker(
	 this,NodeFilter.SHOW_ALL,
	{
		acceptNode : function(node) {
			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);
	var node;
	
	if(onlyChildren) {
		node = walker.nextNode();
	} else {
		node = this;
	}
	var firstChild = false;
	do  {
			var newNode;
			if (node.parentNode && node.parentNode.nodeType == 1 && node.parentNode.htmlNode) {
				parentN = node.parentNode.htmlNode;
			} else {
				parentN = htmlnode;
			}
			if (node.nodeType == 1 ) {
				var newElement = null;
				if (node.namespaceURI ==  XHTMLNS) {
					newElement = document.createElement(node.localName);
					newElement.XMLNode.localName = node.localName;
					// prevent open links
					if (node.localName.toLowerCase() == "a") {
						newElement.onclick = function(e) {e.preventDefault(); }
						newElement.onmousedown = function(e) {e.preventDefault(); }
						newElement.onmouseup = function(e) {e.preventDefault(); }
					}
					
				} else {
					newElement = document.createElement("span");
					newElement.setAttribute("class",node.localName);
					newElement.XMLNode.localName = node.localName;
					
				}
				if (! node.hasChildNodes() ) {
						var xmlstring = node.getBeforeAndAfterString(false,true);
						newElement.setAttribute("_edom_tagnameopen",xmlstring[0]);
				}
				if (node.hasAttributes()) {
					var attribs = node.attributes;
					for (var i = 0; i < attribs.length; i++) {
						if (attribs[i].namespaceURI != "http://www.w3.org/2000/xmlns/") {
						   newElement.setAttributeNode(attribs[i]);
						}
					}
				}
				if (!firstChild) {
					firstChild = newElement;
				}
				newElement.XMLNode.namespaceURI = node.namespaceURI;
				newNode = parentN.appendChild(newElement);
			} else {
				newNode = parentN.appendChild(document.importNode(node,true));
			}
			newNode.XMLNode.setNode(node);
			node.htmlNode = newNode;
			if (this.nodeType == 3) {
				return;
			}
			node = walker.nextNode()
	}  while(node );
	return firstChild;
}



Node.prototype.transformToDocumentFragment = function () {
	
	var docfrag = this.ownerDocument.createDocumentFragment();
	var child = this.firstChild;
	var oldchild = null;
	alert(this);
	do {
		oldchild = child;
		child = child.nextSibling
		docfrag.appendChild(oldchild);
	} while (child )
	return docfrag;
}

Node.prototype.convertToXMLDocFrag = function () {
	return  this.XMLNode.buildXML();
}

Node.prototype.convertToXMLNode = function(xmldoc) {
	alert("Node.convertToXMLNode is deprecated? please report to chregu@bitflux.ch that this method is stilll used somewhere");
	return false;
}

Node.prototype.getNamespaceDefinitions = function () {
	
	var node = this;
	var attr;
	var namespaces = new Array();
	while (node.nodeType == 1 ) {
		attr = node.attributes;
		for (var i = 0; i < attr.length; i++) {
			if (attr[i].namespaceURI == XMLNS && !(namespaces[attr[i].localName])) {
				namespaces[attr[i].localName] = attr[i].value;
			}
		}
		node = node.parentNode;
	}
	return namespaces;
}



Node.prototype.__defineGetter__(
"XMLNode",
function()
{
	if (this.InternalParentNode) {
		this._XMLNode = this.InternalParentNode.XMLNode;
	}
	else if (!this._XMLNode ) {
		if ( this.nodeType == 1) {
			this._XMLNode = new XMLNodeElement(this);
		} else {
			this._XMLNode = new XMLNode(this);
		}
	}
	
	return this._XMLNode;
}	
);

Node.prototype.__defineSetter__(
	"XMLNode",
	function(node)
	{
		this._XMLNode = node;
	}
);
/*
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
		prevSibling = prevSibling.previousSibling
		while (prevSibling ) {
			if (prevSibling.nodeName == this.nodeName) {
				position++;
			}
			prevSibling = prevSibling.previousSibling
		}
		xpathstring += "/" + this.nodeName +"[" + position + "]";
	}
	return xpathstring;
}
*/
Element.prototype.getCStyle = function(style) {
	return document.defaultView.getComputedStyle(this, null).getPropertyValue(style);
}

Element.prototype.SplitClasses = function() {
	var newElement = null;
	if (this.localName.toLowerCase() == "span" && (this.namespaceURI == null ) && this.getAttribute("class")) {
		var classes = this.getClasses();
		if (classes.length > 1) {
			for (var i = classes.length - 1; i >= 0; i--) {
				if (newElement != null) {
					var newSpan = document.createElement("span");
					newSpan.setAttribute("class",classes[i]);
					newElement.appendChild(newSpan);
					
				} else {
					newElement = document.createElement("span");
					newElement.setAttribute("class",classes[i]);
				}
				
			}
			newSpan.appendAllChildren(this);
			this.parentNode.replaceChild(newElement,this);
		}
	}
	
}

Element.prototype.getBeforeAndAfterString = function (hasChildNodes, noParent) {
	
	var lastChild = this;
	while ( lastChild.firstChild) {
			lastChild = lastChild.firstChild;
	}
	var xmlstring;
	try {
		if (hasChildNodes == false) {
			xmlstring = new Array();
			if (noParent) {
				xmlstring[0] = this.ownerDocument.saveXML(this);
			} else {
				xmlstring[0] = this.ownerDocument.saveChildrenXML(this,true).str;
			}
			xmlstring[1] = null;
		} else {
			lastChild.appendChild(this.ownerDocument.createTextNode("::"));
			xmlstring = this.ownerDocument.saveChildrenXML(this,true).str.split("::");
		}
	} catch(e) {
		xmlstring = new Array();
		xmlstring[0] = this.ownerDocument.saveChildrenXML(this,true).str;
		xmlstring[1] = null;
	}
	xmlstring[2] = lastChild;

	return xmlstring;
	
}

Node.prototype.initXMLNode = function () {
	if (this.nodeType == 1 ) {
		this.XMLNode = new XMLNodeElement(this) ;
	} else {
		this.XMLNode = new XMLNode(this);
	}
	return this.XMLNode;
	
}

Node.prototype.__defineGetter__ ( 
	"previousNotInternalSibling",
	function () {
		var prev = this.previousSibling;
		while (prev) {
			if(prev.nodeType != 1 || ! prev.hasAttribute("_edom_internal_node")) {
				return prev;
			}
			prev = prev.previousSibling;
		}
		return null;
	}
)

Node.prototype.__defineGetter__ ( 
	"nextNotInternalSibling",
	function () {
		var next = this.nextSibling;
		while (next) {
			if(next.nodeType != 1  || ! next.hasAttribute("_edom_internal_node")) {
				return next;
			}
			next = next.nextSibling;
		}
		return null;
	}
)
Node.prototype.__defineGetter__ ( 
	"firstNotInternalChild",
	function () {
		var first = this.firstChild;
		while (first) {
			if(first.nodeType != 1  || ! first.hasAttribute("_edom_internal_node")) {
				return first;
			}
			first = first.nextSibling;
		}
		return null;
	}
)

Node.prototype.updateXMLNode = function (force) {
	if (this.nodeType == 1 && !this.userModifiable && this.hasChildren) {
		return;
	}
	if (this._XMLNode && this.XMLNode.xmlBridge) {
		var firstChild = this.firstNotInternalChild;
		if (firstChild) {
			this.XMLNode.firstChild = firstChild.XMLNode;
			return firstChild.updateXMLNode(force);}
		else { 
			this.XMLNode.firstChild = null;
			return ;
		}
	}

		
	if (this.parentNode && !this.parentNode._XMLNode ) {
		return this.parentNode.updateXMLNode(force);
	}
	if (this.nodeType == 3) {
		this.normalize();
	}
	var prev = this.previousNotInternalSibling;
	if (prev ) {
		if (!prev._XMLNode ) {
			prev.updateXMLNode(force);
		}
		this.XMLNode.previousSibling = prev.XMLNode;
		prev.XMLNode.nextSibling = this.XMLNode;
	} else {
		this.XMLNode.previousSibling = null;
	}
	var next = this.nextNotInternalSibling;
	if (next ) {
		
		if (!next._XMLNode || force) {
			next.updateXMLNode(force);
		}
		
		this.XMLNode.nextSibling = next.XMLNode;
		next.XMLNode.previousSibling = this.XMLNode;
	} else {
		this.XMLNode.nextSibling = null;
	}
	if (this.parentNode  && this.parentNode.XMLNode) {
		
		this.XMLNode.parentNode = this.parentNode.XMLNode;
	}
	if (!this.XMLNode.nextSibling && this.XMLNode.parentNode) {
		this.XMLNode.parentNode.lastChild = this.XMLNode;
	}
	if (!this.XMLNode.previousSibling && this.XMLNode.parentNode) {
		this.XMLNode.parentNode.firstChild = this.XMLNode;
	}
	this.XMLNode._node = this

	if (this.nodeType == 1 && this.hasAttribute("__bxe_ns")) {
		this.XMLNode.namespaceURI = this.getAttribute("__bxe_ns");
	}
	var child = this.firstNotInternalChild;
	if (child) {
		
		while (child) {
			child.updateXMLNode(force);
			child = child.nextNotInternalSibling;
		}
	}

}

Node.prototype.getXPathResult = function(xpath) {
	
	var nsRes = this.ownerDocument.createNSResolver(this.ownerDocument.documentElement);
	return this.ownerDocument.evaluate(xpath, this,nsRes, 0, null);
}


Node.prototype.getXPathFirst = function(xpath) {
	
	var res = this.getXPathResult(xpath);
	return res.iterateNext();
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
}

/* mmmh, the same as in insertIntoHTML methods of XMLNode
    not that smart to have both ways...
	but    
	 node.prepareForInsert();
	 node.updateXML();
	seems to work quite well for this here.
	
	Maybe some stuff from XMLNode, could use this here..
*/

Node.prototype.prepareForInsert = function(onlyChildren) {
	var walker = document.createTreeWalker(
	 this,NodeFilter.SHOW_ALL,
	{
		acceptNode : function(node) {
			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);
	var node;
	if(onlyChildren) {
		node = walker.nextNode();
	} else {
		node = this;
		
	}
	var firstChild = false;
	do  {
			var newNode;
	

			newNode = node.makeHTMLNode();

			if (!firstChild) {
				firstChild = newNode;
			}
			if (node.parentNode && node.parentNode.newNode) {
				node.parentNode.newNode.appendChild(newNode);
			}
			node.newNode = newNode;

			node = walker.nextNode();
			
	}  while(node );
	return firstChild;
}

Node.prototype.makeHTMLNode = function () {
	var _node;
	if (this.nodeType == 1) {
		_node = this.createNS(this.namespaceURI, this.attributes);
	} else if (this.nodeType == 3 ) {
		_node = this.createNS(this.data);
	}
	else if (this.nodeType == 9 ) { // Node.XMLDOCUMENT) {
			_node = this.documentElement;
	}
	return _node;	
}

Node.prototype.createNS = function ( namespaceURI, attribs ) {
	return bxe_Node_createNS(this.nodeType, namespaceURI, this.localName, attribs);
}


function bxe_Node_createNS(nodeType, namespaceURI, localName, attribs) {
	var htmlelementname;
	var _node;
	if (nodeType == 1) {
		if (namespaceURI != XHTMLNS) {
			htmlelementname = "span"
			_node = document.createElement(htmlelementname);
			_node.setAttribute("class", localName);
			_node.setAttribute("__bxe_ns",namespaceURI);
		}
		else {
			_node = documentCreateXHTMLElement(localName.toLowerCase(), attribs);
		}
		if (attribs) {
			for (var i = 0; i< attribs.length; i++) {
				_node.setAttributeNS(attribs[i].namespaceURI, attribs[i].localName,attribs[i].value);
			}
		}
	}
	else if (nodeType == 3) {
		_node = document.createTextNode(namespaceURI);
	}
	return _node;
	
}
