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
 * eDOMXHTML.js V0.46
 *
 * The basic w3c DOM is not honed for interactive editing. eDOM extends the standard DOM
 * to make it easy to build CSS-enabled editing applications that work
 * within a browser. eDOMXHTML builds on eDOM for XHTML specific routines.
 *
 * This file represents the limits to completely CSS and Validation Module based
 * editing. You need to have HTML specific logic in some cases. As Mozile and eDOM
 * evolve this file will expand and contract. It is preferable if it goes away but
 * that may not be possible or efficient.
 *
 * POST04: 
 * - move all XHTML specific routines in here. This will include Range routines
 * (part of split of eDOM into eDOMCSS, eDOMHTML
 * - in particular containerless line stuff that mandates inserting "div"
 * parents
 * - open question: is new validation module useful for XHTML editing?
 * 
 **********************************************************************************/

/********************************* xhtml range *******************************************
 *
 * These methods are XHTML specific (there's a general problem with lists
 * as CSS has no "list-container" display type) and partially selection model specific.
 *
 * POST04:
 * - turn methods into those of an XHTML Range object
 * - this stuff could move into eDOM iff methods allow a user to pass in array of 
 * list container names. Consider this step but only after work on issues with DL.
 * - add support for DL methods
 *
 *****************************************************************************************/

/**
 * If one or more non list item lines in a range then turn them into list-items; if only list item lines
 * in a Range then promote the list-items up one level.
 */
function listLinesToggle(cssr, listContainerName, listContainerToChange)
{
	var lines = cssr.lines();

	var topToNormalize = cssr.commonAncestorContainer.parentElement;
	var newListElement = false;
	for(var i=0; i<lines.length; i++)
	{
		var listElement = lines[i].listItemAncestor;
		if(!listElement)
		{
			var lineContainer = lines[i].container;
			var makeIntermediate = false;
			// special cases: would only happen if one line only
			// - if top then make intermediate
			// - if not top - then need to move normalize context up one 
			if(lineContainer == cssr.top)
				makeIntermediate = true;
			else if(lineContainer == topToNormalize) // if only now covering one line then move up!
				topToNormalize = topToNormalize.parentNode;
			// handle special case of one line with top as container
			lineContainer = lines[i].changeContainer("li", makeIntermediate);
			lineContainer.insertParent(listContainerName);	
			// POST04: setStyle (line style?) to margin 0 if set ie/ then nixes other indent!
			newListElement = true;
		}
	}

	// if have a new list element then merge appropriate adjacent lists
	if(newListElement)
	{
		var range = document.createRange();
		range.selectNodeContents(topToNormalize);
		range.normalizeElements(listContainerName); 
	}
	// all list elements already so should toggle: BUT ONLY IF list container AND/OR list-item is not top!
	else
	{
		// special case: don't toggle a list-item top
		var firstListItem = lines[0].listItemAncestor;
		if((firstListItem == cssr.top) || (firstListItem.parentNode == cssr.top))
			return;

		var firstListContainer = __topListContainer(firstListItem);
		var lastListContainer = __topListContainer(lines[lines.length-1].listItemAncestor);
		var range = document.createRange();
		range.selectNode(firstListContainer);
		if(firstListContainer != lastListContainer)
			range.setEnd(lastListContainer.parentNode, lastListContainer.offset+1);			
		var anyRenamed = range.renameElements(listContainerToChange, listContainerName);
		if(!anyRenamed)
			outdentLines(range); // range is still valid as wasn't used and all are list items!
		else 
			// must normalize [range might be old and gone now?
			range.normalizeElements(listContainerName);
	}
}

// indent lists as lists and lines as lines (unlike listLines which makes or removes lists of all lines)
function indentLines(cssr)
{
	var lines = cssr.lines();	

	// first off, split list lines from non-list lines
	var listElements = new Array();
	var nonListLines = new Array();
	for(var i=0; i<lines.length; i++)
	{
		var listElement = lines[i].listItemAncestor;
		if(listElement)
		{
			if((listElements.length == 0) || (listElements[listElements.length-1] != listElement))
				listElements.push(listElement);
		}
		else
			nonListLines.push(lines[i]);
	}

	if(listElements.length)
	{
		// Special case: only list elements and the list element is top - no indent possible. Just return
		if((listElements.length == 1) && (listElements[0] == cssr.top))
			return;

		var topToNormalize = cssr.commonAncestorContainer.parentElement;

		// indent the list elements
		for(var i=0; i<listElements.length; i++)
		{
			if(!listElement.descendent(topToNormalize)) // if only now covering one line then move up!
				topToNormalize = listElement.parentNode;

			listElements[i].insertParent(listElements[i].parentNode.nodeName);
		}
	
		var range = document.createRange();
		range.selectNodeContents(topToNormalize);
		range.normalizeElements("UL"); 
		range.normalizeElements("OL");	
	}

	// indent the non list lines
	for(var i=0; i<nonListLines.length; i++)
	{
		// special case: one line and it is top - make an intermediate container
		// before adding margin.
		if(nonListLines[i].container == cssr.top)
			nonListLines[i].changeContainer("div", true);

		nonListLines[i].setStyle("margin-left", "+40px");
	}
}

function outdentLines(cssr)
{
	var lines = cssr.lines();

	// first off, split list lines from non-list lines
	var listElements = new Array();
	var nonListLines = new Array();
	for(var i=0; i<lines.length; i++)
	{
		var listElement = lines[i].listItemAncestor;
		if(listElement)
		{
			if((listElements.length == 0) || (listElements[listElements.length-1] != listElement))
				listElements.push(listElement);
		}
		else
			nonListLines.push(lines[i]);
	}

	// special cases: return and don't outdent if ...
	// - only one non list item and it is top
	// - only one list item and it is top 
	// - one or more list items and their parent is top
	if(((listElements.length == 1) && (listElements[0] == cssr.top)) ||
	   ((listElements.length > 0) && (listElements[0].parentNode == cssr.top)) ||
	   ((nonListLines.length == 1) && (nonListLines[0].container == cssr.top)))
		return;

	// outdent the list elements
	for(var i=0; i<listElements.length; i++)
		__outdentListItem(listElements[i]);

	// indent the non list lines
	for(var i=0; i<nonListLines.length; i++)
	{
		if(lines[i].container)
			lines[i].container.setStyle("margin-left", "-40px");
	}
}

/**
 * POST04: consider merge into outdent with ul split being done once
 */
__outdentListItem = function(listItem)
{
	// if not the first element in the container then split the container and work on the new container
	var newContainer = listItem.parentNode.split(listItem.offset);
	if(newContainer)
		listItem = newContainer.firstChild;

	// promote list item and if is was the only editable element then delete the container
	var container = listItem.parentNode;
	var nextSibling = listItem.__editableNextSibling;
	var listItem = container.parentNode.insertBefore(listItem, container);
	if(!nextSibling) // if container has no more children then nix it!
		container.parentNode.removeChild(container);

	// should we keep listItem? Only if it is not now in a list
	if(!(listItem.parentNode.nodeNamed("ul") || listItem.parentNode.nodeNamed("ol")))
	{
		// go through lines promoting where necessary
		var listContents = document.createRange();
		listContents.selectNode(listItem);
		var linesInList = listContents.lines();
		for(var i=0; i<linesInList.length; i++)
		{
			if(!linesInList[i].container || linesInList[i].container == listItem)
				linesInList[i].changeContainer("div", true);
		}
		listItem.parentNode.removeChildOnly(listItem);
	}
}

/**
 * POST04: may redo as general purpose "ancestorWithDisplay". This really wants a CSS called "list-container"
 * 
 * Change to take "top" -- easier comparison! Not safe for XUL boxes set to be the editable area!
 * 
 * @returns return the list element that this line is in if it is in a list element; return null otherwise.
 */
CSSLine.prototype.__defineGetter__(
	"listItemAncestor",
	function()
	{
		var nodeToTest = this.container;
		if(nodeToTest == null)
			nodeToTest = this.__baseRange.startContainer; /// TODO: this.firstNode
		nodeToTest = nodeToTest.parentElement;
		while(nodeToTest != document)
		{
			if(document.defaultView.getComputedStyle(nodeToTest, null).getPropertyValue("display") == "list-item")
				return nodeToTest;
			nodeToTest = nodeToTest.parentNode;				
		}
		return null;
	}
);

// POST04: move into Range methods - part of methods to expand the context of a range
function __topListContainer(node)
{
	var container = node;
	while(container.parentNode.nodeNamed("ul") ||
	      container.parentNode.nodeNamed("ol"))
		container = container.parentNode;
	return container;	
}	


/* sets the class attribute of an element */
Element.prototype.setClass = function(className) {
	this.setAttribute("class",className);
	
}
/* adds a class to the class attribute 
<span class="class1"> ->
<span class="class1 class2">
*/
Element.prototype.addClass = function(className) {
	if (!this.hasClass(className)) {
		var oldClass = this.getAttribute("class");
		if (oldClass) { oldClass += " "} 
		else { oldClass = "";}
		this.setAttribute("class",oldClass + className);
	}
	return true;
	
}
/* removes a class from the class attribute
<span class="class1 class2"> ->
<span class="class1">
*/
Element.prototype.removeClass = function(className) {
	var classes = this.getClasses();
	var newClasses = new Array();
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] != className) {
			newClasses.push( classes[i]);
		}
	}
	if (newClasses.length > 0 ) {
		this.setClass(newClasses.join(" "));
	} else {
		this.removeAttribute("class");
	}
	
}

/* checks if a class is in the classAttribute */
Element.prototype.hasClass = function(className) {
	var classes = this.getClasses();
	for (var i = 0; i < classes.length; i++) {
		if (classes[i] == className) {
			return true;
		}
	}
	return false;
}

/* returns all classes as an array or an empty
array if there are none */
Element.prototype.getClasses = function() {
	var classes = this.getAttribute("class");
	if (classes) {
		return this.getAttribute("class").split(" ");
	} else {
		return new Array();
	}
}