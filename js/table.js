// +----------------------------------------------------------------------+
// | Bitflux Editor                                                       |
// +----------------------------------------------------------------------+
// | Copyright (c) 2001,2002 Bitflux GmbH                                 |
// +----------------------------------------------------------------------+
// | This software is published under the terms of the Apache Software    |
// | License a copy of which has been included with this distribution in  |
// | the LICENSE file and is available through the web at                 |
// | http://bitflux.ch/editor/license.html                                |
// +----------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>                        |
// +----------------------------------------------------------------------+
//
// $Id: table.js,v 1.4 2003/09/14 10:33:17 chregu Exp $


HTMLTableCellElement.prototype.TableAppendRow = function () {
	var newRow = this.parentNode.cloneNode(true);
	this.parentNode.parentNode.insertAfter(newRow,this.parentNode);
}

HTMLTableCellElement.prototype.TableAppendCol = function () {
	var pos = this.findPosition();
	var table = this.parentNode.parentNode;
	var row = table.firstChild;
	var colpos = 1;
	while (row) {
		if (row.nodeType == 1) {
			if ( row.localName.toLowerCase() == "tr") {
				var cell = row.firstChild;
				var nextpos = 1;
				
				while (cell) {
					if (cell.nodeType == 1 && cell.localName.toLowerCase() == "td") {
						if (nextpos >= pos) {
							var newtd = document.createElementNS(XHTMLNS,"td");
							newtd.appendChild(document.createTextNode(STRING_NBSP));
							row.insertBefore(newtd,cell.nextSibling);
							break;
						}
						if (cell.hasAttribute("colspan")) {
							nextpos += parseInt( cell.getAttribute("colspan"));
						} else {
							nextpos++;
						}
						
						
					}
					cell = cell.nextSibling;
				}
				
			} else if ( row.localName.toLowerCase() == "col") {
				dump (colpos + " ==  " + pos + "\n");
				if (colpos == pos) {
					
					table.insertBefore(document.createElementNS(XHTMLNS, "col"),row.nextSibling);
				}
				colpos++;
			}
		}
		
		row = row.nextSibling;
	}
	
}

HTMLTableCellElement.prototype.findPosition = function () {
	// find position
	var prevSibling = this.previousSibling;
	var pos = 1;
	while(prevSibling) {
		if (prevSibling.nodeType == 1 && prevSibling.localName.toLowerCase() == "td") {
			if (prevSibling.hasAttribute("colspan")) {
				pos += parseInt( prevSibling.getAttribute("colspan"));
			} else {
				pos++;
			}
		}
		prevSibling = prevSibling.previousSibling;
	}
	return pos;
}

HTMLTableCellElement.prototype.TableCellMergeRight = function () {
	var nextSibling = this.nextSibling;
	while (nextSibling && nextSibling.nodeType != 1) {
		nextSibling = nextSibling.nextSibling;
	}
	var child = nextSibling.firstChild;
	while (child) {
		this.appendChild(child);
		child = child.nextSibling;
	}
	this.normalize();
	nextSibling.parentNode.removeChild(nextSibling);
	var colspan = this.getAttribute("colspan");
	if (!colspan) {
		colspan = 1;
	}
	this.setAttribute("colspan", colspan+1);
}



HTMLTableCellElement.prototype.TableCellMergeDown = function () {
	
	var pos = this.findPosition();
	var thisRowspan = 1;
	if (this.hasAttribute("rowspan")) {
		thisRowspan = this.getAttribute("rowspan");
	}
	this.setAttribute("rowspan",thisRowspan+1);	
	
	// find the same cell in the row below..
	var tr = null;
	// find next Row
	
	var nextSibling = this.parentNode.nextSibling
	while(nextSibling) {
		if (nextSibling.nodeType == 1 && nextSibling.localName.toLowerCase() == "tr") {
			tr = nextSibling;
			break;
		}
		nextSibling = nextSibling.nextSibling;
	}
	
	if (!tr) {
		alert("no next table row found");
		return;
	}
	
	nextSibling = tr.firstChild;
	var nextpos = 1;
	while(nextSibling) {
		if (nextSibling.nodeType == 1 && nextSibling.localName.toLowerCase() == "td") {
			if (nextSibling.hasAttribute("colspan")) {
				nextpos += parseInt( nextSibling.getAttribute("colspan"));
			} else {
				nextpos++;
			}
			if (nextpos > pos) {
				break;
			}
		}
		nextSibling = nextSibling.nextSibling;
	}
	
	
	var child = nextSibling.firstChild;
	while (child) {
		this.appendChild(child);
		child = child.nextSibling;
	}
	this.normalize();
	tr.removeChild(nextSibling);
}

HTMLTableCellElement.prototype.TableCellSplit = function () {
	
	var cssr = window.getSelection().getEditableRange();
	var ip = documentCreateInsertionPoint(cssr.top, cssr.startContainer, cssr.startOffset);
	ip.splitContainedLine();

	var colspan = this.getAttribute("colspan");
	if (colspan > 2) {
		this.setAttribute("colspan", colspan-1);
	} else {
		this.removeAttribute("colspan");
	}
	var nextSibling = this.nextSibling;
	while (nextSibling && nextSibling.nodeType != 1) {
		nextSibling = nextSibling.nextSibling;
	}
	if (nextSibling) {
		nextSibling.reomveAttribute("colspan");
	}
	
}



