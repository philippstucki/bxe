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
// $Id: DocumentVAL.js,v 1.12 2004/01/19 02:04:59 chregu Exp $

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
	

	if (!this.documentElement) {
		this.documentElement = this._node.documentElement.XMLNode;
	}
	var c =  this.documentElement.isNodeValid(true);
	/*FIXME: HACK... Sometimes the above statement does not check
	   deep enough, do another check here for all editable Areas
	   
	*/
	   
	var areaNodes = bxe_getAllEditableAreas();

	for (var i = 0; i < areaNodes.length; i++) {
		if ((areaNodes[i]._SourceMode)) {
			return false;
		}
		c = c & areaNodes[i].XMLNode.isNodeValid(true)
	}
	
	
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

