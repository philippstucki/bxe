const BXENS = "http://bitfluxeditor.org/namespace";

function __bxeSave(e) {
	
	var cssr = window.getSelection().getEditableRange();
	if(!cssr)
	{
		alert("*mozileModify.js:mozileSave: this default implementation only works if the current selection is in an editable area");
		return;
	}

	var areaNodes = bxe_getAllEditableAreas();
	for (var i = 0; i < areaNodes.length; i++) {
		
		var xmldoc = areaNodes[i].convertToXMLDocFrag();
	}

	alert(xmldoc.ownerDocument.saveXML(xmldoc.ownerDocument));

	return ;
	var td = new BXE_TransportDriver_webdav();
	function callback (e) {
		this.td.Docu.xmldoc =  this.responseXML;
		this.td.Docu.xmldoc.insertIntoHTMLDocument()
	}
	td.Docu = this;
	td.save("webdavtest.xml",null,xmldoc.ownerDocument.saveXML(xmldoc));
}



/* Mode toggles */

function toggleTagMode_bxe(e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	var xmldoc = document.implementation.createDocument("","",null);
	
	if (!editableArea._TagMode) {
		createTagNameAttributes(editableArea);
		var x = document.styleSheets[0];
		x.insertRule('#' + editableArea.id + ' *:before {content: attr(_edom_tagnameopen); margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		x.insertRule('#' + editableArea.id + ' *:after {content:  attr(_edom_tagnameclose) ; margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
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
			node.removeAttribute("_edom_tagnameopen");
			node.removeAttribute("_edom_tagnameclose");
		}while(node =   walker.nextNode() )
		var x = document.styleSheets[0];
		x.deleteRule(x.cssRules.length-1);
		x.deleteRule(x.cssRules.length-1);
		editableArea._TagMode = false;
		editableArea.AreaInfo.TagModeMenu.Checked = false;
		editableArea.AreaInfo.NormalModeMenu.Checked = true;
	}
	}
	catch(e) {alert(e);}

}

function toggleNormalMode_bxe (e) {
	try {
	var editableArea = e.target;
	if (editableArea._SourceMode) {
			var e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	if (editableArea._TagMode) {
			var e = new eDOMEvent();
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
			
			var lastChild = newNode;
			while ( lastChild.firstChild) {
				lastChild = lastChild.firstChild;
			}
			//node.xmlNodeNew = lastChild;
			lastChild.appendChild(xmldoc.createTextNode("::"));
			var xmlstring = xmldoc.saveChildrenXML(parentN,true).split("::");
			node.setAttribute("_edom_tagnameopen", xmlstring[0]);
			node.setAttribute("_edom_tagnameclose", xmlstring[1]);
			node.XMLNode.setNode(lastChild);
	} while(node = walker.nextNode() )
}

function toggleSourceMode_bxe(e) {
	try {
	var editableArea = e.target;

	if (editableArea._TagMode) {
			var e = new eDOMEvent();
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
			editableArea.removeAllChildren();
			innerhtmlValue.documentElement.insertIntoHTMLDocument(editableArea,true);
			editableArea.setStyle("white-space",null);
			editableArea._SourceMode = false;
			editableArea.AreaInfo.SourceModeMenu.Checked = false;
			editableArea.AreaInfo.NormalModeMenu.Checked = true;
		}
	}
	}
	catch (e) {alert(e);}

}

function toggleTextClass_bxe(e) {
	window.getSelection().toggleTextClass(e.additionalInfo);
	/*
	var walker = document.createTreeWalker(
	 window.getSelection().getRangeAt(0).startContainer.parentNode,NodeFilter.SHOW_ELEMENT,
	{
		acceptNode : function(node) {
			
			return NodeFilter.FILTER_ACCEPT;
		}
	}
	, true);
	
	var node =walker.currentNode;
	do {
		node.SplitClasses();
	
 	}  while(node = walker.nextNode() );
	*/
	
}

function changeLinesContainer_bxe(e) {
	window.getSelection().changeLinesContainer(e.additionalInfo);
}


/* end mode toggles */

/* area mode stuff */

function bxe_getAllEditableAreas() {
	var nsResolver = new bxe_nsResolver(document.documentElement);
	var result = document.evaluate("/html/body//*[@bxe_xpath]", document.documentElement,nsResolver, 0, null);
	var node = null;
	var nodes = new Array();
	while (node = result.iterateNext()) {
		nodes.push(node);
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
		bxe_status_bar.buildXPath(target);
	}
	
}
