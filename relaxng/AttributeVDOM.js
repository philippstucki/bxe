function AttributeVDOM(node) {
	this.name = node.getAttribute("name");
	this.dataType = "NCName";
	//dump(node.getAttribute("name") + ": " + node.childNodes.length + "\n");
	for (var i = 0; i < node.childNodes.length;i++  ) {
		//dump(i + node.childNodes[i].nodeName );
		if (node.childNodes[i].nodeName == "data") {
			this.dataType = node.childNodes[i].getAttribute("type");
		}
		
	}
	
}