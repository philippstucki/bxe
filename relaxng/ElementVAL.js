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
// $Id: ElementVAL.js,v 1.14 2004/01/13 09:00:20 chregu Exp $


XMLNodeElement.prototype.__defineGetter__(
"allowedChildren", function() {
	
	// everything which isn't an Element, can't have children
	if (typeof this._allowedChildren == "undefined") {
		var ctxt = new ContextVDOM(this,this.vdom);
		var ac = new Array();
		var subac = null;
		try{
			if (ctxt.vdom ) {
				do {
					subac = ctxt.vdom.allowedElements(ctxt);
					
					if (subac && subac.nodeName) {
						ac.push(subac);
					} else if (subac) {
						for (var i = 0; i < subac.length; i++) {
							ac.push(subac[i]);
						}
					}
				} while (ctxt.nextVDOM())
			}
			ac.sort(bxe_nodeSort);

			this._allowedChildren = ac;
			return ac;
		} catch(e){
			debug("end with catch get allowed Children for " + this.nodeName);
			bxe_catch_alert(e);
			return ac;
		} 
	} else { 
		return this._allowedChildren;
	}
}
)

XMLNodeElement.prototype.__defineGetter__ ("canHaveText",
	function() {
		
		if (typeof this.vdom == "undefined") {
			//bad hack...
			return true;
		}
		else if ( typeof this.vdom._canHaveText == "undefined") {
			var ac = this.allowedChildren;
			if (ac) {
				for (var i = 0; i < ac.length; i++) {
					if (ac[i].nodeType == 3) {
						this.vdom._canHaveText = true;
						return true;
					}
				}
			}
			this.vdom._canHaveText = false;
			return false;
		} else {
			return this.vdom._canHaveText;
		}
		return true;
	}
	)
	

//Element.prototype.isAllowedChild = function(node) {
XMLNodeElement.prototype.isAllowedChild = function(namespaceURI, localName) {
	
	var ac = this.allowedChildren;
	if (ac) {
	for (var i = 0; i < ac.length; i++) {
		if (ac[i].localName == localName && ac[i].namespaceURI == namespaceURI) {
			return true;
		}
	}
	}
	return false;

}


