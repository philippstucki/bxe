function ElementVDOM(name) {
	this.name = name;
	this._allowedChildren = new Array();
}

ElementVDOM.prototype.addAllowedChild = function(node) {
	this._allowedChildren[node.name] = node;
}

