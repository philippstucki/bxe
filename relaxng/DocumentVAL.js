Document.prototype.loadSchema = function(file ,callback) {
	this._vdom = new DocumentVDOM();
	this._vdom.loadSchema(file, callback);
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

XMLDocument.prototype.saveXML = function(snode)
{
	if(!snode) {
		snode = this;
	}

	//create a new XMLSerializer
	var objXMLSerializer = new XMLSerializer;
	
	//get the XML string
	var strXML = objXMLSerializer.serializeToString(snode);
	
	//return the XML string
	return strXML;
}


