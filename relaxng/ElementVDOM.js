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
// $Id: ElementVDOM.js,v 1.12 2003/11/18 21:41:10 chregu Exp $

function ElementVDOM(node) {
	this.node = node;
	this._allowedChildren = new Array();
	this.type = "RELAXNG_ELEMENT";
	this.canBeRoot = false;
	this.nextSibling = null;
	this.previousSibling = null;
	this.minOccurs = 1;
	this.maxOccurs = 1;
	this._attributes = new Array();
}

ElementVDOM.prototype = new NodeVDOM();

NodeVDOM.prototype.addAttributeNode = function(attribute) {
	this._attributes[attribute.name] = attribute;
}

ElementVDOM.prototype.__defineGetter__ ( 
	"hasAttributes",
	function() {
		for (var i in this.attributes) {
			return true;
		}
		return false;
		
	}
);

ElementVDOM.prototype.addAllowedChild = function(node) {
	this._allowedChildren[node.name] = node;
}

NodeVDOM.prototype.getAllAttributes = function () {
	var child = this.firstChild;
	var attr = this._attributes;
	while (child) {
		if (child.nodeName == "RELAXNG_REF" && child.DefineVDOM) {
			var AA = child.DefineVDOM.getAllAttributes()
			if (AA) {
				for (i in AA) {
					attr[AA[i].name]= AA[i];
					//attr.push(AA[i]);
				}
			}
		}
		child = child.nextSibling;
	}
	return attr;
}


ElementVDOM.prototype.__defineGetter__ ( 
	"attributes",
	function() {
		if (typeof this._cachedAttributes == "undefined") {
			
			this._cachedAttributes = this.getAllAttributes();
		}
		return this._cachedAttributes;
	}
	);
	


ElementVDOM.prototype.isValid = function(ctxt) {
//debug(ctxt.node.nodeType + " " + ctxt.node.localName+" == "+this.localName+" && "+ctxt.node.namespaceURI+" == "+this.namespaceURI+"\n");
	if (ctxt.node.localName == this.localName && ctxt.node.namespaceURI == this.namespaceURI) {
		ctxt.node.vdom = this;
		ctxt.nextVDOM();
		return true;
	} else {
		return false;
	}
}
