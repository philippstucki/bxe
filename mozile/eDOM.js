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
 * eDOM.js V0.46: editor or extended DOM
 *
 * The basic w3c DOM is not honed for interactive editing. eDOM extends the standard DOM
 * to make it easy to build CSS-enabled XML and XHTML editing applications that work
 * within a browser. Initially it should support editing of XHTML in XHTML and XML pages 
 * within any W3c DOM supporting browser. Geiko-based browser like Mozilla are the initial 
 * target.
 *
 * When complete, eDOM will be a DOM module that facilities a wide variety of domain specific
 * and general purpose editors. It itself is not an editor: issues like Selection models
 * and toolbars are beyond its scope. It represents the routines needed in editors built
 * over the w3c DOM. First releases tackle text/object manipulation (editing and styling); 
 * later releases will address layout editing.
 * 
 * The initial target is basic XHTML text editing. This requires some new methods for w3c DOM
 * objects and three new Objects:
 * - CSSTextRange: text in a range may be manipulated in various ways; CSS is one
 * way to restrict how it should be processed.
 * - InsertionPoint: allow you to iterate, examine and manipulate the visible characters 
 * of a document
 * - CSSLine: captures the concept of contiguous nodes that define a block, either inline elements or
 * text nodes.
 *
 * POST04:
 * - split the double: XHTML and CSS/Text DOM routines: this applies to Range in particular
 * - update to InsertionPoint (traversal tracking and insertion in empty cells, list-items
 * divs, spans, between/before/after images)
 * - round out style handling tackling synonyms/classes
 * - cloneNode that doesn't clone "id"
 * - fully support CSS driven deletion to account for tables (method: emptyTextNodes)
 * - more use of Range: setStartBefore, selectContents etc
 * - check if prototype exists before creating it. For example, Safari supports parentElement.
 * - add undo to all public change methods [may be out of scope for eDOM itself]
 * - url/href/link handlers: ability to find local references easily [needed for post/save]
 * 
 **********************************************************************************/

/*********************************** eDOM version *********************************/

const eDOM_VERSION = "0.46";

/**
 * Is there support for the eDOM either as a whole or for a particular version.
 *
 * Use: if(document.supportsEDOM) or if(document.supportsEDOM && document.supportsEDOM("0.3"))
 *
 * @argument version if null then check if any version of eDOM is supported - otherwise check a particular version
 *
 * POST02: Would be much better to be able to add a feature dynamically to implementation.hasFeature. 
 * Don't see how to do this. Get security exceptions
 */
Document.prototype.supportsEDOM = function(version)
{
	if((version == eDOM_VERSION) || (version == ""))
		return true;
	return false;
}

/********************************* XHTML namespace ********************************/

const XHTMLNS = "http://www.w3.org/1999/xhtml"; // XHTML name space

/**
 * Ensure that element creation uses the XHTML name space only if necessary
 *
 * POST04:
 * - move any of the XHTML explicit stuff into eDOMXHTML.js or work on using default namespaces. 
 * - force use of name spaces for all cases: main draw back is can't use
 * XML serializer for basic HTML (need to do own in domlevel3.js) but that's fine.
 * - for non XHTML pages, ensure that the XHTML name space declaration is at the top of the document: add it if it isn't
 */
function documentCreateXHTMLElement(elementName)
{
	if(document.body)
		return document.createElement(elementName);
	
	// POST05: do more experiments with this. Do experiments: if insert HTML: then things look
	// better but don't work so well when doing plain name comparisons!
	return document.createElementNS(XHTMLNS, elementName.toLowerCase());
}

Element.prototype.hasXHTMLAttribute = function(attributeName)
{
	if(document.body)
		return this.hasAttribute(attributeName);
	
	return this.hasAttributeNS(XHTMLNS, attributeName);
}

Element.prototype.getXHTMLAttribute = function(attributeName)
{
	if(document.body)
		return this.getAttribute(attributeName);
	
	return this.getAttributeNS(XHTMLNS, attributeName);
}

/**
 * Removes all children of an Element
 */
Element.prototype.removeAllChildren = function() {
	var child = this.firstChild;
	while (child) {
		var oldchild = child;
		child = child.nextSibling;
		this.removeChild(oldchild);
	}
}

/**
 * Removes all children of an Element
 */
Element.prototype.appendAllChildren = function(node) {
	var child = node.firstChild;
	while (child) {
		var oldchild = child;
		child = child.nextSibling;
		this.appendChild(oldchild);
	}
}

/**
 * Get content of all text nodes of an element (idea stolen from libxml2)
 */
Element.prototype.getContent = function() {
	var walker = document.createTreeWalker(
		this, NodeFilter.SHOW_TEXT,
		null, 
		this.ownerDocument);
	var returnString = "";
	var node = null;
	while( node = walker.nextNode() ) {
		returnString += node.nodeValue ;
	}
	return returnString;
}

 
/*********************************** Node/Element/Text/CSS ****************************/

/*
 * What is a node's offset within its parent?
 */
Node.prototype.__defineGetter__(
	'offset',
	function()
	{
		var parentNode = this.parentNode;

		var nextChild = parentNode.firstChild;
		var offset = 0;
		while(nextChild)
		{
			if(nextChild == this)
				return offset;

			offset++;
			nextChild=parentNode.childNodes[offset];
		}
	}
);

Node.prototype.__defineGetter__(
	'parentElement',
	function()
	{
		if(this.nodeType == Node.TEXT_NODE)
			return this.parentNode;
		return this;
	}
);

Node.prototype.hasOnlyInternalAttributes = function() {
	var attr = this.attributes;
	for (var i = 0; i < attr.length; i++) { 
		if (attr[i].nodeName.substr(0,5) != "_edom") {
			return false;
		}
	}
	return true;
}

Node.prototype.descendent = function(ancestor)
{
	var nodeParent = this.parentNode;
	while(nodeParent)	
	{
		if(nodeParent == ancestor)
			return true;
		nodeParent = nodeParent.parentNode;
	}
	return false;
}

// POST05: account for document.documentElement (ie/ top of document)
Node.prototype.__defineGetter__(
	"__nilParentNode",
	function()
	{
		var nilParent = this.parentNode;
		while(document.defaultView.getComputedStyle(nilParent, null).getPropertyValue("display") == "inline")
			nilParent = nilParent.parentNode;
		return nilParent;
	}
);

/**
 * POST05: 
 * - effects Range
 */
Node.prototype.insertParent = function(parentName)
{
	var currentParent = this.parentNode;
	var newParent = documentCreateXHTMLElement(parentName);
	newParent = currentParent.insertBefore(newParent, this);
	newParent.appendChild(this);
	return newParent;
}

/**
 * @returns the first previous sibling that is not an empty text node
 * 
 * POST04: need to change to use IPNodeFilter (get rid of nonEmpty check everywhere) - will need to account for
 * skip here! Careful - need to see if rework works in normalize etc
 */
Node.prototype.__defineGetter__(
	"__editablePreviousSibling",
	function()
	{
		var previousSibling = this.previousSibling;
		while(previousSibling)
		{
			if(__NodeFilter.nonEmptyText(previousSibling) == NodeFilter.FILTER_ACCEPT)
				return previousSibling;
			previousSibling = previousSibling.previousSibling;
		}
		return null;
	}
);

/**
 * Get the next editable sibling of a node. An editable sibling is one with at least one non-empty text node as
 * a decendent.
 * 
 * POST04: need to change to use IPNodeFilter
 *
 * @returns non empty node after this one or null if there isn't one
 */
Node.prototype.__defineGetter__(
	"__editableNextSibling",
	function()
	{
		var nextSibling = this.nextSibling;
		while(nextSibling)
		{
			if(__NodeFilter.nonEmptyText(nextSibling) == NodeFilter.FILTER_ACCEPT)
				return nextSibling;
			nextSibling = nextSibling.nextSibling;
		}
		return null;
	}
);

/**
 * Peer of insertBefore
 * 
 * @argument elementToInsert
 * @argument child
 */
Element.prototype.insertAfter = function(elementToInsert, child)
{
	if(this.lastChild == child)
		this.appendChild(elementToInsert);
	else
		this.insertBefore(elementToInsert, child.nextSibling);
}

/**
 * Split the element in two with some children staying with this element and others going to a new 
 * sibling. Split won't happen if offset points before the first or after the last editable child 
 * of the element.
 *
 * @argument offset this element's index in its parent's child list
 *
 * @returns new element inserted after this element in the tree or null if no split happens
 */
Element.prototype.split = function(offset)
{
	// don't split if offset is after the last child!
	if(this.childNodes.length <= offset)
		return null;

	// if no previous node to leave in existing container then can't split container
	// in other words: ul|li
	if(!this.childNodes[offset].__editablePreviousSibling)
		return null;

	// won't get here unless there is a previous sibling so this check can see if the element before this
	// one has a next sibling. This catches situations where you are beyond the end of a list ie/
	// li|</ul>. It will check if li.__editableNextSibling which it won't!
	if(!this.childNodes[offset-1].__editableNextSibling)
		return null;

	var newElement = this.cloneNode(false);
	this.parentNode.insertAfter(newElement, this);
	var child;
	while(child = this.childNodes[offset])
	{
		newElement.appendChild(child);
	}
	return newElement;
}

Element.prototype.replaceChildOnly = function(child, newChildName)
{
	var newElement = documentCreateXHTMLElement(newChildName);
	// copy attributes of this element
	for(var i=0; i<child.attributes.length; i++)
	{
		var childAttribute = child.attributes.item(i);
		var childAttributeCopy = childAttribute.cloneNode(true);
		newElement.setAttributeNode(childAttributeCopy);
	}
	var childContents = document.createRange();
	childContents.selectNodeContents(child);

	newElement.appendChild(childContents.extractContents());
	childContents.detach();
	this.replaceChild(newElement, child);
	return newElement;
}

Element.prototype.removeChildOnly = function(oldChild)
{
	if(oldChild.childNodes.length > 0)
	{
		var childContents = document.createRange();
		childContents.selectNodeContents(oldChild);
		this.insertBefore(childContents.extractContents(), oldChild);
	}

	return this.removeChild(oldChild); 
}

/*
 * POST04: 
 * - account for "class" as well as style (treat as generic enum attr where order
 * doesn't matter)
 * - account for "display": never match table columns
 * - xml: do full attribute matching
 * - xml: style doesn't come from a style method
 */
Element.prototype.match = function(node)
{
	if(!node)
		return false;

	if(this.nodeType != node.ELEMENT_NODE)
		return false;

	if(this.nodeName.toLowerCase() != node.nodeName.toLowerCase())
		return false;

	if(this.attributes.length != node.attributes.length)
		return false;

	for(var i=0; i<this.attributes.length; i++)
	{
		var thisAttribute = this.attributes.item(i);
		var nodeAttribute = node.attributes.getNamedItem(thisAttribute.nodeName);
		if(!nodeAttribute)
			return false;

		// do literal string compare on all but style attribute. This may not work with
		// XML which may have other attributes like style. Need more sophisticated attribute
		// match handling.

		// POST04: this may not work for XML. Seem to remember not having style explicitly.
		if(nodeAttribute.nodeName == "style")
		{
			if(!node.style.match(this.style))	
				return false;
		}
		// assume all but style need to be exactly the same!	
		else if(nodeAttribute.nodeValue != thisAttribute.nodeValue)
		{
			return false;
		}		
	}	

	return true;
}

/**
 * Set the value of style
 *
 * POST04:
 * - distinguish inline and block level styles ...
 * - may move most of this into "CSSLine.setStyle": list all styles, see if any integer styles for inline
 * - needs to use style property meta; now only works for integer value styles
 * [meta: name, displays, int or enum or ..., units (if int) etc
 * - text justify: CSSLine ... text-align (justify is default?)
 */
Element.prototype.setStyle = function(styleName, styleValue)
{
	var intStyleRegExp = /(\D?)(\d+)(.*)/i;
	var regResult = intStyleRegExp.exec(styleValue);

	// non integer style - just set the value for now
	if(!regResult)
	{
		this.style.setProperty(styleName, styleValue, "");
		return;
	}

	// integer style from here on ...
	var plusOrMinus = regResult[1];
	var intVal = parseInt(regResult[2]);
	var units = regResult[3];

	// style attribute value is a string (this.attributes.getNamedItem("style").value). This is far from ideal
	// for easy setting: basically reduces style manip to string matching. For now use, HTML style attribute
	// which gives a CSSDeclaration ... Not ideal as doesn't work for XML.

	// shouldn't this come from computedValue? POST04 ie/ factor in inherited offsets ...
	var currentStyleValue = parseInt(this.style.getPropertyValue(styleName));
	if(isNaN(currentStyleValue))
	{
		if(plusOrMinus != "-") // for now, don't allow for - values
			this.style.setProperty(styleName, intVal+units, "");
		return;
	}
	
	if(plusOrMinus == "+") // increment
		currentStyleValue += intVal;
	else if(plusOrMinus == "-") // decrement
	{
		// for now, allow no negatives!
		if(currentStyleValue <= intVal)
		{
			this.style.removeProperty(styleName);
			// if style is now empty, remove it!
			if(this.style.length == 0) // nix style if no other style setting!
				this.attributes.removeNamedItem("style");
			return;
		}

		currentStyleValue -= intVal;		
	}

	this.style.setProperty(styleName, currentStyleValue + units, "");
}
/**
 * Remove redundant inline classes - those classes inherited already from the parent of an element
 *
 */

Element.prototype.removeRedundantInlineClasses = function()
{
	var thisClasses = this.getClasses();
	var parentClasses = this.parentNode.getClasses();
	dump ("----# " + this.parentNode + parentClasses+"\n");
	for (var i = 0; i < thisClasses.length; i++) {
		dump (thisClasses[i] + "\n");
		for (var j = 0; j < parentClasses.length; j++) {
			dump ("  " + parentClasses[j] + "\n");
			if (parentClasses[j] == thisClasses[i]) {
				this.removeClass(parentClasses[j] );
			}
		}
	}
}

