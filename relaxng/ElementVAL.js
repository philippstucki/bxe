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
// $Id: ElementVAL.js,v 1.19 2004/02/20 11:25:52 chregu Exp $


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

XMLNodeElement.prototype.isValidNextSibling = function(ctxt) {
	if (!ctxt) {
		try {
			if (this.parentNode.vdom) {
				ctxt = new ContextVDOM(this.parentNode, this.parentNode.vdom);
			} else {
				dump(this.previousSibling.nodeName +" jjj \n");
				return false;
			}
	} catch (e) { bxe_catch_alert(e); debug ("couldn't make new context..");}
	}
	
	
	do {
		if (ctxt.node.nodeType == "3" && ctxt.node.isWhitespaceOnly) {
			continue;
		} 	
		if (ctxt.node.nodeType == Node.COMMENT_NODE) {
			continue;
		}
		//FIXME: check CDATA_SECTIONS AS WELL
		if (ctxt.node.nodeType == Node.CDATA_SECTION_NODE) {
			continue;
		}
		var _vdom = ctxt.vdom;
		if (  ctxt.isValid()) {
		} else {
			ctxt.isError = true;
		}
		if (ctxt.node == this) {
			break;
		}
	} while (ctxt.next() );
	
	return (!ctxt.isError);
	
}

XMLNodeElement.prototype.__defineGetter__(
"allowedNextSiblings", function() {
		// everything which isn't an Element, can't have children
	if (typeof this._allowedNextSiblings == "undefined") {
		var ctxt = new ContextVDOM(this.parentNode,this.parentNode.vdom);
		var ac = new Array();
		var subac = null;
		
		
		try{
			if (ctxt.vdom ) {
				do {
					
					subac = ctxt.vdom.allowedElements(ctxt);
					if (subac && subac.nodeName) {
						if (subac.localName != "#text") {
							var bla =  new XMLNodeElement(subac.namespaceURI, subac.localName, 1);
							this.parentNode.insertBeforeIntern(bla,this.nextSibling);
							
							if(bla.isValidNextSibling() ) {
								ac.push(subac);
							}
							bla.unlink();
							bla=null;
						}
						
					} else if (subac) {
						for (var i = 0; i < subac.length; i++) {
							if (subac[i].localName != "#text") {
								var bla =  new XMLNodeElement(subac[i].namespaceURI, subac[i].localName, 1);
								
								this.parentNode.insertBeforeIntern(bla,this.nextSibling);
								
								if(bla.isValidNextSibling()  ) {
									ac.push(subac[i]);
								}
								bla.unlink();
								bla = null;
							}
							
						}
					}
					
				} while (ctxt.nextVDOM())
			}
			ac.sort(bxe_nodeSort);
			
			this._allowedNextSiblings = ac;
			return ac;
		} catch(e){
			dump("end with catch get allowed nextSibling for " + this.nodeName);
			bxe_catch_alert(e);
			return ac;
		} 
	} else { 
		return this._allowedNextSiblings;
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
	if (typeof namespaceURI == "undefined") {
		namespaceURI = "";
	}
	if (ac) {
	for (var i = 0; i < ac.length; i++) {
		dump("."+ ac[i].namespaceURI+". ." + ac[i].localName + "\n");
		if (ac[i].localName == localName && ac[i].namespaceURI == namespaceURI) {
			return true;
		}
	}
	}
	return false;

}


