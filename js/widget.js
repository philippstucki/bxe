function Widget () {}

Widget.prototype.position = function (left, top, position) {
	if (position) {
		this.node.style.position = position;
	}
	this.node.style.left = left + "px";
	this.node.style.top = top + "px";
	
}
Widget.prototype.initNode = function (elementName,className, id) {
	
	var node = document.createElementNS(XHTMLNS,elementName);
	node.setAttribute("class",className);
	if (id) {
		node.setAttribute("id",id);
	}
	node.style.display = "none";
	node.Widget = this;
	this.Display = "inline";
	return node;
}
Widget.prototype.draw = function () {
	this.node.style.display = this.Display;
}

Widget.prototype.hide = function () {

	this.node.style.display = 'none';
}


Widget_AreaInfo.prototype = new Widget();

function Widget_AreaInfo (areaNode) {
	this.node = this.initNode("span","AreaInfoPointer");

	var img = this.node.appendChild(document.createElement("img"));
	img.src = "triangle.png";
	if (areaNode.display == "block") {
		this.Display = 'block';
	} else {
		this.Display = 'inline';
	}
	this.node.style.position = 'relative';
	this.node.style.width = "0px";
	this.node.style.height = "0px";
	areaNode.parentNode.insertBefore(this.node,areaNode);
	this.MenuPopup = new Widget_MenuPopup(areaNode.xmlNode.getXPathString());
	var doo = this.MenuPopup.addMenuItem("View",null);
	var submenu = new Widget_MenuPopup();
	this.NormalModeMenu = submenu.addMenuItem("Normal",function(e) {eDOMEventCall("toggleNormalMode",e.target.Widget.AreaNode )});
	this.NormalModeMenu.AreaNode = areaNode;
	this.NormalModeMenu.Checked = true;
	this.TagModeMenu = submenu.addMenuItem("Tag", function(e) {eDOMEventCall("toggleTagMode",e.target.Widget.AreaNode )});
	this.TagModeMenu.AreaNode = areaNode;
	this.SourceModeMenu = submenu.addMenuItem("Source",function(e) {eDOMEventCall("toggleSourceMode",e.target.Widget.AreaNode )});
	this.SourceModeMenu.AreaNode = areaNode;
	doo.addMenu(submenu);
	
	this.node.addEventListener("contextmenu" , Widget_AreaInfo_eventHandler, false);
	this.node.addEventListener("click" , Widget_AreaInfo_eventHandler, false);
}

function Widget_AreaInfo_eventHandler(e) {
	this.Widget.MenuPopup.position(e.pageX,e.pageY,"absolute");
	this.Widget.MenuPopup.draw();
	//this.Widget.MnuPopup.MenuItems[0].Label = areaNode.xmlNode.getXPathString();
	e.preventDefault(); 
	e.stopPropagation();
}


function Widget_MenuPopup(title) {
	this.node = this.initNode("div","MenuPopup");
	if (title) {
		var titleNode = this.node.appendChild(document.createElement("div"));
		titleNode.setAttribute("class","MenuPopupTitle");
		titleNode.appendChild(document.createTextNode(title));
	}
	document.getElementsByTagName("body")[0].appendChild(this.node);
	this.Display = "block";
	this.MenuItems = new Array();
}

Widget_MenuPopup.prototype = new Widget();

Widget_MenuPopup.prototype.draw = function() {
	
	var glob = mozilla.getWidgetGlobals();
	glob.addHideOnClick(this);
	this.node.style.display = this.Display;

}



Widget_MenuPopup.prototype.addMenuItem = function 	(label,action) {
	var menuitem = new Widget_MenuItem(label,action);
	menuitem.MenuPopup = this;
	this.MenuItems.push(menuitem);
	this.node.appendChild(menuitem.node);
	return menuitem;

}

function Widget_MenuItem(label, action) {
	this.node = this.initNode("div","MenuItem");
	this.node.style.display = "block";
	var anchor = document.createElement("a");
	anchor.onclick = action;
	anchor.setAttribute("href","#");
	//anchor.setAttribute("class","MenuItem");
	//anchor.appendChild();
	this.node.appendChild(document.createTextNode(label));
	this.node.onclick = action;
	this.node.Action = action;
}

