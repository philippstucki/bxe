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
 *		Karl Guertin <grayrest@grayrest.com>
 *
 * ***** END LICENSE BLOCK ***** */

/*******************************************************************************************************
 * Simple, html-based editing toolbar for mozile: it appears once an editable area is 
 * selected: V0.46
 *
 * POST04: 
 * - make OO - too hacky (see mozileModify's button disable!)
 * - experiment with "select" events after reselection (cp) to indent/dedent buttons
 * - make invisible if not in editable area [partially done: have to work on arrow in/out]
 * - print: hide this toolbar (call disable)
 * - move bar to bottom or side of screen if trying to edit the top?
 * (see: http://devedge.netscape.com/toolbox/examples/2002/xb/xbPositionableElement/)
 * - preload images
 * - support for a "read-writetext" value that only allows text editing and
 * does not allow ANY formatting. Should be bar appear or be greyed out?
 * - HTML bar as divs and spans and not a table: use moz-outline on imgs ...
 * - do equivalent in XUL
 *   - add as proper toolbar: http://devedge.netscape.com/viewsource/2002/toolbar/
 *******************************************************************************************************/

// image should be in the same directory as this file. This file is in mozile_root_dir. The loader
// sets this constant.
const buttonImgLoc = mozile_root_dir + "/images/buttons.png";
var preloadthebutton = new Image();
preloadthebutton.src = buttonImgLoc;

var ptbStyles = new Array(
			"height", "30px",
			"background-color", "#ff6600",
			"border", "0px",
			"position", "fixed",
			"z-index", "999", // important to be higher than all else on page
			"-moz-user-select", "none",
			"-moz-user-modify", "read-only",
			"-moz-user-input", "enabled", // means enabled: overrides page default which could be "disabled"
			"top", "16px",
			"width", "100%",
			"margin-left", "0px");

// button definitions
var buttons=new Array();

buttons=
    {
	"Dimension": [120,140,20,20],//width,height and button width,height in px
    
	"b":[1,1,"ToggleTextClass","http://www.w3.org/1999/xhtml"],
    "italic":[0,1,"ToggleTextClass"],
    "underline":[2,1,"ToggleTextClass"],
    "strikethrough":[3,1,"ToggleTextClass"],
    "subscript":[4,1,"ToggleTextClass"],
    "superscript":[5,1,"ToggleTextClass"],
    "link":[0,5,"InsertLink"],
    "unlink":[1,5,true],
    "create_table":[2,5,"InsertTable"],
    /*"Outdent":[1,2,true],
    "Indent":[0,2,true],*/
    "Unordered_List":[3,2,true],
    "Ordered_List":[2,2,true],
  /*  "Left":[0,3,true],
    "Center":[1,3,true],
    "Right":[2,3,true],
    "Justify":[3,3,false],
    "New_Page":[0,6,false],*/
    "Copy":[0,4,"ClipboardCopy"],
    "Cut":[1,4,"ClipboardCut"],
    "Paste":[2,4,"ClipboardPaste"],
    "Image":[3,5,"InsertImage"],
    //"HR":[4,5,],
    "Save":[1,6,"DocumentSave"],
    "Raw_HTML":[2,6,false],
    "Undo":[3,6,"Undo"],
    "Redo":[4,6,"Redo"]
	};

var buttonStyles = new Array(
	"height", "20px", 
	"width", "20px", 
	"border", "solid 1px #C0C0C0",
	"background-color", "##ff6600",
	"-moz-user-modify", "read-only",
	"-moz-user-input", "disabled",
	"-moz-user-select", "none",
	"background-image","url("+buttonImgLoc+")");

var ptbActive = false;
var ptbEnabled = false;

// POST04: submit PR on Firebird - needs toggle of display for toolbar to appear properly!
function PTB()
{
	// make bar as a table 
	var ptb = document.createElement("table");
	ptb.id = "playtoolbar";
	document.body.appendChild(ptb); // POST04: change to be XML ok
	for(var i=0; i<ptbStyles.length; i=i+2)
		ptb.style.setProperty(ptbStyles[i], ptbStyles[i+1], "");

	// add tbody to table (required to avoid a bgcolor/background-color sync bug http://bugzilla.mozilla.org/show_bug.cgi?id=205705)
	var tbTB = document.createElement("tbody");
	ptb.appendChild(tbTB);

	// add a row of buttons and selectors
	var tbTR = document.createElement("tr");
	tbTB.appendChild(tbTR);
	for(var i=0; i<selectors.length; i++)
	{
		tbTR.appendChild(createSelector(selectors[i]));
	}
	for(var i=1; i<buttons.length; i++)
	{
		if(buttons[i][3])
			tbTR.appendChild(createButton(i));
	}
	var possButtons = document.getElementsByTagName("div");
	for(var i=0; i<possButtons.length; i++)
	{
		if(possButtons[i].className == "button")
		{	
			var button = possButtons[i];
      			button.onmouseover = ptbmouseover;
      			button.onmouseout = ptbmouseout;
      			button.onmousedown = ptbmousedown;
      			button.onmouseup = ptbmouseup;
      			button.onclick = ptbbuttonclick;
		}
  	}
	ptb.style.display = "table";
	ptb.style.display = "none"; // this sequence is needed to get over a Firebird bug
	ptb.style.display = "table";
	ptbActive = true;
	ptbEnabled = true;
}

