function XMLNode  ( nodein, localName, nodeType, autocreate) {

	this.init( nodein, localName, nodeType, autocreate);
}



XMLNode.prototype.init = function ( nodein, localName, nodeType, autocreate) {
	if (typeof nodein != "undefined" && typeof nodein != "string") {
		this.nodeType = nodein.nodeType;
		this.localName = nodein.localName;
		this.namespaceURI = nodein.namespaceURI;
		this._node = nodein;
	} else {
		this.localName = localName;
		this.namespaceURI = nodein;
	}
	this.prefix = null;
	this.firstChild = null;
	this.lastChild = null;
	this.nextSibling = null;
	this.previousSibling = null;
	this.xmlBridge = false;
	
	if (nodeType && ! this.nodeType) {
		this.nodeType = nodeType;
	}
	if (autocreate) {
		this.createNS(nodein, localName);
	}
	
	if (this._node && this._node.ownerDocument == document) {
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
			if (this._node.hasAttribute("__bxe_ns")) {
				this.namespaceURI = this._node.getAttribute("__bxe_ns");
			}
		} else {
			this.localName = this._node.nodeName;
		}
	} 
	if (this._node) {
		this._node.XMLNode = this;
	}
	
}

//XMLNode.prototype =  document.createElement("bxe");

XMLNode.prototype.insertAfter = function(newNode, oldNode) {
	this.insertBefore(newNode,oldNode.nextSibling);
}

XMLNode.prototype.insertBefore = function(newNode,oldNode) {
	newNode = this.appendChild(newNode);
	newNode._node = this._node.insertBefore(newNode._node,oldNode._node);
	this.insertBeforeIntern(newNode,oldNode);
	newNode._node.XMLNode = newNode;

}

XMLNode.prototype.insertBeforeIntern = function(newNode, oldNode) {
	try {

	newNode.unlink();
	newNode.parentNode = this;
	newNode.ownerDocument = this.ownerDocument;
	if (oldNode != null) {
		if (oldNode.previousSibling != null) {
			oldNode.previousSibling.nextSibling = newNode;
			newNode.previousSibling = oldNode.previousSibling;
		} else {
			this.firstChild = newNode;
			newNode.previousSibling = null;
		}
		oldNode.previousSibling = newNode;
		newNode.nextSibling = oldNode;
	}
	} catch(e) {alert(e);}
}

XMLNode.prototype.unlink = function () {
	
	if (this.nextSibling == null) {
		if ( this.parentNode != null) {
			this.parentNode.lastChild = this.previousSibling;
		}
	} else {
		this.nextSibling.previousSibling = this.previousSibling;
	}
	if (this.previousSibling == null) {
		if (this.parentNode != null) {
			this.parentNode.firstChild = this.nextSibling;
		}
	} else {
		this.previousSibling.nextSibling = this.nextSibling;
	}
	this.parentNode = null;
}

XMLNode.prototype.unlinkChildren = function () {
	
	var child = this.firstChild;
	
	while (child) {
		child.parentNode = null;
		child = child.nextSibling;
	}
	this.firstChild = null;
	this.lastChild = null;
}


XMLNode.prototype.appendChild = function(newNode) {
	//BX_debug(newNode);
	if (this._node.ownerDocument == document ) {
		newNode.createNS(newNode.namespaceURI, newNode.localName, newNode.nodeType);
	}
	newNode._node = this._node.appendChild(newNode._node);

	this.appendChildIntern(newNode);

	return newNode;
}

XMLNode.prototype.appendChildIntern = function (newNode) {
	newNode.parentNode = this;
	if (this.firstChild == null) {

		this.firstChild = newNode;

		this.lastChild = newNode;
		newNode.nextSibling = null;
		newNode.previousSibling = null;
	} else {
		newNode.previousSibling = this.lastChild;
		this.lastChild.nextSibling = newNode;
		this.lastChild = newNode;
		newNode.nextSibling = null;
	}

	newNode.ownerDocument = this.ownerDocument;
}


XMLNode.prototype.setContent = function (text) {
	this.removeAllChildren();
	var mmmh = new XMLNode(text, null, 3);
	this.appendChild(mmmh);
}

XMLNode.prototype.removeChild = function (child) {
	if (child._node.parentNode == this._node) {
		this._node.removeChild(child._node);
	}
	child.unlink();
	return child = null;
}

XMLNode.prototype.removeAllChildren = function() {
	var child = this.firstChild;
	while (child) {
		var oldchild = child;
		child = child.nextSibling;
		this.removeChild(oldchild);
	}
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
		var ac = this.vdom.allowedChildren;
		if (ac) {
			return ac;
		} else {
			return new Array();
		}
	}
);


XMLNode.prototype.__defineSetter__( 
	"namespaceURI",
	function(value)
	{
		if (value == null) {
			value = "";
		}
		this._namespaceURI = value;
		if (this._node && this.isInHTMLDocument() && this.nodeType == 1 ) {
			this._node.setAttribute("__bxe_ns",value);
		}
	}
);

XMLNode.prototype.__defineGetter__( 
	"namespaceURI",
	function()
	{
		if (this._node && this._node.nodeType == 1 &&  this.isInHTMLDocument() && this._node.hasAttribute("__bxe_ns")) {
			return this._node.getAttribute("__bxe_ns");
		}
		return this._namespaceURI;
	}
);


XMLNode.prototype.__defineGetter__( 
	"data",
	function()
	{
		if (this.nodeType == 3) {
			return this._node.data;
		} else {
			return false;
		}
	}
);


