// +----------------------------------------------------------------------+
// | Bitflux Editor                                                       |
// +----------------------------------------------------------------------+
// | Copyright (c) 2003 Bitflux GmbH                                      |
// +----------------------------------------------------------------------+
// | This software is published under the terms of the Apache Software    |
// | License a copy of which has been included with this distribution in  |
// | the LICENSE file and is available through the web at                 |
// | http://bitflux.ch/editor/license.html                                |
// +----------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>                        |
// +----------------------------------------------------------------------+
//
// $Id$

const BXENS = "http://bitfluxeditor.org/namespace";
const XMLNS = "http://www.w3.org/2000/xmlns/";

const E_FATAL = 1;

const BXE_SELECTION = 1;
const BXE_APPEND = 2;
const BXE_SPLIT_IF_INLINE = 1;

var bxe_snapshots = new Array();
var bxe_snapshots_position = 0;
var bxe_snapshots_last = 0;
const BXE_SNAPSHOT_LENGTH = 5;
function __bxeSave(e) {
	
	var td = new mozileTransportDriver("webdav");
	td.Docu = this;
	if (e.additionalInfo ) {
		td.Exit = e.additionalInfo.exit;
	} else {
		td.Exit = null;
	}
	var xml = bxe_getXmlDomDocument();
	if (!xml) {
		alert("You're in Source Mode. Not possible to use this button");
	}
	if (!(xml.XMLNode.validateDocument())) 
	{
		return false;
	}
	var xmlstr =xml.saveXML(xml);
	
	function callback (e) {
		var widg = mozilla.getWidgetModalBox("Saving");
		
		if (e.isError) {
			widg.addText("Document couldn't be saved\n"+e.statusText);
			widg.show((window.innerWidth- 500)/2,50, "fixed");
			return;
		}
		widg.addText( "" );
		widg.addText( "" );
		widg.addText( "" );
		widg.addText( "Document saved" );
		widg.addText( "" );
		widg.addText( "" );
		widg.addText( "" );
		
		widg.show((window.innerWidth- 500)/2,50, "fixed");
		if (e.td.Exit) {
			eDOMEventCall("Exit",document);
		}
	}
	var url = bxe_config.xmlfile;
	if (td.Exit) {
		url = bxe_addParamToUrl(url,"exit=true");
	} else {
		url = bxe_addParamToUrl(url,"exit=false");
	}
	td.save(url, xmlstr, callback);
}

function bxe_addParamToUrl(url, param) {
	if (url.indexOf("?") == -1) {
		url += "?" + param;
	} else {
		url += "&" + param;
	}
	return url;
}

function bench(func, string,iter) {
	
	
	var start = new Date();
	for (var i = 0; i< iter; i++) {
		func();
	}
	var end = new Date();
	

	debug ("Benchmark " + string);
//	debug ("Start " + start.getTime());
//	debug ("End   " + end.getTime() );
	debug ("Total " +(end-start) + " / " +  iter + " = " + (end-start)/iter); 
}

function bxe_bench() {
	
	bench(function() {xmlstr = bxe_getXmlDocument()}, "getXML", 2);
}

function bxe_history_snapshot_async()  {
	window.setTimeout("bxe_history_snapshot()",1);
}


function bxe_history_snapshot() {
	var xmlstr = bxe_getXmlDocument();
	if (!xmlstr) { return false;}
	bxe_snapshots_position++;
	bxe_snapshots_last = bxe_snapshots_position;
	bxe_snapshots[bxe_snapshots_position] = xmlstr;
	var i = bxe_snapshots_last + 1;
	while (bxe_snapshots[i]) {
		bxe_snapshots[i] = null;
		i++;
	}
	if (bxe_snapshots.length >  BXE_SNAPSHOT_LENGTH ) {
		var _temp = new Array();
		
		for (var i = bxe_snapshots_last; i >= bxe_snapshots_last - BXE_SNAPSHOT_LENGTH; i--) {
			_temp[i] = bxe_snapshots[i];
		}
		bxe_snapshots = _temp;
	}
	return (xmlstr);
}

