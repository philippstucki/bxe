NodeVDOM = function(node) {
	this.node = node;
	this.minOccurs = null;
	this.maxOccurs = null;
	this.attributes = new Array();
};


NodeVDOM.prototype.getVdomForChild = function (child ) {
	var ctxt = new ContextVDOM(child.parentNode,this);
	ctxt.node = child;
	var vdom = this.firstChild;
	while (vdom) {
		//dump (child.nodeName + " = " + vdom.nodeName + "\n");
		if (vdom.isValid(ctxt)) {
			return vdom;
		}
		vdom = vdom.nextSibling;
	}

	return null;
}

NodeVDOM.prototype.allowedElements = function() {
	return this.localName;
}

NodeVDOM.prototype.parseChildren = function() {};


NodeVDOM.prototype.appendChild = function(newElement) {
	
	newElement.parentNode = this;
	if (this.firstChild == null) {
		this.firstChild =  newElement;
		this.lastChild =  newElement;
		newElement.nextSibling = null;
		newElement.previousSibling = null;
	} else {
		newElement.previousSibling = this.lastChild;
		newElement.previousSibling.nextSibling = newElement;
		newElement.nextSibling = null;
		this.lastChild = newElement;
	}
}
NodeVDOM.prototype.isValid = function(node) {
	return true;
}
	
NodeVDOM.prototype.addAttributeNode = function(attribute) {
	
	this.attributes[attribute.name] = attribute;
}
