

Node.prototype.isNodeValid = function(deep, wFValidityCheckLevel ) {
	
	// if it's a root node.
	if(this.parentNode.nodeType == 9) {
		if (!this.parentNode.vdom.isGlobalElement(this.nodeName)) {
			alert("root element is not a global element");
			return false;
		}
	} else {
		if (this.nodeType == 1) {
			if (!this.parentNode.allowedChildren[this.nodeName.toLowerCase()]) {
				alert(this.parentNode.nodeName + " does not allow  " + this.nodeName + " as child");
				return false;
			}
		}
	}
	var children = this.childNodes;
	for (var i = 0; i < children.length; i++) {
		if (this.childNodes[i].nodeType == 1) {
			if(!this.childNodes[i].isNodeValid(deep)) {
				return false;
			}
		}
		
	}
	return true;
}






Node.prototype.__defineGetter__(
	"vdom", function () {
		if (!this._vdom) {
			this._vdom = this.ownerDocument.getVdom(this.nodeName);
		}
		return this._vdom;
	}
	)

