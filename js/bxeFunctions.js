const BXENS = "http://bitfluxeditor.org/namespace";
const XMLNS = "http://www.w3.org/2000/xmlns/";

function __bxeSave(e) {
	
	var td = new mozileTransportDriver("webdav");
	td.Docu = this;
	if (e.additionalInfo ) {
		td.Exit = e.additionalInfo.exit;
	} else {
		td.Exit = null;
	}
	var xmlstr = bxe_getXmlDocument()
	function callback (e) {
		if (e.isError) {
			alert("Document couldn't be saved\n"+e.statusText);
			return;
		}
		alert("Document Saved");
		if (e.td.Exit) {
			eDOMEventCall("Exit",document);
		}
	}
	td.save(bxe_config.xmlfile, xmlstr, callback);
}

function bxe_getXmlDocument() {
	
	var areaNodes = bxe_getAllEditableAreas();
	var xml;
	for (var i = 0; i < areaNodes.length; i++) {
		if ((areaNodes[i]._SourceMode)) {
			alert("Editable areas must not be in SourceMode while saving. Please switch it");
			return false;
		}
		//xmldoc = areaNodes[i].XMLNode.insertIntoXMLDocument(xmldoc);
		xml = areaNodes[i].XMLNode.buildXML();
		
	}
	return xml.ownerDocument.saveXML(xml.ownerDocument);

//	return areaNodes[0].XMLNode.ownerDocument.buildXML();
}

function bxe_getRelaxNGDocument() {
	
	var areaNodes = bxe_getAllEditableAreas();
	var xml = areaNodes[0].XMLNode.ownerDocument._vdom.xmldoc;
	return xml.saveXML(xml);

//	return areaNodes[0].XMLNode.ownerDocument.buildXML();
}

/* Mode toggles */

function bxe_toggleTagMode(e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	var xmldoc = document.implementation.createDocument("","",null);
	
	if (!editableArea._TagMode) {
		createTagNameAttributes(editableArea);
		/*editableArea.addEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.addEventListener("DOMNodeRemoved",addTagnames_bxe,false);
		editableArea.addEventListener("DOMAttrModified",addTagnames_bxe,false);*/
		editableArea._TagMode = true;
		editableArea.AreaInfo.TagModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else {
		var walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			true);
		var node = editableArea;
		/*editableArea.removeEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMAttrModified",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMNodeRemoved",addTagnames_bxe,false);*/
		
		do {
			if (node.hasChildNodes()) {
				node.removeAttribute("_edom_tagnameopen");
			}
			node.removeAttribute("_edom_tagnameclose");
			node =   walker.nextNode() 
		} while(node)
		editableArea._TagMode = false;
		editableArea.AreaInfo.TagModeMenu.Checked = false;
		editableArea.AreaInfo.NormalModeMenu.Checked = true;
	}
	}
	catch(e) {alert(e);}

}

function bxe_toggleNormalMode (e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	if (editableArea._TagMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleTagMode");
	}
	editableArea.AreaInfo.NormalModeMenu.Checked = true;
	}
	catch(e) {alert(e);}

}

function addTagnames_bxe (e) {		
	
	e.currentTarget.removeEventListener("DOMAttrModified",addTagnames_bxe,false);
	
	var nodeTarget = e.target; 
try {
	createTagNameAttributes(nodeTarget.parentNode.parentNode);
} catch (e) {bxe_catch_alert(e);}
	e.currentTarget.addEventListener("DOMAttrModified",addTagnames_bxe,false);
	
}

function createTagNameAttributes(startNode) {
	var walker = startNode.XMLNode.createTreeWalker();
	var node = walker.nextNode();
	while( node) {
		if (node.nodeType == 1) {
			var xmlstring = node.getBeforeAndAfterString(false,true);
			node._node.setAttribute("_edom_tagnameopen",xmlstring[0]);
			if (xmlstring[1]) {
				node._node.setAttribute("_edom_tagnameclose",xmlstring[1]);
			}
		}
		node = walker.nextNode();
	}
}