Widget_MenuItem.prototype = new Widget();

Widget_MenuItem.prototype.__defineSetter__(
	"Label",
	function(label)
	{
		this.node.firstChild.nodeValue = label;
	}
);

Widget_MenuItem.prototype.__defineGetter__(
	"Label",
	function()
	{
		return this.node.firstChild.nodeValue;
	}
);

Widget_MenuItem.prototype.__defineSetter__(
	"Disabled",
	function(disabled)
	{
		if (disabled) {
			this.node.onclick = null;
			this.node.setAttribute("class","MenuItemDisabled");
		} else {
			this.node.onclick = this.node.Action;
			this.node.setAttribute("class","MenuItem");
		}
	}
);

Widget_MenuItem.prototype.__defineGetter__(
	"Disabled",
	function()
	{ 
		if (this.node.GetAttribute("class") == "MenuItemDisabled") {
			return true;
		} else {
			return false;
		}
	}
);

Widget_MenuItem.prototype.__defineSetter__(
	"Checked",
	function(checked)
	{
		if (checked) {
			this.node.setAttribute("class","MenuItemChecked");
		} else {
			this.node.setAttribute("class","MenuItem");
		}
	}
);

Widget_MenuItem.prototype.__defineGetter__(
	"Checked",
	function()
	{ 
		if (this.node.GetAttribute("class") == "MenuItemChecked") {
			return true;
		} else {
			return false;
		}
	}
);

Widget_MenuItem.prototype.addMenu = function (menu) {
	var img = this.node.appendChild(document.createElement("img"));
	img.src = "triangle.png";
	img.setAttribute("align","right");
	this.node.insertBefore(img,this.node.firstChild);
	this.SubMenu = menu;
	this.node.addEventListener("mouseover",Widget_MenuItem_showSubmenu, false);
	this.node.addEventListener("mouseout",Widget_MenuItem_hideSubmenu, false);	
}

function Widget_MenuItem_showSubmenu() {
	var widget = this.Widget;
	//this.position
	widget.SubMenu.position(widget.node.offsetParent.offsetLeft + widget.node.offsetLeft + widget.node.offsetWidth , widget.node.offsetParent.offsetTop +widget.node.offsetTop    ,"absolute");
	widget.SubMenu.draw();
	if (widget.MenuPopup.OpenSubMenu && widget.MenuPopup.OpenSubMenu  != widget.SubMenu) {
		widget.MenuPopup.OpenSubMenu.hide();
	}
	widget.MenuPopup.OpenSubMenu = widget.SubMenu;
	
}

function Widget_MenuItem_hideSubmenu() {
	//this.Widget.SubMenu.hide();
	
		
	
}

function Widget_Globals () {
	
}

Widget_Globals.prototype.addHideOnClick = function (widget,id) {
	if (!this.HideOnClick) {
		this.HideOnClick = new Array();
	}
	/*
	dump("id: " + id + "\n");
	if (id) {
		this.HideOnClick.push(id);
	} else {
		this.HideOnClick.push("0");
	}*/
	this.HideOnClick.push(widget);
	
	document.addEventListener("click", Widget_Globals_doHideOnClick , true);
	document.addEventListener("contextmenu", Widget_Globals_doHideOnClick ,true);
}



Widget_Globals_doHideOnClick = function(e) {
	var glob = mozilla.getWidgetGlobals();
	document.removeEventListener("click", Widget_Globals_doHideOnClick ,false);
	document.removeEventListener("contextmenu", Widget_Globals_doHideOnClick ,true);
	if( glob.HideOnClick && glob.HideOnClick.length > 0)�{
		var newHideOnClick = new Array();
		var widget = null;
		while (widget = glob.HideOnClick.pop()) 
		{ 
			widget.hide();
		}
		glob.HideOnClick = newHideOnClick;
	}
}


Widget_MenuBar = function () {
	this.node = this.initNode("div","MenuBar");
	document.getElementsByTagName("body")[0].appendChild(this.node);
	this.position(0,0,"absolute");
	this.draw();
}

Widget_MenuBar.prototype = new Widget();