/**
 * Remove redundant inline styles - those styles inherited already from the parent of an element
 *
 * POST04: rename to normalizeStyleSettings? Issue of default "transparent" for color and "start" for "text-align"
 */
Element.prototype.removeRedundantInlineStyles = function()
{
	for(var j=0; j<this.style.length; j++)
	{
		var styleName = this.style.item(j);
		var styleValue = this.style.getPropertyValue(styleName);
		var parentStyleValue = document.defaultView.getComputedStyle(this.parentNode, null).getPropertyValue(styleName);

		// problem: if the element itself/class sets the style even when we remove the inline then there's a prob!

		// if parent already has setting then remove it
		if(parentStyleValue == styleValue)
		{
			this.style.removeProperty(styleName);	

			// now make sure that removing the property actually expose's the parent's setting. If not
			// then we must put it back! It is possible that the tag of the element fixes the style or
			// at least a style different than the one intended.
			if(document.defaultView.getComputedStyle(this, null).getPropertyValue(styleName) != parentStyleValue)
					this.style.setProperty(styleName, styleValue, "");		
		}
	}

	if(this.hasXHTMLAttribute("style") && (this.style.length == 0))
		this.attributes.removeNamedItem("style");
}

/**
 * Does a node have a particular name - case insensitive
 * 
 * POST05: make into accessor giving back lower case name every time
 */
Element.prototype.nodeNamed = function(nodeName)
{
	return(this.nodeName.toLowerCase() == nodeName.toLowerCase());
}

/**
 * Cleanup standard conformant inline CSS ie/ remove redundancies
 *
 * Three types of A or span need normalization:
 * - those that only contain space: delete the element but keep the space
 * - those with redundant inline CSS, CSS that their parent's have: delete the redundant settings
 * - those that follow an A or span that has identical properties: merge 
 * - those with no CSS: delete the element but keep its contents
 *
 * POST04:
 * - change to take inline container list so that it is more generic
 */ 
Element.prototype.__normalizeXHTMLTextStyle = function()
{

	// normalize element filter checks two things:
	// - is the element within the Range
	// - does the element have an identical previous sibling (prelude to merge!)
	var normalizeFilter = function(node)
	{	
		// any inline or specifically fix on these two?						
		// will only normalize spans or A's with one child. This prevents bad XHTML from complicating
		// merge logic below	
		if((node.parentNode.nodeNamed("span") || node.parentNode.nodeNamed("a")) && (node.parentNode.childNodes.length == 1))
		{
			return NodeFilter.FILTER_ACCEPT;
		}	  	
		return NodeFilter.FILTER_REJECT;		
	}

	var tw = document.createTreeWalker(this,
					   NodeFilter.SHOW_TEXT,
					   normalizeFilter,
					   false);

	// go through all text nodes that appear in spans or A's
	var nextTextNode = tw.firstChild();
	while(nextTextNode)
	{
		var thisTextNode = nextTextNode;
		nextTextNode = tw.nextNode();
		var thisISC = thisTextNode.parentNode;
		thisISC.removeRedundantInlineStyles();	
		thisISC.removeRedundantInlineClasses();
		// nix isc if empty text node or redundant inline styles
		if((__NodeFilter.nonEmptyText(thisTextNode) == NodeFilter.FILTER_REJECT) ||
		thisISC.hasOnlyInternalAttributes() ) 
		{
			var elContents = document.createRange();
			elContents.selectNodeContents(thisISC);
			thisISC.parentNode.insertBefore(elContents.extractContents(), thisISC);
			thisISC.parentNode.normalize(); // no problem to tree traversal as it gets text in own spans!
			thisISC.parentNode.removeChild(thisISC);
		}
		else // if didn't nix then try to merge!
		{
			// merge ISC with previous sibling if they match
			var previousSibling = thisISC.__editablePreviousSibling;

			if(previousSibling && previousSibling.match && previousSibling.match(thisISC))
			{
				// delete intermediate text nodes and other "useless" markup
				var thisISCParentNode = thisISC.parentNode;
				while(previousSibling.nextSibling != thisISC)
					thisISCParentNode.removeChild(previousSibling.nextSibling);
	
				// merge siblings
				var contentsToMerge = document.createRange();
				contentsToMerge.selectNodeContents(thisISC);
				previousSibling.appendChild(contentsToMerge.extractContents());
				previousSibling.normalize();
				thisISCParentNode.removeChild(thisISC);	
			}
		}
	}
}

/*
 * POST04: need to account for synonyms and complex css values
 */
CSSStyleDeclaration.prototype.match = function(declToMatch)
{
	if(this.length != declToMatch.length)
		return false;

	for(var j=0; j<this.length; j++)
	{
		var aStyleName = this.item(j);
		var bStyleValue = declToMatch.getPropertyValue(aStyleName);
		var aStyleValue = this.getPropertyValue(aStyleName);
		if(aStyleValue != bStyleValue)
		{
			return false;
		}				
	}

	return true;
}

/************************************ InsertionPoint *********************************************
 * An IP or Insertion Point node is:
 * - a visible text node
 * - an inline, EMPTY_CONTENTTYPE element node ie/ one that doesn't take children ex/ IMG, BR in XHTML. 
 *   Idea is to allow text insertion before or after them within a line.
 *
 * The form of raw and rendered text vary mainly according to the handling of whitespace.
 * As the XML standard says: "In editing XML documents, it is often convenient to use 
 * "white space" (spaces, tabs, and blank lines) to set apart the markup for greater 
 * readability. Such white space is typically not intended for inclusion in the delivered 
 * version of the document. On the other hand, "significant" white space that should be 
 * preserved in the delivered version is common, for example in poetry and source code."
 * eDOM must traverse the rendered whitespace based on the actual whitespace in the "raw"
 * text.
 * - handle whitespace = pre: http://www.w3.org/TR/html4/struct/text.html#h-9.3.4 
 * - XML: http://www.w3.org/TR/2000/REC-xml-20001006#sec-white-space
 * - XHTML: http://www.w3.org/TR/xhtml1/#uacon
 * 
 * There is also the concept of an "InsertionPoint Token" (IPT) whose presense makes Geiko show
 * a line and for eDOM marks that insertion is allowed within an element. However, the first inserted
 * item will replace and opposed to adding to the token. 
 *
 * Valid tokens are:
 * - a BR (invisible element) in a line with nothing other than whitespace
 * - an NBSP on its own in a line
 *
 * When laying out a page a user can choose to put nothing but tokens in various editable elements.
 *
 * POST04: 
 * - add replaceCharacter (insert mode)
 * - iptoken (expand to cover BR etc)
 * - tighten impl of insertNode etc
 * - add methods to create lines etc
 ************************************************************************************************/

InsertionPoint.SAME_LINE = 0;
InsertionPoint.CROSSED_BLOCK = 1;
InsertionPoint.AT_TOP = 2;

Document.prototype.createInsertionPoint = documentCreateInsertionPoint;

/*
 * POST05: seed checking (invisible?, ANY_CONTENTTYPE element etc) ie/ intercept refs to non empty el's or empty text nodes
 */
function documentCreateInsertionPoint(top, seed, seedOffset)
{
	var ip = __createInsertionPoint(top, seed, seedOffset);

	// can't be within or before whitespace at the start of a line; within whitespace within the line; or 
 	// within or after whitespace at the end of a line
	if((ip.__cssWhitespace != "pre") && ip.whitespace)
	{
		// go to start of whitespace sequence or token (same_line) or end of previous block (crossed_block) or stay where you are (at_top)
		var result = ip.backOne();

		// three cases where must move forward:
		// - same_line && not whitespace but also not IPToken: move back to whitespace!
		// - at_top: didn't move so move forward as whitespace must be collapsed at block start
		// - crossed_block: move forward to valid character after seed whitespace
		if(((result == InsertionPoint.SAME_LINE) && !ip.whitespace && !ip.IPToken) ||
		   (result == InsertionPoint.AT_TOP) ||
		   (result == InsertionPoint.CROSSED_BLOCK))
			ip.forwardOne();
	}	
	
	return ip;
}

/*
 * Simple version of creation that doesn't check if the seed and seedOffset are valid. This is used for basic 
 * creation, forward and back testing.
 */
function __createInsertionPoint(top, seed, seedOffset)
{
	var ip = new InsertionPoint(top, seed, seedOffset, null, document.defaultView.getComputedStyle(seed.parentNode, null).getPropertyValue("white-space"));
	return ip;
}

/*
 * POST04: need to accept selection of inline isolated whitespace
 */
function InsertionPoint(top, seed, seedOffset, cw, csswsp)
{
	this.__top = top;
	this.__ipNode = seed;
	this.__ipOffset = seedOffset;
	this.__cw = cw;
	this.__cssWhitespace = csswsp;
}

InsertionPoint.prototype.__defineGetter__(
	"top",
	function() {return this.__top;}
);

InsertionPoint.prototype.__defineGetter__(
	"cssWhitespace",
	function() {return this.__cssWhitespace;}
);

InsertionPoint.prototype.__defineGetter__(
	"ipNode",
	function() {return this.__ipNode;}
);

InsertionPoint.prototype.__defineGetter__(
	"ipOffset",
	function() {return this.__ipOffset;}
);

InsertionPoint.prototype.clone = function()
{
	var clone = new InsertionPoint(this.__top, this.__ipNode, this.__ipOffset, this.__cw, this.__cssWhitespace);
	return clone;
}

InsertionPoint.prototype.set = function(ip)
{
	this.__top = ip.__top;
	this.__ipNode = ip.__ipNode;
	this.__ipOffset = ip.__ipOffset;
	this.__cw = ip.__cw;
	this.__cssWhitespace = ip.__cssWhitespace;
}

/**
 * IP tokens serve as the only non whitespace children of otherwise "ANY_CONTENTTTYPE" Elements. Without the token, Geiko
 * wouldn't render these nodes properly and an editor wouldn't know that it is valid to enter text within them. An editor
 * should replace a token when inserting content rather than just appending content around it.
 *
 * For XHTML, a IP token is an empty BR element OR an NBSP-only text node that are the only elements in their line.
 * 
 * POST05:
 * - add support for BR (move into eDOMHTML?) ie/ override this method with an equivalent ie/ copy its contents (specialization?)
 */
InsertionPoint.prototype.__defineGetter__(
	"IPToken",
	function()
	{
		// first case: NBSP on its own
		if((this.__ipNode.nodeType == Node.TEXT_NODE) && 
		   (this.__ipOffset < this.__ipNode.nodeValue.length) &&
		   (this.__ipNode.nodeValue.charAt(this.__ipOffset) == STRING_NBSP))
		{
			// See if more than this nbsp in the line (ie/ match non-nbsp whitespace) - if not then go before the NBSP
			var line = new CSSLine(this.__ipNode);
			var matches = line.toString().match(/[^\f\n\r\t\u0020\u2028\u2029]/g);
			if(matches.length == 1)
				return true;
		}
		return false;
	}
);

InsertionPoint.prototype.__defineGetter__(
	"__beforeEmptyElement",
	function()
	{
		if(this.__ipNode.nodeType != Node.ELEMENT_NODE)
			return false;

		if(this.__ipNode.childNodes.length == this.__ipOffset)
			return false;

		var refNode = this.__ipNode.childNodes[this.__ipOffset];

		if(refNode.nodeType != Node.ELEMENT_NODE)
			return false;

		if(refNode.contentType != Element.EMPTY_CONTENTTYPE)
			return false;

		if(document.defaultView.getComputedStyle(refNode, null).getPropertyValue("display") != "inline")
			return false;

		return true;
	}
);

/**
 * Does the insertion point point to a whitespace?
 *
 * http://www.w3.org/TR/REC-CSS2/text.html#white-space-prop
 * "space" (Unicode code 32), "tab" (9), "line feed" (10), "carriage return" (13), and "form feed" (12)
 *
 * Note that this presumes white-space:pre
 */
const SPCHARS = "\f\n\r\t\u0020\u2028\u2029"; // NOTE: no nbsp - \u00A0 - consider rename to normalSpace

InsertionPoint.prototype.__defineGetter__(
	"whitespace",
	function()
	{
		var character = this.character;

		if(character == null)
			return false;

		if(character == "")
			return true;

		return(SPCHARS.indexOf(character) != -1);
	}
);

/**
 * What character is at the pointer:
 * - character at offset
 * - empty string "" if at end of line
 * - null if "character" is or is effectively an element
 *
 * Note: this assumes white-space of pre so end of line whitespace will be treated as valid characters rather
 * than as invisible collapsed markup
 */
InsertionPoint.prototype.__defineGetter__(
	"character",
	function()
	{
		if(this.__ipNode.nodeType == Node.ELEMENT_NODE)
			return null;

		if(this.__ipOffset < this.__ipNode.length)
			return this.__ipNode.nodeValue.charAt(this.__ipOffset);

		var forwardip = this.clone();

		var result = forwardip.__forwardOne();

		if(forwardip.__ipNode.nodeType == Node.ELEMENT_NODE)
			return null;

		var returnValue = ""; // forward is crossed_block or at_top then ""

		if(result == InsertionPoint.SAME_LINE)
			returnValue = forwardip.__ipNode.nodeValue.charAt(0);

		return returnValue;
	}
);

