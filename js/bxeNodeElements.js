Node.prototype.insertIntoHTMLDocument = function(htmlnode,onlyChildren) {
	
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
	//alert(node.ownerDocument.saveXML(node));	
	
	/*this.XMLNode._xmlnode.removeAllChildren();
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
	var lastChild = null;
		
	do {
		var parentN = null;
		if (node.parentNode.XMLNode._xmlnode) {
			parentN = node.parentNode.XMLNode._xmlnode;
		} else {
			parentN = this.XMLNode._xmlnode;
		}
		var newNode = node.convertToXMLNode(document);
		parentN.appendChild(newNode);
		
		lastChild = newNode.firstChild
		while ( lastChild ) {
			newNode = lastChild;
			lastChild = newNode.firstChild;
		}
		node.XMLNode.setNode( newNode);
		node = walker.nextNode()
	} while(node )
	return this.XMLNode._xmlnode;
	*/
}

Node.prototype.convertToXMLNode = function(xmldoc) {
	var newElement = null;
	var i;
	if (this.nodeType == 1 ) {
		if (!this.XMLNode.namespaceURI) { this.XMLNode.namespaceURI = null;}
		if (this.localName.toLowerCase() != "span" && (this.XMLNode.namespaceURI == XHTMLNS )) {
			newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,this.localName.toLowerCase());
		} else {
			var classes = this.getClasses();
			if (classes.length > 0) {
				for (i = classes.length - 1; i >= 0; i--) {
					if (newElement != null) {
						newElement.appendChild(xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]));
					} else {
						newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]);
					}
				}
			} else {
				newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,this.localName);
			}
		}
		if (this.hasAttributes()) {
			var attribs = this.attributes;
			for (i = 0; i < attribs.length; i++) {
				if ( attribs[i].localName == "class" && this.XMLNode.namespaceURI == XHTMLNS  && attribs[i].value == newElement.localName) {
					continue;
				}
				else if (!(this.XMLNode.namespaceURI != XHTMLNS && attribs[i].localName == "class" ) ) {
					if (attribs[i].localName.substr(0,5) != "_edom" && attribs[i].localName.substr(0,5) != "__bxe") {
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







Node.prototype.__defineGetter__(
"XMLNode",
function()
{
	if (!this._XMLNode ) {
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


Node.prototype.updateXMLNode = function () {
	if (this.previousSibling && this.previousSibling.XMLNode) {
		this.XMLNode.previousSibling = this.previousSibling.XMLNode;
		this.previousSibling.XMLNode.nextSibling = this.XMLNode;
	} else {
		this.XMLNode.previousSibling = null;
	}
	if (this.nextSibling && this.nextSibling.XMLNode) {
		this.XMLNode.nextSibling = this.nextSibling.XMLNode;
		this.nextSibling.XMLNode.previousSibling = this.XMLNode;
	} else {
		this.XMLNode.nextSibling = null;
	}
	if (this.parentNode  && this.parentNode.XMLNode) {
		this.XMLNode.parentNode = this.parentNode.XMLNode;
	}
	if (!this.XMLNode.nextSibling) {
		this.XMLNode.parentNode.lastChild = this.XMLNode;
	}
	if (!this.XMLNode.previousSibling) {
		this.XMLNode.parentNode.firstChild = this.XMLNode;
	}


	this.XMLNode._node = this
/*	dump (this.XMLNode.nodeType);
	dump ("\n**********\n");*/
	if (this.firstChild) {
		var node = this.firstChild;
		while (node) {
			node.updateXMLNode();
			node = node.nextSibling;
		}
	}

}
