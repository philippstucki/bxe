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
	dump (this.childNodes.length);
	
	//FIXME: element 0 doesn't have to be the root node.
	var root = this.childNodes[0];
	dump(root.nodeName + " " + root.childNodes.length);
	return root.isNodeValid(true);
	/*if (!this.vdom.isGlobalElement(root.nodeName)) {
		alert("not globally defined");
	}*/
	return true;
}

Document.prototype.getVdom = function(name) {
	return this._vdom.globalElements[name.toLowerCase()];
}


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


