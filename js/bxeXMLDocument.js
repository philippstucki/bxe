XMLDocument.prototype.init= function (startNode) {
	if (!startNode) {
		startNode = this.documentElement;
	}
	var walker = this.createTreeWalker(
		startNode,NodeFilter.SHOW_ALL,
	{
		acceptNode : function(node) {			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);

	var node = startNode;
	var firstChild = false;
	if (startNode == this.documentElement) {
		this.XMLNode = new XMLNodeDocument();
		this.XMLNode._node = this;
	}
	do  {
		if (node.nodeType == 1) {
			node.XMLNode = new XMLNodeElement(node);
		} else {
			node.XMLNode = new XMLNode(node);
		}
		node = walker.nextNode();
	}  while(node );
	
	walker.currentNode = startNode;
	if (startNode == this.documentElement) {
		this.XMLNode.documentElement = this.documentElement.XMLNode;
		this.XMLNode.nodeType = 9;
		this.documentElement.XMLNode.parentNode = this.XMLNode;
	} else {
	}
	
	node = walker.currentNode;
	do  {

		x = node.XMLNode;
		x.ownerDocument = this.XMLNode;
		if (node.parentNode) {
			x.parentNode = node.parentNode.XMLNode;
		}
		if (node.previousSibling) {
			x.previousSibling = node.previousSibling.XMLNode;
		}
		if (node.nextSibling) {
			x.nextSibling = node.nextSibling.XMLNode;
		}
		if (node.firstChild) {
			x.firstChild = node.firstChild.XMLNode;
		}
		if (node.lastChild) {
			x.lastChild = node.lastChild.XMLNode;
		}
		x.nodeType = node.nodeType;
		x.prefix = node.prefix;
		node = walker.nextNode();
	}  while(node );
	return startNode.XMLNode;
/*	var xw = new XMLNodeWalker(this.documentElement.XMLNode.firstChild);
	node = xw.currentNode;
	while (node) {
		
		dump(node + node.localName + "\n");
		node = xw.nextNode();
		
	}*/
	
	
}


XMLDocument.prototype.insertIntoHTMLDocument = function(htmlnode) {

	var nsResolver = new bxe_nsResolver(this.documentElement);

	var nodes = bxe_getAllEditableAreas();
	var bxe_areaHolder;
	for (var i = 0; i < nodes.length; i++) {

		nodes[i].removeAllChildren();
		var xpath = nodes[i].getAttribute("bxe_xpath");
		var xmlresult = this.evaluate(xpath, this.documentElement, nsResolver, 0, null);

		if (document.defaultView.getComputedStyle(nodes[i], null).getPropertyValue("display") == "inline") { 
			bxe_areaHolder = document.createElement("span");
			nodes[i].display = "inline";
		} else {
			bxe_areaHolder = document.createElement("div");
			nodes[i].display = "block";
		}
		bxe_areaHolder.setAttribute("name","bxe_areaHolder");
		nodes[i].parentNode.insertBefore(bxe_areaHolder,nodes[i]);
		bxe_areaHolder.appendChild(nodes[i]);
		xmlnode = xmlresult.iterateNext();
		var xmlresults = new Array;
		while (xmlnode) {
			xmlresults.push(xmlnode);
			xmlnode = xmlresult.iterateNext();
		}
		for (var j = 0; j < xmlresults.length; j++) {
			if (xmlresults[j].nodeType == 1) {
				var fc = xmlresults[j].XMLNode.insertIntoHTMLDocument(nodes[i],true);
				
			} else {
				xmlresults[j].XMLNode.insertIntoHTMLDocument(nodes[i],false);
			}
			xmlresults[j].XMLNode.xmlBridge = xmlresults[j]; 
			var menu = new Widget_AreaInfo(nodes[i]);
			bxe_alignAreaNode(menu,nodes[i]);
			nodes[i].AreaInfo = menu;
			menu.editableArea = nodes[i];
			
		}
		
	}
	
	bxe_draw_widgets();
}

XMLDocument.prototype.checkParserError = function()
{
	if(this.documentElement && this.documentElement.nodeName=="parsererror")
	{
		var alerttext = "Parse Error: \n \n";
		alerttext += this.documentElement.firstChild.data +"\n\n";
		alerttext += "Sourcetext:\n\n";
		alerttext += this.documentElement.childNodes[1].firstChild.data;
		
		return (alerttext);
	}
	return true;
}

XMLDocument.prototype.transformToXPathMode = function(xslfile) {
	var xsldoc = document.implementation.createDocument("", "", null);
	xsldoc.addEventListener("load", onload_xsl, false);
	xsldoc.xmldoc = this;
	try {
		xsldoc.load(xslfile);
	} catch(e) {
		alert("The xslfile: '" + xslfile + "' was not found");
	}

	function onload_xsl(e) {
		xsldoc = e.currentTarget;
		var xsltransformdoc = document.implementation.createDocument("", "", null);
		xsltransformdoc.addEventListener("load", onload_xsltransform, false);
		xsltransformdoc.xsldoc = xsldoc;
		xsltransformdoc.load(mozile_root_dir + "xsl/transformxsl.xsl");
	}
	
	function onload_xsltransform (e) {
		var processor = new XSLTProcessor();
		xsltransformdoc = e.currentTarget;
		processor.importStylesheet(xsltransformdoc);
		try {
			var newDocument = processor.transformToDocument(xsltransformdoc.xsldoc);
		}
		catch (e) {
			alert ( e + "\n\n xsltransformdoc.xsldoc is : " + xsltransformdoc.xsldoc);
		}
		processor = new XSLTProcessor();
		try {
			processor.importStylesheet(newDocument);
		} catch(e) {
			alert("Something went wrong during importing the XSLT document.\n" + bxe_catch_alert_message(e) + "\n" + newDocument.saveXML(newDocument));
		}
		var xmldoc = processor.transformToFragment(xsltransformdoc.xsldoc.xmldoc,document);
		var bxe_area = document.getElementById("bxe_area");
		bxe_area.parentNode.replaceChild(xmldoc,bxe_area);
		xsltransformdoc.xsldoc.xmldoc.insertIntoHTMLDocument();
		xml_loaded(xsltransformdoc.xsldoc.xmldoc);
	}
	
}

function XMLNodeDocument () {
	
}

XMLNodeDocument.prototype.validateDocument = function () {
	if (!this.vdom) {
		alert ("no Schema assigned to Document");
		return false;
	}
	
	//check root element
	//var vdomCurrentChild = this.documentElement.vdom.firstChild;
	return this.documentElement._isNodeValid(true);
}

XMLNodeDocument.prototype.__defineGetter__( 
	"documentElement",
	function()
	{
		return this._documentElement;
	}
);

XMLNodeDocument.prototype.__defineSetter__( 
	"documentElement",
	function(value)
	{
		this._documentElement = value;
	}
);

XMLNodeDocument.prototype.buildXML = function() {
	
	var node = this.documentElement.buildXML();
	return node.ownerDocument;
}

XMLNode.prototype.buildXML = function () {
	var nsResolver = new bxe_nsResolver(this.ownerDocument.documentElement);
	
	var walker = new XMLNodeWalker(this);
	var srcNode;
	if (this.xmlBridge) {
		srcNode = this.xmlBridge;
	} else {
		srcNode = this._node;
	}
	srcNode.removeAllChildren();
	var xmldoc = srcNode.ownerDocument;
	var node = walker.nextNode();
	
	srcNode.XMLNode._sernode = srcNode;
	var child ;
	var attribs;
	while (node) {
		if (node.nodeType == 1 && node.localName != 0){
			child = xmldoc.createElementNS(node.namespaceURI, node.localName);
			child.prefix = nsResolver.lookupNamespacePrefix(node.namespaceURI);
			attribs = node.attributes;
			for (var i = 0; i< attribs.length; i++) {
				child.setAttributeNode(attribs[i]);
			}
		} else if (node.nodeType == 3) {
			child = xmldoc.createTextNode(node.data);
		} else {
			child = xmldoc.importNode(node._node.cloneNode(true),true);
		}
		
		node._sernode = child;
		if (node.parentNode && node.parentNode._sernode) {
			node.parentNode._sernode.appendChild(child);
		}
		node = walker.nextNode();
	}
	
	return srcNode;
}


