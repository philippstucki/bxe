Element.prototype.__defineGetter__(
"allowedChildren", function() {
	
	var ctxt = new ContextVDOM(this,this.vdom);
	var ac = new Array();

	if (ctxt.node) {
		do {
			subac = ctxt.vdom.allowedElements()
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

}
)

Element.prototype.isAllowedChild = function(node) {
	
	var ac = this.allowedChildren;
	for (var i = 0; i < ac.length; i++) {
		if (ac[i].localName == node.localName && ac[i].namespaceURI == node.namespaceURI) {
			return true;
		}
	}
	return false;
		
}