InsertionPoint.prototype.__backOne = function()
{
	// two special cases
	if(this.__ipNode.nodeType == Node.TEXT_NODE)
	{
		// in text node and not at the start then move back one in that node: assumption "pre" value won't change!
		if(this.__ipOffset > 0)
		{
			this.__ipOffset--;
			return InsertionPoint.SAME_LINE;
		}
	}
	// Element_Node: points beyond last element in line ie/ definitely after empty element - move back one
	else if(this.__ipNode.childNodes.length == this.__ipOffset)
	{
		this.__ipOffset--;
		return InsertionPoint.SAME_LINE;		
	}
	
	// Must move back to previous editable node	
	var ipni = new __IPNodeIterator(this.__top);

	var currentNode = this.__ipNode;

	// set current node to just after or just before empty element (whichever is appropriate - tree takes care of rest)
	if(currentNode.nodeType == Node.ELEMENT_NODE)
		currentNode = this.__ipNode.childNodes[this.__ipOffset];

	ipni.currentNode = currentNode;
	
	var ipniResult = ipni.previousNode();

	if(ipni.currentNode == null) // at top!
		return InsertionPoint.AT_TOP;

	// may have crossed to new parent: reset cssWhitespace setting
	this.__cssWhitespace = document.defaultView.getComputedStyle(ipni.currentNode.parentNode, null).getPropertyValue("white-space");

	if(ipni.currentNode.nodeType == Node.TEXT_NODE)
	{
		this.__ipNode = ipni.currentNode;
		this.__ipOffset = this.__ipNode.nodeValue.length; 
	}
	else // empty element
	{
		this.__ipNode = ipni.currentNode.parentNode;
		this.__ipOffset = ipni.currentNode.offset + 1;
	}

	if(ipniResult)
		return InsertionPoint.CROSSED_BLOCK;

	this.__ipOffset--; // SAME_LINE then skip back one whether empty element or text

	return InsertionPoint.SAME_LINE;
}

/**
 * Assume the InsertionPoint is created in a valid position.
 *
 * POST05:
 * - account for linefeed right before a tag. May actually do in "__backOne"
 */
InsertionPoint.prototype.backOne = function()
{
	var origip = this.clone(); // jump back here if only whitespace between current position and top

	var result = this.__backOne();

	if(result == InsertionPoint.AT_TOP)
		return InsertionPoint.AT_TOP;

	// Collapsed whitespace: MAY have to jump back if in a non pre text node, either at its end or on a whitespace
	if((this.__ipNode.nodeType == Node.TEXT_NODE) && (this.__cssWhitespace != "pre") &&
	   ((this.__ipNode.nodeValue.length == this.__ipOffset) ||
	    (SPCHARS.indexOf(this.__ipNode.nodeValue.charAt(this.__ipOffset)) != -1)))
	{			
		// Now on whitespace in TEXT_NODE: go back until get to non whitespace
		var backip = this.clone();
		var firstwspip;
		var resultBack;
		do
		{
			firstwspip = backip.clone();

			resultBack = backip.__backOne();

			if(resultBack != InsertionPoint.SAME_LINE)
				result = resultBack;

			if(resultBack == InsertionPoint.AT_TOP)
				break;
		}
		// text node and not pre and whitespace (end of text node or literally a whitespace character)
		while((backip.__ipNode.nodeType == Node.TEXT_NODE) && (backip.__cssWhitespace != "pre") &&
		      ((backip.__ipNode.nodeValue.length == backip.__ipOffset) ||
		       (SPCHARS.indexOf(backip.__ipNode.nodeValue.charAt(backip.__ipOffset)) != -1)))	

		if(result == InsertionPoint.CROSSED_BLOCK) // CROSSED_BLOCK: adopt when backcp takes you
		{
			// Keep the place that backcp went to
			this.set(backip);
			// Jump right after the non whitespace unless already there (resultBack is CROSSED_BLOCK if line ends in Element)
			// or this now points to an editable token
			if(!((resultBack == InsertionPoint.CROSSED_BLOCK) || this.IPToken))
				this.__ipOffset++;
		}
		else if(result == InsertionPoint.AT_TOP) // AT_TOP: return to original cp position
			this.set(origip);
		else // SAME_LINE: go back to the first whitespace in the sequence
		{
			if(backip.IPToken) // only for create in wrong place!
				this.set(backip);
			else
				this.set(firstwspip);
		}
	}
	return result;
}

/**
 * POST04:
 * - may be more efficient to skip through insertion points AND not skip 1 position on if inline; means comparisons
 * can be more explicit. Example - CROSSED_INLINECONTAINER could be used internally for Range expansion or deletion
 */
InsertionPoint.prototype.__forwardOne = function()
{
	if(this.__ipNode.nodeType == Node.TEXT_NODE)
	{
		if(this.__ipOffset < this.__ipNode.length)
		{
			this.__ipOffset++;
			return InsertionPoint.SAME_LINE;
		}
	}
	// ELEMENT_NODE: if before empty element then just increment!
	else if(this.__beforeEmptyElement)
	{
		this.__ipOffset++;
		return InsertionPoint.SAME_LINE;
	}

	// Must move forward to next editable node	
	var ipni = new __IPNodeIterator(this.__top);

	var currentNode = this.__ipNode;
	// reset ipNode to point to the actual element now being referenced: needed for next calculation
	// will only get here if currently point beyond an empty element (see special case processing above)
	if(currentNode.nodeType == Node.ELEMENT_NODE)
		currentNode = this.__ipNode.childNodes[this.__ipOffset-1];

	ipni.currentNode = currentNode;
	
	var ipniResult = ipni.nextNode();

	if(ipni.currentNode == null) // at top!
		return InsertionPoint.AT_TOP;

	// may have crossed to new parent: reset cssWhitespace setting
	this.__cssWhitespace = document.defaultView.getComputedStyle(ipni.currentNode.parentNode, null).getPropertyValue("white-space");

	if(ipni.currentNode.nodeType == Node.TEXT_NODE)
	{
		this.__ipNode = ipni.currentNode;
		this.__ipOffset = 0; 
	}
	else // empty element
	{
		this.__ipNode = ipni.currentNode.parentNode;
		this.__ipOffset = ipni.currentNode.offset;
	}

	if(ipniResult)
		return InsertionPoint.CROSSED_BLOCK;

	this.__ipOffset++; // SAME_LINE then skip forward one whether empty element or text

	return InsertionPoint.SAME_LINE;

}

/**
 * Accounts for display setting of the block, top and the whitespace property. The whitespace property is testimont
 * to hand coding. As you can style lines properly with tagging, the need to accept text formatting characters as
 * more than whitespace is a throwback to hand coded HTML and limited ability to style tagged text.
 *
 * POST05:
 * - add skips for newlines right after or before any tag (http://www.w3.org/TR/REC-html40/appendix/notes.html#notes-line-breaks)
 */
InsertionPoint.prototype.forwardOne = function()
{
	var origip = this.clone(); // jump back here if only whitespace between current position and top

	// Special case: skip any editable token completely and move to the next line or stay put if at top
	if(origip.IPToken)
	{
		var result;
		do {
			result = this.__forwardOne();
		}
		while(result == InsertionPoint.SAME_LINE)

		if(result == InsertionPoint.AT_TOP) // revert to original position if AT_TOP
			this.set(origip);
		return result;
	}

	var result = this.__forwardOne();

	// at top - no need to chase whitespace
	if(result == InsertionPoint.AT_TOP)
		return result;

	// Collapsed whitespace: if now on a non pre text node on whitespace and either original was whitespace OR
	// original was after an empty text node then must eat whitespace and get to a non whitespace character or element
	if(((this.__cssWhitespace != "pre") && this.whitespace) &&
	   (origip.whitespace || ((origip.__ipNode.nodeType == Node.ELEMENT_NODE) && !origip.__beforeEmptyElement)))
 	{
		var resultforward;	
		do
		{
			resultForward = this.__forwardOne();

			if(resultForward != InsertionPoint.SAME_LINE)
				result = resultForward;
		}
		while((this.__cssWhitespace != "pre") && this.whitespace && (result != InsertionPoint.AT_TOP))

		// AT_TOP: return to original cp position
		if(result == InsertionPoint.AT_TOP) 
			this.set(origip);
		else if(result == InsertionPoint.CROSSED_BLOCK)
		{
			// Hate this but special case: leading collapsed whitespace of a line you cross into
			if((this.__cssWhitespace != "pre") && 
		           (this.__ipNode.nodeType == Node.TEXT_NODE) && 
			   (this.__ipNode.nodeValue.length == this.__ipOffset))
			{
				// move forward one and then reduce offset by 1
				this.__forwardOne();
				this.__ipOffset--;
			}
		}
	}

	return result;
}

/*
 * POST05: 
 * - consider moving "insertContainer" out of here and up a level so that this method fails if trying to split top
 * itself [PART OF MOVING "DIV" out of eDOM]
 * - may consider controls where optionally don't allow a user to split a topmost node: return false if try to 
 * and setting of "preserveTop" is true
 * - pre problem (no workaround - moz bug)
 */
InsertionPoint.prototype.splitLine = function()
{
	if(this.__cssWhitespace == "pre")
	{
		// Mozilla bug: the line feed isn't treated properly by the renderer. If select the offset
		// after the linefeed, you end up on the same line as the line and suddenly jump once you
		// start inserting more characters. There is a mismatch in the offset setting of Selection
		// and the rendering of the selection. There is no workaround.
		// POST05: need to enter bug in Bugzilla
		this.__ipNode.insertData((this.__ipOffset), "\n"); // if pre - insert linefeed
		this.__ipOffset++;		
		return;
	}

	var tp = null; 
	var line = new CSSLine(this.__ipNode);

	// special case: no container or container is top - insert a container
	var lineContainer = line.container;
	if(!lineContainer || (lineContainer == this.__top))
	{
		tp = new __TextPointer(this.__top, this.__ipNode, this.__ipOffset); // POST05: don't accept top here: too high - could be body
		if((lineContainer == this.__top) && (this.clone().forwardOne() != InsertionPoint.SAME_LINE))
			tp.__goToStart = false;
		line.changeContainer("div", true);
		this.__ipNode = tp.referencedTextNode;
		this.__ipOffset = tp.referencedOffset; 
	}

	var newLineContainer = line.container.cloneNode(false);

	// If split at the end of a line then create a new empty line after that line and move to this new line
	var cloneip = this.clone();
	var result = cloneip.forwardOne();
	if(result != InsertionPoint.SAME_LINE) // at end line
	{ 
		newLineContainer.appendChild(document.createTextNode(STRING_NBSP));
		line.container.parentNode.insertAfter(newLineContainer, line.container);

		// put cp in new line
		this.__ipNode = newLineContainer.firstChild;
		this.__ipOffset = 0;

		return;
	}
	
	// If split at start of line then create a new empty line before this line but leave the CP where it is
	if(this.clone().backOne() != InsertionPoint.SAME_LINE) // at start line
	{
		newLineContainer.appendChild(document.createTextNode(STRING_NBSP));
		line.container.parentNode.insertBefore(newLineContainer, line.container);
		return;
	}

	if(!tp) // POST05: as above, inefficient: don't accept top here: too high - could be body
		tp = new __TextPointer(this.__top, this.__ipNode, this.__ipOffset);
	var newLineRange = document.createRange();
	newLineRange.setStart(line.container, 0);
	newLineRange.setEnd(this.__ipNode, this.__ipOffset);
	var newLineContents = newLineRange.extractContents();
	newLineContainer.appendChild(newLineContents);
	line.container.normalize();
	line.container.parentNode.insertBefore(newLineContainer, line.container);
	this.__ipNode = tp.referencedTextNode;
	this.__ipOffset = tp.referencedOffset;		
}

/**
 * POST05: 
 */
InsertionPoint.prototype.deleteOne = function()
{
	// if at start => merge
	var startip = this.clone();
	var startResult = startip.backOne();

	// case 1: at top => just return
	if(startResult == InsertionPoint.AT_TOP)
		return false;

	// case 2: at start of line and there is a previous line => merge if you can
	if(startResult == InsertionPoint.CROSSED_BLOCK)
	{
		var line = new CSSLine(this.__ipNode);
		var prevLine = new CSSLine(startip.ipNode);
		if(!prevLine.canMerge(line))
			return false;
		startip.__mark(); // ?????? Problem given position?
		var normalizeContext = startip.ipNode.__nilParentNode; // ?????
		prevLine.mergeLine(line);
		var normalizeRange = document.createRange();
		normalizeRange.selectNode(normalizeContext);
		normalizeRange.normalizeElements("span");
		startip.__restore(); // causes crash
		this.set(startip);
		return true;
	}

	// special case IPToken: check if only character - if it is then replace with nbsp and return
	var previp = startip.clone();
	var prevResult = previp.backOne();
	var nextip = this.clone();
	var nextResult = nextip.forwardOne();
	if((prevResult != InsertionPoint.SAME_LINE) && (nextResult != InsertionPoint.SAME_LINE))
	{
		startip.ipNode.replaceData(startip.ipOffset, 1, STRING_NBSP);
		this.__ipNode = startip.ipNode;
		this.__ipOffset = startip.ipOffset;
		return true;	
	}

	// special case eol: if deletion would expose a space then make sure that space becomes an nbsp
	if((nextResult != InsertionPoint.SAME_LINE) && (previp.whitespace))
	{
		previp.__ipNode.replaceData(previp.ipOffset, 1, STRING_NBSP);		
	}
	// special case wsp collapse: if deletion would collapse a whitespace, no matter where it would be
	// exposed then preserve it with an NBSP
	else if((nextResult == InsertionPoint.SAME_LINE) && this.whitespace && ((prevResult != InsertionPoint.SAME_LINE) || previp.whitespace))
	{
		// if whitespace actually starts following text node
		if(this.__ipNode.nodeValue.length == this.__ipOffset)
			nextip.__ipNode.replaceData(0, 1, STRING_NBSP);
		else
			this.__ipNode.replaceData(this.__ipOffset, 1, STRING_NBSP);
	}

	// majority case: delete one character and any exclusive parents it has - restore to after the character
	// before this character
	var range = document.createRange();
	range.setStart(startip.ipNode, startip.ipOffset);
	range.setEnd(this.__ipNode, this.__ipOffset);
	var keepRange = range.cloneRange();
	var cssr = documentCreateCSSTextRange(range, this.__top);

	cssr.includeExclusiveParents(); 

	// TMP: POST05: include exclusive shouldn't do a partial grab of one end or the other of a range but it does now!
	if((cssr.startContainer == startip.ipNode) || (cssr.endContainer == this.ipNode))
		keepRange.deleteContents();
	else
		cssr.deleteContents();

	this.__top.normalize();

	// restore
	if(prevResult != InsertionPoint.AT_TOP)
	{
		previp.forwardOne();
		this.set(previp);
	}
	else
		this.setToStart();

	return true;
}

