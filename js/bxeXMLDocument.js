
XMLDocument.prototype.insertIntoHTMLDocument = function() {
	
	
	//this.transformToInternalFormat();
	

	//var nsResolver = this.createNSResolver(this.documentElement);
	var nsResolver = new bxe_nsResolver(this.documentElement);
	
	
	var nodes = bxe_getAllEditableAreas();
	
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].removeAllChildren();
		var xpath = nodes[i].getAttribute("bxe_xpath");
		var xmlresult = document.evaluate(xpath, this.documentElement, nsResolver, 0, null);
		if (document.defaultView.getComputedStyle(nodes[i], null).getPropertyValue("display") == "inline") { 
			var bxe_areaHolder = document.createElement("span");
			nodes[i].display = "inline";
		} else {
			var bxe_areaHolder = document.createElement("div");
			nodes[i].display = "block";
		}
		bxe_areaHolder.setAttribute("name","bxe_areaHolder");
		nodes[i].parentNode.insertBefore(bxe_areaHolder,nodes[i]);
		bxe_areaHolder.appendChild(nodes[i]);
		while (xmlnode = xmlresult.iterateNext()) {
			if (xmlnode.nodeType == 1) {
				nodes[i].XMLNode.setNode( xmlnode);
				xmlnode.insertIntoHTMLDocument(nodes[i],true);
			} else {
				nodes[i].XMLNode._xmlnode = xmlnode.parentNode;
				xmlnode.insertIntoHTMLDocument(nodes[i]);
			}
			var menu = new Widget_AreaInfo(nodes[i]);
			bxe_alignAreaNode(menu,nodes[i]);
			nodes[i].AreaInfo = menu;
			menu.editableArea = nodes[i];
		}
		
	}
	
	bxe_draw_widgets();
}





