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

/* 
 * mozCE V0.46
 * 
 * Mozilla Inline text editing that relies on eDOM, extensions to the standard w3c DOM.
 *
 * This file implements contenteditable/user modify in Mozilla by leverging
 * Mozilla's proprietary Selection object as well as eDOM, a set of browser independent
 * extensions to the w3c DOM for building editors. 
 *
 * POST04:
 * - refactor userModify code as part of "EditableElement" 
 * - IE's "ContentEditable" means that an element is editable whenever its "ContentEditable"
 * setting is true. However, we may change this so that you have to set editing on for a
 * document as a whole before its individual editable sections become editable. This would
 * allow a user to browse an editable document and explicitly choose to edit it or not.
 * - see if can move to using DOM events and away from Window.getSelection() if possible 
 * (effects how generic it can be!)
 * - selection model: word, line etc. Write custom handlers of clicks and use new Range
 * expansion methods
 */

/****************************************************************************************
 *
 * MozUserModify and ContentEditable: allow precise designation of editing scope. This
 * file implements user-modify/contentEditable. The following utilities let the implementation
 * determine scope.
 *
 * - http://www.w3.org/TR/1999/WD-css3-userint-19990916#user-modify
 *
 * POST04
 * - remove need to spec ContentEditable as equivalent to mozUserModify: do mapping in
 * style sheet: *[contentEditable="true"] 
 * - to change as part of "editableElement": may also move Selection methods into EditableElement
 * - support for tracking whether changes were made to elements or not ie/ does a user
 * need to save? Should MozCE warn a user to save before exiting the browser? Some of
 * this may go into eDOM itself in enhancements to document or to all elements ie/ changed?
 *
 ****************************************************************************************/

/**
 * Start of "EditableElement": this will move into eDOM once it is fleshed out.
 *
 * POST04: set user-input and user-select properly as a side effect of setting user-modify. 
 * Need to chase to explicit parent of the editable area and check if true
 * Also for contentEditable - make sure set moz user modify and other properties!
 */
Element.prototype.__defineGetter__(
	"mozUserModify",
	function()
	{
		var mozUserModify = document.defaultView.getComputedStyle(this, null).MozUserModify;
		return mozUserModify;
	}
);

/**
 * Does MozUserModify set this element modifiable
 */
Element.prototype.__defineGetter__(
		"mozUserModifiable",
		function()
		{
			// first check user modify!
			var mozUserModify = this.mozUserModify;
			if(mozUserModify == "read-write")
			{
				return true;
			}

			return false;
		}
);

/**
 * mozUserModify and contentEditable both count
 */
Element.prototype.__defineGetter__(
	"userModify",
	function()
	{
		var mozUserModify = this.mozUserModify;
		// special case: allow MS attribute to set modify level
		if(this.isContentEditable)
			return("read-write");
		return mozUserModify;
	}
);

/**
 * If either contentEditable is true or userModify is not read-only then return true. This makes
 * it easy to support a single approach to user modification of elements in a page using either
 * the W3c or Microsoft approaches.
 * 
 * POST04:
 * - consider not supporting contentEditable here
 */
Element.prototype.__defineGetter__(
		"userModifiable",
		function()
		{
			// first check user modify!
			var userModify = this.userModify;
			if(userModify == "read-write")
			{
				return true;
			}

			return false;
		}
);

/*
 * UserModifiableContext means a parent element that is explicitly set to userModifiable. Note that this accounts for
 * different degrees of userModify. If say "writetext" is inside a "write" then context will stop at the writetext
 * element. That is the context for that level of usermodify. 
 */ 
Element.prototype.__defineGetter__(
	"userModifiableContext",
	function()
	{
		// Moz route (userModify) 
		if(this.mozUserModifiable)
		{
			var context = this;
			contextUserModify = this.mozUserModify;
			while(context.parentNode)
			{
				var contextParentUserModify = context.parentNode.mozUserModify;
				if(contextParentUserModify != contextUserModify)
					break;
				context = context.parentNode;
				contextUserModify = contextParentUserModify;
			}
			return context;
		}

		// try IE route
		return this.contentEditableContext;
	}
);

/***************************************************************************************************************
 * New Selection methods to support styling the current selection
 ***************************************************************************************************************/

/**
 * POST05: change so defaultValue doesn't have to be passed in; think about toggling whole line if selection collapsed
 */
