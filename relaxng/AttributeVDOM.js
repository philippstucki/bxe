function AttributeVDOM(node, option) {
	this.name = node.getAttribute("name");
	this.dataType = "NCName";
	if (option == "optional") {
		this.optional = true;
	} else {
		this.optional = false;
	}
	for (var i = 0; i < node.childNodes.length;i++  ) {
		if (node.childNodes[i].nodeName == "data") {
			this.dataType = node.childNodes[i].getAttribute("type");
		}
		else if (node.childNodes[i].nodeName == "choice") {
			this.dataType = "choice";
			this.choices = new Array();
			var choice = node.childNodes[i].childNodes;
			for (var j = 0; j < choice.length; j++) {
				if (choice[j].localName == "value" && choice[j].firstChild) {
				this.choices.push(choice[j].firstChild.data);
				}
			}
		} 
	}
	
	
}

AttributeVDOM.prototype.isValid = function() {
	debug ("AttributeVDOM.prototype.isValid");
	return true;
}