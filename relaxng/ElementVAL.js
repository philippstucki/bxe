//Element.prototype.__defineGetter__(


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
		if (typeof this.vdom._canHaveText == "undefined") {
			debug ("not cached...");
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
			debug("CCCAAACCCHHHHEEEEEDDDD");
			return this.vdom._canHaveText;
		}
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


