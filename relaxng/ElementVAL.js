//Element.prototype.__defineGetter__(


XMLNodeElement.prototype.__defineGetter__(
"allowedChildren", function() {
	
	// everything which isn't an Element, can't have children
	var ctxt = new ContextVDOM(this,this.vdom);
	var ac = new Array();
	var subac = null;
	try{
		if (ctxt.node ) {
			do {
				subac = ctxt.vdom.allowedElements();
				
				if (subac && subac.nodeName) {
					ac.push(subac);
				} else if (subac) {
					for (var i = 0; i < subac.length; i++) {
						ac.push(subac[i]);
					}
				}
			} while (ctxt.nextVDOM())
		}
		return ac;
	} catch(e){
		/*bxe_catch_alert(e);
		alert(ctxt.vdom.nodeName);*/
		return new Array()
	}
}
)

//Element.prototype.isAllowedChild = function(node) {
XMLNodeElement.prototype.isAllowedChild = function(node) {
	
	var ac = this.allowedChildren;
	if (ac) {
	for (var i = 0; i < ac.length; i++) {
		if (ac[i].localName == node.localName && ac[i].namespaceURI == node.namespaceURI) {
			return true;
		}
	}
	}
	return false;

}


