// +----------------------------------------------------------------------+
// | Bitflux Editor                                                       |
// +----------------------------------------------------------------------+
// | Copyright (c) 2003 Bitflux GmbH                                      |
// +----------------------------------------------------------------------+
// | This software is published under the terms of the Apache Software    |
// | License a copy of which has been included with this distribution in  |
// | the LICENSE file and is available through the web at                 |
// | http://bitflux.ch/editor/license.html                                |
// +----------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>                        |
// +----------------------------------------------------------------------+
//
// $Id: DocumentVDOM.js,v 1.13 2003/11/18 21:41:10 chregu Exp $


function DocumentVDOM() {} 
 
 
DocumentVDOM.prototype = new NodeVDOM();

DocumentVDOM.prototype.parseSchema = function() {
	//if it's an XMLSchema File
	if (!this.xmldoc.documentElement) {
		
		alert("Validation Document could not be loaded. \n" + this.xmldoc.saveXML(this.xmldoc));
	}
	if (this.xmldoc.documentElement.localName == "schema" &&
		this.xmldoc.documentElement.namespaceURI == "http://www.w3.org/2001/XMLSchema" ) {
		alert("XML Schema validation is not supported at the moment");
		//this.parseXMLSchema();
	}
	else if (this.xmldoc.documentElement.localName == "grammar" &&
		this.xmldoc.documentElement.namespaceURI == "http://relaxng.org/ns/structure/1.0" ) {
		this.parseRelaxNG();
	} else {
		bxe_alert ("Validation-file is not valid :\n" + this.xmldoc.saveXML(this.xmldoc));
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
	// set onload handler
	this.xmldoc.onload = function(e) {e.currentTarget.DocumentVDOM.parseSchema();};
	//set a reference to the DocumentVDOM, so we can access it in the callback
	this.xmldoc.DocumentVDOM = this;
	this.filename = file;

	if (file.substring(0,1) == "/") {
		this.directory = bxe_getDirPart(file);
	} else {
		var dir = bxe_getDirPart(window.location.toString());
		this.directory =  bxe_getDirPart(dir + file);
	}
	// load schema file
	debug("blabla");
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

