function Widget () {}

Widget.prototype.position = function (left, top, position) {
	if (position) {
		this.node.style.position = position;
	}
	this.node.style.left = left + "px";
	this.node.style.top = top + "px";
	
}



Widget.prototype.initNode = function (elementName,className, id) {
	
	var node = document.createElement(elementName);
	node.setAttribute("class",className);
	if (id) {
		node.setAttribute("id",id);
	}
	node.style.display = "none";
	node.Widget = this;
	this.Display = "inline";
	return node;
}
Widget.prototype.draw = function (display) {
	if (display) {
		this.node.style.display = display;
	} else {
		this.node.style.display = this.Display;
	}
}

Widget.prototype.hide = function () {

	this.node.style.display = 'none';
}


Widget_AreaInfo.prototype = new Widget();

function Widget_AreaInfo (areaNode) {
	this.node = this.initNode("span","AreaInfoPointer");

	var img = this.node.appendChild(document.createElement("img"));
	img.src = mozile_root_dir + "images/triangle.png";
	if (areaNode.display == "block") {
		this.Display = 'block';
	} else {
		this.Display = 'inline';
	}
	this.node.style.position = 'relative';
	this.node.style.width = "0px";
	this.node.style.height = "0px";
	areaNode.parentNode.insertBefore(this.node,areaNode);
	this.MenuPopup = new Widget_MenuPopup(areaNode.XMLNode._xmlnode.getXPathString());
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
	//this.Widget.MnuPopup.MenuItems[0].Label = areaNode.XMLNode._xmlnode.getXPathString();
	e.preventDefault(); 
	e.stopPropagation();
}


function Widget_MenuPopup(title) {
	this.node = this.initNode("div","MenuPopup");
	if (title) {
		this.initTitle(title)
	}
	document.getElementsByTagName("body")[0].appendChild(this.node);
	this.Display = "block";
	this.MenuItems = new Array();
}

Widget_MenuPopup.prototype = new Widget();

Widget_MenuPopup.prototype.initTitle = function (title) {
	var titleNode = this.node.appendChild(document.createElement("div"));
	titleNode.setAttribute("class","MenuPopupTitle");
	titleNode.appendChild(document.createTextNode(title));
}

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

Widget_MenuPopup.prototype.removeAllMenuItems = function () {
	this.node.removeAllChildren();
}

function Widget_MenuItem(label, action) {
	this.node = this.initNode("div","MenuItem");
	this.node.style.display = "block";
	var anchor = document.createElement("a");
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
	img.src = mozile_root_dir+ "images/triangle.png";
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
	if( glob.HideOnClick && glob.HideOnClick.length > 0) {
		var newHideOnClick = new Array();
		var widget = null;
		while (widget = glob.HideOnClick.pop()) 
		{ 
			widget.hide();
		}
		glob.HideOnClick = newHideOnClick;
	}
}


function Widget_MenuBar()  {
	this.node = this.initNode("div","MenuBar");
	document.getElementsByTagName("body")[0].appendChild(this.node);
	this.position(0,0,"fixed");
	this.draw();
}

Widget_MenuBar.prototype = new Widget();

Widget_MenuBar.prototype.addMenu = function (label, submenu) {
	var menu = new Widget_Menu(label);
	this.node.appendChild(menu.node);
	menu.draw();
	menu.addMenuPopup(submenu);
	

}