Selection.prototype.toggleTextStyle = function(styleName, styleValue, defaultValue, styleClass)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	if(cssr.hasStyle(styleName, styleValue))
		cssr.styleText(styleName, defaultValue, styleClass);
	else
		cssr.styleText(styleName, styleValue, styleClass);

	this.selectEditableRange(cssr);
}
/**
* adds or removes a class from a selection
*/
Selection.prototype.toggleTextClass = function(styleClass)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	if(cssr.hasClass(styleClass)) {
		cssr.styleText(styleClass,  false, true);
	}
	else
		cssr.styleText(styleClass, true, true);

	this.selectEditableRange(cssr);
}



/**
 * POST05: think about toggling whole line if selection collapsed
 */
Selection.prototype.styleText = function(styleName, styleValue)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	cssr.styleText(styleName, styleValue);

	this.selectEditableRange(cssr);
}

Selection.prototype.linkText = function(href)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	cssr.linkText(href);

	this.selectEditableRange(cssr);
}

Selection.prototype.clearTextLinks = function()
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	cssr.clearTextLinks();

	this.selectEditableRange(cssr);
}

Selection.prototype.styleLines = function(styleName, styleValue)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	var lines = cssr.lines();	

	for(var i=0; i<lines.length; i++)
	{
		lines[i].setStyle(styleName, styleValue);
	}

	this.selectEditableRange(cssr);
}

Selection.prototype.changeLinesContainer = function(containerName, isClass)
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	var lines = cssr.lines();
	for(var i=0; i<lines.length; i++)
	{ // replace container unless it is top
		lines[i].changeContainer(containerName, (lines[i].container == cssr.top), isClass);
	}

	this.selectEditableRange(cssr);
}

Selection.prototype.removeLinesContainer = function()
{
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	var lines = cssr.lines();
	for(var i=0; i<lines.length; i++)
	{
		if(lines[i].container != cssr.top) // as long as container isn't top then remove it
			lines[i].removeContainer();
	}

	this.selectEditableRange(cssr);
}

Selection.prototype.indentLines = function()
{	
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	indentLines(cssr);	

	this.selectEditableRange(cssr);
}

Selection.prototype.outdentLines = function()
{	
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	outdentLines(cssr);	

	this.selectEditableRange(cssr);
}

Selection.prototype.toggleListLines = function(requestedList, alternateList)
{	
	var cssr = this.getEditableRange();

	if(!cssr)
		return;

	listLinesToggle(cssr, requestedList, alternateList);

	this.selectEditableRange(cssr);
}

Selection.prototype.insertNode = function(node)
{
	var cssr = this.getEditableRange();
	
	if(!cssr)
		return;

	var ip = documentCreateInsertionPoint(cssr.top, cssr.startContainer, cssr.startOffset);

	ip.insertNode(node);
	cssr.selectInsertionPoint(ip);
	cssr.__clearTextBoundaries(); // POST04: don't want to have to use this

	this.selectEditableRange(cssr);
}

// Delegates "USERMODIFY" level check to "insertNode"
Selection.prototype.paste = function()
{
	var clipboard = mozilla.getClipboard();
	window.getSelection().insertNode(clipboard.getData(MozClipboard.TEXT_FLAVOR));	
}
// creates a hidden form field for interapp copy/paste support without native-method support
Selection.prototype._createHiddenForm = function() {
		var iframe = document.createElement("div");
		iframe.setAttribute("ID","ClipboardIFrame");
		iframe.setAttribute("style"," -moz-user-select: normal; -moz-user-input: enabled; position: absolute; width: 0px; height: 0px; position: hidden; overflow: hidden; top: 0px; left: 0px;");
		iframe =  document.getElementsByTagName("body")[0].appendChild(iframe);
		var input = document.createElement("textarea");
		input.setAttribute("style","height: 3000px;");
		// don't know of any other solution to get a Range object for the input value
		// therefore we create a span element, so we can use selectNodeContents on that later
		var placeholder = document.createElement("span");
		iframe.appendChild(input);
		iframe.appendChild(placeholder);
		iframe._placeholder = placeholder;
		iframe._input = input;
		return iframe;
}

/**
 * copies the selection to the hidden form field on key down
 */
Selection.prototype.copyKeyDown = function() {
	
	//copy the selection into the internal clipboard
	this.copy();
	//check if hidden form already exists
	var iframe = document.getElementById("ClipboardIFrame");
	if (!iframe) {
		iframe = this._createHiddenForm();
	}
	
	//store the editable range for later retrieval
	var clipboard = mozilla.getClipboard();
	var cssr = this.getEditableRange();
	iframe._cssr = cssr;  
	
	//remove all children in the placeholder span
	iframe._placeholder.removeAllChildren();
	//get the clipboard object
	var clipboard = mozilla.getClipboard();
	
	//insert the text from the internal clipboard in the placeholder span
	iframe._placeholder.appendChild(document.createTextNode(clipboard._clipboardText));
	
	//select the content of the placeholder span, so the ctrl+c keypress event can catch it
	var rng = document.createRange();
    rng.selectNodeContents(iframe._placeholder);
    this.removeAllRanges();
	this.addRange(rng);
	
}