function ptbenable()
{
	var ptb = document.getElementById("playtoolbar");
	if(!ptb)
		return;
	ptb.style.setProperty("display", 'table', '');
	ptbEnabled = true;
}

function ptbdisable()
{
	/*var ptb = document.getElementById("playtoolbar");
	if(!ptb)
		return;
	ptb.style.setProperty("display", 'none', '');
	ptbEnabled = false;*/
}

function createButton(buttonindex)
{
	var mybutton = buttons[buttonindex];
	var canvasdims = [buttons[0][0],buttons[0][1]];
	var icondims   = [buttons[0][2],buttons[0][3]];
	var clipoffset = 
	    [icondims[0]*mybutton[1], // left
	     icondims[1]*mybutton[2]]; //top

 	var button = document.createElement("td");
 	var buttonDIV = document.createElement("div");
 	button.appendChild(buttonDIV);
 	buttonDIV.setAttribute("class", "button");
	buttonDIV.setAttribute("id", mybutton[0]);
 	for(var i=0; i<buttonStyles.length; i=i+2)
 		buttonDIV.style.setProperty(buttonStyles[i], buttonStyles[i+1], "");
	buttonDIV.style.setProperty("background-position","-"+clipoffset[0]+"px -"+clipoffset[1]+"px","");
  	return button;
 }

function createSelector(values)
{
	var selectortd = document.createElement("td");
	var selector = document.createElement("select");
	selector.setAttribute("unselectable", "on"); // POST04: seems to have some problem with this: apply selection then try up/down arrows!
	selector.setAttribute("id", values[0]);
	selector.style.setProperty("margin-bottom", "5px", "");

	selector.onchange = ptbSelect;				
	for(var i=1; i<values.length; i++)
	{
		var option = document.createElement("option");
		option.setAttribute("value", values[i]);
		i++;
		option.appendChild(document.createTextNode(values[i]));
		selector.appendChild(option);
	}	
	selectortd.appendChild(selector);
	return selectortd;
}

var formatBlock = new Array("formatBlock",
			    "Format", "Format", 
			    "P", "Paragraph <P>",
			    "H1", "Heading 1 <H1>", 
			    "H2", "Heading 2 <H2>", 
			    "H3", "Heading 3 <H3>", 
			    "H4", "Heading 4 <H4>", 
			    "H5", "Heading 5 <H5>", 
			    "H6", "Heading 6 <H6>", 
			    "BLOCKQUOTE", "Blockquote",
			    "Address", "Address <ADDR>",
			    "PRE", "Pre <PRE>",
				"B", "Bold <B>",
			    "Unformatted", "Unformatted");

var fontFamily = new Array("font-family",
			   "Font", "Font",
			   "serif", "Serif",
			   "Arial", "Arial",
		 	   "Courier", "Courier",
			   "Times", "Times");

var fontSize = new Array("font-size",
			 "Size", "Size",
			 "xx-small", "1",
			 "x-small", "2",
			 "small", "3",
			 "medium", "4",
			 "large", "5",
			 "x-large", "6",
			 "xx-large", "7");

var color = new Array("color",
		      "color", "Color",
		      "rgb(0, 0, 0)", "black",
		      "rgb(255, 255, 255)", "white",
		      "rgb(255, 0, 0)", "red",
		      "rgb(0, 255, 0)", "green",
		      "rgb(0, 0, 255)", "blue",
		      "rgb(255, 255, 0)", "yellow",
		      "rgb(0, 255, 255)", "cyan",
		      "rgb(255, 0, 255)", "magenta");

var backgroundColor = new Array("background-color", // issue: default is "transparent"
				"background-color", "Background",
				"rgb(0, 0, 0)", "black",
				"rgb(255, 255, 255)", "white",
				"rgb(255, 0, 0)", "red",
				"rgb(0, 255, 0)", "green",
				"rgb(0, 0, 255)", "blue",
				"rgb(255, 255, 0)", "yellow",
				"rgb(0, 255, 255)", "cyan",
				"rgb(255, 0, 255)", "magenta");

