
XMLDocument.prototype.insertIntoHTMLDocument = function() {
	
	
	this.transformToInternalFormat();
	

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
				nodes[i].xmlNode = xmlnode;
				
				xmlnode.insertIntoHTMLDocument(nodes[i],true);
			} else {
				nodes[i].xmlNode = xmlnode.parentNode;
				xmlnode.insertIntoHTMLDocument(nodes[i]);
			}
			nodes[i].XPath = nodes[i].xmlNode.getXPathString();
			var menu = new Widget_AreaInfo(nodes[i]);
			bxe_alignAreaNode(menu,nodes[i]);
			nodes[i].AreaInfo = menu;
			menu.editableArea = nodes[i];
		}
		
	}
	
	// make menubar
	var menubar = new Widget_MenuBar();
	var img = document.createElement("img");
	img.setAttribute("src","bxe.png");
	
	//imgspan.appendChild(img);
	img.setAttribute("align","right");
	menubar.node.appendChild(img);
	var submenu = new Array("Save",function() {alert("hello")},"Load","load");
	menubar.addMenu("File",submenu);

	var submenu = new Array("Undo",bxe_not_yet_implemented,"Redo",bxe_not_yet_implemented);
	menubar.addMenu("Edit",submenu);
	

	menubar.draw();
	
	//make toolbar
	
	var toolbar = new Widget_ToolBar();
	var menulist = new Widget_MenuList("m",function(e) {eDOMEventCall("changeLinesContainer",document,this.value)});
	menulist.appendItem("H1","h1");
	menulist.appendItem("bar","foo");
	menulist.appendItem("blbla","foo");
	toolbar.addItem(menulist);
	
	
	toolbar.addButtons(buttons);
	

	
	

	
	
	//var button = new Widget_ToolBarButton("italic",1,2);
	//alert(toolbar.node.saveXML(toolbar.node));
	//toolbar.addItem(button);
	
	toolbar.draw();
	
	
	window.setTimeout(bxe_about_box_fade_out, 1000);
	
}