/**
 * POST05:
 * - fix to check if next inline element is a text node and insert there to a/c for span after object: use clone.forwardOne
 * - mix with insertTextNode
 */
InsertionPoint.prototype.insertCharacter = function(charCode)
{
	// Simple - experiment - doesn't account for tokens [still need whitespace tests in most cases!]
	if(this.__ipNode.nodeType == Node.ELEMENT_NODE)
	{
		// after element node at end of line with container or editable area: insert after
		if(this.__ipOffset == this.__ipNode.childNodes.length)
		{
			this.__ipNode.appendChild(document.createTextNode(""));
			this.__ipNode = this.__ipNode.lastChild;
			this.__ipOffset = 0;
		}
		else
		{
			var referencedNode = this.__ipNode.childNodes[this.__ipOffset];
			
			// ie/ between element node and text node: ie/ after element node
			if(referencedNode.nodeType == Node.TEXT_NODE)
			{
				this.__ipNode = referencedNode;
				this.__ipOffset = 0;
			}
			// references element node: either before element node OR between element nodes
			else // [Bug: insert after if before block level node ie/ end of containerless line!]
			{
				// ie/ between text node and element node: ie/ before element node with text node before it
				if(referencedNode.previousSibling && (referencedNode.previousSibling.nodeType == Node.TEXT_NODE))
				{
					this.__ipNode = referencedNode.previousSibling;
					this.__ipOffset = this.__ipNode.nodeValue.length;
				}
				// no text node before the element node - insert one
				else
				{
					var emptyTextNode = document.createTextNode("");
					this.__ipNode.insertBefore(emptyTextNode, referencedNode);
					this.__ipNode = emptyTextNode;
					this.__ipOffset = 0;
				}				
			}			
		}
	}
	// lot's of whitespace/nbsp handling if not dealing with "pre"
	else if(this.__cssWhitespace != "pre")
	{
		// TODO: problem for CHARCODE_SPACE - if only textToken ... node.textToken should be a first class check

		// Cases: start line, end line, space is current character or space before
		if(charCode == CHARCODE_SPACE) 
		{
			// whitespace ahead or end of line
			if(this.whitespace)
			{
				charCode = CHARCODE_NBSP;
			}
			// check if previous character is a space or at beginning of line
			else 
			{
				var prevCharPointer = this.clone();
				// beginning of line if going back brings us over a block boundary
				if((prevCharPointer.backOne() != InsertionPoint.SAME_LINE) || prevCharPointer.whitespace)
					charCode = CHARCODE_NBSP;	
			}
		}	
		// add non whitespace - switch a preceding nbsp if it is in same line and isn't preceded by a
       		// space or nbsp (reason for leaving sequences of nbsp's is that it makes dealing with at top situations
		// easier.	
		else 
		{ 
			var prevCharPointer = this.clone();
			var prevResult = prevCharPointer.backOne();
			if((prevResult == InsertionPoint.SAME_LINE) && (prevCharPointer.character == STRING_NBSP))
			{
				var tnToReplace = prevCharPointer.ipNode;
				var tnOffset = prevCharPointer.ipOffset;
				if((prevCharPointer.backOne() == InsertionPoint.SAME_LINE) && !prevCharPointer.whitespace)
					tnToReplace.replaceData(tnOffset, 1, STRING_SPACE);
			}

			// TODO: use node.textToken here

			// if we're at the first point in a line and nbsp is the only character then replace nbsp with a character
			if((this.clone().backOne() != InsertionPoint.SAME_LINE) && (this.character == STRING_NBSP)) // start line
			{
				var next = this.clone();
				var result = next.forwardOne(); // beyond nbsp
				if(result != InsertionPoint.SAME_LINE)
				{
					this.__ipNode.replaceData(this.__ipOffset, 1, String.fromCharCode(charCode));
					this.__ipOffset++;
					return;	
				}
			}
		}	
	}
	this.__ipNode.insertData(this.__ipOffset, String.fromCharCode(charCode));
	this.__ipOffset++;	
}

/**
 * Insert a DocumentFragment, a TextNode or an Element into a document. Akin to Range.insertNode except driven by CSS.
 */
InsertionPoint.prototype.insertNode = function(node)
{
	if(node.nodeType == 11) // Node.DOCUMENT_FRAGMENT)
	{
		var i = node.childNodes.length;
		var child = node.firstChild;
		while(child) {
			var oldChild = child;
			child = child.nextSibling;
			this.__insertOneNode(oldChild);
		}
	}
	else
		this.__insertOneNode(node);
}

/**
 * Insert a TextNode or an Element into a document. 
 *
 * POST04: 
 * - insert at end of line can change once cp supports inline element references
 * - break insertTextNode AND insertElement
 * - insertElement: domlevel3 permissions on whether allowed to insert that element or not
 */
InsertionPoint.prototype.__insertOneNode = function(node)
{
	// POST04: what if covering nbsp at end of line or pasting whitespace only (ala insertCharacter!)
	if(node.nodeType == Node.TEXT_NODE)
	{
		var ipNodeOffset = this.__ipNode.offset;
		var newOffset = this.__ipOffset + node.nodeValue.length;
		var parentNode = this.__ipNode.parentNode;
		var newNode = this.__ipNode.splitText(this.__ipOffset);
		parentNode.insertBefore(node, newNode);
		eDOMEventCall("NodeInserted",node);
		parentNode.normalize();
		this.__ipNode = parentNode.childNodes[ipNodeOffset];
		this.__ipOffset = newOffset;
		
		
		return; 
	}

	if(node.nodeType == 1 && document.defaultView.getComputedStyle(node, null).getPropertyValue("display") == "inline")
	{
		// If text is within a span or other inline element then split that element and then insert the node
		var characterParent = this.__ipNode.parentNode;
		if(document.defaultView.getComputedStyle(characterParent, null).getPropertyValue("display") == "inline")
		{
			// at end of text node
			if(this.__ipNode.nodeValue.length == this.__ipOffset)
			{
				characterParent.parentNode.insertAfter(node, characterParent);
				this.forwardOne(); // needs to change once support object selection ...
			}
			else if(this.__ipOffset == 0)
			{
				characterParent.parentNode.insertBefore(node, characterParent);
			}
			else // POST04: combine with splitting in style code: one routine to split element at text
			{
				var newInlineContainer = characterParent.cloneNode(false);
				characterParent.parentNode.insertAfter(newInlineContainer, characterParent);
				var secondTextNode = this.__ipNode.splitText(this.__ipOffset);
				newInlineContainer.appendChild(secondTextNode);
				newInlineContainer.parentNode.insertBefore(node, newInlineContainer);
				this.__ipNode = secondTextNode;
				this.__ipOffset = 0;
			}
			return;
		}
		
		var newNode = this.__ipNode.splitText(this.__ipOffset);
		newNode.parentNode.insertBefore(node, newNode);
		if(newNode.nodeValue.length == 0)
		{
			newNode.parentNode.removeChild(newNode);
			return;
		}
		if(this.__ipNode.nodeValue.length == 0)
			this.__ipNode.parentNode.removeChild(this.__ipNode);
		this.__ipNode = node.nextSibling;
		this.__ipOffset = 0; 
		return; 
	}

	// block level: put on its own line

	// if at end of the line then append the block after the current line
	if(this.clone().forwardOne() != InsertionPoint.SAME_LINE) // TODO: ? - need to move on?
	{
		var line = new CSSLine(this.__ipNode);
		var container = line.container;
		if(container)
			container.parentNode.insertAfter(node, container);
		else	
			this.__ipNode.parentNode.insertAfter(node, this.__ipNode);
	}
	// else if at start of line then prepend the block before the current line
	else if(this.clone().backOne() != InsertionPoint.SAME_LINE)
	{
		var line = new CSSLine(this.__ipNode);
		var container = line.container;
		if(container)
			container.parentNode.insertBefore(node, container);
		else	
			this.__ipNode.parentNode.insertBefore(node, this.__ipNode);
	}
	// else split the line and put the block between the two lines	
	else
	{
		// TODO: what if PRE - ie/ don't allow post of block into PRE unless it is pre? ie/ don't split line
		// but split the pre block ... => force split option

		// cp will go to start of new line (second line!)
		this.splitLine(); // POST05: consider common split line core to avoid the above checks twice

		var line = new CSSLine(this.__ipNode);
		var container = line.container; // there has to be a container
		container.parentNode.insertBefore(node, container);		
	}
}

InsertionPoint.prototype.setToStart = function()
{
	var __ipni = new __IPNodeIterator(this.__top);
	if(__ipni.currentNode)
	{
		var firstip = new InsertionPoint(this.__top, __ipni.currentNode, 0);
		this.set(firstip);
	}
}

InsertionPoint.prototype.__mark = function()
{
	var previp = this.clone();
	var prevResult = previp.backOne();
	if(prevResult == InsertionPoint.AT_TOP)
		this.__markip = null;
	else
		this.__markip = previp;	
}

InsertionPoint.prototype.__restore = function()
{
	if(this.__markip)
	{
		this.__markip.forwardOne();
		this.set(this.__markip);
	}
	else // go to first valid point in first text node within top
		this.setToStart();
}

InsertionPoint.CHARACTER_CONTENTTYPE = 10;
InsertionPoint.TOKEN_CONTENTTYPE = 11;
InsertionPoint.EMPTYELEMENT_CONTENTTYPE = 12;

InsertionPoint.prototype.__defineGetter__(
	"contentType",
	function()
	{
		// TODO: check for token

		if(this._xmlnode.nodeType == Node.ELEMENT_NODE)
			return InsertionPoint.EMPTYELEMENT_CONTENTTYPE;

		return InsertionPoint.CHARACTER_CONTENTTYPE;
	}
);

/**
 * Insertion point iterator.
 */
function __IPNodeFilter()
{
	this.__crossedBlock = false;
}

__IPNodeFilter.prototype.__defineGetter__(
	"crossedBlock",
	function() {return this.__crossedBlock;}
);

__IPNodeFilter.prototype.reset = function()
{
	this.__crossedBlock = false;
}

/**
 * Accept any node that could be selected as an insertion point when white-space is "pre" ie/ the most liberal definition.
 * This filter (like most of eDOM) is driven by CSS and not other indicators of whitespace such as XML attributes
 * (see: http://www.w3.org/TR/2000/REC-xml-20001006#sec-white-space)
 *
 * POST05: 
 * - search down the preceding or succeeding inline element to make sure it has a selectable child
 */
__IPNodeFilter.prototype.acceptNode = function(node)
{
	if(node.nodeType == Node.TEXT_NODE)
	{
		// empty node - not visible
		if(node.nodeValue.length == 0)
			return NodeFilter.FILTER_REJECT;

		// if non NBSP whitespace then normally reject - except (special cases) if it is before/after an inline node OR it is
		// within an inline node
		if(!(/\u00A0+/.test(node.nodeValue)) && node.isWhitespaceOnly)
		{
			// accept empty text node that is within an inline element
			if(document.defaultView.getComputedStyle(node.parentNode, null).getPropertyValue("display") == "inline")
				return NodeFilter.FILTER_ACCEPT;

			// accept empty text that has either an inline node before or after it: strictly speaking should
			// make sure that the inline node has a text node or empty object as a child!
			if((node.previousSibling &&  node.previousSibling.nodeType == 1 && (document.defaultView.getComputedStyle(node.previousSibling, null).getPropertyValue("display") == "inline")) ||
			   (node.nextSibling && node.nextSibling.nodeType == 1 &&(document.defaultView.getComputedStyle(node.nextSibling, null).getPropertyValue("display") == "inline")))
				return NodeFilter.FILTER_ACCEPT;

			return NodeFilter.FILTER_REJECT;
		}
			
		return NodeFilter.FILTER_ACCEPT;
	}

	// normally we skip elements: two cases are of interest - when we cross a block and when we find an
	// empty inline element. We need to note when we are in a new line and empty inline elements are 
	// selectable. However, we skip all other types of element includin childless, child bearing elements 
	// as Geiko doesn't display these. eDOM assumes that they are just for spacing and should not support insertion.
	if(node.nodeType == Node.ELEMENT_NODE)
	{
		if(document.defaultView.getComputedStyle(node, null).getPropertyValue("display") != "inline")
		{
			this.__crossedBlock = true;
		}
		else if(node.contentType == Element.EMPTY_CONTENTTYPE)
		{
			return NodeFilter.FILTER_ACCEPT;
		}
	}

	return NodeFilter.FILTER_SKIP;
}

/**
 * By default the current node is set to the first child under root that passes the filter or null if there are
 * no nodes to iterate through
 */
function __IPNodeIterator(root)
{
	this.__ipNodeFilter = new __IPNodeFilter();

	this.ipNodeWalker = document.createTreeWalker(root,
					NodeFilter.SHOW_ALL,
					this.__ipNodeFilter,
					false);
	this.__currentNode = this.ipNodeWalker.firstChild();
}

__IPNodeIterator.prototype.__defineGetter__(
	"currentNode",
	function() {return this.__currentNode;}
);

__IPNodeIterator.prototype.__defineSetter__(
	"currentNode",
	function(value) {this.__currentNode = value; this.ipNodeWalker.currentNode = value;}
);

__IPNodeIterator.prototype.nextNode = function()
{
	this.__ipNodeFilter.reset();

	this.__currentNode = this.ipNodeWalker.nextNode(); 

	return this.__ipNodeFilter.crossedBlock;
}

__IPNodeIterator.prototype.previousNode = function()
{
	this.__ipNodeFilter.reset();

	this.__currentNode = this.ipNodeWalker.previousNode(); 

	return this.__ipNodeFilter.crossedBlock;
}

/**
 * @returns the first previous sibling that is not an empty text node
 * 
 * POST04: need to change to use IPNodeFilter (get rid of nonEmpty check everywhere) - will need to account for
 * skip here! Careful - need to see if rework works in normalize etc
 *
 * Could use contentType for Element but need to dig deeper if contentType is "_ELEMENT". If ANY then skip element.
 */
