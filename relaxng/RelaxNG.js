

DocumentVDOM.prototype.parseRelaxNG = function () {
	
	//do includes
	this.parseIncludes();

	var rootChildren = this.xmldoc.documentElement.childNodes;

	for (var i = 0; i < rootChildren.length; i++) {
		if (rootChildren[i].isRelaxNGElement("start")) {
			this.parseStart(rootChildren[i]);
		}
	}
	return true;
}

DocumentVDOM.prototype.parseIncludes = function() {
	var rootChild = this.xmldoc.documentElement.firstChild;
	var alreadyNext;
	this.replaceIncludePaths(this.xmldoc,this.directory);
	while (rootChild) {
		alreadyNext = false;
		if (rootChild.isRelaxNGElement("include")) {
			var td = new mozileTransportDriver("http");
			var href = rootChild.getAttribute("href");
			bxe_about_box.addText(rootChild.getAttribute("href") + " " );
			var req =  td.load(href, null, false);
			if (req.isError) {
				debug("!!!RelaxNG file " + rootChild.getAttribute("href") + " could not be loaded!!!")
			} else {
				this.replaceIncludePaths(td.document,href);
				if (td.document.documentElement.isRelaxNGElement("grammar")) {
					var child = td.document.documentElement.firstChild;
					var insertionNode = rootChild.nextSibling;
					while (child) {
						var newChild = this.xmldoc.importNode(child,true);
						rootChild.parentNode.insertBefore(newChild,insertionNode);
						child = child.nextSibling;
					}
				}
			}
			var rootChildOld = rootChild;
			var rootChild = rootChild.nextSibling;
			alreadyNext = true;
			rootChildOld.parentNode.removeChild(rootChildOld);
		}
		if (!alreadyNext) {
			rootChild = rootChild.nextSibling;
		}
	}

}

DocumentVDOM.prototype.replaceIncludePaths = function(doc, currentFile) {
	var includes = doc.documentElement.getElementsByTagNameNS("http://relaxng.org/ns/structure/1.0","include");
	var workingdir = bxe_getDirPart(currentFile);
	//replace includes with fulluri
	var href;
	for (var i = 0; i < includes.length; i++) {
		href = includes[i].getAttribute("href");
		if (href.indexOf("/") != 0  && href.indexOf("://") < 0) {
			href = workingdir + href;
		}
		includes[i].setAttribute("href", href);
	}
}
var rng_nsResolver;
DocumentVDOM.prototype.parseStart = function(node) {
	var startChildren = node.childNodes;
	rng_nsResolver = new bxe_RelaxNG_nsResolver(this.xmldoc.documentElement);
	
	for (var i = 0; i < startChildren.length; i++) {
		if (startChildren[i].isRelaxNGElement("element")) {
			var startElement = new ElementVDOM(startChildren[i]);
			this.firstChild = startElement;
			startElement.parentNode = this;
			var nsParts = rng_nsResolver.parseNodeNameOnElement(startChildren[i]);
			startElement.nodeName = nsParts.nodeName;
			startElement.localName = nsParts.localName;
			startElement.namespaceURI = nsParts.namespaceURI;
			startElement.prefix = nsParts.prefix;
			startElement.canBeRoot = true;
			startElement.nextSibling = null;
			startElement.previousSibling = null;
			
			break;
		} 
	}
	
	startElement.parseChildren();
	dump("RelaxNG is parsed\n");

}


function bxe_RelaxNG_nsResolver(node) {
	var rootAttr = node.attributes;
	this.defaultNamespace = null;
	this.namespaces = new Array();
	for(var i = 0; i < rootAttr.length; i++) {
		if (rootAttr[i].namespaceURI == "http://www.w3.org/2000/xmlns/") {
			this.namespaces[rootAttr[i].localName] = rootAttr[i].value;
		} else if (rootAttr[i].localName == "ns") {
			this.defaultNamespace= rootAttr[i].value;
		}
	}
}
bxe_RelaxNG_nsResolver.prototype.lookupNamespaceURI = function(prefix) {
	if (this.namespaces[prefix]) {
		return this.namespaces[prefix];
	}
	return null;
}

