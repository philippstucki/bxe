function XMLNode  (htmlnode) {
	this.localName = null;
	this.namespaceURI = null;
	this.prefix = null;
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
		if (this._htmlnode.AreaInfo ) {
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
	"attributes",
	function()
	{
		return this._xmlnode.attributes;
	}
);

XMLNode.prototype.__defineGetter__( 
	"nodeName",
	function()
	{
		return this.localName;
	}
);