function bxe_toggleSourceMode(e) {
	try {
	var editableArea = e.target;

	if (editableArea._TagMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleTagMode");
	}
	if (!editableArea._SourceMode) {
		var xmldoc = editableArea.convertToXMLDocFrag();

		editableArea.removeAllChildren();
		editableArea.setStyle("white-space","-moz-pre-wrap");
		
		var xmlstr = document.saveChildrenXML(xmldoc,true);
		editableArea.appendChild(document.createTextNode(xmlstr.str));
		editableArea.XMLNode.prefix = xmlstr.rootPrefix;
		editableArea._SourceMode = true;
		editableArea.AreaInfo.SourceModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else {
		var rootNodeName = editableArea.XMLNode.localName;
		if (editableArea.XMLNode.prefix != null) {
			rootNodeName = editableArea.XMLNode.prefix +":"+rootNodeName;
		}
		var innerHTML = '<'+rootNodeName;
		ns = editableArea.XMLNode.xmlBridge.getNamespaceDefinitions();
		for (var i in ns ) {
			if  (i == "xmlns") {
				innerHTML += ' xmlns="'+ ns[i] + '"';
			} else {
				innerHTML += ' xmlns:' + i + '="' + ns[i] +'"';
			}
		}
		innerHTML += '>'+editableArea.getContent()+'</'+rootNodeName +'>';
		
		var innerhtmlValue = documentLoadXML( innerHTML);
		if (innerhtmlValue) {
			editableArea.XMLNode._node = editableArea.XMLNode.xmlBridge;
			
			editableArea.XMLNode.removeAllChildren();
			editableArea.XMLNode._node.removeAllChildren();
			
			editableArea.XMLNode._node.appendAllChildren(innerhtmlValue.firstChild);
			
			//preserve vdom...
			var eaVDOM = editableArea.XMLNode._vdom;
			editableArea.XMLNode = editableArea.XMLNode._node.ownerDocument.init(editableArea.XMLNode._node);
			editableArea.XMLNode.vdom = eaVDOM;
			editableArea.removeAllChildren();
			/*
			
			innerhtmlValue.documentElement.insertIntoHTMLDocument(editableArea,true);
			*/
			editableArea.setStyle("white-space",null);
			var xmlnode = editableArea.XMLNode._node;
			
			editableArea.XMLNode.insertIntoHTMLDocument(editableArea,true);
			editableArea.XMLNode.xmlBridge = xmlnode;
			dump("valid? " +editableArea.XMLNode.isNodeValid() + "\n");
			editableArea._SourceMode = false;
			editableArea.AreaInfo.SourceModeMenu.Checked = false;
			editableArea.AreaInfo.NormalModeMenu.Checked = true;
			/*normalize namesapces */
			if (editableArea.XMLNode.xmlBridge.parentNode.nodeType == 1) {
				nsparent = editableArea.XMLNode.xmlBridge.parentNode.getNamespaceDefinitions();
				for (var prefix in nsparent) {
					if (nsparent[prefix] == ns[prefix]) {
						xmlnode.removeAttributeNS(XMLNS,prefix);
					}
				}
			}
			
		}
	}
	}
	catch (e) {bxe_catch_alert(e);}

}

function bxe_toggleTextClass(e) {
	var sel = window.getSelection();
	sel.toggleTextClass(e.additionalInfo.localName);
	sel = window.getSelection();
	var _node = sel.anchorNode.parentNode;
	_node.XMLNode.namespaceURI = e.additionalInfo.namespaceURI;
	_node.XMLNode = new XMLNode(  e.additionalInfo.namespaceURI,   e.additionalInfo.localName, 1);
	_node.parentNode.updateXMLNode();
}


function bxe_NodeInsertedParent(e) {
//	alert("document wide");
	var oldNode = e.target.XMLNode;
	var parent = e.additionalInfo;
	
	parent.XMLNode =  new XMLNode(parent);
	parent.XMLNode.previousSibling = oldNode.previousSibling;
	parent.XMLNode.nextSibling = oldNode.nextSibling;
	if (parent.XMLNode.previousSibling) {
		parent.XMLNode.previousSibling.nextSibling = parent.XMLNode;
	} 
	if (parent.XMLNode.nextSibling) {
		parent.XMLNode.nextSibling.previousSibling = parent.XMLNode;
	}
	parent.XMLNode.firstChild = oldNode;
	parent.XMLNode.lastChild = oldNode;
	parent.XMLNode.parentNode = oldNode.parentNode;
	oldNode.parentNode = parent.XMLNode;
	oldNode.previousSibling = null;
	oldNode.nextSibling = null;
	
}

function bxe_NodeRemovedChild (e) {
	var parent = e.target.XMLNode;
	var oldNode  = e.additionalInfo.XMLNode;
	oldNode.unlink();
}

function bxe_NodeAppendedChild(e) {
	var parent = e.target.XMLNode;
	var newNode  = e.additionalInfo.XMLNode;
	parent.appendChildIntern(newNode);
	
}

function bxe_NodeRemovedChildOnly (e) {
	var parent = e.target.XMLNode;
	var oldNode  = e.additionalInfo.XMLNode;

	var div = oldNode.lastChild;
	if (oldNode.firstChild) {
		var child = oldNode.firstChild;
		while (child ) {
			child.parentNode = oldNode.parentNode;
			child = child.nextSibling;
		}
		oldNode.previousSibling.nextSibling = oldNode.firstChild;
		oldNode.nextSibling.previousSibling = oldNode.lastChild;
		oldNode.firstChild.previousSibling = oldNode.previousSibling;
		oldNode.lastChild.nextSibling = oldNode.nextSibling;
		
	} else {
		oldNode.previousSibling.nextSibling = old.nextSibling;
		oldNode.nextSibling.previousSibling = old.previousSibling;
	}
	if (parent.firstChild == oldNode) {
		parent.firstChild = oldNode.nextSibling;
	}
	if (parent.lastChild == oldNode) {
		parent.lastChild = oldNode.previousSibling;
	}
	//oldNode.unlink();

	
}

function bxe_NodeChanged(e) {

	var newNode = e.target;
	var oldNode = e.additionalInfo.XMLNode;
	newNode.XMLNode = new XMLNode(newNode);
	newNode.XMLNode.previousSibling = oldNode.previousSibling;
	newNode.XMLNode.nextSibling = oldNode.nextSibling;
	newNode.XMLNode.parentNode = oldNode.parentNode;
	newNode.XMLNode.firstChild = oldNode.firstChild;
	newNode.XMLNode.lastChild = oldNode.lastChild;

	if (!newNode.XMLNode.previousSibling ) {
		newNode.XMLNode.parentNode.firstChild = newNode.XMLNode;
	} else {
		newNode.XMLNode.previousSibling.nextSibling = newNode.XMLNode;
	}
	if (!newNode.XMLNode.nextSibling ) {
		newNode.XMLNode.parentNode.lastChild = newNode.XMLNode;
	} else {
		newNode.XMLNode.nextSibling.previousSibling = newNode.XMLNode;
	}
		
	oldNode.unlink();
	

}

function bxe_NodeInsertedBefore(e) {
	try {
	var oldNode = e.target.XMLNode;
	var newNode = e.additionalInfo;

	newNode.XMLNode =  new XMLNode(newNode);
	oldNode.parentNode.insertBeforeIntern(newNode.XMLNode, oldNode);
	if (newNode.firstChild ) {
		newNode.updateXMLNode();
	}
	if (oldNode.firstChild ) {
		oldNode.unlinkChildren();
		oldNode._node.updateXMLNode();
	}
	}
	catch(e) {bxe_catch_alert(e);}

}

function bxe_appendNode(e) {
	var aNode = e.additionalInfo.appendToNode;
	var newNode = new XMLNode(e.additionalInfo.namespaceURI,e.additionalInfo.localName, 1 ) ;
	
	aNode.parentNode.insertAfter(newNode,aNode);
	newNode.setContent("#" + e.additionalInfo.localName + " ");

	var sel = window.getSelection();
	sel.removeAllRanges();
	var rng = document.createRange();
	rng.setStart(newNode._node.firstChild,1);
	rng.setEnd(newNode._node.firstChild,newNode._node.firstChild.data.length-1);
	//dump(e.additionalInfo.localName + " is valid " +_node.XMLNode._xmlnode.isNodeValid(true));
	sel.addRange(rng);
	
}

function bxe_changeLinesContainer(e) {
	var nodeParts = e.additionalInfo.split("=");
	if (nodeParts.length < 2 ) {
		nodeParts[1] = null;
	}
	var newContainer = window.getSelection().changeLinesContainer(nodeParts[0]);
	for(var i=0; i<newContainer.length; i++)
	{ 
		newContainer[i].XMLNode = new XMLNode( nodeParts[1], nodeParts[0], newContainer[i].nodeType);
		newContainer[i].updateXMLNode();
	}
	bxe_delayedUpdateXPath();
}



/* end mode toggles */

/* area mode stuff */

function bxe_getAllEditableAreas() {
	var nsResolver = new bxe_nsResolver(document.documentElement);
	var result = document.evaluate("/html/body//*[@bxe_xpath]", document.documentElement,nsResolver, 0, null);
	var node = null;
	var nodes = new Array();
	node = result.iterateNext()
	while (node) {
		nodes.push(node);
		node = result.iterateNext()
	}
	return nodes;
}

function bxe_alignAllAreaNodes() {
	var nodes = bxe_getAllEditableAreas();
	for (var i = 0; i < nodes.length; i++) {
		bxe_alignAreaNode(nodes[i].parentNode,nodes[i]);
	}
}

function bxe_alignAreaNode(menuNode,areaNode) {
	if (areaNode.display == "block") {
		menuNode.position("-8","5");
	} else {
		menuNode.position("0","0");
	}
	menuNode.draw();
}

/* debug stuff */
function BX_debug(object)
{
    var win = window.open("","debug");
	bla = "";
    for (b in object)
    {

        bla += b;
        try {

            bla +=  ": "+object.eval(b) ;
        }
        catch(e)
        {
            bla += ": NOT EVALED";
        };
        bla += "\n";
    }
    win.document.innerHTML = "";

    win.document.writeln("<pre>");
    win.document.writeln(bla);
    win.document.writeln("<hr>");
}

function bxe_about_box_fade_out (e) {
	
	var mozO = bxe_about_box.node.getCStyle("-moz-opacity");
	if (mozO > 0.1) {
		bxe_about_box.node.style.MozOpacity = mozO - 0.1;
		window.setTimeout(bxe_about_box_fade_out, 100);
	} else {
		bxe_about_box.node.style.display = "none";
		window.status = null;
	}
}

function bxe_draw_widgets() {
	
	
	// make menubar
	var menubar = new Widget_MenuBar();
	var img = document.createElement("img");
	img.setAttribute("src",mozile_root_dir + "images/bxe.png");
	
	img.setAttribute("align","right");
	menubar.node.appendChild(img);
	var submenu = new Array("Save",function() {eDOMEventCall("DocumentSave",document);});
	submenu.push("Save & Exit",function() {eDOMEventCall("DocumentSave",document,{"exit": true});});
	submenu.push("Exit",function() {eDOMEventCall("Exit",document);});
	menubar.addMenu("File",submenu);

	var submenu2 = new Array("Undo",bxe_not_yet_implemented,"Redo",bxe_not_yet_implemented);
	menubar.addMenu("Edit",submenu2);
	
	var submenu3 = new Array("Count Div", function(e) { alert(document.getElementsByTagName("div").length);})
	submenu3.push("Show XML Document",function(e) {alert(bxe_getXmlDocument());})
	submenu3.push("Validate with xmllint",function(e) {	var foo = new BXE_TransportDriver_relaxng();foo.check();});

	menubar.addMenu("Debug",submenu3);
	
	
	var submenu4 = new Array();
	submenu4.push("Help",function (e) { 
		bla = window.open("http://wiki.bitfluxeditor.org","help","width=800,height=600,left=0,top=0");
		bla.focus();
	
	});
	submenu4.push("Website",function (e) { 
		bla = window.open("http://www.bitfluxeditor.org","help","width=800,height=600,left=0,top=0");
		bla.focus();
	
	});
	submenu4.push("About Bitflux Editor",function(e) { 
		bxe_about_box.setText("");
		bxe_about_box.show();
		
	});
	
	menubar.addMenu("Help",submenu4);
	
	menubar.draw();
	
	//make toolbar
	
	var toolbar = new Widget_ToolBar();
	bxe_format_list = new Widget_MenuList("m",function(e) {eDOMEventCall("changeLinesContainer",document,this.value)});

	toolbar.addItem(bxe_format_list);
	
	toolbar.addButtons(bxe_config.getButtons());
	
	
	toolbar.draw();

	bxe_status_bar = new Widget_StatusBar();
	var ea = bxe_getAllEditableAreas();
	for (var i = 0; i < ea.length; i++) {
		
	ea[i].addEventListener("click",MouseClickEvent,false);
	}

	// if not content editable and ptb is enabled then hide the toolbar (watch out
	// for selection within the toolbar itself though!)
	
	
	window.setTimeout(bxe_about_box_fade_out, 1000);
	
}

function MouseClickEvent(e) {
	
	
	var target = e.target.parentElement;
	if(target.userModifiable) {
		return bxe_updateXPath();
	}
	return true;
}

function bxe_updateXPath() {
	var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	if (cssr) {
		bxe_status_bar.buildXPath(sel.anchorNode);
		var lines = cssr.lines;
		bxe_format_list.removeAllItems();
		
		function nodeSort(a,b) {
			if (a.nodeName > b.nodeName) {
				return 1;
			} else {
				return -1;
			}
		}
		if (lines[0] && lines[0].container) {
			/*		bxe_format_list.appendItem(lines[0].container.XMLNode.localName,lines[0].container.XMLNode.localName);*/
			var thisNode = lines[0].container.XMLNode;
			if (thisNode.xmlBridge) {
				var pref = "";
				if (thisNode.prefix) {
					pref = thisNode.prefix + ":";
				}
				menuitem = bxe_format_list.appendItem(pref + thisNode.nodeName, thisNode.localName + "=" + thisNode.namespaceURI);
			} else 
			{
				var ac = thisNode.parentNode.allowedChildren;
				ac.sort(nodeSort);
				var menuitem;
				var thisLocalName = thisNode.localName;
				var thisNamespaceURI = thisNode.namespaceURI
				for (i = 0; i < ac.length; i++) {
					menuitem = bxe_format_list.appendItem(ac[i].nodeName, ac[i].localName + "=" + ac[i].namespaceURI);
					if (ac[i].localName == thisLocalName &&  ac[i].namespaceURI == thisNamespaceURI) {
						menuitem.selected=true;
					}
				}
			}
		} else {
			bxe_format_list.appendItem("no block found","");
		}
	}
}

function bxe_delayedUpdateXPath() {
	if (bxe_delayedUpdate) {
		window.clearTimeout(bxe_delayedUpdate);
	}
	bxe_delayedUpdate = window.setTimeout("bxe_updateXPath()",100);
}

function bxe_ContextMenuEvent(e) {

	var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	if(!cssr)
	{
		return true;
	}
	
	var no ;
	if (cssr.startContainer.nodeType == Node.TEXT_NODE) {
		no = cssr.startContainer.parentNode;
	} else {
		no = cssr.startContainer;
	}
	bxe_context_menu.show(e,no);
	e.stopPropagation();
	e.returnValue = false;
	e.preventDefault();
	return false;
}

function bxe_UnorderedList() {
	function callback(e) {

	}
	//document.eDOMaddEventListener("NodeInsertedParent",callback,false);
	window.getSelection().toggleListLines("ul", "ol");
	//document.eDOMremoveEventListener("NodeInsertedParent",callback,false);
	/*var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	if (cssr) {
		var lines = cssr.lines;
		var newContainer = lines[0].container.parentNode;
		newContainer.XMLNode.init(newContainer);
		newContainer.updateXMLNode();
	}*/
	bxe_updateXPath();
}

function bxe_OrderedList() {
	window.getSelection().toggleListLines("ol", "ul");
}

function bxe_InsertImage() {
	var imgref = prompt("Enter the image url or file name:", "");
	if(imgref == null) // null href means prompt canceled
		return;
	if(imgref == "") 
		return; // ok with no name filled in
	var img = documentCreateXHTMLElement("img");
	img.src = imgref; // any way to tell if it is valid?
	window.getSelection().insertNode(img);
}

function bxe_InsertTable() {
	bxe_table_insert();
}

function bxe_InsertLink() {
	if(window.getSelection().isCollapsed) // must have a selection or don't prompt
		return;
	var href = prompt("Enter a URL:", "");
	if(href == null) // null href means prompt canceled - BUG FIX FROM Karl Guertin
		return;
	if(href != "") 
		window.getSelection().linkText(href);
	else
		window.getSelection().clearTextLinks();

	var sel = window.getSelection();
	var aNode = sel.anchorNode.parentNode;
	aNode.XMLNode.namespaceURI = XHTMLNS;
	aNode.onclick = function(e) {e.preventDefault(); }
	aNode.onmousedown = function(e) {e.preventDefault(); }
	aNode.onmouseup = function(e) {e.preventDefault(); }
}


function bxe_catch_alert(e ) {
	
	alert(bxe_catch_alert_message(e));
}

function bxe_catch_alert_message(e) {
	var mes = "ERROR in Bitflux Editor:\n"+e.message +"\n";
	try
	{
		if (e.filename) {
			mes += "In File: " + e.filename +"\n";
		} else {
			mes += "In File: " + e.fileName +"\n";
		}
		
	}
	catch (e)
	{
		mes += "In File: " + e.fileName +"\n";
	}
	try
	{
		mes += "Linenumber: " + e.lineNumber + "\n";
	}
	catch(e) {}
	
	mes += "Type: " + e.name + "\n";
	mes += "Stack:" + e.stack + "\n";
	return mes;
}

function bxe_exit(e) {
	window.location = bxe_config.exitdestination;
}

function bxe_not_yet_implemented() {
	alert("not yet implemented");
}


/* bxe_nsResolver */

function bxe_nsResolver (node) {
	this.metaTagNSResolver = null;
	this.metaTagNSResolverUri = null;
	
	//this.htmlDocNSResolver = null;
	this.xmlDocNSResolver = null;
	this.node = node;
	
	
}

bxe_nsResolver.prototype.lookupNamespaceURI = function (prefix) {
	var url = null;
	// if we never checked for meta bxeNS tags, do it here and save the values in an array for later reusal..
	if (!this.metaTagNSResolver) {
		var metas = document.getElementsByName("bxeNS");
		this.metaTagNSResolver = new Array();
		for (var i=0; i < metas.length; i++) {
			if (metas[i].localName.toLowerCase() == "meta") {
				var ns = metas[i].getAttribute("content").split("=");
				this.metaTagNSResolver[ns[0]] = ns[1]
			}
		}
	}
	//check if the prefix was there and return it
	if (this.metaTagNSResolver[prefix]) {
		return this.metaTagNSResolver[prefix];
	}
	/* there are no namespaces in even xhtml documents (or mozilla discards them somehow or i made a stupid mistake
	therefore no NS-lookup in document. */
	/*
	if (! this.htmlDocNSResolver) {
		this.htmlDocNSResolver = document.createNSResolver(document.documentElement);
	}
	url = this.htmlDocNSResolver.lookupNamespaceURI(prefix);
	if (url) {
		return url;
	}
	*/
	
	//create NSResolver, if not done yet
	if (! this.xmlDocNSResolver) {
		this.xmlDocNSResolver = this.node.ownerDocument.createNSResolver(this.node.ownerDocument.documentElement);
	}
	
	//lookup the prefix
	url = this.xmlDocNSResolver.lookupNamespaceURI(prefix);
	if (url) {
		return url;
	}
	// if still not found and we want the bxe prefix.. return that
	if (prefix == "bxe") {
		return BXENS;
	}
	
	//prefix not found
	return null;
}

bxe_nsResolver.prototype.lookupNamespacePrefix = function (uri) {
	
	if (!this.metaTagNSResolverUri) {
		var metas = document.getElementsByName("bxeNS");
		this.metaTagNSResolverUri = new Array();
		for (var i=0; i < metas.length; i++) {
			if (metas[i].localName.toLowerCase() == "meta") {
				var ns = metas[i].getAttribute("content").split("=");
				this.metaTagNSResolverUri[ns[1]] = ns[0]
			}
		}
	}
	//check if the prefix was there and return it
	if (this.metaTagNSResolverUri[uri]) {
		return this.metaTagNSResolverUri[uri];
	}
	return null;
}