/**
 * restores the selection back to what it was before the copy event
 */
Selection.prototype.copyKeyUp = function() {
	
	var iframe = document.getElementById("ClipboardIFrame");
	this.selectEditableRange(iframe._cssr);
}

/**
 * sets the focus to the hidden form on a paste key down event
 */
Selection.prototype.pasteKeyDown = function() {
	var iframe = document.getElementById("ClipboardIFrame");
	if (!iframe) {
		iframe = this._createHiddenForm();
	}
	// delete value of hidden form
	iframe._input.value = "";
	
	// delete childnodes of placeholder
	iframe._placeholder.removeAllChildren();
	//store the range for later retrieval
	var cssr = this.getEditableRange();
	iframe._cssr = cssr;
	iframe._input.focus();
}
/**
 * pastes the stuff from the hidden form field in to the internal clipboard
 */
Selection.prototype.pasteKeyUp = function () {
	
	var iframe = document.getElementById("ClipboardIFrame");
	iframe._input.blur();
	
	//copy the content of the hidden form into the placeholder span
	var text = iframe._placeholder.appendChild(document.createTextNode(iframe._input.value));
	
	//make a range with the content of the placesholder span
	var rng = document.createRange();
	rng.selectNodeContents(iframe._placeholder);
	
	//put the data of the placeholder span in the internal clipboard, if it's different
	// than the content in the internal clipboard (then we assume, it's newer..)
	var clipboard = mozilla.getClipboard();
	if (rng.toString() != clipboard._clipboardText) {
		clipboard.setData(rng);
	}
	//restore the selection
	this.selectEditableRange(iframe._cssr);
	// paste the content of the internal clipboard
	this.paste();
}

Selection.prototype.copy = function()
{
	var cssr = this.getEditableRange();

	if(!cssr || cssr.collapsed) // not an editable area or nothing selected
		return; 

	// data to save - render as text (temporary thing - move to html later)

	var clipboard = mozilla.getClipboard();
	// clipboard.setData(deletedFragment.saveXML(), "text/html"); // go back to this once, paste supports html paste!
	// above to be handled in mozClipboard, IMHO (chregu) 

	clipboard.setData(cssr,MozClipboard.TEXT_FLAVOR);
}

Selection.prototype.cut = function()
{
	var cssr = this.getEditableRange();

	if(!cssr || cssr.collapsed) // not an editable area or nothing selected
		return;

	var clipboard = mozilla.getClipboard();

	// clipboard.setData(deletedFragment.saveXML(), MozClipboard.HTML_FLAVOR); // go back to this once, paste supports html paste! 
	// above (conversion from selection to HTML text) to be handled in mozClipboard, IMHO (chregu) 
	clipboard.setData(cssr, MozClipboard.TEXT_FLAVOR);

	var deletedFragment = cssr.deleteTextTree();

	this.removeAllRanges();
	this.addRange(cssr);
}

/*
 * Shorthand way to get CSS Range for the current selection. This range will be marked
 * ie/ it can easily be restored.
 *
 * POST04: 
 * - consider not calculating textpointers here (createCSSTextRange) but only within the
 *   editing functions in eDOM where the context can be given more precisely.
 * - allow text selection to only begin and end on word boundaries (part of CSSTextRange 
 * selection methods)
 * - consider moving into Selection (bad for XUL/XML?)
 * - account for empty editable area (maybe in isContentEditable); account for selection
 * type ie/ element or object or text.
 */
Selection.prototype.getEditableRange = function()
{	
	try 
	{
		var selr = window.getSelection().getRangeAt(0);
		var commonAncestor = selr.commonAncestorContainer;

		if(!commonAncestor.parentElement.userModifiable)
			return null;

		var cec = commonAncestor.parentElement.userModifiableContext;

		var cssr = documentCreateCSSTextRange(selr.cloneRange(), cec); 
		return cssr;
	}
	catch(e)
	{
		return null;
	}
}

/*
 * Restore the range
 */
Selection.prototype.selectEditableRange = function(cssr)
{
	cssr.__restoreTextBoundaries(); // POST04: required cause of line manip that effects range but makes rest more complex
	var rng = document.createRange();
	this.removeAllRanges();
	this.addRange(cssr.cloneRange());	
}