Node.prototype.__defineGetter__(
	"editablePreviousSibling",
	function()
	{
		var previousSibling = this.previousSibling;
		while(previousSibling)
		{
			if(__NodeFilter.nonEmptyText(previousSibling) == NodeFilter.FILTER_ACCEPT)
				return previousSibling;
			previousSibling = previousSibling.previousSibling;
		}
		return null;
	}
);

/**
 * Get the next editable sibling of a node. An editable sibling is one with at least one non-empty text node as
 * a decendent.
 * 
 * POST04: need to change to use IPNodeFilter
 *
 * @returns non empty node after this one or null if there isn't one
 */
Node.prototype.__defineGetter__(
	"editableNextSibling",
	function()
	{
		var nextSibling = this.nextSibling;
		while(nextSibling)
		{
			if(__NodeFilter.nonEmptyText(nextSibling) == NodeFilter.FILTER_ACCEPT)
				return nextSibling;
			nextSibling = nextSibling.nextSibling;
		}
		return null;
	}
);

/*************************************************************************************************************
 * CSSLine captures the concept of contiguous nodes that define a block, either inline elements or
 * text nodes. This is a key concept for CSS driven navigation and for HTML structure. 
 * 
 * POST04:
 * - handle CSSLine.ELEMENT ie/ empty block level elements that don't act as line boundaries. They are lines
 * in and off themselves!
 * - redo with charPointer etc. 
 * - handle previous/next ie/ up/down 
 * - handle line length and offset
 * - handle destroyed line ie/ collapsed range - must throw exceptions ...
 * - add style to this: ie/ styleLine == styleElement with container application if 
 * necessary
 * - utility: normalizeWhiteSpace removes white space before the beginning or after the end of lines. Note that this 
 * should be applied carefully because it will effect TextPointers. It will also merge any a sequence of white
 * spaces into one space and remove white space at the beginning or end of the line. This should remove the
 * need for a lot of special case handling of white spaces. It should also simplify post split behaviors.
 * - utility: formatLineMarkup - does normalize of whitespace AND sets container on its own line
 *************************************************************************************************************/

Document.prototype.createCSSLine = documentCreateCSSLine;

function documentCreateCSSLine(seed)
{
	return new CSSLine(seed);
}

/*
 * POST04: change to use InsertionPoint once it supports jump to start of line
 */
function CSSLine(seed) 
{
	// catch out non inline seeds: POST04: do exception!
	//if((seed.nodeType == Node.ELEMENT_NODE) &&
        //  (document.defaultView.getComputedStyle(seed, null).getPropertyValue("display") != "inline")

	// jump up to top inline parent of seed and work on it and its peers
	while(document.defaultView.getComputedStyle(seed.parentNode, null).getPropertyValue("display") == "inline")
		seed = seed.parentNode;

	// get first inline element/text node in this line
	var startNode = seed;
	var previousSibling = seed.previousSibling;
	while(previousSibling && 
	      ((previousSibling.nodeType == Node.TEXT_NODE) || 
	       (document.defaultView.getComputedStyle(previousSibling, null).getPropertyValue("display") == "inline")))
	{
		startNode = previousSibling;
		previousSibling = previousSibling.previousSibling;
	}

	// but don't include empty or collapsed white space isolated at the beginning of a line. This would be skipped
	// by any "proper" navigation system
	if(__NodeFilter.nonEmptyText(startNode) == NodeFilter.FILTER_REJECT)
		startNode = startNode.nextSibling;

	// get last inline element/text node in this line
	var endNode = seed;
	var nextSibling = seed;
	while(nextSibling && 
	      ((nextSibling.nodeType == Node.TEXT_NODE) || 
	       (document.defaultView.getComputedStyle(nextSibling, null).getPropertyValue("display") == "inline")))
	{
		endNode = nextSibling;
		nextSibling = nextSibling.nextSibling;
	}

	// but don't include empty or collapsed white space isolated at the end of a line. This would be skipped
	// by any "proper" navigation system
	if(__NodeFilter.nonEmptyText(endNode) == NodeFilter.FILTER_REJECT)
		endNode = endNode.previousSibling;

	// ok - now set start to the offset of the first node
	this.__baseRange = document.createRange();
	this.__baseRange.selectNode(startNode.parentNode); // make sure no selection exceptions - can happen with blank ranges
	this.__baseRange.setStart(startNode.parentNode, startNode.offset);
	this.__baseRange.setEnd(endNode.parentNode, endNode.offset + 1); // end container will be same as start
}

CSSLine.prototype.__defineGetter__(
	'container',
	function()
	{
		if(__NodeFilter.firstChild(this.__baseRange.startContainer.childNodes[this.__baseRange.startOffset]) == NodeFilter.FILTER_REJECT)
				return null;

		if(__NodeFilter.lastChild(this.__baseRange.endContainer.childNodes[this.__baseRange.endOffset-1]) == NodeFilter.FILTER_REJECT)
				return null;

		return this.__baseRange.startContainer;
	}
);

/**
 * @return a Range that matches the line. Changing the returned Range will not effect the line's selection.
 */
CSSLine.prototype.__defineGetter__(
	'range',
	function() {return this.__baseRange.cloneRange();}
);

CSSLine.BLOCK = 0; // container is block
CSSLine.LIST_ITEM = 1; // container is list-item
CSSLine.TABLE_CELL = 2; // container is table-cell
CSSLine.BOUNDED = 3; // no container: bounded by non inline elements
CSSLine.ELEMENT = 4; // isolated, childless, non inline element
CSSLine.UNKNOWN = 5;

/**
 * lineType
 */
CSSLine.prototype.__defineGetter__(
	'lineType',
	function()
	{
		var container = this.container;

		if(container)
		{
			var containerDisplay = document.defaultView.getComputedStyle(container, null).getPropertyValue("display");
			if(containerDisplay == "block")
				return CSSLine.BLOCK;
			else if(containerDisplay == "list-item")
				return CSSLine.LIST_ITEM;
			else if(containerDisplay == "table-cell")
				return CSSLine.TABLE_CELL;
			return CSSLine.UNKNOWN;
		}		

		// Line of single, childless element
		// POST05: need to check if non empty element has selectable child!
		if((this.__baseRange.startContainer == this.__baseRange.endContainer) &&
	   	   (this.__baseRange.startOffset == (this.__baseRange.endOffset-1)) &&
	   	   (this.__baseRange.startContainer.childNodes[this.__baseRange.startOffset].nodeType == Node.ELEMENT_NODE) &&
	   	   (this.__baseRange.startContainer.childNodes[this.__baseRange.startOffset].childNodes.length == 0))
			return CSSLine.ELEMENT;

		return CSSLine.BOUNDED;
	}
);

/** 
 * A line has a start boundary if it is bounded and it is not the first line within an element
 */
CSSLine.prototype.__defineGetter__(
	"startBoundary",
	function() 
	{
		if(this.lineType != CSSLine.BOUNDED)
			return null;

		// First node in line is either text node or child at offset within element context
		var firstNodeInLine = this.__baseRange.startContainer;
		if(firstNodeInLine.nodeType == Node.ELEMENT_NODE)
			firstNodeInLine = this.__baseRange.startContainer.childNodes[this.__baseRange.startOffset];

		// No container so must have a node before the first node that defines the line's boundary or first line in an element
		var startBoundaryElement = firstNodeInLine.previousSibling;

		// could be null if first line in element with more than one line
		return startBoundaryElement;
	}
);

/**
 * A line has an end boundary if it is bounded and it is not the last line of an element
 */
CSSLine.prototype.__defineGetter__(
	"endBoundary",
	function()
	{
		if(this.lineType != CSSLine.BOUNDED)
			return null;

		// Last node in line is either text node or child at offset within element context
		var lastNodeInLine = this.__baseRange.endContainer;
		if(lastNodeInLine.nodeType == Node.ELEMENT_NODE)
			lastNodeInLine = this.__baseRange.endContainer.childNodes[this.__baseRange.endOffset-1];

		// No container so must have a node after the last node that defines the line's boundary or last line in an element
		var endBoundaryElement = lastNodeInLine.nextSibling;

		// could be null if last line in element with more than one line
		return endBoundaryElement;	
	}
);

/**
 * Can you merge a line into this line? Note that "mergeLine" will still merge lines even if it shouldn't.
 *
 * Note: watch out for cell merging. This allows table-cell lines to merge but you may not want certain operations (deleteOne?)
 * to do this.
 *
 * POST05: reconsider this in light of ops like "mergeWithPrevious" or CSSRange.mergeLines
 */
CSSLine.prototype.canMerge = function(lineToMerge)
{
	var thisLineType = this.lineType;
	var lineToMergeType = lineToMerge.lineType;

	// if both lines are table cell then return true ie/ allow merging!
	if((thisLineType == CSSLine.TABLE_CELL) && (lineToMergeType == CSSLine.TABLE_CELL))
		return false; // TMP: change to return true as allow merge of cells ...

	// if only one line is table cell then return false	
	if((thisLineType == CSSLine.TABLE_CELL) || (lineToMergeType == CSSLine.TABLE_CELL))
		return false;

	// if one or other line is an element then return false
	if((thisLineType == CSSLine.ELEMENT) || (lineToMergeType == CSSLine.ELEMENT))
		return false;

	// if this ends with an empty (block level) element OR lineToMerge starts with such an element then don't allow merging
	if(((thisLineType == CSSLine.BOUNDED) && this.endBoundary && (this.endBoundary.contentType == Element.EMPTY_CONTENTTYPE)) ||
   	   ((lineToMergeType == CSSLine.BOUNDED) && lineToMerge.startBoundary && (lineToMerge.startBoundary.contentType == Element.EMPTY_CONTENTTYPE)))
		return false;

	return true;		
}

/**
 * This method will set a style for the line as a whole. It will make a container for a line if one doesn't already exist
 *
 * POST05:
 * - used for styles that apply to block level elements
 * - handle case of - settings where there is no container - just ignore?
 * - text-align in Mozilla seems to have some CSS3 support - default is "start". Some but not all - supports "start" but
 * not "end". Need to handle cases like this. http://www.w3.org/TR/css3-text/#alignment-prop
 */
CSSLine.prototype.setStyle = function(styleName, styleValue)
{
	var container = this.container;
	if(!container)
		container = this.changeContainer("div", false);
	container.setStyle(styleName, styleValue);
}

/**
 * Return the first node in a line
 * 
 * @returns first node in a line
 */
CSSLine.prototype.__defineGetter__(
	"firstNode",
	function()
	{
		var startContainer = this.__baseRange.startContainer;
		if(startContainer.nodeType == Node.TEXT_NODE)
			return startContainer;
		var startOffset = this.__baseRange.startOffset;
		if(startOffset >= startContainer.childNodes.length)
			startOffset = startContainer.childNodes.length -1;
		return startContainer.childNodes[startOffset];			
	}
);

/* 
 * POST04: 
 * - normalize inline CSS for every container change! (.__normalizeTextStyle)
 * - consider changing to return Line rather than new container. Can always get container!
 * - really only works for applying block level elements now: needs to properly apply say TD to P etc going forward
 * one item might be a "replace" boolean that forces replacement even if the container and an element have different
 * values for display. Doesn't properly match specification.
 * - check if element passed in is not inline
 * - boundary checks and ensuring that element passed in isn't inline
 */
CSSLine.prototype.changeContainer = function(elementName, makeIntermediate, isClass)
{
	if (isClass) {
		var className = elementName;
		elementName = "div";
	} else {
		elementName = elementName.toLowerCase();
	}
	// No container - must put one in; if want new intermediate parent then put that in!
	if(!this.container || makeIntermediate)
	{
		var newContainer = documentCreateXHTMLElement(elementName);
		if (isClass) {
			newContainer.setClass(className);
		}
		// insert new container before the first node 
		if(this.__baseRange.endContainer.childNodes.length > this.__baseRange.endOffset)		
		{
			var nextEl = this.__baseRange.endContainer.childNodes[this.__baseRange.endOffset];
			nextEl.parentNode.insertBefore(newContainer, nextEl);
		}
		else
			this.__baseRange.endContainer.appendChild(newContainer);

		var newC = newContainer.appendChild(this.__baseRange.extractContents());
		eDOMEventCall("NodeInserted",newC);
		this.__baseRange.selectNodeContents(newContainer);

		return newContainer;	
	}

	// container already set
	if (isClass && this.container.hasClass(className)) {
		return this.container;
	}
	
	if(!isClass && this.container.nodeName.toLowerCase() == elementName)
		return this.container;
	// if display of container is block then swap the container for a new one
	// POST04: replace with the "replaceEl" method above
	if(document.defaultView.getComputedStyle(this.container, null).getPropertyValue("display") == "block")
	{
		var newContainer = documentCreateXHTMLElement(elementName);
		var currentContainer = this.container;
		// copy attributes of current container
		for(var i=0; i<currentContainer.attributes.length; i++)
		{
			var thisAttribute = currentContainer.attributes.item(i);
			var thisAttributeCopy = thisAttribute.cloneNode(true);
			newContainer.setAttributeNode(thisAttributeCopy);
		}
		if (isClass) {
			newContainer.setClass(className);
		}


		this.__baseRange.surroundContents(newContainer);
		this.container.parentNode.replaceChild(newContainer, currentContainer);
		eDOMEventCall("NodeInserted",newContainer);
		this.__baseRange.selectNodeContents(newContainer); // restore the Range
		return newContainer;
	}

	// display must be td etc - don't swap - apply as intermediary container
	var newContainer = documentCreateXHTMLElement(elementName);
	if (isClass) {
			newContainer.setClass(className);
	}

	this.container.appendChild(newContainer);
	newContainer.appendChild(this.__baseRange.extractContents());

	this.__baseRange.selectNodeContents(newContainer);

	return newContainer;
}

