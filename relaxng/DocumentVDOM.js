function DocumentVDOM() {} 
 
 
DocumentVDOM.prototype = new NodeVDOM();

DocumentVDOM.prototype.parseSchema = function() {
	//if it's an XMLSchema File
	if (!this.xmldoc.documentElement) {
		
		alert("Validation Document could not be loaded. \n" + this.xmldoc.saveXML(this.xmldoc));
	}
	if (ths.xmldoc.documentElement.localName == "schema" &&
		this.xmldoc.documentElement.namespaceURI == "http://www.w3.org/2001/XMLSchema" ) {
		alert("XML Schema validation is not supported at the moment");
		//this.parseXMLSchema();
	}
	else if (this.xmldoc.documentElement.localName == "grammar" &&
		this.xmldoc.documentElement.namespaceURI == "http://relaxng.org/ns/structure/1.0" ) {
		this.parseRelaxNG();
	} else {
		alert ("Validation-file is not valid :\n" + this.xmldoc.saveXML(this.xmldoc));
		return false;
	}
	this.onparse(this);
	return true;
} 
/* 
*   Starts the loading of the schema with a simple http-get
*
*   you can override this function, if you net another method than get
*
*   file: file to be loaded
*   callback: callback to be called, when schema is parsed
*/
DocumentVDOM.prototype.loadSchema = function(file, callback) {
	// set callback
	this.onparse = callback;
	// make XMLDocument
	this.xmldoc = document.implementation.createDocument("","",null);
	// set onload handler (async = false doesn't work in mozilla AFAIK)
	this.xmldoc.onload = function(e) {e.currentTarget.DocumentVDOM.parseSchema();};
	//set a reference to the DocumentVDOM, so we can access it in the callback
	this.xmldoc.DocumentVDOM = this;
	this.filename = file;
	// load schema file
	try {
	this.xmldoc.load(file);
	} catch (e) {
		return false;
	}
	
	return true;
}

DocumentVDOM.prototype.getAllowedChildren = function (name) {
	//FIXME: toLowerCase is HTML specific... make switch later
	return this.globalElements[name.toLowerCase()].allowedChildren;
}

DocumentVDOM.prototype.isGlobalElement = function(name) {
	
	if (this.globalElements[name.toLowerCase()]) { 
		return true;
	} else {
		return false;
	}
}

