XMLNodeDocument.prototype.loadSchema = function(file ,callback) {
	this._vdom = new DocumentVDOM();
	return this._vdom.loadSchema(file, callback);
}

XMLNodeDocument.prototype.validateDocument = function() {
	if (!this.vdom) {
		//if vdom was not attached to the document, try to find the global one...
		this.vdom = bxe_config.DocumentVDOM;
	}
	if (!this.vdom) {
		alert ("no Schema assigned to Document, but " + this.vdom);
		return false;
	}
	
	//check root element
	//var vdomCurrentChild = this.documentElement.vdom.firstChild;
	//alert(this._node.documentElement);
	if (!this.documentElement) {
		this.documentElement = this._node.documentElement.XMLNode;
	}
	var c =  this.documentElement.isNodeValid(true);
	
	return c;
}

XMLNodeDocument.prototype.getVdom = function(name) {
	return this._vdom.globalElements[name.toLowerCase()];
}
XMLNodeDocument.prototype.__defineGetter__(
	"vdom", function () {
		return this._vdom;
	}
	)


XMLNodeDocument.prototype.__defineSetter__(
	"vdom", function (value) {
		this._vdom = value;
	}
	)

