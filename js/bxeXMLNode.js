function XMLNode  () {
	this.localName = null;
	this.namespaceURI = null;
	this.prefix = null;
	this.firstChild = null;
	this.lastChild = null;
	this.nextSibling = null;
	this.previousSibling = null;
	this.nodeType = null;
	this.xmlBridge = false;
	/*
	if (htmlnode) {
		this.nodeType = htmlnode.nodeType;
		this._htmlnode = htmlnode;
		if (htmlnode) {
			if (htmlnode.namespaceURI == null) {
				if (htmlnode.nodeName.toLowerCase() =="span") {
					this.localName = htmlnode.getClasses();
				} else  {
					this.localName = htmlnode.nodeName.toLowerCase();
					this.namespaceURI = XHTMLNS;
				}
			}
			
			else {
				this.localName = htmlnode.nodeName;
			}
			
			//this.namespaceURI = htmlnode.XMLNode.namespaceURI;
		}
	}*/
}


//XMLNode.prototype =  document.createElement("bxe");

XMLNode.prototype.insertAfter = function(newNode, oldNode) {
	this._htmlnode.insertBefore(newNode._htmlnode,oldNode._htmlnode.nextSibling);
}

XMLNode.prototype.setContent = function (text) {
	this._htmlnode.removeAllChildren();
	this._htmlnode.appendChild(document.createTextNode(text));
}



XMLNode.prototype.setNode = function(xmlnode) {
	this._xmlnode = xmlnode;
	this.namespaceURI = xmlnode.namespaceURI;
	this.localName = xmlnode.localName;
	this.prefix = xmlnode.prefix;
	this.nodeType = xmlnode.nodeType;
	/*if (xmlnode.vdom) {
		this._vdom = xmlnode.vdom;
	}*/
}

XMLNode.prototype.reset = function() {
	
	if (this._node.ownerDocument == document) {
		this.NodeMode = "html";
		if (this._node.nodeType == 1) {
		if (this._node.nodeName.toLowerCase() != "span" && (this.namespaceURI == XHTMLNS )) {
			this.localName = this._node.nodeName.toLowerCase();
		} else {
			var classes = this._node.getClasses();
			if (classes.length > 0) {
				for (i = classes.length - 1; i >= 0; i--) {
				/*	if (newElement != null) {
						newElement.appendChild(xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]));
					} else {
						newElement = xmldoc.createElementNS(this.XMLNode.namespaceURI,classes[i]);
					}
					*/
					this.localName = classes[i];
				}
			} else {
				this.localName = this._node.localName;
			}
		}
		} else {
			this.localName = this._node.nodeName;
		}
	} else {
		this.NodeMode = "xml";
		this.localName = this._node.localName;
		this.nodeName = this._node.nodeName;
		this.namespaceURI = this._node.namespaceURI;
	}
}

XMLNode.prototype.removeAllChildren = function() {
	return this._xmlnode.removeAllChildren();
}

XMLNode.prototype.insertBefore = function (nodeOne,nodeTwo) {
	return this._xmlnode.insertBefore(nodeOne,nodeTwo);
}

/*
XMLNode.prototype.insertIntoXMLDocument = function (node) {
	alert (node.ownerDocument.saveXML(node)	);

	this._xmlnode.removeAllChildren();

	var newnode = this._xmlnode.ownerDocument.importNode(node,true);
    return this._xmlnode.appendChild(newnode);
}*/

XMLNode.prototype.setAttribute = function(name, value) {
	this._node.setAttribute(name,value);
}

XMLNode.prototype.__defineGetter__( 
	"allowedChildren",
	function()
	{
		return this._xmlnode.vdom.allowedChildren;
	}
);


XMLNode.prototype.__defineSetter__( 
	"localName",
	function(value)
	{
		this._localName = value;
	}
);

XMLNode.prototype.__defineGetter__( 
	"localName",
	function()
	{
		return this._localName;
	}
);


XMLNode.prototype.__defineSetter__( 
	"namespaceURI",
	function(value)
	{
		this._namespaceURI = value;
		if (this._htmlnode && this._htmlnode.nodeType == 1 ) {
			this._htmlnode.setAttribute("__bxe_ns",value);
		}
	}
);

XMLNode.prototype.__defineGetter__( 
	"namespaceURI",
	function()
	{
		if (this._htmlnode && this._htmlnode.nodeType == 1 &&  this._htmlnode.hasAttribute("__bxe_ns")) {
			return this._htmlnode.getAttribute("__bxe_ns");
		}
		return this._namespaceURI;
	}
);

XMLNode.prototype.__defineSetter__( 
	"parentNode",
	function(value)
	{
		this._parentNode = value;
	}
);

XMLNode.prototype.__defineGetter__( 
	"parentNode",
	function()
	{
		return this._parentNode;
	}
);


XMLNode.prototype.__defineGetter__( 
	"attributes",
	function()
	{
		if (this._xmlnode) {
			return this._xmlnode.attributes;
		} else {
			return this._htmlnode.attributes;
		}
	}
);



