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
// $Id: XMLSchema.js,v 1.3 2003/11/18 21:41:10 chregu Exp $


DocumentVDOM.prototype.parseXMLSchema = function () {
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
//		dump(node.getAttribute("name")  + " : " +this.globalElements[node.getAttribute("name")].allowedChildren + "\n");
	}
}
