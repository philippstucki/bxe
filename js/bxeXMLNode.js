function XMLNode  (htmlnode) {
	this.localName = null;
	this.namespaceURI = null;
	this.prefix = null;
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
	}
}

XMLNode.prototype.insertAfter = function(newNode, oldNode) {
	this._htmlnode.insertBefore(newNode._htmlnode,oldNode._htmlnode.nextSibling);
}

XMLNode.prototype.setContent = function (text) {
	this._htmlnode.removeAllChildren();
	this._htmlnode.appendChild(document.createTextNode(text));
}

XMLNode.prototype.createNS = function (namespaceURI, localName) {
    var htmlelementname;
	if (namespaceURI != XHTMLNS) {
		htmlelementname = "span"
		this._htmlnode = document.createElement(htmlelementname);
		this._htmlnode.setAttribute("class", localName);
	
	}
	else {
		htmlelementname = localName;
		this._htmlnode = document.createElement(htmlelementname);
		
	}
	this._htmlnode.setAttribute("__bxe_ns", namespaceURI);
	this.localName = localName;
	this.namespaceURI = namespaceURI;
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
XMLNode.prototype.__defineGetter__( 
	"parentNode",
	function()
	{
		if (this._htmlnode && this._htmlnode.AreaInfo ) {
			return this._xmlnode.parentNode;
		} else { 
			return this._htmlnode.parentNode.XMLNode;
		}
	}
);

XMLNode.prototype.setAttribute = function(name, value) {
	this._xmlnode.setAttribute(name,value);
	this._htmlnode.setAttribute(name,value);
}

XMLNode.prototype.__defineGetter__( 
	"allowedChildren",
	function()
	{
		return this._xmlnode.vdom.allowedChildren;
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
		return this.localName;
	}
);
