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
				if (node.namespaceURI ==  XHTMLNS) {
					var newElement = document.createElement(node.localName);
					newElement.XMLNode.localName = node.localName;
				} else {
					var newElement = document.createElement("span");
					newElement.setAttribute("class",node.localName);
					newElement.XMLNode.localName = node.localName;
				}
				if (node.hasAttributes()) {
					var attribs = node.attributes;
					for (var i = 0; i < attribs.length; i++) {
						if (attribs[i].namespaceURI != "http://www.w3.org/2000/xmlns/") {
						   newElement.setAttributeNode(attribs[i]);
						}
					}
				}
					
				newElement.XMLNode.namespaceURI = node.namespaceURI;
				var newNode = parentN.appendChild(newElement);
			} else {
				var newNode = parentN.appendChild(document.importNode(node,true));
			}
			newNode.XMLNode._xmlnode = node;
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
	
	this.XMLNode._xmlnode.removeAllChildren();
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
		var parentN = null;
		if (node.parentNode.XMLNode._xmlnode) {
			parentN = node.parentNode.XMLNode._xmlnode;
		} else {
			parentN = this.XMLNode._xmlnode;
		}
		var newNode = node.convertToXMLNode(document);
		parentN.appendChild(newNode);
		
		var lastChild = null;
		while ( lastChild = newNode.firstChild) {
			newNode = lastChild;
		}
		node.XMLNode.setNode( newNode);
		
	} while(node = walker.nextNode() )
	return this.XMLNode._xmlnode;
}

Node.prototype.convertToXMLNode = function(xmldoc) {
	var newElement = null;
	if (this.nodeType == 1 ) {
		if (!this.XMLNode.namespaceURI) { this.XMLNode.namespaceURI = null;}
		if (this.localName.toLowerCase() != "span" && (this.namespaceURI == XHTMLNS )) {
			newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,this.localName);
		} else {
			var classes = this.getClasses();
			if (classes.length > 0) {
				for (var i = classes.length - 1; i >= 0; i--) {
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



//XMLNode.prototype = new Node();

Node.prototype.getXMLComponents = function () {
	var localName = "";
	var namespaceURI = null;
	var prefix = null;
	
	if (this.nodeType == 1 ) {
		if (this.localName.toLowerCase() != "span" && (this.namespaceURI == XHTMLNS )) {
			localName = this.localName;
			namespaceURI = XHTMLNS;
		} else {
			var classes = this.getClasses();
			if (classes.length > 0) {
				for (var i = classes.length - 1; i >= 0; i--) {
					if (newElement != null) {
						newElement.appendChild(xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]));
					} else {
						newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]);
					}
				}
			} else {
				namespaceURI = "null";
				localName = this.localName;
			}
		}
	}
	
	return ({"localName": localName, "namespaceURI": namespaceURI});
	
}

function XMLNode  (htmlnode) {
	this.localName = null;
	this.namespaceURI = null;
	this.prefix = null;	
	this.nodeType = htmlnode.nodeType;
	this._htmlnode = htmlnode;
}

XMLNode.prototype.setNode = function(xmlnode) {
	this._xmlnode = xmlnode;
	this.namespaceURI = xmlnode.namespaceURI;
	this.localName = xmlnode.localName;
	this.prefix = xmlnode.prefix;
	this.nodeType = xmlnode.nodeType;
}

XMLNode.prototype.removeAllChildren = function() {
	return this._xmlnode.removeAllChildren();
}

XMLNode.prototype.insertBefore = function (nodeOne,nodeTwo) {
	return this._xmlnode.insertBefore(nodeOne,nodeTwo);
}

XMLNode.prototype.__defineGetter__( 
	"parentNode",
	function()
	{
		if (this._htmlnode.AreaInfo ) {
			return this._xmlnode.parentNode;
		} else { 
			return this._htmlnode.parentNode.XMLNode;
		}
	}
);

XMLNode.prototype.__defineGetter__( 
	"nodeName",
	function()
	{
		return this.localName;
	}
);

Node.prototype.__defineGetter__(
	"XMLNode",
	function()
	{
		if (!this._XMLNode) {
			this._XMLNode = new XMLNode(this);
		}
		return this._XMLNode;
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