function Widget_Menu (label, submenu) {
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
	submenu.position(this.node.offsetLeft + 5, this.node.offsetTop + this.node.offsetHeight   ,"absolute");
	this.MenuPopup = submenu;
	this.node.addEventListener("click", function(e) {
		this.Widget.MenuPopup.draw();
		var glob = mozilla.getWidgetGlobals();
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
 var table = document.createElement("table");

 this.TableRow =table.appendChild(document.createElement("tr"));
 this.node.appendChild(table);
 this.Display = "block";
 this.node.appendToBody();
 
}

Widget_ToolBar.prototype = new Widget();

Widget_ToolBar.prototype.addButtons = function ( buttons) {
	
	for (but in buttons) {
		if (but != "Dimension") {
			var button = new Widget_ToolBarButton(but,buttons[but][3]);
			this.addItem(button);	
		}
	}
	
	
}
Widget_ToolBar.prototype.addItem = function(item) {
	var td = document.createElement("td");
	td.appendChild(item.node);
	this.TableRow.appendChild(td);
	item.draw();
	}
	
	

function Widget_MenuList(id, event) {
	this.node= document.createElement("select");
	if (event) {
		this.node.addEventListener("change", event, false);
	}
	this.Display="block";
}

Widget_MenuList.prototype = new Widget();

Widget_MenuList.prototype.appendItem = function(label, value) {
	var option = document.createElement("option");
	option.text = label;
	option.value = value
	this.node.appendChild(option);
}
	

function Widget_ToolBarButton (id,namespaceURI) {
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
	this.node.addEventListener("mousedown",function(e) {this.style.border="solid 1px"}, false);
	this.node.addEventListener("mouseup",function(e) {this.style.border="dotted 1px"}, false);
	this.node.addEventListener("mouseout",function(e) {this.style.border="dotted 1px #C0C0C0"}, false);
	this.node.addEventListener("mouseover",function(e) {this.style.border="dotted 1px"}, false);
	this.node.ElementNamespaceURI = namespaceURI;
	this.node.addEventListener("click",function(e) { 
	eDOMEventCall(buttons[id][2],document,{"localName":this.getAttribute("title"),"namespaceURI":e.target.ElementNamespaceURI})}, 
		false);
}	

Widget_ToolBarButton.prototype = new Widget();

Element.prototype.appendToBody = function() {
	document.getElementsByTagName("body")[0].appendChild(this);
}

function Widget_AboutBox() {
	var width = "400";
	var height = "180";
	this.node = this.initNode("div","AboutBox");
	this.Display = "block";
	this.node.appendToBody();
	this.node.style.width = width + "px";
	this.node.style.height = height + "px";
	this.position((window.innerWidth- width)/2,(window.innerHeight-height)/3,"absolute");
	this.node.onclick = function(e) { this.style.display = 'none';}
	var htmltext = "<a href='http://bitfluxeditor.org' target='_new'>http://bitfluxeditor.org</a> <br/> Version: " + BXE_VERSION;
	htmltext += "<br/><br/> Based on <a href='http://mozile.mozdev.org' target='_new'>Mozile</a>";
	
	var abouttext = this.node.innerHTML = htmltext;
	var textdiv = document.createElement("div");
	this.TextNode = document.createTextNode(" ");
	textdiv.appendChild(this.TextNode);
	this.node.appendChild(textdiv );
	textdiv.style.top = (height - 84 ) + "px";;
	textdiv.style.position = "relative";
	this.draw();
	
}
 

Widget_AboutBox.prototype = new Widget();

Widget_AboutBox.prototype.setText = function(text) {
	this.TextNode.data = text;
}

Widget_AboutBox.prototype.addText = function(text) {
	this.TextNode.data =this.TextNode.data + " " + text;
	if ( this.TextNode.data.length  > 60) {
		this.TextNode.data = "..." + this.TextNode.data.substr(this.TextNode.data.length - 60);
	}
}


function Widget_StatusBar () {
	this.node = this.initNode("div","StatusBar","StatusBar");
	this.node.appendToBody();
	this.positionize();
	window.onresize = this.positionize;
	this.Display  = "block";
	this.EditAttributes = new Widget_ModalAttributeBox();
	this.buildXPath(bxe_globals.xmldoc.documentElement);
	
	this.draw();	
}



Widget_StatusBar.prototype = new Widget();

Widget_StatusBar.prototype.positionize = function (e) {
	// it's an event, do nothing...
	if (e) {
		
	} else {
		target = this;
	}
	target.position(0,window.innerHeight - 20,"fixed");
}

Widget_StatusBar.prototype.buildXPath = function (node) {

	node = node.XMLNode;
	this.node.removeAllChildren();
	
	
	this.Popup = new Widget_MenuPopup();
	
	this.Popup.position(0,0,"absolute");
	this.Popup.StatusBar = this;
	
	while(node && node.nodeType == 1) {
		
		var rootNode = document.createElement("span");
		rootNode.appendChild(document.createTextNode(node.nodeName));
		this.node.insertBefore(rootNode,this.node.firstChild);
		if (node._htmlnode) {
			rootNode._htmlnode = node._htmlnode;
			rootNode.addEventListener("mouseover",Widget_XPathMouseOver,false);
			rootNode.addEventListener("mouseout",Widget_XPathMouseOut,false);
		}
		rootNode.Widget = this;
		rootNode.addEventListener("click", function(e) {
			this.Widget.buildPopup(this);
		}, false );
		rootNode.XMLNode = node;
		node = node.parentNode;
	}

}

Widget_StatusBar.prototype.buildPopup = function (node) {
		this.Popup.removeAllMenuItems();
		this.Popup.initTitle(node.XMLNode.localName);
		if (node.XMLNode.attributes.length > 0 ) {
			var menui = this.Popup.addMenuItem("Edit Attributes..", this.EditAttributes.show);
			menui.Modal = this.EditAttributes;
		}
		var ac = node.XMLNode._xmlnode.allowedChildren;
		for (i = 0; i < ac.length; i++) {
			this.Popup.addMenuItem("Add " + ac[i], null);
		}
		this.Popup.draw();
		this.Popup.position(node.offsetParent.offsetLeft +node.offsetLeft + window.scrollX, window.scrollY + node.offsetParent.offsetTop + node.offsetTop -this.Popup.node.offsetHeight ,"absolute");
		this.Popup.draw();
		this.Popup._node = node;
}

function Widget_ContextMenu () {
	this.Popup = new Widget_MenuPopup();
	this.Popup.position(0,0,"absolute");
	this.Popup.ContextMenu = this;
}

Widget_ContextMenu.prototype = new Widget();

Widget_ContextMenu.prototype.show = function(e,node) {
	this.buildPopup(e,node);
}

Widget_ContextMenu.prototype.buildPopup = function (e,node) {
	this.Popup.removeAllMenuItems();
	this.Popup.initTitle(node.XMLNode.localName);
	if (node.XMLNode.attributes.length > 0 && this.EditAttributes) {
		var menui = this.Popup.addMenuItem("Edit Attributes..", this.EditAttributes.show);
		menui.Modal = this.EditAttributes;
	}
	var sel  = window.getSelection();
	var cssr = sel.getEditableRange();
	var ip = documentCreateInsertionPoint(cssr.top, cssr.startContainer, cssr.startOffset);
	var ac = node.XMLNode._xmlnode.allowedChildren;
	for (i = 0; i < ac.length; i++) {
			var menui = this.Popup.addMenuItem("Add " + ac[i], function(e) { 
				var widget = e.currentTarget.Widget;
				var sel = window.getSelection();
				sel.removeAllRanges();
				var rng = widget.Cssr.cloneRange();
				sel.addRange(rng);
				eDOMEventCall("toggleTextClass",document,{"localName":widget.InsertLocalName,"namespaceURI":widget.InsertNamespaceURI})
		});
		menui.Cssr = cssr;
		menui.InsertLocalName = ac[i];
		menui.InsertNamespaceURI;
			
	}
	this.Popup.position(e.pageX, e.pageY, "absolute");
	this.Popup.draw();
	this.Popup._node = node;
}


function Widget_ModalBox () {
	this.node = this.initNode("div","ModalBox");
	this.Display = "block";
	
}

Widget_ModalBox.prototype = new Widget();

Widget_ModalBox.prototype.initTitle = function(title) {
	var titeldiv = document.createElement("div");
	titeldiv.setAttribute("class","ModalBoxTitle");
	titeldiv.appendChild(document.createTextNode(title));
	this.node.appendChild(titeldiv);
	this.TitleNode = titeldiv;
}

Widget_ModalBox.prototype.initPane = function() {
	var panenode = document.createElement("div");
	panenode.setAttribute("class","ModalBoxPane");
	this.node.appendChild(panenode);
	this.PaneNode = panenode;
}

Widget_ModalBox.prototype.setTitle = function(text) {
	this.TitleNode.firstChild.data = text;
	
}
function Widget_ModalAttributeBox(node) {
	
	this.node = this.initNode("div","ModalBox");
	this.Display = "block";
	this.node.appendToBody();
	this.position(100,100,"absolute");
	this.initTitle("Edit Attributes");
	this.initPane();
}

Widget_ModalAttributeBox.prototype = new Widget_ModalBox();

Widget_ModalAttributeBox.prototype.setNode = function() {
	this.htmlnode = node;
}

Widget_ModalAttributeBox.prototype.show = function(e) {
	
	var box = e.target.Widget.Modal; 
	var xmlnode = e.target.Widget.MenuPopup._node.XMLNode;
	box.position(e.pageX,e.pageY,"absolute");
	box.drawAttributes(xmlnode);

	box.setTitle("Edit Attributes of " + xmlnode.localName );
	box.draw();
	box.position(e.pageX ,e.pageY -  box.node.offsetHeight,"absolute");
	box.draw();
	//target.position(e.target.offsetParent.offsetLeft +e.target.offsetLeft , e.target.offsetParent.offsetTop + e.target.offsetTop - e.target.offsetHeight  + 5,"absolute");
}

Widget_ModalAttributeBox.prototype.drawAttributes = function(xmlnode) {
	var attr = xmlnode.attributes;
	var text = "";
	this.PaneNode.removeAllChildren();
	var table = document.createElement("table");
	this.PaneNode.appendChild(table);
	for (var i = 0; i < attr.length; i++) {
		var tr = document.createElement("tr");
		table.appendChild(tr);
		var td = document.createElement("td")
		td.appendChild(document.createTextNode(attr[i].localName));
		tr.appendChild(td);
		var tdt = document.createElement("td");
		var textfield = document.createElement("input");
		textfield.value = attr[i].value;
		tdt.appendChild(textfield);
		tr.appendChild(tdt);
		
	}
	var subm = document.createElement("input");
	subm.setAttribute("type","submit");
	subm.setAttribute("value","OK");
	subm.onclick = function(e) {
		var Widget = e.target.parentNode.parentNode.Widget;
		Widget.setAttributes(xmlnode);
		e.target.parentNode.parentNode.style.display = "none";
	}
	var cancel = document.createElement("input");
	cancel.setAttribute("type","submit");
	cancel.setAttribute("value","Cancel");
	cancel.onclick = function(e) { e.target.parentNode.parentNode.style.display = "none";}
	this.PaneNode.appendChild(subm);
	this.PaneNode.appendChild(cancel);
	//alert(text);
}

Widget_ModalAttributeBox.prototype.setAttributes = function(xmlnode) {
	var trs = this.PaneNode.getElementsByTagName("tr");
	for (var i = 0; i < trs.length; i++) {
		attrName = trs[i].firstChild.firstChild.data;
		attrValue = trs[i].firstChild.nextSibling.firstChild.value;
		xmlnode.setAttribute(attrName, attrValue);
	}
}
function Widget_XPathMouseOver (e) {
	dump (e.currentTarget._htmlnode + "\n");
	e.currentTarget._htmlnode.setAttribute("__bxe_highlight","true");
}
function Widget_XPathMouseOut (e) {
	e.currentTarget._htmlnode.removeAttribute("__bxe_highlight");
}


	
// image should be in the same directory as this file. This file is in mozile_root_dir. The loader
// sets this constant.
/*const buttonImgLoc = mozile_root_dir + "/images/buttons.png";
var preloadthebutton = new Image();
preloadthebutton.src = buttonImgLoc;
*/