/*
 * POST04: 
 * - interplay of applying list or table to set of nodes. Allow removal of any type of container. Remove
 * exclusive parents by side effect.
 * - also QA the restored Range better. Seems to behave differently from time container first removed and
 * then another restored!
 * - consider preserving the Line object: this means expanding it/restructuring it given its new scope
 */
CSSLine.prototype.removeContainer = function()
{
	// no container - no worries!
	if(!this.container)
		return false;

	// only work with blocks for now
	if(document.defaultView.getComputedStyle(this.container, null).getPropertyValue("display") == "block")
	{
		// most of the below is concerned with restoring the line's range: usual concern with references
		// no longer being relevant once extraction or appendage happens
		var ancestor = this.container.parentNode;
		var container = this.container;
		var rangeContents = this.__baseRange.extractContents();
		ancestor.insertBefore(rangeContents, container);
		ancestor.removeChild(container);
		ancestor.normalize();
		return true;
	}
	return false;
}

CSSLine.prototype.toString = function()
{
	return this.__baseRange.toString();
}

CSSLine.prototype.mergeLine = function(lineToMerge)
{
	var containerToDelete = lineToMerge.container;

	if(this.container)
	{
		this.container.appendChild(lineToMerge.__baseRange.extractContents());
	}
	// POST04: problem with spaces when calculating - at start or end
	else if(this.__baseRange.endContainer.childNodes.length == this.__baseRange.endOffset)
	{
		this.__baseRange.startContainer.appendChild(lineToMerge.__baseRange.extractContents());
	}	
	else
	{
		var toMerge = lineToMerge.__baseRange.extractContents();
		this.__baseRange.startContainer.insertBefore(toMerge, this.__baseRange.startContainer.childNodes[this.__baseRange.endOffset-1].nextSibling);		
	}

	// delete container and its exclusive parents
	if(containerToDelete)
	{
		while(containerToDelete.parentNode.childNodes.length == 1)
			containerToDelete = containerToDelete.parentNode;
		containerToDelete.parentNode.removeChild(containerToDelete);
	}

	this.__baseRange.commonAncestorContainer.normalize();
}

/**************************************************************************************************
 * CSSTextRange is a range that begins and ends in a text node. Its methods are driven by CSS.
 * 
 * POST04: 
 * - for now, just implement as a Range
 * - range selection for processing is key to editing:
 *   - list to merge or rename
 *   - including exclusive parents  
 *   need a lot more routines for this
 * - hide boundary marking: always restore to marks before each operation. If restoration fails 
 * then throw an exception.
 **************************************************************************************************/

/**
 * Create a CSSTextRange
 */
Document.prototype.createCSSTextRange = documentCreateCSSTextRange; 
function documentCreateCSSTextRange(range, top)
{	
	range.__top = top;
	range.__markTextBoundaries(true);
	return range;
}

/**
 * POST05: rename to "topCommonAncestorNode"?
 *
 * @return topmost common ancestor for Range
 */
Range.prototype.__defineGetter__(
	"top",
	function() {return this.__top;}
);

/**
 * POST04: handle not just text ranges; move over to use VisualText tree 
 */
Range.prototype.__defineGetter__(
	'textNodes',
	function() {

		// normalize safely: sets marker by side effect
		this.normalizeText();

		// not at start of start text node so split it 
		// split the text.
		var currentNode = this.startContainer;
		if(this.startOffset != 0)
 		{
			this.startContainer.splitText(this.startOffset);
			this.__restoreTextBoundaries(); // needed to restore endContainer when in same node!
			currentNode = this.startContainer;
		}

		// not at end so split end node of this 
		if(this.endOffset != this.endContainer.length) 
			this.endContainer.splitText(this.endOffset);

		var textTW = document.createTreeWalker(this.commonAncestorContainer,
							   NodeFilter.SHOW_TEXT,
							   null,
							   false);

		// change to walk elements or text and nonEmptyText ie/ show all!
		var textNodes = new Array();
		textTW.currentNode = currentNode;
		var testNode = textTW.currentNode;
		while(testNode)
		{
			// must allow empty text to get this far as last node could be empty (offset = 0 before
			// split)
			if(__NodeFilter.nonEmptyText(testNode) == NodeFilter.FILTER_ACCEPT)
				textNodes[textNodes.length] = testNode;
			// at end!
			if(testNode == this.endContainer)
				break;
			testNode = textTW.nextNode();
		}

		// do one global one at the end?
		this.__restoreTextBoundaries();

		return textNodes;
	}
);

/**
 * Does one range contain another?
 *
 * @argument compareRange range to check
 * @returns true if one contains the other
 * 
 * POST04: 
 * - try out compareNode of Mozilla. May be no use case for Range in Range - all Node in Range
 * - see if this is called too much (ie/ trace it)
 */
Range.prototype.containsRange = function(compareRange)
{
	// Compare against a maximized version of this range.
	var baseRange = this.cloneRange();
	baseRange.__maximizeContext();			
	
	var val = baseRange.compareBoundaryPoints(Range.START_TO_START, compareRange);
	if(baseRange.compareBoundaryPoints(Range.START_TO_START, compareRange) == 1)
		return false;

	if(baseRange.compareBoundaryPoints(Range.END_TO_END, compareRange) == -1)
		return false;

	return true;	
}

/**
 * recursively combine adjacent editable elements in a Range.
 *
 * POST04:
 * - move out of Range and make this an Element method. Then if necessary do a 
 * Range equivalent that just resets boundaries. Typical use case is to 
 * selectNode and then call this. IMPORTANT
 * - not for text ranges: formalize this - consider general issue of range setting. Caller should expand
 * a range appropriately. This and other methods SHOULD NOT expand it by side effect.
 * - efficiency: only check top most nodes for inclusion in Range: once find included node then don't
 * check their children ... [general pattern for all Range change operations ...]
 */
Range.prototype.normalizeElements = function(elementName)
{
	elementName = elementName.toLowerCase();

	// note: no range markers as range isn't a text range

	// normalize element filter checks two things:
	// - is the element within the Range
	// - does the element have an identical previous sibling (prelude to merge!)
	var range = this;
	var normalizeFilter = function(node)
	{
		var compareRange = document.createRange();
		compareRange.selectNodeContents(node);			
		
		if(!range.containsRange(compareRange))
		{
			return NodeFilter.FILTER_REJECT;
		}
		compareRange.detach();
							
		if(node.nodeName.toLowerCase() == elementName) 
		{
			var previousSibling = node.__editablePreviousSibling;
			if(previousSibling && previousSibling.match && previousSibling.match(node))
			{
				return NodeFilter.FILTER_ACCEPT;
			}
	
			return NodeFilter.FILTER_SKIP;
		}	  	
		return NodeFilter.FILTER_SKIP;		
	}

	var namedElTW = document.createTreeWalker(this.commonAncestorContainer,
					   NodeFilter.SHOW_ELEMENT,
					   normalizeFilter,
					   false);

	// recurse through a tree processing the leaf nodes before their parents
	this.normalizeElementsInTree = function(namedElTW)
	{
		// children will all be nodes of the type we want to rename 
		var child = namedElTW.firstChild();

		while(child != null)
		{
			// process the next child before processing its parent!
			this.normalizeElementsInTree(namedElTW);
			namedElTW.currentNode = child; // jump back up!
			var childToMerge = child;
			child = namedElTW.nextSibling(); // moves current on if one more!

			var childToMergeInto = childToMerge.__editablePreviousSibling;
			// delete intermediate empty text nodes
			while(childToMergeInto.nextSibling != childToMerge)
				childToMergeInto.parentNode.removeChild(childToMergeInto.nextSibling);
			var contentsToMerge = document.createRange();
			contentsToMerge.selectNodeContents(childToMerge);
			childToMergeInto.appendChild(contentsToMerge.extractContents());
			childToMergeInto.normalize();
			// now delete the merged child
			childToMerge.parentNode.removeChild(childToMerge);	

		}
	}

	// now normalize elements
	this.normalizeElementsInTree(namedElTW);
}

/**
 * Change all elements of one type to another type! This will NOT normalize elements.
 */
Range.prototype.renameElements = function(currentName, newName)
{
	// before processing, let's mark text boundaries if the range has them but only if not already set
	this.__markTextBoundaries(false);

	currentName = currentName.toLowerCase();
	newName = newName.toLowerCase();

	// - is the element within the Range
	// - does the element have a particular name
	var range = this;
	var renameFilter = function(node)
	{
		var compareRange = document.createRange();
		compareRange.selectNodeContents(node);			
		
		if(!range.containsRange(compareRange))
			return NodeFilter.FILTER_REJECT;
		compareRange.detach();
		if(node.nodeName.toLowerCase() == currentName) 
			return NodeFilter.FILTER_ACCEPT;
		return NodeFilter.FILTER_SKIP;		
	}

	var namedElTW = document.createTreeWalker(this.commonAncestorContainer,
					   NodeFilter.SHOW_ELEMENT,
					   renameFilter,
					   false);

	// recurse through a tree processing the leaf nodes before their parents
	var atLeastOneRenamed = false;
	this.renameElementsInTree = function(namedElTW)
	{
		// children will all be nodes of the type we want to rename 
		var child = namedElTW.firstChild();

		while(child != null)
		{
			// process the next child before processing its parent!
			this.renameElementsInTree(namedElTW);
			namedElTW.currentNode = child; // jump back up!
			var childToRename = child;
			child = namedElTW.nextSibling(); // moves current on if one more!
			childToRename.parentNode.replaceChildOnly(childToRename, newName);
			atLeastOneRenamed = true;
		}
	}

	// now normalize elements (test result!)
	this.renameElementsInTree(namedElTW);
		
	// now restore the text boundaries
	if(atLeastOneRenamed)
	{
		this.__restoreTextBoundaries();
		return true;
	}
	return false;
}

/**
 * Normalize text in a Range without effecting its boundaries
 */
Range.prototype.normalizeText = function()
{
	this.__markTextBoundaries(false);
	this.commonAncestorContainer.parentElement.normalize();
	this.__restoreTextBoundaries();
}

/**
 * Expand the range to include nodes that only contain its boundary points or those nodes
 * that only contain them.
 *
 * @argument top don't include beyond this node
 *
 * @returns true if takes in all of the contents of top; false otherwise.
 * 
 * POST04:
 * - reconsider reseting if in middle of midline whitespace sequences
 * 
 * Note: this method does NOT set a text mark.
 */
Range.prototype.includeExclusiveParents = function()
{
	// will include a parent in the start boundary iff: (equivalent true for end boundary)
	// - previous character is outside the line
	// - at top
	// - previous character is inline but in a previous text node
	if(this.startContainer.nodeType == Node.TEXT_NODE)
	{
		var startip = new InsertionPoint(this.__top, this.startContainer, this.startOffset); // RESET BY SIDE EFFECT? [or put into Range?]

		if((startip.ipOffset == 0) ||
		   (startip.backOne() != InsertionPoint.SAME_LINE))
		{
			this.setStart(this.startContainer, 0); // skip to start to account for collapsed whitespace
			// eat up exclusive intermediate parents between this node and its ultimate context: firstchild accounts for empty text
			while((this.startContainer != this.__top) && (__NodeFilter.firstChild(this.startContainer) == NodeFilter.FILTER_ACCEPT))
				this.setStart(this.startContainer.parentNode, 0);

			if(this.startContainer.parentNode && (this.startContainer != this.__top))
				this.setStart(this.startContainer.parentNode, this.startContainer.offset);
		}
	}

	if(this.endContainer.nodeType == Node.TEXT_NODE)
 	{
		var endip = new InsertionPoint(this.__top, this.endContainer, this.endOffset);
	
		// ok: let's handle a moz selection bug. Double-click selection can take in collapsed white space at
		// the end of a Range though it doesn't seem to do this at the start of a Range.
		// POST04: replace this and make Range reset itself based on InsertionPoint
		if(!endip.ipNode.descendent(this.__top))
			endip.backOne();

		if((endip.ipOffset == endip.ipNode.length) ||
		   (endip.forwardOne() != InsertionPoint.SAME_LINE))
		{
			this.setEnd(this.endContainer, this.endContainer.nodeValue.length); // skip to the end if necessary!
			// eat up exclusive intermediate parents between this node and its ultimate context
			while((this.endContainer != this.__top) && (__NodeFilter.lastChild(this.endContainer) == NodeFilter.FILTER_ACCEPT))
				this.setEnd(this.endContainer.parentNode, this.endContainer.parentNode.childNodes.length);

			if(this.endContainer.parentNode && (this.endContainer != this.__top))
				this.setEnd(this.endContainer.parentNode, this.endContainer.offset + 1);
		}
	}

	// maximize covers top?
	return((this.startContainer == this.__top) && (this.endContainer == this.__top));
}

/**
 * Assumption: for now that xhtml is adhered to and that there are no elements partially embedded in elements
 * ex/ [span]XX[span]YY[/span][/span]
 *
 * @argument styleName name of style
 * @argument styleValue valid valid for style (or addClass if isClass = true, resp. removeClass if isClass = false)
 * @argument isClass if it should be treated as class instead of style
 *
 * if isClass is true, then it's added as a class not as a style.
 *  then styleValue has another meaning: if true, the class is added, if false, class is removed
 *
 * POST04: 
 * - dont' use textNodes ... instead walk tree ala normalize; could use if text node partially in range then
 * split ...
 * - consider replacing compareRanges with compareNode (Mozilla): need to move from looking at node contents
 * and then including elements that contain those contents to making Range inclusive enough that nodes themselves
 * can be checked (efficiency from a comprehensive set of Range boundary setters)
 * - account for top where we won't style the whole of top: use span instead to allow more nuance with subsequent
 * settings: insert div in between
 * - allow "inline" span element to be specified explcitly
 * - allow to pass in a number of "inline style holders". For HTML, A and span should be equivalent in that
 * A should be split just like span is split as style is applied. STRONG/EM etc must be accounted for too.
 * They should be treated as inline style holders within reason. If inline holder has style of some sort
 * that needs to be preserved. May also treat FONT/B/I and other deprecated inline style holders as peers
 * of span.
 * - recognize non text styles and exception. Some styles should only be applied to elements explicitly 
 * - issue of [a] getting inline style. Not reset - only span's are! They are just overridden.
 * - recognize equivalency between different ways to express the same style. For example,
 * "bold" and its numeric equivalent for "font-weight". This may also require accepting a range
 * of "equivalent values" for a style that may not be exact matches in official style but which look
 * the same. "bolder" and "bold" for instance display the same: setting one where another already 
 * applies in a higher context is redundant.
 * - test code needed for messy HTML like spans within or overlapping other spanS. The latter isn't 
 * allowed in XHTML but most browsers tolerate it.
 * - ensure span is inline before removing it. If it is not inline then it has another purpose.
 * - if applied to text outside the XHTML name space then make sure span has the correct name space
 * setting.
 * - support concept of +/-# for numeric settings where settings are applied incrementally when a 
 * setting is already present either explicitly or inherited. Used for position and even for making
 * font-weight bolder ...
 * - if <span> expands to cover <div> or other parent then merge its style into that parent. Right
 * now, certain sequences will leave the span around if style is built up to incrementally cover a
 * larger block.
 */