function bxe_history_redo() {
	
	if (bxe_snapshots_position >= 0 && bxe_snapshots[( bxe_snapshots_position + 1)]) {
		var currXmlStr = bxe_getXmlDocument();
		bxe_snapshots_position++;
		var xmlstr = bxe_snapshots[bxe_snapshots_position];
		if (currXmlStr == xmlstr && bxe_snapshots[bxe_snapshots_position + 1]) {
			bxe_snapshots_position++;
			var xmlstr = bxe_snapshots[bxe_snapshots_position];
		}
		var BX_parser = new DOMParser();
		var xmldoc = BX_parser.parseFromString(xmlstr,"text/xml");
		var vdom = bxe_config.xmldoc.XMLNode.vdom;
		bxe_config.xmldoc = xmldoc;
		xmldoc.init();
		xmldoc.insertIntoHTMLDocument();
		bxe_config.xmldoc.XMLNode.vdom = vdom;
		try {
			bxe_config.xmldoc.XMLNode.validateDocument();
		} catch(e) {
			bxe_catch_alert(e);
		}
		
	}
	
}
function bxe_history_undo() {
	
	if (bxe_snapshots_position >= 0) {
		if (bxe_snapshots_position == bxe_snapshots_last) {
			var currXmlStr = bxe_history_snapshot();
			bxe_snapshots_position--;
		} else {
			var currXmlStr = bxe_getXmlDocument();
		}
		
		if (!currXmlStr) { alert("You're in Source Mode. Not possible to use this button"); return false;} 
		var xmlstr = bxe_snapshots[bxe_snapshots_position];
		bxe_snapshots_position--;
		while(currXmlStr == xmlstr && bxe_snapshots[bxe_snapshots_position ] ) {
			xmlstr = bxe_snapshots[bxe_snapshots_position];
			bxe_snapshots_position--;
		}
		
		if (bxe_snapshots_position < 0) {
			bxe_snapshots_position = 0;
			return false;
		}
		var BX_parser = new DOMParser();
		if (xmlstr) {
			var xmldoc = BX_parser.parseFromString(xmlstr,"text/xml");
			var vdom = bxe_config.xmldoc.XMLNode.vdom;
			bxe_config.xmldoc = xmldoc;
		xmldoc.init();
		xmldoc.insertIntoHTMLDocument();
		bxe_config.xmldoc.XMLNode.vdom = vdom;
		try {
			bxe_config.xmldoc.XMLNode.validateDocument();
		} catch(e) {
			bxe_catch_alert(e);
		}
		}
	} 
	/*bxe_snapshots[bxe_snapshots_position] == xmlstr;
	bxe_snapshots_position++;*/
}

function bxe_getXmlDomDocument() {
	var areaNodes = bxe_getAllEditableAreas();
	var xml;
	if(areaNodes.length == 0) {
		alert("No bxe_xpath definitions found in your layout (HTML) file.");
		return false;
	}
		
		
	for (var i = 0; i < areaNodes.length; i++) {
		if ((areaNodes[i]._SourceMode)) {
			return false;
		}
		xml = areaNodes[i].XMLNode.buildXML();
		
	}
	return xml.ownerDocument;
}
	

function bxe_getXmlDocument() {
	
	var xml = bxe_getXmlDomDocument();
	if (!xml ) { return xml;}
	return xml.saveXML(xml);

}

function bxe_getRelaxNGDocument() {
	
	var areaNodes = bxe_getAllEditableAreas();
	var xml = areaNodes[0].XMLNode.ownerDocument._vdom.xmldoc;
	return xml.saveXML(xml);
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
		editableArea._TagMode = true;
		editableArea.AreaInfo.TagModeMenu.Checked = true;
		editableArea.AreaInfo.NormalModeMenu.Checked = false;
	} else {
		var walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			true);
		var node = editableArea;
		
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

function createTagNameAttributes(startNode, startHere) {
	var walker = startNode.XMLNode.createTreeWalker();
	if (!startHere) {
		var node = walker.nextNode();
	} else {
		var node = walker.currentNode;
	}
	
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
		bxe_updateXPath(editableArea);
		
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

			
			
			editableArea._SourceMode = false;
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
			var valid = editableArea.XMLNode.isNodeValid(true);
			if ( ! valid) {
				bxe_toggleSourceMode(e);
			}
			bxe_updateXPath(editableArea);
			
		}
	}
	}
	catch (e) {bxe_catch_alert(e);}

}

function bxe_toggleTextClass(e) {
	var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	if (typeof e.additionalInfo.namespaceURI == "undefined") {
		e.additionalInfo.namespaceURI = "";
	}
	if (cssr.top._SourceMode) {
		alert("You're in Source Mode. Not possible to use this button");
		return false;
	}
	
	if (!bxe_checkIsAllowedChild( e.additionalInfo.namespaceURI,e.additionalInfo.localName,sel)) {
		return false;
	}
	var cb = bxe_getCallback(e.additionalInfo.localName, e.additionalInfo.namespaceURI);
	if (cb ) {
		bxe_doCallback(cb, BXE_SELECTION);
		return;
	}
	
	if (sel.isCollapsed) {
			var newNode = new XMLNodeElement(e.additionalInfo.namespaceURI,e.additionalInfo.localName, 1 , true) ;
		
			sel.insertNode(newNode._node);
	/*		debug("valid? : " + newNode.isNodeValid());
	*/		
			newNode.makeDefaultNodes(false);
			if (newNode._node.firstChild) {
				var sel = window.getSelection();
				var startip = newNode._node.firstInsertionPoint();
				var lastip = newNode._node.lastInsertionPoint();
				sel.collapse(startip.ipNode, startip.ipOffset);
				sel.extend(lastip.ipNode, lastip.ipOffset);
				
			}
	} else {
		
		sel.toggleTextClass(e.additionalInfo.localName,e.additionalInfo.namespaceURI);
	}
	sel = window.getSelection();
	cssr = sel.getEditableRange();
	
	
	var _node = cssr.commonAncestorContainer;
	_node.updateXMLNode();
	cssr.startContainer.updateXMLNode();
	cssr.endContainer.updateXMLNode();
	debug("isValid?" + _node.XMLNode.isNodeValid());

}


