Document.prototype.loadSchema = function(file ,callback) {
	this._vdom = new DocumentVDOM();
	return this._vdom.loadSchema(file, callback);
}

Document.prototype.validateDocument = function() {
	if (!this.vdom) {
		alert ("no Schema assigned to Document");
		return false;
	}
	
	//check root element
	vdomCurrentChild = this.documentElement.vdom.firstChild;
	return this.documentElement.isNodeValid(true);
	/*if (!this.vdom.isGlobalElement(root.nodeName)) {
		alert("not globally defined");
	}*/
	return true;
}

Document.prototype.getVdom = function(name) {
	return this._vdom.globalElements[name.toLowerCase()];
}
Document.prototype.__defineGetter__(
	"vdom", function () {
		return this._vdom;
	}
	)


Document.prototype.__defineSetter__(
	"vdom", function (value) {
		this._vdom = value;
	}
	)