/*
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
);*/


XMLNode.prototype.__defineGetter__( 
	"attributes",
	function()
	{
//			return this._node.attributes;
			return Array();
			
	}
);



XMLNode.prototype.__defineGetter__( 
	"nodeName",
	function()
	{
		if (this._nodeName) {
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
				
				if (! node.hasChildNodes() ) {
						var xmlstring = node.getBeforeAndAfterString(false,true);
						
						newNode.setAttribute("_edom_tagnameopen",xmlstring[0]);
				}
			} else {
				newNode = node.makeHTMLNode();
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

XMLNode.prototype.getBeforeAndAfterString = function () {
	var nodeName = "";
	if (this.prefix) {
		nodeName = this.prefix + ":";
	}
	var before = "";
	var after = "";
	
	nodeName = nodeName + this.localName;
	before = "<"+ nodeName;
	var attribs = this.attributes;
	for (var i = 0; i < attribs.length; i++) {
		before = before + " " + attribs[i].localName + '="'+attribs[i].value+'"';
	}
	if (this.hasChildNodes() ){
		before = before + ">";
		after = "</"+ nodeName +">";
	} else {
		before = before + "/>";
	}
	return new Array(before,after);
	
}
XMLNode.prototype.createNS = function (namespaceURI, localName) {
	var htmlelementname;
	if (this.nodeType == 1) {
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
			try {
				this._node = document.createElement(htmlelementname);
			}
			catch(e) {alert("you can't insert '" + htmlelementname + "' as an elementname");} 
			
		}
		this.localName = localName;
		this.namespaceURI = namespaceURI;
	}
	else if (this.nodeType == 3) {
		this._node = document.createTextNode(namespaceURI);
	}
	if (this._node) {
		this._node.XMLNode = this;
	} else {
	}
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
	//dump("here " + " " + this.data + " " +this.nodeType + " " +this.localName+"");
	if (this.nodeType == 1) {
		var attribs = this._node.attributes;
		this.createNS(this.namespaceURI, this.localName);
		for (var i = 0; i < attribs.length; i++) {
			this._node.setAttributeNS(attribs[i].namespaceURI,attribs[i].localName,attribs[i].value);
		}
		
	} else if (this.nodeType == 3 ) {
		this._node = document.createTextNode(this.data);
	}
	
	else if (this._node.nodeType == 9 ) { // Node.XMLDOCUMENT) {
			this._node = this._node.documentElement;
	}
	if (this.parentNode && this.parentNode.isInHTMLDocument()) {
		//dump (" inHTML");
		this.parentNode._node.appendChild(this._node);
	}
	this._node.XMLNode = this;
	return this._node;	
	//dump("\n");
}

XMLNode.prototype.__defineGetter__ (
	"childNodes",
	function() {
		chN = new Array();
		var node = chN.firstChild;
		while (node) { 
			chN.push(node);
			node= node. nextSibling;
		}
		return chN;
	}
);
XMLNode.prototype.hasChildNodes = function() {
	if (typeof this.firstChild != "undefined" && this.firstChild != null) {
		return true;
	} else {
		return false;
	}
}
/* not yet implemented */
XMLNode.prototype.hasAttributes = function() {
	return false;
}

/**
 * Removes all children of an Element
 */
XMLNode.prototype.appendAllChildren = function(node) {
	var child = node.firstChild;
	while (child) {
		var oldchild = child;
		child = child.nextSibling;
		this.appendChild(oldchild);
	}
}


XMLNode.prototype.info = function() {
	var str = "";
	str = "nodeType: " +this.nodeType + "\n";
	str += "namespaceURI: " + this.namespaceURI + "\n";
	str += "localName: " + this.localName + "\n";
	str += "data: "+ this.data + "\n";
	
	return  (str);
}
	

function XMLNodeElement ( nodein, localName, nodeType, autocreate) {

	this.init( nodein, localName, nodeType, autocreate);

}

XMLNodeElement.prototype = new XMLNode();


XMLNodeElement.prototype.hasAttributes = function() {
	var attribs = this._node.attributes;
	for (var i = 0; i < attribs.length; i++) {
		if (attribs[i].localName.substr(0,5) != "_edom" && attribs[i].localName.substr(0,5) != "__bxe") {
			return true;
		}
	}
	return false;
}

XMLNodeElement.prototype.__defineGetter__( 
	"attributes",
	function()
	{
		var attribs;
		if (this.xmlBridge) {
			attribs = this.xmlBridge.attributes;
		} else {
			attribs = this._node.attributes;
		}
		var attributes = new Array();
		for (var i = 0; i < attribs.length; i++) {
			if (attribs[i].localName.substr(0,5) != "_edom" && attribs[i].localName.substr(0,5) != "__bxe" && attribs[i].namespaceURI != "http://www.w3.org/2000/xmlns/" && !(this.namespaceURI != XHTMLNS && attribs[i].localName == "class"))  {
				attributes.push(attribs[i]);
			}
		}
		return attributes;
	}
);

XMLNodeElement.prototype.setAttribute = function(name,value) {
	return this._node.setAttribute(name, value);
}

XMLNodeElement.prototype.setAttributeNS = function(namespace,name,value) {
	return this._node.setAttributeNS(namespace,name, value);
}

XMLNodeElement.prototype.getAttribute = function(name) {
	return this._node.setAttribute(name, value);
}

XMLNodeElement.prototype.getAttributeNS = function(namespace,name) {
	return this._node.getAttributeNS(namespace,name);
}
	
	