XMLNode.prototype.__defineGetter__( 
	"nodeName",
	function()
	{
		if (this._nodeName) {
			return this._nodeName;
		} else {
			return this.localName;
		}
	}
);

XMLNode.prototype.__defineSetter__( 
	"nodeName",
	function(value)
	{
		 this._nodeName = value;
	}
);

XMLNode.prototype.setAttributeNS = function (namespaceURI, localName, value) {
	this._node.setAttributeNS(namespaceURI,localName, value);
}

XMLNode.prototype.insertIntoHTMLDocument = function(htmlnode,onlyChildren) {
	
	var walker = this.createTreeWalker();
	var node;
	if(onlyChildren) {
		node = walker.nextNode();
	} else {
		node = this._node;
	}
	htmlnode.XMLNode = node.parentNode;
	node.parentNode._node = htmlnode;
	var firstChild = false;
	do  {
			var newNode;
			//newElement =  node.parentNode.XMLNode.appendChild(newElement);
			//node.NodeMode = "html";
			if (node.nodeType == 1 ) {
				newNode = node.makeHTMLNode()
				/*
				if (! node.hasChildNodes() ) {
						var xmlstring = node.getBeforeAndAfterString(false,true);
						newElement.setAttribute("_edom_tagnameopen",xmlstring[0]);
				}
				if (node.hasAttributes()) {
					var attribs = node.attributes;
					for (var i = 0; i < attribs.length; i++) {
						if (attribs[i].namespaceURI != "http://www.w3.org/2000/xmlns/") {
						   newElement.setAttributeNS(attribs[i].namespaceURI,attribs[i].localName,attribs[i].value);
						}
					}
				}
				*/
				
			} else {
				newNode = node.makeHTMLNode(node);
			}
			if (this.nodeType == 3) {
				return;
			}
			if (!firstChild) {
				firstChild = newNode;
			}

			node = walker.nextNode();
			
	}  while(node );
	return firstChild;
}

XMLNode.prototype.appendChild = function(newNode) {
	//BX_debug(newNode);
	newNode.parentNode = this;
	if (this.firstChild == null) {
		this.firstChild = newNode;
		this.lastChild = newNode;
		this.nextSibling = null;
		this.previousSibling = null;
	} else {
		newNode.previousSibling = this.lastChild;
		this.lastChild.nextSibling = newNode;
		this.lastChild = newNode;
		newNode.nextSibling = null;
	}
	if (this._node.ownerDocument == document ) {
		newNode.createNS(newNode.namespaceURI, newNode.localName);
	} else {
	}
	this._node.appendChild(newNode._node);

	return newNode;
}

XMLNode.prototype.createNS = function (namespaceURI, localName) {
    var htmlelementname;
	if (namespaceURI != XHTMLNS) {
		htmlelementname = "span"
		this._node = document.createElement(htmlelementname);
		this._node.setAttribute("class", localName);
		if (localName == "a") {
			this._node.onclick = function(e) {e.preventDefault(); }
			this._node.onmousedown = function(e) {e.preventDefault(); }
			this._node.onmouseup = function(e) {e.preventDefault(); }
		}
		
	}
	else {
		htmlelementname = this.localName;
		this._node = document.createElement(htmlelementname);
		
	}
	this.localName = localName;
	this.namespaceURI = namespaceURI;
}

XMLNode.prototype.getXPathString = function() {
	var prevSibling = this;
	var position = 1;
	var xpathstring = "";
	if (this.parentNode && 
	this.parentNode.nodeType == 1) {
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

XMLNode.prototype.createTreeWalker= function() {
	return new XMLNodeWalker(this);
}
	
function XMLNodeWalker (startnode,afunction) {
	
	this.currentNode = startnode;
	this.startNode = startnode;

}
XMLNodeWalker.prototype.nextNode = function() {
	if (this.currentNode.firstChild) {
		this.currentNode = this.currentNode.firstChild;
		return this.currentNode;
	}
	else if (this.currentNode.nextSibling) {
		this.currentNode = this.currentNode.nextSibling;
		return this.currentNode;
	}
	else if(this.currentNode.parentNode) {
		this.currentNode = this.currentNode.parentNode;
		while ( this.currentNode && !this.currentNode.nextSibling ) { 
			this.currentNode = this.currentNode.parentNode;
		}
		if (this.currentNode ) {
			this.currentNode = this.currentNode.nextSibling;
			return this.currentNode;
		}
		else { return null};
	}
	return null;
	
}

XMLNode.prototype.isInHTMLDocument= function() {
	return (this._node.ownerDocument == document)
}

XMLNode.prototype.makeHTMLNode = function () {
	dump("here " + " " + this.data + " " +this.nodeType + " " +this.localName+"");

	if (this.nodeType == 1) {
		this.createNS(this.namespaceURI, this.localName);
	} else {
		this._node = document.importNode(this._node.cloneNode(true),true);
	}
	if (this.parentNode.isInHTMLDocument()) {
		dump (" inHTML");
		this.parentNode._node.appendChild(this._node);
	}
	this._node.XMLNode = this;
	dump("\n");
}
