// +--------------------------------------------------------------------------+
// | BXE                                                                      |
// +--------------------------------------------------------------------------+
// | Copyright (c) 2003,2004 Bitflux GmbH                                     |
// +--------------------------------------------------------------------------+
// | Licensed under the Apache License, Version 2.0 (the "License");          |
// | you may not use this file except in compliance with the License.         |
// | You may obtain a copy of the License at                                  |
// |     http://www.apache.org/licenses/LICENSE-2.0                           |
// | Unless required by applicable law or agreed to in writing, software      |
// | distributed under the License is distributed on an "AS IS" BASIS,        |
// | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
// | See the License for the specific language governing permissions and      |
// | limitations under the License.                                           |
// +--------------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>                            |
// +--------------------------------------------------------------------------+
//
// $Id$

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
/* FIXME: This try/catch had to be inserted for making it work for MIT
should look into it, what really was the issue.. */
try {
	this._attributes[attribute.name] = attribute;
} catch(e) {};
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
	if (ctxt.node.localName == this.localName && ctxt.node.namespaceURI == this.namespaceURI) {
		
		
		var _attr = this.attributes;
		var _vdomAttr = new Array();
		
		for(var i in _attr) {
			 _attr[i].isValid(ctxt);
			 _vdomAttr[_attr[i].name] = true;
		}
		
		var _nodeAttr = ctxt.node.attributes;
		
		for(var i in _nodeAttr) {
			if (typeof _vdomAttr[_nodeAttr[i].nodeName] == "undefined") {
				var errMsg = "The attribute " + _nodeAttr[i].nodeName + " is not allowed in " +  ctxt.node.nodeName;
				if (ctxt.wFValidityCheckLevel & 2) {
					if (confirm(errMsg + "\n Should it be removed?")) {
						ctxt.node.removeAttribute(_nodeAttr[i].nodeName);
						return this.isValid(ctxt);
					}
				}
				ctxt.setErrorMessage(errMsg );
			}
		}
		
		ctxt.node.vdom = this;
		ctxt.nextVDOM();
		return true;
	} else {
		return false;
	}
}
