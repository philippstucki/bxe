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
			if (node.parentNode.xmlNode) {
				parentN = node.parentNode.xmlNode;
			} else {
				parentN = this.xmlNode;
			}
			var newNode = node.convertToXMLNode(document);
			parentN.appendChild(newNode);
			
			var lastChild = null;
			while ( lastChild = newNode.firstChild) {
				newNode = lastChild;
			}
			node.xmlNode = newNode;
	
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