function bxe_NodeInsertedParent(e) {
//	alert("document wide");
	var oldNode = e.target.XMLNode;
	var parent = e.additionalInfo;
	
	parent.XMLNode =  bxe_XMLNodeInit(parent);
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

function bxe_NodeBeforeDelete (e) {
	var node = e.target.XMLNode;
	node.unlink();
}

function bxe_NodePositionChanged(e) {
	var node = e.target;
	node.updateXMLNode();
}
	

function bxe_NodeAppendedChild(e) {
	var parent = e.target.XMLNode;
	var newNode  = e.additionalInfo;
	if (newNode.nodeType == 11) {
		var child = newNode.firstChild;
		while (child) {
			this.appendChildIntern(child.XMLNode);
			child = child.nextSibling;
			
		}
	} else {
		newNode  = newNode.XMLNode;
		parent.appendChildIntern(newNode);
	}
	
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
function bxe_ContextPopup(e) {
	try {
	var node = e.target.XMLNode;
	var popup = e.additionalInfo;
	if (node.vdom && node.vdom.hasAttributes ) {
		
		var menui = popup.addMenuItem("Edit " + e.target.XMLNode.nodeName  + " Attributes", mozilla.getWidgetGlobals().EditAttributes.popup);
		menui.MenuPopup._node = node._node;
	}

	
	popup.addMenuItem("Copy "  + e.target.XMLNode.nodeName  + " Element", function (e) {
		var widget = e.currentTarget.Widget;
		var delNode = widget.MenuPopup.MainNode;
		delNode.copy();
	});
	var clip = mozilla.getClipboard();
	
	if (clip._clipboard) {
		var _clipboardNodeName = "";
		var _clipboardNamespaceUri = "";
		if (clip._clipboard.firstChild.XMLNode) {
			_clipboardNodeName = clip._clipboard.firstChild.XMLNode.nodeName;
			_clipboardNamespaceUri = clip._clipboard.firstChild.XMLNode.namespaceURI;
		} else {
			_clipboardNodeName = clip._clipboard.firstChild.nodeName;
			_clipboardNamespaceUri = XHTMLNS;
		}
		if (node.parentNode.isAllowedChild(_clipboardNamespaceUri, _clipboardNodeName)) {
			
			
			popup.addMenuItem("Append " + _clipboardNodeName + " from Clipboard", function (e) {
				var widget = e.currentTarget.Widget;
				var appNode = widget.MenuPopup.MainNode;
				var clip = mozilla.getClipboard();
				var clipNode = clip.getData(MozClipboard.TEXT_FLAVOR);
				
				eDOMEventCall("appendNode",document,{"appendToNode":appNode, "node": clipNode.firstChild})
			});
		}
		
	}
	
	popup.addMenuItem("Delete "  + e.target.XMLNode.nodeName  + " Element", function (e) {
		var widget = e.currentTarget.Widget;
		var delNode = widget.MenuPopup.MainNode;
		if (delNode._node.InternalParentNode) {
			delNode = delNode._node.InternalParentNode.XMLNode
		}
		var _par = delNode.parentNode;
		
		var _upNode = delNode.previousSibling;
		if (!_upNode) {
			_upNode = delNode.parentNode;
		}
		bxe_history_snapshot();
		_par.removeChild(delNode);
//		_upNode.updateXMLNode();
		
	});
	popup.addSeparator();
	if (node.localName == "td") {
		
		// merge right
	//	popup.addSeparator();
		
		
		//split
		var menui = popup.addMenuItem("Split right", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode;
			widget.MenuPopup.MainNode._node.TableCellSplitRight();
			_par.updateXMLNode();
		});
		
		if (node._node.getAttribute("rowspan") > 1) {
			
			var menui = popup.addMenuItem("Split down", function(e) {
				var widget = e.currentTarget.Widget;
				var _par = widget.MenuPopup.MainNode._node.parentNode;
				widget.MenuPopup.MainNode._node.TableCellSplitDown();
				_par.updateXMLNode();
			});
		}
		
		
		var nextSibling = node.nextSibling;
		while (nextSibling && nextSibling.nodeType != 1) {
			nextSibling = nextSibling.nextSibling;
		}
		if (nextSibling && nextSibling.localName == "td") {
			var menui = popup.addMenuItem("Merge right", function(e) {
				var widget = e.currentTarget.Widget;
				var _par = widget.MenuPopup.MainNode._node.parentNode;
				widget.MenuPopup.MainNode._node.TableCellMergeRight();
				_par.updateXMLNode();
			});
		}
		//TODO fix for last row
		var menui = popup.addMenuItem("Merge down", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode;
			widget.MenuPopup.MainNode._node.TableCellMergeDown();
			_par.updateXMLNode();
		});
		
		var menui = popup.addMenuItem("Append Row", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode;
			widget.MenuPopup.MainNode._node.TableAppendRow();
			_par.updateXMLNode();
		});
		var menui = popup.addMenuItem("Append Col", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode.parentNode;
			widget.MenuPopup.MainNode._node.TableAppendCol();
			_par.updateXMLNode();
		});
		var menui = popup.addMenuItem("Remove Row", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode.parentNode;
			widget.MenuPopup.MainNode._node.TableRemoveRow();
			_par.updateXMLNode();
		});
		
		var menui = popup.addMenuItem("Remove Col", function(e) {
			var widget = e.currentTarget.Widget;
			var _par = widget.MenuPopup.MainNode._node.parentNode.parentNode;
			widget.MenuPopup.MainNode._node.TableRemoveCol();
			_par.updateXMLNode();
		});
		
		
		popup.addSeparator();
	}
	popup.MainNode = node;
	} catch (e) { bxe_catch_alert(e);}
}