var selectors = new Array(formatBlock, fontFamily, fontSize, color, backgroundColor);
 
/*
 * Change styles as go over buttons
 *
 * POST04: allow these to be disabled and enabled
 */
function ptbmousedown(event)
{
	this.style.border="inset 1px";
  	event.preventDefault();
}

function ptbmouseup()
{
	this.style.border="outset 1px";
}

function ptbmouseout()
{
	this.style.border="solid 1px #C0C0C0";
}

function ptbmouseover()
{
	this.style.border="outset 1px";
}

/*
 * Activate the toolbar if need be; handle enable/disable from then on
 *
 * POST04: what if user scrolls or tabs out of an editable area?
 * - may need to make disable optional: blogs may not want it to work that way ...
 */
//document.addEventListener("click", toolbarActivate, false);

function toolbarActivate(event)
{
	var target = event.target.parentElement;
	var ptb = document.getElementById("playtoolbar");

	// if not content editable and ptb is enabled then hide the toolbar (watch out
	// for selection within the toolbar itself though!)
	if(!target.userModifiable)
	{
		if(ptbEnabled)
		{
			do
			{
				if(target == ptb)
					break;
				target = target.parentNode;
			} while(target);

			if(!target)
			{
				/*ptb.style.setProperty("display", 'none', '');
				ptbEnabled = false;*/
			}
		}
		return;
	}

	if(!ptbActive)	
	{
		new PTB();
	}
	else if(!ptbEnabled)
	{
		ptb.style.setProperty("display", 'table', '');
		ptbEnabled = true;
	}	

	// possible activate outlining if in editable area ...
}

/*
 * take care of button operations
 */
function ptbbuttonclick()
{
	switch(this.id)
	{
		case "Unlink":
			window.getSelection().clearTextLinks();
			break;

		case 'Link': 
			if(window.getSelection().isCollapsed) // must have a selection or don't prompt
				return;
 	    		var href = prompt("Enter a URL:", "");
			if(href == null) // null href means prompt canceled - BUG FIX FROM Karl Guertin
				return;
			if(href != "") 
				window.getSelection().linkText(href);
			else
				window.getSelection().clearTextLinks();
			break;

		case "Save": 
			mozileSave();
			this.style.border="solid 1px #C0C0C0"; // POST05: generalize this in OO toolbar
			break;

		case 'Bold':
			window.getSelection().toggleTextClass('bold');
			break;
		case 'Italic':
			window.getSelection().toggleTextClass('italic');
			break;
		case 'Underline':
			window.getSelection().toggleTextStyle('text-decoration', 'underline', 'none');			
			break;
		case 'Ordered_List':
			window.getSelection().toggleListLines("OL", "UL");
			break;
		case 'Unordered_List':
			window.getSelection().toggleListLines("UL", "OL");
			break;
		case 'Indent':
			window.getSelection().indentLines();
			break;
		case 'Outdent':
			window.getSelection().outdentLines();
			break;
		case 'Left':
			window.getSelection().styleLines("text-align", "left");
			break;
		case 'Right':
			window.getSelection().styleLines("text-align", "right");
			break;
		case 'Center':
			window.getSelection().styleLines("text-align", "center");
			break;
		case 'Image': // need to replace with native file selection dialog
 	    		var imgref = prompt("Enter the image url or file name:", "");
			if(imgref == null) // null href means prompt canceled
				return;
			if(imgref == "") 
				return; // ok with no name filled in
			var img = documentCreateXHTMLElement("img");
			img.src = imgref; // any way to tell if it is valid?
			window.getSelection().insertNode(img);
			break;
		case 'HR':
			var hr = documentCreateXHTMLElement("hr");
			window.getSelection().insertNode(hr);
			break;
		case 'Create_Table':
			alert("Table insertion coming soon ...");
			break;
		case 'Copy':
			window.getSelection().copy();
			break;
		case 'Cut':
			window.getSelection().cut();
			break;
		case 'Paste':
			window.getSelection().paste();
			break;
	}
}

/*
 * take care of selections
 */
function ptbSelect()
{
	var cursel = this.selectedIndex;

  	if (cursel != 0) 
	{
		var selectName = this.id;
 		var selectValue = this.options[cursel].value;

		if(selectName == "formatBlock")
		{
			if(selectValue == "Unformatted")
				window.getSelection().removeLinesContainer();
			else
				window.getSelection().changeLinesContainer(selectValue,true);
		}
		// others all apply style
		else
			window.getSelection().styleText(selectName, selectValue);

		this.options[0].selected = true; // reset to first option	

		document.getElementById(selectName).blur(); // ensures focus goes back to editable area
	}			
}