bxe_RelaxNG_nsResolver.prototype.parseNodeNameOnElement = function(node) {
	var nodename = node.getAttribute("name");
	if (nodename) {
		return this.parseNodeName(nodename);
	}
	// no attribute name, search for childnode with name attribute
	var child = node.firstChild;
	var ret = new Object();
	while (child) {
		if (child.nodeType == 1 && child.localName == "name") {
			child.getAttribute("ns");
			ret.namespaceURI = child.getAttribute("ns");
			ret.localName = child.firstChild.data;
			ret.prefix = "";
			return ret;
		}
		child = child.nextSibling;
	}
	
}

bxe_RelaxNG_nsResolver.prototype.parseNodeName = function(nodename) {
	var spli = nodename.split(":");
	var ret = new Object;
	ret.nodeName = nodename;
	
	if (spli.length > 1) {
		ret.localName = spli[1];
		ret.namespaceURI = this.lookupNamespaceURI(spli[0]);
		ret.prefix = spli[0];
	} else {
		ret.localName = spli[0];
		ret.namespaceURI = this.defaultNamespace;
		ret.prefix = "";
	}
	return ret;
	
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
	
//	dump ("isRelaxNGElement" + this.nodeType  +  " " + this.nodeName + " " + this.hasRelaxNGNamespace + "\n");
	if (this.nodeType == 1 && this.nodeName == nodename && this.hasRelaxNGNamespace) {
		return true;
	} else {
		return false;
	}
}
	

NodeVDOM.prototype.parseChildren = function(node) {
	var childNodes;
	
	if (node) {
		childNodes = node.childNodes;
	} else {
		childNodes = this.node.childNodes;
	}
	var newChoice;
	var newOneOrMore;
	
	
	for (var i = 0; i < childNodes.length; i++) {
		if (childNodes[i].isRelaxNGElement("element")) {
			var newElement = new ElementVDOM(childNodes[i]);
			var nsParts = rng_nsResolver.parseNodeNameOnElement(childNodes[i]);
			newElement.nodeName = nsParts.nodeName;
			newElement.localName = nsParts.localName;
			newElement.namespaceURI = nsParts.namespaceURI;
			newElement.prefix = nsParts.prefix;
			this.appendChild(newElement);
			newElement.parseChildren();
			
		} else if (childNodes[i].isRelaxNGElement("ref")) {
			//FIXME this can be done smarter... cache the defines.
			var grammarChild = this.node.ownerDocument.documentElement.childNodes;
			//dump ("ref: " + childNodes[i].getAttribute("name") +"\n");
			for (var j = 0; j < grammarChild.length; j++) {
				if (grammarChild[j].isRelaxNGElement("define") && grammarChild[j].getAttribute("name") == childNodes[i].getAttribute("name")) {
					//dump ("define" + grammarChild[j].getAttribute("name") +"\n"); 
					this.parseChildren(grammarChild[j]);
				}
			}
		} 

		else if (childNodes[i].isRelaxNGElement("oneOrMore")) {
			newOneOrMore = new OneOrMoreVDOM(childNodes[i]);
			this.appendChild(newOneOrMore)
			newOneOrMore.parseChildren(childNodes[i]);
			

		} else if (childNodes[i].isRelaxNGElement("text")) {
			this.appendChild(new TextVDOM(childNodes[i]));

		} else if (childNodes[i].isRelaxNGElement("zeroOrMore")) {
			newOneOrMore = new OneOrMoreVDOM(childNodes[i]);
			this.appendChild(newOneOrMore);
			newOneOrMore.appendChild(new EmptyVDOM());
			newOneOrMore.parseChildren(childNodes[i]);
			
		} else if (childNodes[i].isRelaxNGElement("attribute")) {
			if (this.node.localName == "optional") {
				this.parentNode.addAttributeNode(new AttributeVDOM(childNodes[i]), "optional");
			} else {
				this.addAttributeNode(new AttributeVDOM(childNodes[i]), "optional");
			}
		} else if (childNodes[i].isRelaxNGElement("optional")) {
			newChoice = new ChoiceVDOM(childNodes[i]);
			this.appendChild(newChoice);
			newChoice.appendChild(new EmptyVDOM());
			newChoice.parseChildren();
		}
		else if (childNodes[i].isRelaxNGElement("choice")) {
			newChoice = new ChoiceVDOM(childNodes[i]);
			this.appendChild(newChoice);
			newChoice.parseChildren();
		}
	}
}