Widget_MenuBar.prototype.addMenu = function (label, submenu) {
	var menu = new Widget_Menu(label);
	this.node.appendChild(menu.node);
	menu.draw();
	menu.addMenuPopup(submenu);
	

}

Widget_Menu = function (label, submenu) {
	this.node = this.initNode("span","Menu");
	this.node.appendChild(document.createTextNode(label));
}

Widget_Menu.prototype = new Widget();

Widget_Menu.prototype.addMenuPopup = function(submenus) {
	var submenu = new Widget_MenuPopup();
	if (submenus) {
		var label = null;
		while (label = submenus.shift() ) {
			submenu.addMenuItem(label, submenus.shift());
		}
	}
	submenu.position(this.node.offsetLeft , this.node.offsetTop + this.node.offsetHeight   ,"absolute");
	this.MenuPopup = submenu;
	this.node.addEventListener("click", function(e) {
		this.Widget.MenuPopup.draw();
		var glob = mozilla.getWidgetGlobals();
		//BX_debug(e);
	
	}, false );
}
//widgets global holder

Moz.prototype.getWidgetGlobals = function () {
	if (this.WidgetGlobals) {
		return this.WidgetGlobals;
	}
	this.WidgetGlobals = new Widget_Globals();
	return this.WidgetGlobals;
}

function Widget_ToolBar () {
 this.node = this.initNode("div","ToolBar");
 var table = document.createElementNS(XHTMLNS,"table");

 this.TableRow =table.appendChild(document.createElementNS(XHTMLNS,"tr"));
 this.node.appendChild(table);
 this.Display = "block";
 this.node.appendToBody();
 
}

Widget_ToolBar.prototype = new Widget();

Widget_ToolBar.prototype.addButtons = function ( buttons) {
	
	for (but in buttons) {
		if (but != "Dimension") {
			var button = new Widget_ToolBarButton(but);
			this.addItem(button);	
		}
	}
	
	
}
Widget_ToolBar.prototype.addItem = function(item) {
	var td = document.createElementNS(XHTMLNS,"td");
	//td.appendChild(document.createTextNode("blabl jkfaslj jklfjsad kl�j kljsdfa a�la"));

	td.appendChild(item.node);
	this.TableRow.appendChild(td);
	item.draw();
	}
	
	

function Widget_MenuList(id, event) {
	this.node= document.createElementNS(XHTMLNS,"select");
	if (event) {
		this.node.addEventListener("change", event, false);
	}
	this.Display="block";
}

Widget_MenuList.prototype = new Widget();

Widget_MenuList.prototype.appendItem = function(label, value) {
	var option = document.createElementNS(XHTMLNS,"option");
	option.text = label;
	option.value = value
	this.node.appendChild(option);
}
	

function Widget_ToolBarButton (id) {
 this.node = this.initNode("div","ToolBarButton",id);
 this.node.setAttribute("title",id);
 this.Display = "block";
 var col =  buttons[id][0];
 var row =  buttons[id][1];

	var clipoffset = 
	    [buttons['Dimension'][2]*col, // left
	     buttons['Dimension'][3]*row]; //top

	this.node.style.setProperty("background-image","url("+buttonImgLoc+")","");
	this.node.style.setProperty("background-position","-"+clipoffset[0]+"px -"+clipoffset[1]+"px","");
	this.node.addEventListener("mousedown",function(e) {this.style.border="inset 1px"}, false);
	this.node.addEventListener("mouseup",function(e) {this.style.border="outset 1px"}, false);
	this.node.addEventListener("mouseout",function(e) {this.style.border="solid 1px #C0C0C0"}, false);
	this.node.addEventListener("mouseover",function(e) {this.style.border="outset 1px"}, false);
	this.node.addEventListener("click",function(e) { eDOMEventCall(buttons[id][2],document,this.getAttribute("title"))}, false);
}	

Widget_ToolBarButton.prototype = new Widget();

Element.prototype.appendToBody = function() {
	document.getElementsByTagName("body")[0].appendChild(this);
}
 
// image should be in the same directory as this file. This file is in mozile_root_dir. The loader
// sets this constant.
/*const buttonImgLoc = mozile_root_dir + "/buttons.png";
var preloadthebutton = new Image();
preloadthebutton.src = buttonImgLoc;
*/
