function __bxeSave(e) {
	
	var cssr = window.getSelection().getEditableRange();
	if(!cssr)
	{
		alert("*mozileModify.js:mozileSave: this default implementation only works if the current selection is in an editable area");
		return;
	}
	var editableArea = cssr.top;
	var xmldoc = editableArea.convertToXMLDocFrag();
	/*editableArea.xmlNode.removeAllChildren();
	var docfrag = xmldoc.transformToDocumentFragment();
	editableArea.xmlNode.appendChild(docfrag);
	*/

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
			if (node.parentNode.xmlNodeNew) {
				parentN = node.parentNode.xmlNodeNew;
			} else {
				parentN = startNode.xmlNode;
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
			node.xmlNodeNew = lastChild;
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
		editableArea.appendChild(document.createTextNode(document.saveChildrenXML(xmldoc,true)));
		editableArea._SourceMode = true;
		editableArea.AreaInfo.SourceModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else { 
		var innerhtmlValue = documentLoadXML('<'+editableArea.xmlNode.localName+' xmlns="' + editableArea.xmlNode.namespaceURI +'">'+editableArea.getContent()+'</'+editableArea.xmlNode.localName+'>');
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
}

function changeLinesContainer_bxe(e) {
	window.getSelection().changeLinesContainer(e.additionalInfo);
}


/* end mode toggles */

/* area mode stuff */

function bxe_getAllEditableAreas() {
	
	var result = document.evaluate("/html/body//*[@bxe_xpath]", document.documentElement,null, 0, null);
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