function bxe_NodeChanged(e) {

	var newNode = e.target;
	var oldNode = e.additionalInfo.XMLNode;
	newNode.XMLNode = bxe_XMLNodeInit(newNode);
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
		newNode.XMLNode =  bxe_XMLNodeInit(newNode);
		if (oldNode.parentNode) {
			oldNode.parentNode.insertBeforeIntern(newNode.XMLNode, oldNode);
		}
		if (newNode.firstChild ) {
			newNode.updateXMLNode();
		}
		if (oldNode.firstChild ) {
			oldNode.unlinkChildren();
			oldNode._node.updateXMLNode();
		}
	}
	catch(e) { 
		bxe_catch_alert(e);
	}
	

}

function bxe_appendNode(e) {
	var aNode = e.additionalInfo.appendToNode;
	bxe_history_snapshot();
	
	if (e.additionalInfo.node) {
		var cb = bxe_getCallback(e.additionalInfo.node.localName, e.additionalInfo.node.namespaceURI);
		if (cb ) {
			if (bxe_doCallback(cb, aNode)) {
				return;
			}
		}
		
		var newNode = e.additionalInfo.node.init();

		aNode.parentNode.insertAfter(newNode,aNode);
		newNode._node.updateXMLNode();

		debug("valid? : " + newNode.isNodeValid());
		
		
		//aNode.parentNode.insertBeforeIntern(newNode,aNode.nextSibling);
		//newNode.insertIntoHTMLDocument(aNode._node);
	}
	else {

		var cb = bxe_getCallback(e.additionalInfo.localName,e.additionalInfo.namespaceURI);
		
		if (cb ) {
			bxe_doCallback(cb, aNode);
			return;
		}
		var newNode = new XMLNodeElement(e.additionalInfo.namespaceURI,e.additionalInfo.localName, 1 ) ;
		aNode.parentNode.insertAfter(newNode,aNode);
		debug("valid? : " + newNode.isNodeValid());
		newNode.makeDefaultNodes(e.additionalInfo.noPlaceholderText);
		
	}

	
	if (newNode._node.firstChild) {
		var sel = window.getSelection();
		var startip = newNode._node.firstInsertionPoint();
		var lastip = newNode._node.lastInsertionPoint();
		sel.collapse(startip.ipNode, startip.ipOffset);
		sel.extend(lastip.ipNode, lastip.ipOffset);
		
	}
		
}


function bxe_appendChildNode(e) {
		var aNode = e.additionalInfo.appendToNode;
		var newNode = new XMLNodeElement(e.additionalInfo.namespaceURI,e.additionalInfo.localName, 1 ) ;
		aNode.appendChild(newNode);
		debug("valid? : " + newNode.isNodeValid());
		var cb = bxe_getCallback(e.additionalInfo.localName, e.additionalInfo.namespaceURI);
		if (cb ) {
			bxe_doCallback(cb, newNode);
		} else {
			var cHT  =  newNode.canHaveText;
			if (cHT) {
				if (!e.additionalInfo.noPlaceholderText) {
					newNode.setContent("#" + e.additionalInfo.localName + " ");
				}
			} else {
				var ac = newNode.allowedChildren;
				dump("..."+ac.length);
				if (ac.length == 1)  {
					debug("automatically append new Node " + ac[0].nodeName);
					eDOMEventCall("appendChildNode",document,{"appendToNode": newNode, "localName":ac[0].nodeName,"namespaceURI":ac[0].namespaceURI});
				} else if (ac.length > 1) {
					bxe_context_menu.buildElementChooserPopup(newNode,ac);
				}
				else {
					var xmlstring = newNode.getBeforeAndAfterString(false,true);
					newNode.setAttribute("_edom_tagnameopen",xmlstring[0]);
				}
			}
		}
	
}



