

DocumentVDOM.prototype.parseRelaxNG = function () {
	//check if it's a schema file
	//parse all global elements and create an ElementVDOM object
	
	var rootChildren = this.xmldoc.documentElement.childNodes;

	for (var i = 0; i < rootChildren.length; i++) {
		if (rootChildren[i].isRelaxNGElement("start")) {
			this.parseStart(rootChildren[i]);
		}
	}
	return true;
}

DocumentVDOM.prototype.parseStart = function(node) {
	var startChildren = node.childNodes;
	
	for (var i = 0; i < startChildren.length; i++) {
		if (startChildren[i].isRelaxNGElement("element")) {
			var startElement = new ElementVDOM(startChildren[i]);
			this.firstChild = startElement;
			startElement.parentNode = this;
			startElement.nodeName = startChildren[i].getAttribute("name");
			startElement.canBeRoot = true;
			startElement.nextSibling = null;
			startElement.previousSibling = null;
			
			break;
		} 
	}
	
	startElement.parseChildren();

}


Node.prototype.__defineGetter__ ("hasRelaxNGNamespace", function() {
	
	if (this.namespaceURI == "http://relaxng.org/ns/structure/1.0") {
		return true;
	} else {
		return false;
	}
}
)
Node.prototype.isRelaxNGElement = function(nodename) {
	
	if (this.nodeType == 1 && this.nodeName == nodename && this.hasRelaxNGNamespace) {
		return true;
	} else {
		return false;
	}
}
	

NodeVDOM.prototype.parseChildren = function(node) {
	if (node) {
		var childNodes = node.childNodes;
	} else {
		var childNodes = this.node.childNodes;
	}
	for (var i = 0; i < childNodes.length; i++) {
		if (childNodes[i].isRelaxNGElement("element")) {
			var newElement = new ElementVDOM(childNodes[i]);
			newElement.nodeName = childNodes[i].getAttribute("name");
			this.appendChild(newElement);
			newElement.parseChildren();
			
		} else if (childNodes[i].isRelaxNGElement("ref")) {
			//FIXME this can be done smarter... cache the defines.
			var grammarChild = this.node.ownerDocument.documentElement.childNodes;
			for (var j = 0; j < grammarChild.length; j++) {
				if (grammarChild[j].isRelaxNGElement("define") && grammarChild[j].getAttribute("name") == childNodes[i].getAttribute("name")) {
					this.parseChildren(grammarChild[j]);
				}
			}
		} 

		else if (childNodes[i].isRelaxNGElement("oneOrMore")) {
			var newOneOrMore = new OneOrMoreVDOM(childNodes[i]);
			this.appendChild(newOneOrMore)
			newOneOrMore.parseChildren(childNodes[i]);
			

		} else if (childNodes[i].isRelaxNGElement("text")) {
			this.appendChild(new TextVDOM(childNodes[i]));

		} else if (childNodes[i].isRelaxNGElement("zeroOrMore")) {
			var newOneOrMore = new OneOrMoreVDOM(childNodes[i]);
			this.appendChild(newOneOrMore);
			newOneOrMore.appendChild(new EmptyVDOM());
			newOneOrMore.parseChildren(childNodes[i]);
			
		} else if (childNodes[i].isRelaxNGElement("attribute")) {
			this.addAttributeNode(new AttributeVDOM(childNodes[i]));
			
			
		} else if (childNodes[i].isRelaxNGElement("optional")) {
			var newChoice = new ChoiceVDOM(childNodes[i]);
			this.appendChild(newChoice);
			newChoice.appendChild(new EmptyVDOM());
			newChoice.parseChildren();
		}
		else if (childNodes[i].isRelaxNGElement("choice")) {
			var newChoice = new ChoiceVDOM(childNodes[i]);
			this.appendChild(newChoice);
			newChoice.parseChildren();
		}
	}
}

ChoiceVDOM.prototype = new NodeVDOM();

ChoiceVDOM.prototype.isValid = function(ctxt) {
	var child = this.firstChild;
	dump ("Choice.isValid:\n");

	while (child) {
		dump ("Choice.child.isValid: " + child.nodeName + "\n");
		if (child.isValid(ctxt)) {
			ctxt.vdom = this;
			return true;

		}
		child= child.nextSibling;
	}
}

function ChoiceVDOM(node) {
	this.node = node;
	this.type = "RELAXNG_CHOICE";
	this.nodeName = "RELAXNG_CHOICE";
	this.attributes = new Array();
}
EmptyVDOM.prototype = new NodeVDOM();

function EmptyVDOM(node) {
	this.node = node;
	this.type = "RELAXNG_EMPTY";
	this.nodeName = "RELAXNG_EMPTY";
}
TextVDOM.prototype = new NodeVDOM();

function TextVDOM(node ) {
	this.node = node;
	this.type = "RELAXNG_TEXT";
	this.nodeName = "RELAXNG_TEXT";
}

TextVDOM.prototype.isValid = function(ctxt) {
	dump("TextVDOM.isValid :" + ctxt.node.data + ":\n");
	if (ctxt.node.nodeType == 3) {
		return true;
	} else {
		return false;
	}
	
}

OneOrMoreVDOM.prototype = new NodeVDOM();

function OneOrMoreVDOM(node) {
	this.type = "RELAXNG_ONEORMORE";
	this.nodeName = "RELAXNG_ONEORMORE";
	this.node = node;
}

OneOrMoreVDOM.prototype.isValid = function(ctxt) {
	var child = this.firstChild;
	dump ("OneorMore.isValid:\n");
	while (child) {
		dump ("OneorMore.child.isValid: " + child.nodeName + "\n");
		if (child.isValid(ctxt)) {
			ctxt.vdom = this;
			return true;
		}
		child = child.nextSibling;
	}
	return false;
}

ElementVDOM.prototype.__defineSetter__("nodeName", function(name) {
	var html = true;
	if (html) {
		this._xmlnodeName = name;
	}
}
)

ElementVDOM.prototype.__defineGetter__("nodeName", function(name) {
	return this._xmlnodeName;
}
)



DocumentVDOM.prototype.getStructure = function() {
	
	
	 return "\n"+ this.firstChild.getStructure();
}



NodeVDOM.prototype.getStructure = function(level) {
	var out = this.nodeName + " " + this.minOccurs + " " + this.maxOccurs + "\n";
	var child = this.firstChild;
	if (!level ) {
		level = 0;
	}
	var indent = "";
	for (var i = 0; i <= level; i++) {
		indent += "  ";
	}
	for (var i in this.attributes) {
		out += indent + "@" + i + " " + this.attributes[i].dataType + "\n";
		
	}
	if ( typeof child != "undefined") {
		while ( child != null && child != "undefined") {
			
			//out += indent + child.nodeName + "\n";
			
			out += indent + child.getStructure(level + 1);
			child = child.nextSibling;
		} 
		
	}
	return out;
}


Text.prototype.__defineGetter__(
	"isWhitespaceOnly",
	function()
	{
		if(/\S+/.test(this.nodeValue)) // any non white space visible characters
			return false;

		return true;
	}
);