ChoiceVDOM.prototype = new NodeVDOM();

ChoiceVDOM.prototype.isValid = function(ctxt) {
	var child = this.firstChild;
	//dump ("Choice.isValid: " + this.nodeName+"\n");
	var hasEmpty = false;
	while (child) {
		//dump ("Choice.child.isValid: " + child.nodeName + "\n");
		if (child.type == "RELAXNG_EMPTY") {
			hasEmpty = true;
		}
		if (child.isValid(ctxt)) {
			ctxt.vdom = this;
			return true;
		}
		child= child.nextSibling;
	}
	if (hasEmpty) {
		var vdom = ctxt.nextVDOM();
		if (vdom) {
			return vdom.isValid(ctxt);
		}
	}
	return false;
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

EmptyVDOM.prototype.isValid  = function() {
	return false;
}
TextVDOM.prototype = new NodeVDOM();

function TextVDOM(node ) {
	this.node = node;
	this.type = "RELAXNG_TEXT";
	this.nodeName = "RELAXNG_TEXT";
}

TextVDOM.prototype.isValid = function(ctxt) {
	//dump("TextVDOM.isValid :" + ctxt.node.data + ":\n");
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
	this.hit = false;
}

OneOrMoreVDOM.prototype.isValid = function(ctxt) {
	var child = this.firstChild;
	//dump ("OneorMore.isValid:\n");
	while (child) {
		//dump ("OneorMore.child.isValid: " + child.nodeName + "\n");
		if (child.isValid(ctxt)) {
			ctxt.vdom = this;
			this.hit = true;
			return true;
		}
		child = child.nextSibling;
	}
	if (this.hit) {
		var vdom = ctxt.nextVDOM();
		if (vdom) {
			return vdom.isValid(ctxt);
		} 
	}
	return false;
}

OneOrMoreVDOM.prototype.allowedElements = function() {
	var child = this.firstChild;
	var ac = new Array();
	
	while (child) {
		var subac = child.allowedElements();
		if (subac.nodeName) {
			ac.push(subac);
		} else {
			for (var i = 0; i < subac.length; i++) {
				ac.push(subac[i]);
			}
		}
		child = child.nextSibling;
	}
	return ac;
	
}

ChoiceVDOM.prototype.allowedElements = function() {
	var child = this.firstChild;
	var ac = new Array();
	
	while (child) {
		var subac = child.allowedElements();
		if (subac && subac.nodeName) {
			ac.push(subac);
		} else if (subac) {
			for (var i = 0; i < subac.length; i++) {
				ac.push(subac[i]);
			}
		}
		child = child.nextSibling;
	}
	
	return ac;
	
}

ElementVDOM.prototype.allowedElements = function() {
	var nodeName = "" ;
	if (this.prefix) {
		nodeName = this.prefix +":";
	}
	return {"nodeName":nodeName + this.localName, "namespaceURI": this.namespaceURI, "localName": this.localName};
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
	for ( i in this.attributes) {
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


XMLNode.prototype.__defineGetter__(
"isWhitespaceOnly",
function()
{
	if (this.nodeType == 3) {
		if(/\S+/.test(this._node.nodeValue)) // any non white space visible characters
			return false;
		
		return true;
	} else {
		return false;
	}
}
);

