const BXENS = "http://bitfluxeditor.org/namespace";

function __bxeSave(e) {
	
	var td = new BXE_TransportDriver_webdav();
	td.Docu = this;
	td.Exit = e.additionalInfo.exit;
	td.save(bxe_config.xmlfile,null,bxe_getXmlDocument());
}

function bxe_getXmlDocument() {
	var areaNodes = bxe_getAllEditableAreas();
	for (var i = 0; i < areaNodes.length; i++) {
		if ((areaNodes[i]._SourceMode)) {
			alert("Editable areas must not be in SourceMode while saving. Please switch it");
			return false;
		}
		var xmldoc = areaNodes[i].convertToXMLDocFrag();
		//xmldoc = areaNodes[i].XMLNode.insertIntoXMLDocument(xmldoc);
	}
	return xmldoc.ownerDocument.saveXML(xmldoc.ownerDocument);
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
		//var x = document.styleSheets[0];
		//x.insertRule('#' + editableArea.id + ' *:before {content: attr(_edom_tagnameopen); margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		//x.insertRule('#' + editableArea.id + ' *:after {content:  attr(_edom_tagnameclose) ; margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		editableArea.addEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.addEventListener("DOMNodeRemoved",addTagnames_bxe,false);
		editableArea.addEventListener("DOMAttrModified",addTagnames_bxe,false);
		editableArea._TagMode = true;
		editableArea.AreaInfo.TagModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else {
		var walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			true);
		var node =editableArea;
		editableArea.removeEventListener("DOMNodeInserted",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMAttrModified",addTagnames_bxe,false);
		editableArea.removeEventListener("DOMNodeRemoved",addTagnames_bxe,false);
		
		do {
			if (node.hasChildNodes()) {
				node.removeAttribute("_edom_tagnameopen");
			}
			node.removeAttribute("_edom_tagnameclose");
			node =   walker.nextNode() 
		} while(node)
		//var x = document.styleSheets[0];
		//x.deleteRule(x.cssRules.length-1);
		//x.deleteRule(x.cssRules.length-1);
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

	createTagNameAttributes(nodeTarget.parentNode);
	e.currentTarget.addEventListener("DOMAttrModified",addTagnames_bxe,false);
	
}

function createTagNameAttributes(startNode) {
	var xmldoc = startNode.ownerDocument;
	var walker = document.createTreeWalker(
		startNode,
		NodeFilter.SHOW_ELEMENT,
		{
			acceptNode : function(node) {
				return NodeFilter.FILTER_ACCEPT;
			}
		}
		, true);
		
	var node = walker.nextNode();
	do {
			var parentN = null;
			if (node.parentNode.XMLNode._xmlnode) {
				parentN = node.parentNode.XMLNode._xmlnode;
			} else {
				parentN = startNode.XMLNode._xmlnode;
			}
			var newNode = node.convertToXMLNode(document);
			parentN.removeAllChildren();
			parentN.appendChild(newNode);
			var xmlstring =  parentN.getBeforeAndAfterString(node.hasChildNodes());
			node.setAttribute("_edom_tagnameopen", xmlstring[0]);
			if (xmlstring[1]) {
				node.setAttribute("_edom_tagnameclose", xmlstring[1]);
			}
			node.XMLNode.setNode(xmlstring[2]);
			node = walker.nextNode()
	} while( node)
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
		if (editableArea.XMLNode.namespaceURI != null) {
			innerHTML += ' xmlns'
			if (editableArea.XMLNode.prefix != null) {
				innerHTML += ":" + editableArea.XMLNode.prefix ;
			}
			innerHTML += '="' + editableArea.XMLNode.namespaceURI +'"';
		}
		innerHTML += '>'+editableArea.getContent()+'</'+rootNodeName +'>';
		
		var innerhtmlValue = documentLoadXML( innerHTML);
		if (innerhtmlValue) {
			editableArea.XMLNode._xmlnode.removeAllChildren();
			editableArea.XMLNode._xmlnode.appendAllChildren(innerhtmlValue.firstChild);
			editableArea.removeAllChildren();
			/*
			
			innerhtmlValue.documentElement.insertIntoHTMLDocument(editableArea,true);
			*/
			editableArea.XMLNode._xmlnode.insertIntoHTMLDocument(editableArea,true);
			editableArea.setStyle("white-space",null);
			editableArea.XMLNode._xmlnode.parentNode.isNodeValid(true);
			editableArea._SourceMode = false;
			editableArea.AreaInfo.SourceModeMenu.Checked = false;
			editableArea.AreaInfo.NormalModeMenu.Checked = true;
			
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
	while (!(_node.XMLNode && _node.XMLNode._xmlnode)) {
		_node = _node.parentNode;
	}
	_node.XMLNode._htmlnode.convertToXMLDocFrag();
	dump("is valid" +_node.XMLNode._xmlnode.isNodeValid(true));
}

function bxe_appendNode(e) {
	var aNode = e.additionalInfo.appendToNode;
	
	var newNode = new XMLNode() ;
	
	newNode.createNS(e.additionalInfo.namespaceURI, e.additionalInfo.localName);
	
	aNode.parentNode.insertAfter(newNode,aNode);
	
	newNode.setContent("#" + e.additionalInfo.localName + " ");
	var sel = window.getSelection();
	sel.removeAllRanges();
	var rng = document.createRange();
	rng.setStart(newNode._htmlnode.firstChild,1);
	rng.setEnd(newNode._htmlnode.firstChild,newNode._htmlnode.firstChild.data.length-1);
	//dump(e.additionalInfo.localName + " is valid " +_node.XMLNode._xmlnode.isNodeValid(true));
	sel.addRange(rng);
	
}

function bxe_changeLinesContainer(e) {
	window.getSelection().changeLinesContainer(e.additionalInfo);
	bxe_updateXPath();
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
	}
}

function bxe_draw_widgets() {
	
	
	// make menubar
	var menubar = new Widget_MenuBar();
	var img = document.createElement("img");
	img.setAttribute("src","images/bxe.png");
	
	//imgspan.appendChild(img);
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
	
	
	toolbar.addButtons(buttons);
	
	
	toolbar.draw();

	bxe_status_bar = new Widget_StatusBar();
	document.addEventListener("click",MouseClickEvent,false);


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
	var lines = cssr.lines();
	bxe_format_list.removeAllItems();
	
	if (lines[0] && lines[0].container) {
		bxe_format_list.appendItem(lines[0].container.XMLNode.localName,lines[0].container.XMLNode.localName);
		var ac = lines[0].container.XMLNode.parentNode._xmlnode.allowedChildren;
		ac.sort();
		for (i = 0; i < ac.length; i++) {
			bxe_format_list.appendItem(ac[i], ac[i]);
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
	window.getSelection().toggleListLines("UL", "OL");
}

function bxe_OrderedList() {
	window.getSelection().toggleListLines("OL", "UL");
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
