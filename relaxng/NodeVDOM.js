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
// $Id: NodeVDOM.js,v 1.14 2003/11/18 21:41:10 chregu Exp $

function NodeVDOM (node) {
	this.node = node;
	this.minOccurs = null;
	this.maxOccurs = null;
	
};


NodeVDOM.prototype.getVdomForChild = function (child ) {
	var ctxt = child.parentNode._isNodeValid(false);
	return child._vdom;
}

NodeVDOM.prototype.allowedElements = function(ctxt) {
	return this.localName;
}

NodeVDOM.prototype.parseChildren = function() {};



NodeVDOM.prototype.appendChild = function(newElement) {
	
	newElement.parentNode = this;
	if (typeof this.firstChild == "undefined" || this.firstChild == null) {
		this.firstChild =  newElement;
		this.lastChild =  newElement;
		newElement.nextSibling = null;
		newElement.previousSibling = null;
	} else {
		newElement.previousSibling = this.lastChild;
		newElement.previousSibling.nextSibling = newElement;
		newElement.nextSibling = null;
		this.lastChild = newElement;
	}
}
NodeVDOM.prototype.isValid = function(node) {
	//dump("\n---NodeVDOM.prototype.isValid----\n");
	return true;
}
	