Range.prototype.styleText = function(styleName, styleValue, isClass)
{
	// if collapsed then return - works for inline style or block: make editor do work
	if(this.collapsed)
		return;

	// go through all text nodes in the range and apply style to 'em unless there already
	if(!keepTxtNodes)
	{
		textNodes = this.textNodes;
	}
	else
		textNodes = keepTxtNodes;

	// POST04: replace with walker - work like normalizeElements
	for(i=0; i<textNodes.length; i++)
	{
		var textContainer = textNodes[i].parentNode; // if setting restore context?

		// only apply to containers that don't have property already
		if(!styleValue || document.defaultView.getComputedStyle(textContainer, null).getPropertyValue(styleName) != styleValue)
		{	
			// if text doesn't have exclusive parent then will need to give it one!
			if(textContainer.childNodes.length > 1)
			{
				var styleHolder;

				// spans are special: we don't embed spans in a span - we put spans around all 
				// the text nodes in the span
				// note: assume not span within a span so we only have a series of text nodes
				
				if(textContainer.nodeNamed("span"))
				{ 
					if(textNodes[i].previousSibling)
					{
						var siblingStyleHolder = textContainer.cloneNode(false);
						textContainer.parentNode.insertBefore(siblingStyleHolder, textContainer);
						siblingStyleHolder.appendChild(textNodes[i].previousSibling);	
						eDOMEventCall("NodeInserted",siblingStyleHolder);
					}

					if(textNodes[i].nextSibling)
					{
						var siblingStyleHolder = textContainer.cloneNode(false);
						if(textContainer.nextSibling)
							textContainer.parentNode.insertBefore(siblingStyleHolder, textContainer.nextSibling);
						else 
							textContainer.parentNode.appendChild(siblingStyleHolder);
						siblingStyleHolder.appendChild(textNodes[i].nextSibling);	
						eDOMEventCall("NodeInserted",siblingStyleHolder);

					}									
				}
				// one text node within a non span element - put this text node within a span
				else
				{
					var styleHolder = documentCreateXHTMLElement('span');
					textContainer.insertBefore(styleHolder, textNodes[i]);
					styleHolder.appendChild(textNodes[i]);
					eDOMEventCall("NodeInserted",styleHolder);

					textNodes[i] = styleHolder.firstChild;
					textContainer = styleHolder;
				}
			}
			if (isClass) {
				if (styleValue) {
					textContainer.addClass(styleName);
				} else {
					textContainer.removeClass(styleName);
				}
			} else {
				textContainer.style.setProperty(styleName, styleValue, "");
			}
		}
	}
					
	this.__restoreTextBoundaries(); // restore boundaries after styles are applied: CAN NIX IF GET CONTAINER AT START?

	var treeTop = this.commonAncestorContainer.parentElement;
	if(document.defaultView.getComputedStyle(treeTop, null).getPropertyValue("display") == "inline")
		treeTop = treeTop.parentNode;

	treeTop.normalize(); // make sure text nodes are normalized

	treeTop.__normalizeXHTMLTextStyle(); // normalize the styles

	this.__restoreTextBoundaries(); // restore boundaries after styles are normalized.
	keepTxtNodes = null;
	return;
}

var keepTxtNodes = null;

/**
 * Does a Range have a style?
 */
Range.prototype.hasStyle = function(styleName, styleValue)
{
	// note that this can split text nodes
	var textNodes = this.textNodes;
	keepTxtNodes = textNodes;

	for(i=0; i<textNodes.length; i++)
	{
		var textContainer = textNodes[i].parentNode;

		// if any node doesn't have the style then the Range doesn't have it!
		if(document.defaultView.getComputedStyle(textContainer, null).getPropertyValue(styleName) != styleValue)
		{
			//this.normalizeText();
			return false;	
		}
	}

	// efficiency given that apply comes next - will be combined with apply POST 03
	// this.normalizeText();

	return true;
}

/**
 * Does a Range have a style?
 */
Range.prototype.hasClass = function(className)
{
	// note that this can split text nodes
	var textNodes = this.textNodes;
	keepTxtNodes = textNodes;
 
	for(var i=0; i<textNodes.length; i++)
	{
		var textContainer = textNodes[i].parentNode;
 
		// if any node doesn't have the style then the Range doesn't have it!
		if(!textContainer.hasClass(className))
		{
			//this.normalizeText();
			return false;	
		}
	}
	return true;
}

/**
 * @returns lines in Range
 * 
 * POST04: make this a getter
 */
Range.prototype.lines = function()
{
	// expand range to test to cover start/end of any text nodes
	var range = this.cloneRange();
	if(range.startContainer.nodeType == Node.TEXT_NODE)
		range.setStart(range.startContainer, 0);
	if(range.endContainer.nodeType == Node.TEXT_NODE)
		range.setEnd(range.endContainer, range.endContainer.nodeValue.length);

	var lineSeedInRangeFilter = function(node)
	{
		var lineSeedCheck = __NodeFilter.lineSeedFilter(node);
		if(lineSeedCheck != NodeFilter.FILTER_ACCEPT)
			return lineSeedCheck;

		// do further check on accepting node to see if it is within the range
		var nodeRange = document.createRange();
		nodeRange.selectNodeContents(node);
		if(!range.containsRange(nodeRange))
			return NodeFilter.FILTER_REJECT; 
		return NodeFilter.FILTER_ACCEPT;
	}

	// Tree to allow us to walk and loop through seeds producing unique lines
	var tw = document.createTreeWalker(range.commonAncestorContainer.parentElement,
					   NodeFilter.SHOW_ALL,
					   lineSeedInRangeFilter,
					   false);

	var lines = new Array();
	var nextLineSeed = tw.firstChild();
	while(nextLineSeed)
	{
		var currentLine = new CSSLine(nextLineSeed);
		lines.push(currentLine);

		// skip seeds that are already in the new line
		var seedRange = document.createRange();
		seedRange.selectNodeContents(nextLineSeed);
		while(currentLine.__baseRange.containsRange(seedRange))
		{
			nextLineSeed = tw.nextNode();
			if(!nextLineSeed)
				break;
			seedRange.selectNodeContents(nextLineSeed);
		}
		seedRange.detach();	 
	}
	range.detach();
	return lines;
} 

/**
 * @returns all the elements with a particular display value
 *
 * POST04:
 * - don't expand beyond text but skip the text
 */
Range.prototype.elementsWithDisplay = function(displayValue)
{
	// expand range to test to cover start/end of any text nodes
	var range = this.cloneRange();
	if(range.startContainer.nodeType == Node.TEXT_NODE)
		range.setStart(range.startContainer, 0);
	if(range.endContainer.nodeType == Node.TEXT_NODE)
		range.setEnd(range.endContainer, range.endContainer.nodeValue.length);

	// expand range to test to cover start/end of any text nodes
	var displayFilter = function(element)
	{
		if(document.defaultView.getComputedStyle(element, null).getPropertyValue("display") != displayValue)
			return NodeFilter.FILTER_SKIP;

		var elementRange = document.createRange();
		elementRange.selectNodeContents(element);
		if(!range.containsRange(elementRange))
			return NodeFilter.FILTER_REJECT; 
		return NodeFilter.FILTER_ACCEPT;
	}

	// Tree to allow us to walk and loop through seeds producing unique lines
	var tw = document.createTreeWalker(range.commonAncestorContainer.parentElement,
					   NodeFilter.SHOW_ELEMENT,
					   displayFilter,
					   false);

	var displayElements = new Array();
	var displayElement = tw.firstChild();
	while(displayElement)
	{
		displayElements.push(displayElement);
		displayElement = tw.nextNode();	 
	}
	return displayElements;
} 

/**
 * Returns extracted contents
 * 
 * POST04: 
 * - may replace with a method that removes all formatting; then apply regular delete
 * - may be too greedy - if list-item should probably just remove line from a list (may need to
 * split the list) rather than merge list item with previous item!
 * - table: account for beginning or ending in text within a table column
 */
/** 
 * POST04: change to extractsContentsByCSS
 * - work with lines (ie/ table-cell lines get emptied => lines need delete contents option!
 */
Range.prototype.deleteTextTree = function()
{
	if(this.collapsed)
		return null;

	var top = this.__top;
	
	if((this.startContainer.nodeType != Node.TEXT_NODE) ||
	   (this.endContainer.nodeType != Node.TEXT_NODE))
		return null; // tmp - doesn't handle non text ranges

	var startip = new InsertionPoint(top, this.startContainer, this.startOffset);
	var atStart = startip.__mark();

	var endip = new InsertionPoint(top, this.endContainer, this.endOffset);

	// only merge lines if not at start or end of both lines
	var partialSelections = ((endip.forwardOne() == InsertionPoint.SAME_LINE) && (startip.clone().backOne() == InsertionPoint.SAME_LINE));
	if(this.includeExclusiveParents(top))
	{	
		// special case one: surrounds top!
		top.appendChild(document.createTextNode(STRING_NBSP));
	}

	var extractedContents = this.extractContents(); 

	// restore
	startip.__restore();

	// BUG 1: check partial lines - don't try to merge SAME LINE!
	if(partialSelections)
	{
		__Feedbackack("need to merge a line");
		var thisLine = new CSSLine(startip.ipNode);
		var nextLineSeed = startip.clone();
		nextLineSeed.forwardOne();
		var nextLine = new CSSLine(nextLineSeed.ipNode);
		if(!thisLine.__baseRange.containsRange(nextLine.__baseRange))
		{
			__Feedbackack("merging ...");
			thisLine.mergeLine(nextLine);
		}
		else
			__Feedbackack("not merging as same line");
	}

	// restore
	this.selectInsertionPoint(startip);

	return extractedContents;
}

Range.prototype.selectInsertionPoint = function(ip)
{
	this.selectNode(ip.ipNode);
	this.setStart(ip.ipNode, ip.ipOffset);
	this.collapse(true);
}

/**
 * Apply a link to a selection of text
 */
