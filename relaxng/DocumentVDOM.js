function DocumentVDOM() {} 
 
DocumentVDOM.prototype.parseSchema = function() {
	//check if it's a schema file
	if (this.xmldoc.documentElement.localName != "schema" ||
		this.xmldoc.documentElement.namespaceURI != "http://www.w3.org/2001/XMLSchema" ) {
			//FIXME: call an error function or the callback handler
			alert ("Schema file "+this.filename +" seems not to be a valid schema document. Check for example your namespaces.\n localName is " + this.xmldoc.documentElement.localName + "\n namespaceURI is " + this.xmldoc.documentElement.namespaceURI);
			return false;
	}
	//parse all global elements and create an ElementVDOM object
	var nsResolver = this.xmldoc.createNSResolver(this.xmldoc.documentElement);
	var xpath = "/xs:schema/xs:element";
	var result = this.xmldoc.evaluate(xpath, this.xmldoc, nsResolver, 0, null);
	this.globalElements = new Array();
	while ( node = result.iterateNext()) {
		this.globalElements[node.getAttribute("name")] = new ElementVDOM(node.getAttribute("name"));
	}
	// do it again for all elements with a complexType
	var xpath = "/xs:schema/xs:element[xs:complexType//xs:sequence/xs:element|xs:complexType//xs:choice/xs:element]";
	var result = this.xmldoc.evaluate(xpath, this.xmldoc, nsResolver, 0, null);

	while ( node = result.iterateNext()) {
		var xpath = "xs:complexType//xs:sequence/xs:element|xs:complexType//xs:choice/xs:element";
		var childrenResult = this.xmldoc.evaluate(xpath, node, nsResolver, 0, null);
		while (child = childrenResult.iterateNext()) {
			if (child.getAttribute("ref")) {
				this.globalElements[node.getAttribute("name")].addAllowedChild(this.globalElements[child.getAttribute("ref")]);
			}
		}
		dump(node.getAttribute("name")  + " : " +this.globalElements[node.getAttribute("name")].allowedChildren + "\n");
	}

	this.onparse();
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
	this.xmldoc.load(file);
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

