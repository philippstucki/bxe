/* ***** BEGIN LICENSE BLOCK *****
 * Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Full Terms at http://mozile.mozdev.org/license.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Playsophy code.
 *
 * The Initial Developer of the Original Code is Playsophy
 * Portions created by the Initial Developer are Copyright (C) 2002-2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

/**********************************************************************************
 * mozileModify.js V0.46: modify this file to specialize Mozile. 
 * 
 * POST06:
 * - may be replaced with a configuration file/something set in preferences 
 **********************************************************************************/

/**
 * Save changes to a remote server or to a local file
 *
 * This method is called by the "save" button in the Mozile toolbar. Change this
 * method to allow users to save changes made through Mozile.
 *
 * editableArea: the topmost element in the currently selected editable area
 */
function mozileSave()
{
	// call default  
	eDOMEventCall("save",document);
	
	
	// one alternative: save the document as a whole.
	// __mozileSaveToFile();
}

/**
 * Dummy save just shows what in the editable area needs to be saved
 * calls alert to show what should be saved: mozile deployer should replace this 
 * with a post, ftp or XML rpc call to a CMS.
 */
function __mozileDummySave(e)
{
	var cssr = window.getSelection().getEditableRange();
	if(!cssr)
	{
		alert("*mozileModify.js:mozileSave: this default implementation only works if the current selection is in an editable area");
		return;
	}
		
	var editableArea = cssr.top;

	// get the id of the editable area - this would tell a remote CMS where the data
	// is coming from
	var editableAreaId = editableArea.id;

	// get the contents of the editable area
	var dataToSaveRange = document.createRange();
	dataToSaveRange.selectNodeContents(editableArea);
	var dataToSave = dataToSaveRange.cloneContents();

	// Note: despite its name, the new DOM 3 method, "saveXML" doesn't save. It 
	// returns the (X)HTML or XML information you need to save in order to persist
	// an element's contents. 
	alert("*mozileModify.js:mozileSave: replace this implementation with a CMS specific equivalent*\nData from editable element <"+ editableAreaId + "> to save/post/ftp:\n" + documentSaveXML(dataToSave));
}

/**
 * Alternative save - save document as a whole
 */
function __mozileSaveToFile()
{
	// first nix the toolbar
	ptbdisable();

	var mfp = mozilla.createFilePicker(MozFilePicker.MODE_SAVE, "save to local file");
	if(mfp)
	{
		mfp.addFilter(MozFilePicker.FILTER_HTML);
		if(mfp.promptUser())
		{
			var mf = mfp.file;
			var documentContents = document.saveXML(document);
			mf.write(documentContents); // to do: remove toolbar
		}
	}
	else
	{	
		alert("mozileSave: can't save-to-file because Mozilla doesn't allow remote scripts to launch its native file picker dialog. Either run Mozile locally or wait until it is packaged as an extension. For more information, see http://mozile.mozdev.org/use.html."); 
	}

	ptbenable();
}


function toggleSourceMode(e) {
	
	var editableArea = e.target;
	
	if (editableArea._TagMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleTagMode");
	}
	
	var dataToSaveRange = document.createRange();
	dataToSaveRange.selectNodeContents(editableArea);
	var dataToSave = dataToSaveRange.cloneContents();
	if (!editableArea._SourceMode) {
		editableArea.removeAllChildren();
		editableArea.setStyle("white-space","-moz-pre-wrap");
		editableArea.appendChild(document.createTextNode(dataToSave.saveXML()));
		editableArea._SourceMode = true;
	} else {
		editableArea.setStyle("white-space",null);
		var innerhtmlValue = editableArea.getContent();
		editableArea.removeAllChildren();
		editableArea.innerHTML = innerhtmlValue;
		editableArea._SourceMode = false;
	}

}


function toggleTagMode(e) {
	var editableArea = e.target;
	
	if (editableArea._SourceMode) {
			e = new eDOMEvent();
			e.setTarget(editableArea);
			e.initEvent("toggleSourceMode");
	}
	var x;
	var node;
	var walker
	if (!editableArea._TagMode) {
		walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			editableArea.ownerDocument);
		node =   walker.nextNode();
		while(node  ) {
			var _tagnameOpen = node.nodeName;
			var _tagnameClose = node.nodeName;
			for( var i =0; i < node.attributes.length; i++) {
				if (node.attributes[i].nodeName != "_tagnameopen" && node.attributes[i].nodeName != "_tagnameclose") {
					_tagnameOpen += " " + node.attributes[i].nodeName+'="'+node.attributes[i].nodeValue+'"';
				}
			}
			if (_tagnameOpen == 'SPAN style=""') {
				node.removeAttribute("_tagnameopen");
				node.removeAttribute("_tagnameclose");
			} else {
				node.setAttribute("_tagnameopen",_tagnameOpen);
				node.setAttribute("_tagnameclose",_tagnameClose);
			}
			node =  walker.nextNode();
		}
		x = document.styleSheets[0];
		x.insertRule('#' + editableArea.id + ' *:before {content: "<" attr(_tagnameOpen)  ">"; margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		x.insertRule('#' + editableArea.id + ' *:after {content: "</" attr(_tagnameClose)  ">"; margin-left: 2px; margin-right: 2px; font: 9px Geneva, Verdana, sans-serif; padding: 0px 1px 0 px 1px; border: 1px solid black; background: #888;  color: #FFF;}',x.cssRules.length);
		document.addEventListener("DOMNodeInserted",addTagnames,false);
		document.addEventListener("DOMNodeRemoved",addTagnames,false);
		document.addEventListener("DOMAttrModified",addTagnames,false);
		editableArea._TagMode = true;
	} else {
		walker = document.createTreeWalker(
			editableArea, NodeFilter.SHOW_ELEMENT,
			null, 
			editableArea.ownerDocument);
		node = null;
		document.removeEventListener("DOMNodeInserted",addTagnames,false);
		document.removeEventListener("DOMAttrModified",addTagnames,false);
		document.removeEventListener("DOMNodeRemoved",addTagnames,false);
		node =   walker.nextNode();
		while(node ) {
			node.removeAttribute("_tagnameopen");
			node.removeAttribute("_tagnameclose");
			node = walker.nextNode()
		}
		x = document.styleSheets[0];
		x.deleteRule(x.cssRules.length-1);
		x.deleteRule(x.cssRules.length-1);

		editableArea._TagMode = false;
	}

}

function addTagnames (e) {		
	
	var node = e.target; 
	if (node.nodeType != 1) {
		node = node.parentNode;
	}
	
	var _tagnameOpen = node.nodeName;
	var _tagnameClose = node.nodeName;
	
	for( var i =0; i < node.attributes.length; i++) {
		if (node.attributes[i].nodeName != "_tagnameopen" && node.attributes[i].nodeName != "_tagnameclose") {
			_tagnameOpen += " " + node.attributes[i].nodeName+'="'+node.attributes[i].nodeValue+'"';
		}
	}
	if (_tagnameOpen == 'SPAN style=""') {
		document.removeEventListener("DOMAttrModified",addTagnames,false);
		node.removeAttribute("_tagnameopen");
		node.removeAttribute("_tagnameclose");
		document.addEventListener("DOMAttrModified",addTagnames,false);
	} else {
		node.setAttribute("_tagnameopen",_tagnameOpen);
		node.setAttribute("_tagnameclose",_tagnameClose);
	}
}