Range.prototype.linkText = function(hrefValue)
{
	// if collapsed then return - works for inline style or block: make editor do work
	if(this.collapsed)
		return;

	// go through all text nodes in the range and link to them unless already set to this link
	var textNodes = this.textNodes;
	for(i=0; i<textNodes.length; i++)
	{
		var textContainer = textNodes[i].parentNode;

		// if selected text is part of a span or a then we need to give it an exclusive parent of its own
		// this would only happen when part of a text node is selected either at the beginning or end of a
		// range or both.
		if((textContainer.childNodes.length > 1) &&
		   (textContainer.nodeNamed("span") || textContainer.nodeNamed("a")))
		{ 
				var siblingHolder;

				// leave any nodes before or after this one with their own copy of the container
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

		// from now on, we assume that text has an exclusive A or span parent OR it is inside a container
		// that can have an A inserted into it and around the text.
		if(textContainer.nodeName.toLowerCase() != "a")
		{
			// replace a span with an A
			if(textContainer.nodeNamed("span"))
				textContainer = textContainer.parentNode.replaceChildOnly(textContainer, "a");
			// insert A inside a non span or A container!
			else
			{	
				var linkHolder = documentCreateXHTMLElement('a');
				textContainer.insertBefore(linkHolder, textNodes[i]);
				linkHolder.appendChild(textNodes[i]);
				textContainer = linkHolder;		
			}
		}

		textNodes[i] = textContainer.firstChild;
		textContainer.setAttribute("href", hrefValue);		
	}

	// normalize A elements [may be a waste - why not normalizeElements at the node level?]
	var normalizeRange = document.createRange();
	normalizeRange.selectNode(this.commonAncestorContainer);
	normalizeRange.normalizeElements("a");
	normalizeRange.detach();

	// now normalize text  
	this.commonAncestorContainer.parentElement.normalize();
	this.__restoreTextBoundaries();
}

/**
 * Clear links from text
 */
Range.prototype.clearTextLinks = function()
{
	// if collapsed then return - works for inline style or block: make editor do work
	if(this.collapsed)
		return;
 
	// go through all text nodes in the range and link to them unless already set to this link
	var textNodes = this.textNodes;
	for(i=0; i<textNodes.length; i++)
	{		
		// figure out this and then it's on to efficiency before subroutines ... ex of sub ... 
		// try text nodes returning one node ie/ node itself! could cut down on normalize calls ...
		var textContainer = textNodes[i].parentNode;

		if(textContainer.nodeNamed("a"))
		{
			if(textContainer.childNodes.length > 1)
			{
				var siblingHolder;

				// leave any nodes before or after this one with their own copy of the container
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
			if(textContainer.attributes.length > 1)
			{
				textContainer = textContainer.parentNode.replaceChildOnly(textContainer, "span");
				textContainer.removeAttribute("HREF");
			}
			// else remove the A!
			else
			{
				textContainer.parentNode.removeChildOnly(textContainer);
			}
		}
	}

	// normalize A elements 
	var normalizeRange = document.createRange();
	normalizeRange.selectNode(this.commonAncestorContainer);
	normalizeRange.normalizeElements("a");
	normalizeRange.detach();

	// now normalize text
	this.commonAncestorContainer.parentElement.normalize();
	this.__restoreTextBoundaries();
}

// - POST05: efficiency: make sure not called too often, in particular from read-only operations
// - POST05: make public or at least have collapse and other methods reset this method!
Range.prototype.__markTextBoundaries = function(replace)
{
	if(!replace && (this.startTextPointer || this.endTextPointer))
		return;

	if(this.startContainer.nodeType == Node.TEXT_NODE)
	{
		this.startTextPointer = new __TextPointer(this.__top, this.startContainer, this.startOffset);
	}
	else
	{
		if(this.startTextPointer)
			delete this.startTextPointer;
	}

	// optimization possibility: calculate end from start ie/ combine both into a CSSTextRangeMarker
	if(this.endContainer.nodeType == Node.TEXT_NODE)
	{
		if(this.collapsed)
			this.endTextPointer = this.startTextPointer;
		else
		{
			this.endTextPointer = new __TextPointer(this.__top, this.endContainer, this.endOffset);
		}
	}
	else
	{
		if(this.endTextPointer)
			delete this.endTextPointer;
	}
}

/*
 * Restore a Range to the boundaries set by MarkTextBoundaries if they exist. Otherwise leave Range as is.
 * 
 * POST04: could change this to always take up text boundaries even where there is no pointer etc. ie/ textBoundaries?
 * - move to being a utility/impl method of CSSTextRange
 * - if one or other end fails then revert to one end; one both fail then ?
 */ 
Range.prototype.__restoreTextBoundaries = function()
{
	if(this.startTextPointer)
	{
		var startNode = this.startTextPointer.referencedTextNode; // avoid order error: start after end as being set
		this.selectNode(startNode);
		this.setStart(this.startTextPointer.referencedTextNode, this.startTextPointer.referencedOffset);
	}
	if(this.endTextPointer)
	{	
		this.setEnd(this.endTextPointer.referencedTextNode, this.endTextPointer.referencedOffset);		
	}
}

Range.prototype.__clearTextBoundaries = function()
{
	if(this.startTextPointer)
		delete this.startTextPointer;
	if(this.endTextPointer)
		delete this.endTextPointer;
}

Range.prototype.__maximizeContext = function()
{
	// is start at beginning or end of text node?
	if((this.startContainer.nodeType == Node.TEXT_NODE) &&
	   ((this.startOffset == 0) || (this.startOffset == this.startContainer.nodeValue.length)))
	{
		// at beginning or end? Decides how to index within its context
		var selOffset = 1;
		if(this.startOffset == 0)
			selOffset = 0;

		// get in terms of parent
		var parentNode = this.startContainer.parentNode;
		var parentOffset = this.startContainer.offset;	

		if(this.collapsed)
		{
			this.selectNode(parentNode); // makes sure start is temporarily put after end
			this.setStart(parentNode, parentOffset+selOffset);
			this.collapse(true);
			return;
		}

		this.setStart(parentNode, parentOffset+selOffset);	
	}

	// is end at beginning or end of text node?
	if((this.endContainer.nodeType == Node.TEXT_NODE) &&
	   ((this.endOffset == 0) || (this.endOffset == this.endContainer.nodeValue.length)))
	{
		// at beginning or end? Decides how to index within its context
		var selOffset = 1;
		if(this.endOffset == 0)
			selOffset = 0;

		// get in terms of parent
		var parentNode = this.endContainer.parentNode;
		var parentOffset = this.endContainer.offset;

		this.setEnd(parentNode, parentOffset+selOffset);			
	}
}

/******************************** TextPointer ****************************************/

/*
 * Many methods (appendChild, normalize) that don't remove text from the DOM, do delete
 * a particular TextNode that holds the text at one time or another. They effect 
 * boundaries of Ranges if a Range begins or ends in a TextNode they manipulate. This
 * object, by recording an absolute offset for text, allows the restoration of a text
 * pointer even after specific text nodes disappear.
 *
 * Uses:
 * - restore a Range after expansion or contraction 
 * - restore a Range after its ends are effected by splitting or normalizing or being moved
 * 
 * Two accessors:
 * - referencedTextNode
 * - referencedOffset
 *
 * POST02:
 * - CSSTextRangeMarker may replace this: calculates end from start and start from a context
 * logical for a Range.
 * - issue: goToStart etc doesn't follow InsertionPoint logic and so treats whitespace as significant
 * - look into using xpointer like syntax for debugging: ie/ id/1/2 etc. Alternatively
 * may implement using xpointers where the child numbers change based on note manipulation
 * - look into dropping skip of non empty text (ie/ orphan white space) because it may
 * be orphaned by applying styles after having been part of a text node. That means that
 * restoration after applying styles may fail. Alternatively, may make routines like "mark"
 * jump to the "real" start or end of a line if already at the effective start or end of a
 * line
 * - may add ability to decide whether to end in one node or begin in a subsequent node. Right
 * now, the default always beings in a new node if it can. 
 * - maybe allow increment and decrement of offset to reflect user controller insertion
 * and deletion of preceding text of a particular size.
 */ 
function __TextPointer(root, text, offset)
{
	// public properties of this marker
	this.root = root;
	this.absTextOffset = 0;
	this.textNode = text; // original text node - may go away doing processing
	this.textOffset = offset; // original offset within text
	this.currentTextNode = text;
	this.currentTextOffset = offset;
	this.__goToStart = true;

	this.textTW = document.createTreeWalker(this.root,
					       NodeFilter.SHOW_TEXT,
					       __NodeFilter.nonEmptyText,
					       false);

	this.absTextOffset = 0;
	this.textTW.currentNode = this.root;
	for(var next = this.textTW.firstChild(); next != null; next = this.textTW.nextNode())
	{
		if(next == this.textNode)
		{
			this.absTextOffset += this.textOffset;
			break;
		}
		this.absTextOffset += next.nodeValue.length;
	}

	/*
         * Now know the absolute offset. If no text deletion then this makes text position
         * recoverable.
         * 
         * The following lets us work back from calculated offset to the current active 
         * text node at any time
         */
	// POST04: should do alert if can't find a TextNode - exception back to caller
	this.calculateTextNode = function()
	{
		this.textTW.currentNode = this.root;
		var lastTextNode = null; // null means no TextNode is referenced
		var endSoFar = possEndSoFar = 0;

		for(var currentTextNode = this.textTW.firstChild(); currentTextNode != null; currentTextNode = this.textTW.nextNode())
		{
			// at start of node - return with node and offset of 0
			if(this.__goToStart && (this.absTextOffset == possEndSoFar))	
			{
				this.currentTextNode = currentTextNode;
				this.currentTextOffset = 0;
				return;
			}

			possEndSoFar += currentTextNode.nodeValue.length;

			// if now within a node then return that node and the offset within it
			if((this.absTextOffset < possEndSoFar) || ((!this.__goToStart) && (this.absTextOffset == possEndSoFar)))
			{
				this.currentTextNode = currentTextNode;
				this.currentTextOffset = this.absTextOffset - endSoFar;
				return;
			}		

			endSoFar = possEndSoFar;
			lastTextNode = currentTextNode;
		}
		// don't like this: get here if goToStart is true but "start" is outside editable area
		this.currentTextNode = lastTextNode;
		this.currentTextOffset = lastTextNode.nodeValue.length;
		return;
	}
}

/*
 * The pointer could lead to the end of a text node or the start of the following node. This setting
 * decides which way to go.
 *
 * POST04: remove need for this or build into pointer creation. 
 */
__TextPointer.prototype.__defineSetter__(
	"goToStart",
	function(value) {this.__goToStart = value;}
);

/*
 * Return the offset within the text node currently referenced by the pointer
 */ 
__TextPointer.prototype.__defineGetter__(
	"referencedOffset",
	function() {
		return this.currentTextOffset;
	}
);

/*
 * Return the text node currently referenced by the pointer. Note that this also causes the pointer to
 * be recalculated. 
 *
 * POST04:
 * - separate calculation from accessors
 */
__TextPointer.prototype.__defineGetter__(
	"referencedTextNode",
	function() {
		this.calculateTextNode();
		return this.currentTextNode;
	}
);

/*
 * Pretty up toString
 */ 
__TextPointer.prototype.toString = function()
{
	return("TextPointer: " + this.referencedTextNode.nodeValue + ":" + this.referencedOffset);
}

/*************************************************************************************************************
 * __NodeFilter provides centralized access to frequently used node filters. They can be 
 * applied directly, within filter enabled methods and in tree traversal.
 *
 * POST04:
 * - replace most with more use of __VisibleTextWalker and Validation module 
 *************************************************************************************************************/

// Class to hold the filters
function __NodeFilter() {}

/*
 * need to filter out empty text nodes, those only in the DOM to format raw HTML
 *
 * POST04: rename to be "nonWhiteSpaceNode"
 */
__NodeFilter.nonEmptyText = function(node)
{
	if(node.nodeType != Node.TEXT_NODE) // may have text in el; POST04: may be no need for this
		return NodeFilter.FILTER_ACCEPT;

	if(node.nodeValue.length == 0) // empty node is obviously empty!
		return NodeFilter.FILTER_REJECT;

	if(/\S+/.test(node.nodeValue)) // any non white space visible characters
		return NodeFilter.FILTER_ACCEPT;

	if(/\u00A0+/.test(node.nodeValue)) // any nbsp 
		return NodeFilter.FILTER_ACCEPT;

	// POST04: if(node.isWhitespaceOnly) ...

	return NodeFilter.FILTER_REJECT;
}

/*
 * Can a node have children: text can't and many XHTML elements can't either. As we
 * are not schema enabled, this routine can't help us with childless XML elements.
 *
 * Note: may not be necessary if firstChild or childNodes on BR etc behaves properly ie/ return null
 * 
 * POST04: nix as only used below in nonEmptyTextNode ...
 */
__NodeFilter.canHaveChildren = function(node)
{
	// text nodes don't support children
	if(node.nodeType == Node.TEXT_NODE)
		return NodeFilter.FILTER_REJECT;

	// POST04: 	if(node.allowedChildren)

	// Listing HTML elements - of course an XML may have others but
	// we can't know that without reading the DTD/Schema.
	switch(node.nodeName.toUpperCase())
	{
		case "AREA":	case "BASE":	case "BASEFONT":
		case "BR":	case "COL":	case "FRAME":
		case "HR":	case "IMG":	case "INPUT":
		case "ISINDEX":	case "LINK":	case "META":
		case "PARAM":
			return NodeFilter.FILTER_REJECT;
	}

	return NodeFilter.FILTER_ACCEPT;
} 

/*
 * Does the node have an explicit inline style or not?
 */
__NodeFilter.hasInlineStyle = function(node)
{
	if(node.nodeType == Node.TEXT_NODE)
		return NodeFilter.FILTER_REJECT;

	var styleAttr = node.attributes.getNamedItem("style");
	if(styleAttr && (styleAttr.nodeValue != ""))
		return NodeFilter.FILTER_ACCEPT;
	
	return NodeFilter.FILTER_SKIP;
}

/*
 * Is a node a "line seed" ie/ something to define a line around: only inline elements and non-empty text nodes
 * need apply!
 *
 * POST04: revisit decision to allow inline seeds. May SKIP them. Problem is that they may not contain a text node!
 */
__NodeFilter.lineSeedFilter = function(node)
{
	if(node.nodeType == Node.TEXT_NODE) // POST04: !node.isWhitespaceOnly
		return __NodeFilter.nonEmptyText(node);

	if(node.nodeType == Node.ELEMENT_NODE)
	{
		if(document.defaultView.getComputedStyle(node, null).getPropertyValue("display") == "inline")
			return NodeFilter.FILTER_ACCEPT;

		// node with children that isn't an inline element - tree will burrow
		// POST04: node.allowedChildren
		if(__NodeFilter.canHaveChildren(node) == NodeFilter.FILTER_ACCEPT)
			return NodeFilter.FILTER_SKIP;
	}

	return NodeFilter.FILTER_REJECT;
}

/*
 * A last child is one with no following siblings other than empty text nodes (for XML formatting)
 */
__NodeFilter.lastChild = function(node)
{
	while(nextNode = node.nextSibling)
	{
		if(__NodeFilter.nonEmptyText(nextNode) == NodeFilter.FILTER_ACCEPT)
			return NodeFilter.FILTER_REJECT;
		node = nextNode;
	}	
	return NodeFilter.FILTER_ACCEPT;
}

/*
 * A first child is one with no preceding siblings other than empty text nodes (for XML formatting)
 */
__NodeFilter.firstChild = function(node)
{
	while(prevNode = node.previousSibling)
	{
		if(__NodeFilter.nonEmptyText(prevNode) == NodeFilter.FILTER_ACCEPT)
			return NodeFilter.FILTER_REJECT;
		node = prevNode;
	}	
	return NodeFilter.FILTER_ACCEPT;
}

/***************************************************************************************
 * Constants
 ***************************************************************************************/
const STRING_NBSP = "\u00A0";
const CHARCODE_NBSP = 160;
//const STRING_NBSP = "\u007B"; (test vals)
//const CHARCODE_NBSP = "123";
const CHARCODE_SPACE = 32;
const STRING_SPACE = "\u0020";	
const CHARCODE_NEWLINE = "012";	
const CHARCODE_TAB = "009";	

/************************************** Test Feedback **************************************************/

var feedback = false;
function __Feedbackack(text)
{
	if(!feedback)
		return;

	var feedbackArea = document.getElementById("feedbackArea");
	if(!feedbackArea)
		return;
	var feedback = document.createTextNode(text);
	var feedbackBlock = documentCreateXHTMLElement("div");
	feedbackBlock.appendChild(feedback);
	feedbackArea.appendChild(feedbackBlock);
}
// for whatever reason, jsdoc needs this line