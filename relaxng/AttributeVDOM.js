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
// $Id$

function AttributeVDOM(node, option) {
	this.type = "RELAXNG_ATTRIBUTE";
	this.name = node.getAttribute("name");
	this.dataType = "NCName";
	if (option == "optional" || node.getAttribute("type") == "optional") {
		this.optional = true;
	} else {
		this.optional = false;
	}
	for (var i = 0; i < node.childNodes.length;i++  ) {
		if (node.childNodes[i].nodeName == "data") {
			this.dataType = node.childNodes[i].getAttribute("type");
		}
		else if (node.childNodes[i].nodeName == "choice") {
			this.dataType = "choice";
			this.choices = new Array();
			var choice = node.childNodes[i].childNodes;
			this.choices.push("");
			for (var j = 0; j < choice.length; j++) {
				if (choice[j].localName == "value" && choice[j].firstChild) {
					this.choices.push(choice[j].firstChild.data);
				}
			}
		} 
	}
	
	
}

AttributeVDOM.prototype.isValid = function(ctxt) {
	if (ctxt.node._node && !this.optional && !ctxt.node._node.hasAttribute(this.name)) {
		ctxt.setErrorMessage(ctxt.node.nodeName + " does not have the required attribute " + this.name);
		return false;
	} else if (ctxt.node._node && this.choices) {
		var value = ctxt.node._node.getAttribute(this.name);
		if (value) {
			for (var i = 0; i < this.choices.length; i++) {
				if (this.choices[i] == value) {
					return true;
				}
			}
			ctxt.setErrorMessage("'" +value + "' is not an allowed value for attribute '" + this.name + "' in '" + ctxt.node.nodeName +"'");
			return false
		} else {
			return true;
		}
	} else {
		return true;
	}
	
}