function bxe_changeLinesContainer(e) {
	bxe_history_snapshot();
	var nodeParts = e.additionalInfo.split("=");
	if (nodeParts.length < 2 ) {
		nodeParts[1] = null;
	}
	var newContainer = window.getSelection().changeLinesContainer(nodeParts[0],  nodeParts[1]);
	for(var i=0; i<newContainer.length; i++)
	{ 
		newContainer[i].XMLNode = new XMLNodeElement( nodeParts[1], nodeParts[0], newContainer[i].nodeType);
		try {
			newContainer[i].updateXMLNode();
			
		} catch(e) {alert(newContainer[i] + " can't be updateXMLNode()'ed\n" + e);
		}
	}
	if (!newContainer[0].XMLNode.parentNode.isNodeValid()) {
		bxe_history_undo();
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

function BX_showInWindow(string)
{
    var win = window.open("","debug");

    win.document.innerHTML = "";
	win.document.writeln("<html>");
	win.document.writeln("<body>");

    win.document.writeln("<pre>");
	if (typeof string == "string") {
		win.document.writeln(string.replace(/</g,"&lt;"));
	}
	win.document.writeln("</pre>");
	win.document.writeln("</body>");
	win.document.writeln("</html>");
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

	var submenu2 = new Array("Undo",function() {eDOMEventCall("Undo",document);},"Redo",function () {eDOMEventCall("Redo",document)});
	menubar.addMenu("Edit",submenu2);
	
	var submenu3 = new Array();
	submenu3.push("Show XML Document",function(e) {BX_showInWindow(bxe_getXmlDocument());})
	submenu3.push("Show RNG Document",function(e) {BX_showInWindow(bxe_getRelaxNGDocument());})
	
	menubar.addMenu("Debug",submenu3);
	
	
	var submenu4 = new Array();
	
	submenu4.push("About Bitflux Editor",function(e) { 
		bxe_about_box.setText("");
		bxe_about_box.show(true);
		
	});
	
	submenu4.push("Help",function (e) { 
		bla = window.open("http://wiki.bitfluxeditor.org","help","width=800,height=600,left=0,top=0");
		bla.focus();
	
	});

	submenu4.push("BXE Website",function (e) { 
		bla = window.open("http://www.bitfluxeditor.org","help","width=800,height=600,left=0,top=0");
		bla.focus();
	
	});

	submenu4.push("Show System Info", function(e) {
		var modal = new Widget_ModalBox();
		modal.node = modal.initNode("div","ModalBox");
		modal.Display = "block";
		modal.node.appendToBody();
		modal.position(100,100,"absolute");
		modal.initTitle("System Info");
		modal.initPane();
		var innerhtml =  "<br/>BXE Version: " + BXE_VERSION  + "<br />";
		innerhtml += "BXE Build Date: " + BXE_BUILD + "<br/>";
		innerhtml += "BXE Revision: " + BXE_REVISION + "<br/><br/>";
		innerhtml += "User Agent: " + navigator.userAgent + "<br/><br/>";
		modal.PaneNode.innerHTML = innerhtml;
		modal.draw();
		var subm = document.createElement("input");
		subm.setAttribute("type","submit");
		subm.setAttribute("value","OK");
		subm.onclick = function(e) {
			var Widget = e.target.parentNode.parentNode.Widget;
			e.target.parentNode.parentNode.style.display = "none";
		}
		modal.PaneNode.appendChild(subm);
		
	});

	submenu4.push("Report Bug",function(e) { 
		bla = window.open("http://bugs.bitfluxeditor.org/enter_bug.cgi?product=Editor&version="+BXE_VERSION+"&priority=P3&bug_severity=normal&bug_status=NEW&assigned_to=&cc=&bug_file_loc=http%3A%2F%2F&short_desc=&comment=***%0DVersion: "+BXE_VERSION + "%0DBuild: " + BXE_BUILD +"%0DUser Agent: "+navigator.userAgent + "%0D***&maketemplate=Remember+values+as+bookmarkable+template&form_name=enter_bug","help","");
		bla.focus();
		
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

	if(target.userModifiable && bxe_editable_page) {
		return bxe_updateXPath(e.target);
	}
	return true;
}

function bxe_updateXPath(e) {
	var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	if (cssr) {
		if (cssr.top._SourceMode) {
			//clear list
			bxe_format_list.removeAllItems();
			bxe_format_list.appendItem("-Source Mode-","");
			bxe_status_bar.buildXPath(cssr.top);

		} else {
			if (e) {
				bxe_status_bar.buildXPath(e);
			} else {
				bxe_status_bar.buildXPath(sel.anchorNode);
			}
			var lines = cssr.lines;
			bxe_format_list.removeAllItems();
	
			if (lines[0] && lines[0].container) {
				/*		bxe_format_list.appendItem(lines[0].container.XMLNode.localName,lines[0].container.XMLNode.localName);*/
				var thisNode = lines[0].container.XMLNode;
				if (thisNode.xmlBridge) {
					var pref = "";
					if (thisNode.prefix) {
						pref = thisNode.prefix + ":";
					}
					menuitem = bxe_format_list.appendItem(pref + thisNode.nodeName, thisNode.localName + "=" + thisNode.namespaceURI);
				} else {
					var ac = thisNode.parentNode.allowedChildren;
					var menuitem;
					var thisLocalName = thisNode.localName;
					var thisNamespaceURI = thisNode.namespaceURI;
					
					for (i = 0; i < ac.length; i++) {
						if (!bxe_config.dontShowInContext[ac[i].namespaceURI + ":" +ac[i].localName] && ac[i].nodeType != 3 && ac[i].vdom.canHaveChildren)  {
							menuitem = bxe_format_list.appendItem(ac[i].nodeName, ac[i].localName + "=" + ac[i].namespaceURI);
							if (ac[i].localName == thisLocalName &&  ac[i].namespaceURI == thisNamespaceURI) {
								menuitem.selected=true;
							}
						}
					}
				}
			} else {
				bxe_format_list.appendItem("no block found","");
			}
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
	if (cssr.top._SourceMode) {
		return true;
	}
	var node ;
	if (cssr.startContainer.nodeType == Node.TEXT_NODE) {
		node = cssr.startContainer.parentNode;
	} else {
		node = cssr.startContainer;
	}
	if (node != e.target) {
		node = e.target;
	}
	var _n = node;
	while(_n.nodeType == 1) {
		if (_n == cssr.top) {
			break;
		}
		_n = _n.parentNode;
	}
	if (_n != cssr.top) {
		return false;
	}
	bxe_context_menu.show(e,node);
	e.stopPropagation();
	e.returnValue = false;
	e.preventDefault();
	return false;
}

function bxe_UnorderedList() {
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	var lines = window.getSelection().toggleListLines("ul", "ol");
	lines[0].container.updateXMLNode();
	var li = lines[0].container;
	while (li ) {
		if (li.nodeName == "li") {
			li.XMLNode.namespaceURI = XHTMLNS;
		}
		var attr = li.XMLNode.attributes;
		for (var i in attr) {
			if (! li.XMLNode.isAllowedAttribute(attr[i].nodeName)) {
				li.XMLNode.removeAttribute(attr[i].nodeName);
			}
		}

		li = li.nextSibling;
	}
	lines[0].container.parentNode.setAttribute("class","type1");
	bxe_updateXPath();
}

function bxe_OrderedList() {
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	
	var lines = window.getSelection().toggleListLines("ol", "ul");

	lines[0].container.updateXMLNode();
	
	var li = lines[0].container;
	while (li ) {
		if (li.nodeName == "li") {
			li.XMLNode.namespaceURI = XHTMLNS;
		}
		var attr = li.XMLNode.attributes;
		for (var i in attr) {
			if (! li.XMLNode.isAllowedAttribute(attr[i].nodeName)) {
				li.XMLNode.removeAttribute(attr[i].nodeName);
			}
		}
		li = li.nextSibling;
	}
	
	// needed by unizh
	lines[0].container.parentNode.setAttribute("class","type1");
	bxe_updateXPath();
}

function bxe_InsertObject() {
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	var object = documentCreateXHTMLElement("object");
	
	sel.insertNode(object);
}

function bxe_InsertAsset() {
	
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	var object = document.createElementNS("http://apache.org/cocoon/lenya/page-envelope/1.0","assset");
	var cb = bxe_getCallback("asset","http://apache.org/cocoon/lenya/page-envelope/1.0");
	if (cb ) {
		bxe_doCallback(cb, object);
	} 
	else {
	
		sel.insertNode(object);
	}
}

function bxe_InsertImage() {
	
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	
	var mod = mozilla.getWidgetModalBox("Enter the image url or file name:", function(values) {
		if(values.imgref == null) // null href means prompt canceled
			return;
		if(values.imgref == "") 
			return; // ok with no name filled in

		
		var img = documentCreateXHTMLElement("img");
		img.firstChild.setAttribute("src",values.imgref);
		sel.insertNode(img);
		img.updateXMLNode();
		img.setAttribute("src",values.imgref);
	});
	
	mod.addItem("imgref", "", "textfield","Image URL:");
	mod.show(100,50,"fixed");
	
}

function bxe_checkForSourceMode(sel) {
	var cssr = sel.getEditableRange();
	if (cssr && cssr.top._SourceMode) {
		alert("You're in Source Mode. Not possible to use this button");
		return true;
	}
	return false;
}

function bxe_checkIsAllowedChild(namespaceURI, localName, sel, noAlert) {
	if (!sel) {
		sel = window.getSelection();
	}
	
	var cssr = sel.getEditableRange();
	var parentnode = null;
	if (cssr.startContainer.nodeType != 1) {
		parentnode = cssr.startContainer.parentNode;
	} else {
		parentnode = cssr.startContainer;
	}
	return bxe_checkIsAllowedChildOfNode(namespaceURI,localName, parentnode, noAlert);
	
}

function bxe_checkIsAllowedChildOfNode(namespaceURI,localName, node, noAlert) {
	if (localName == null || node.XMLNode.isAllowedChild(namespaceURI, localName) ) {
		return true;
	} else {
		if (!noAlert) {
			alert (localName + " is not allowed as child of " + node.XMLNode.localName);
		}
		return false;
	}
}

function bxe_InsertTable() {
	var sel = window.getSelection();
	var cssr = sel.getEditableRange();
	
	if (!bxe_checkIsAllowedChild(XHTMLNS,"table",sel, true) &&  !bxe_checkIsAllowedChildOfNode(XHTMLNS,"table",cssr.startContainer.parentNode.parentNode, true)) {
		alert ("Table is not allowed here");
		return false;
	}

	var object = documentCreateXHTMLElement("table");
	//sel.insertNode(object);
	window.bxe_ContextNode = BXE_SELECTION;
	bxe_InsertTableCallback();
}


function bxe_InsertTableCallback(node) {
	
	var sel = window.getSelection();

	if (node && node.firstChild) {
		return false;
	}
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	
	var mod = mozilla.getWidgetModalBox("Create Table", function(values) {
		var te = documentCreateTable(values["rows"], values["cols"]);
		if(!te) {
			alert("Can't create table: invalid data");
		}
		else if (window.bxe_ContextNode == BXE_SELECTION) {
			te.setAttribute("class", bxe_config.options[OPTION_DEFAULTTABLECLASS]);

			var sel = window.getSelection(); 	
			if (!bxe_checkIsAllowedChild(XHTMLNS,"table",sel, true)) {
				var cssr = sel.getEditableRange();
				ip = documentCreateInsertionPoint(cssr.top, cssr.startContainer, cssr.startOffset);
				ip.splitXHTMLLine()
				cssr.selectInsertionPoint(ip);
			}
			sel.insertNodeRaw(te, true);
			sel.insertNodeRaw(document.createTextNode("\n"));
			te.parentNode.insertBefore(document.createTextNode("\n"),te);
			te.updateXMLNode();
		} else if (window.bxe_ContextNode){
			te.setAttribute("class", bxe_config.options[OPTION_DEFAULTTABLECLASS]);
			var newNode = te.init();
			window.bxe_ContextNode.parentNode.insertAfter(newNode, window.bxe_ContextNode);
			debug("valid? : " + newNode.isNodeValid());
		}
	});
	mod.addItem("rows",2,"textfield","number of rows");
	mod.addItem("cols",2,"textfield","number of cols");
	mod.show(100,50, "fixed");
	
}

function bxe_CleanInline(e) {
	
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	
	var cssr = sel.getEditableRange();
	if(cssr.collapsed)
		return;
 
	// go through all text nodes in the range and link to them unless already set to cssr link
	var textNodes = cssr.textNodes;
	for(i=0; i<textNodes.length; i++)
	{		
		// figure out cssr and then it's on to efficiency before subroutines ... ex of sub ... 
		// try text nodes returning one node ie/ node itself! could cut down on normalize calls ...
		var textContainer = textNodes[i].parentNode;
		//if(textContainer.nodeNamed("span") && textContainer.getAttribute("class") == "a" )	{
			if (textContainer.getCStyle("display") == "inline") {
			if(textContainer.childNodes.length > 1)
			{
				var siblingHolder;

				// leave any nodes before or after cssr one with their own copy of the container
				if(textNodes[i].previousSibling)
				{
					var siblingHolder = textContainer.cloneNode(false);
					textContainer.parentNode.insertBefore(siblingHolder, textContainer);
					siblingHolder.appendChild(textNodes[i].previousSibling);	
				}

				if(textNodes[i].nextSibling)
				{
					var siblingHolder = textContainer.cloneNode(false);
					if(textContainer.nextSibling)
						textContainer.parentNode.insertBefore(siblingHolder, textContainer.nextSibling);
					else 
						textContainer.parentNode.appendChild(siblingHolder);
					siblingHolder.appendChild(textNodes[i].nextSibling);	
				}
			}

			// rename it to span and remove its href. If span is empty then delete span

			textContainer.parentNode.removeChildOnly(textContainer);
		}
	}

	// normalize A elements 
	var normalizeRange = document.createRange();
	normalizeRange.selectNode(cssr.commonAncestorContainer);
	normalizeRange.normalizeElements("span");
	normalizeRange.detach();

	// now normalize text
	cssr.commonAncestorContainer.parentElement.normalize();
	sel.selectEditableRange(cssr);
	sel.anchorNode.updateXMLNode();
}


function bxe_DeleteLink(e) {
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	
	var cssr = sel.getEditableRange();
	
	var textContainer = sel.anchorNode.parentNode;
	
	if(textContainer.nodeNamed("span") && textContainer.getAttribute("class") == "a" )
	{
		textContainer.parentNode.removeChildOnly(textContainer);
		
	}
	
	
	
	sel.selectEditableRange(cssr);
	
	
	sel.anchorNode.updateXMLNode();
}


function bxe_InsertLink(e) {
	
	var sel = window.getSelection();
	if (bxe_checkForSourceMode(sel)) {
		return false;
	}
	var aValue = "";
	if (sel.anchorNode.parentNode.XMLNode.localName == "a") {
		aValue = sel.anchorNode.parentNode.getAttribute("href");
	}
	else if(sel.isCollapsed) { // must have a selection or don't prompt
		return;
	}
	
	if (!bxe_checkIsAllowedChild(XHTMLNS,"a",sel)) {
		return false;
	}
	
	
	var mod = mozilla.getWidgetModalBox("Enter a URL:", function(values) {
		var href = values["href"];
		if(href == null) // null href means prompt canceled - BUG FIX FROM Karl Guertin
			return;
		var sel = window.getSelection();
		if (sel.anchorNode.parentNode.XMLNode.localName == "a") {
		 sel.anchorNode.parentNode.setAttribute("href", href);
		 return true;
		}
		if(href != "") 
			sel.linkText(href);
		else
			sel.clearTextLinks();
		
		sel.anchorNode.parentNode.updateXMLNode();
	}
	);
		
	
	mod.addItem("href",aValue,"textfield","Enter a URL:");
	mod.show(100,50, "fixed");
	
	
	return;
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
// replaces the function from mozile...
documentCreateXHTMLElement = function (elementName,attribs) {
	var newNode;
	var childNode;
	switch( elementName) {
		case "a":
			htmlelementname = "span";
			break;
		case "object":
		case "img":
			htmlelementname = "span";
			childNode = document.createElementNS(XHTMLNS,elementName);
			childNode.setAttribute("_edom_internal_node","true");
			break;
		default:
			htmlelementname = elementName;
	}
	newNode = document.createElementNS(XHTMLNS,htmlelementname);
	if (elementName != htmlelementname) {
		newNode.setAttribute("class", elementName);
	}
			
	if (childNode) {
		if (attribs) {
			for (var i = 0; i < attribs.length ;  i++) {
				childNode.setAttributeNS(attribs[i].namespaceURI, attribs[i].localName,attribs[i].value);
			}
		}
		newNode.appendChild(childNode);
		newNode.InternalChildNode = childNode;
		childNode.InternalParentNode = newNode;
		newNode.eDOMaddEventListener("NodeAttributesModified",bxe_InternalChildNodesAttrChanged,false);
	
	}
	return newNode;
}

function bxe_InternalChildNodesAttrChanged(e) {
	var node = e.target;
	var attribs = node.attributes;
	//we have to replace the old internalnode, redrawing of new object-sources seem not to work...
	var newNode = document.createElementNS(node.InternalChildNode.namespaceURI, node.InternalChildNode.localName);
	for (var i = 0; i < attribs.length ;  i++) {
		var prefix = attribs[i].localName.substr(0,5);
		if (prefix != "_edom" && prefix != "__bxe") {
			newNode.setAttributeNS(attribs[i].namespaceURI,attribs[i].localName,attribs[i].value);
		}
	}
	node.replaceChild(newNode,node.InternalChildNode);
	newNode.setAttribute("_edom_internal_node","true");
	node.InternalChildNode = newNode;
	createTagNameAttributes(node,true)
	
	
	
	
}

function bxe_registerKeyHandlers() {
	if (bxe_editable_page) {
		document.addEventListener("keypress", keyPressHandler, true);
//key up and down handlers are needed for interapplication copy/paste without having native-methods access
//if you're sure you have native-methods access you can turn them off
		document.addEventListener("keydown", keyDownHandler, true);
		document.addEventListener("keyup", keyUpHandler, true);
	}
}

function bxe_disableEditablePage() {
	
	bxe_deregisterKeyHandlers();
	bxe_editable_page = false;
	document.removeEventListener("contextmenu",bxe_ContextMenuEvent, false);
	
}

function bxe_deregisterKeyHandlers() {
	document.removeEventListener("keypress", keyPressHandler, true);
//key up and down handlers are needed for interapplication copy/paste without having native-methods access
//if you're sure you have native-methods access you can turn them off
	document.removeEventListener("keydown", keyDownHandler, true);
	document.removeEventListener("keyup", keyUpHandler, true);
}

function bxe_insertContent(content, replaceNode, options) {
	window.setTimeout(function() {bxe_insertContent_async(content,replaceNode,options);},1);
}

function bxe_insertContent_async(node,replaceNode, options) {
	var docfrag;
	if (typeof node == "string") {
		docfrag = node.convertToXML()
	} else {
		docfrag = node;
	}
	var oldStyleInsertion = false;
	if (replaceNode == BXE_SELECTION) {
		var sel = window.getSelection();
		var _node = docfrag.firstChild.prepareForInsert();
		if (options & BXE_SPLIT_IF_INLINE) {
			if (!bxe_checkIsAllowedChild(_node.XMLNode.namespaceURI,_node.XMLNode.localName,sel, true)) {
				var cssr = sel.getEditableRange();
				ip = documentCreateInsertionPoint(cssr.top, cssr.startContainer, cssr.startOffset);
				ip.splitXHTMLLine()
				cssr.selectInsertionPoint(ip);
				oldStyleInsertion = true;
			}
		}
		sel.insertNodeRaw(_node,oldStyleInsertion);
		_node.updateXMLNode();
		return _node;
	} else if (replaceNode) {
		
		var newNode = docfrag.firstChild.init();

		
		replaceNode.parentNode.insertAfter(newNode,replaceNode);
		newNode._node.updateXMLNode();
		debug("valid? : " + newNode.isNodeValid());
	} else {
		docfrag.firstChild.init();
		var sel= window.getSelection();
		var cssr =sel.getEditableRange();
		eDOMEventCall("appendNode",document,{"appendToNode":cssr.startContainer.parentNode.XMLNode, "node": docfrag.firstChild})
	}
}

String.prototype.convertToXML = function() {
	var BX_parser = new DOMParser();
	var content = this.toString();
	if (content.indexOf("<") >= 0) {
		
		content = BX_parser.parseFromString("<?xml version='1.0'?><rooot>"+content+"</rooot>","text/xml");
		content = content.documentElement;
		
		BX_tmp_r1 = document.createRange();
		
		BX_tmp_r1.selectNodeContents(content);
		content = BX_tmp_r1.extractContents();
		
	} else {
		content = document.createTextNode(content);
	}
	return content;
	
}

function bxe_getCallback (nodeName, namespaceURI) {
	
	if (bxe_config.callbacks[namespaceURI + ":" + nodeName]) {
		return bxe_config.callbacks[namespaceURI + ":" + nodeName];
	} else {
		return null;
	}
}

function bxe_doCallback(cb, node ) {
	window.bxe_ContextNode = node;
	if (cb["type"] == "popup") {
		
		
		var pop = window.open(cb["content"],"popup","width=600,height=600,resizable=yes");
		pop.focus();
		
	} else if (cb["type"] == "function") {
		return eval(cb["content"] +"(node)");
	}
}
		

function bxe_alert(text) {
	var widg = mozilla.getWidgetModalBox("Alert");
	widg.addText(text);
	widg.show(100,50, "fixed");
}

function bxe_validationAlert(messages) {
	var widg = mozilla.getWidgetModalBox("Validation Alert");
	for (i in messages) {
		widg.addText( messages[i]["text"] );
	}
	widg.show((window.innerWidth- 500)/2,50, "fixed");
	
}
function bxe_getDirPart(path) {
	
	return path.substring(0,path.lastIndexOf("/") + 1);
}

function bxe_nodeSort(a,b) {
	if (a.nodeName > b.nodeName) {
		return 1;
	} else {
		return -1;
	}
}

function bxe_showImageDrawer() {
	drawertool.cssr = window.getSelection().getEditableRange();
	drawertool.openDrawer('imagedrawer');
}

