Element.prototype.__defineGetter__(
"allowedChildren", function() {
	
	var ctxt = new ContextVDOM(this,this.vdom);
		var ac = new Array();

	if (ctxt.node) {
		do {
			subac = ctxt.vdom.allowedElements()
			if (typeof subac == "string") {
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


