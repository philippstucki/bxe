
function ElementVDOM(node) {
	this.node = node;
	this._allowedChildren = new Array();
	this.type = "RELAXNG_ELEMENT";
	this.canBeRoot = false;
	this.nextSibling = null;
	this.previousSibling = null;
	this.minOccurs = 1;
	this.maxOccurs = 1;
	this.attributes = new Array();

}

ElementVDOM.prototype = new NodeVDOM();

ElementVDOM.prototype.addAllowedChild = function(node) {
	this._allowedChildren[node.name] = node;
}

ElementVDOM.prototype.isValid = function(ctxt) {
	
	//dump ("ElementVDOM.isValid " + ctxt.node.nodeName + " " + this.nodeName + "\n");
	if (ctxt.node.localName == this.localName && ctxt.node.namespaceURI == this.namespaceURI) {
		ctxt.node.vdom = this;
		ctxt.nextVDOM();
		return true;
	} else {
		return false;
	}
}
