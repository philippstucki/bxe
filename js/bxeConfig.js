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

const OPTION_DEFAULTTABLECLASS = "defaultTableClass";
const MATHMLNS = "http://www.w3.org/1998/Math/MathML";

function  bxeConfig (filename,fromUrl, configArray) {
	
	var td = new mozileTransportDriver("http");
	//td.Docu = this;
	this.parseUrlParams();
	this.configParams = configArray;
	if (fromUrl) {
		filename = this.urlParams[filename];
	}
	bxe_about_box.addText(" (" + filename + ") ...");
	td.bxeConfig = this;
	try {
		debug("td.load " + filename);
		td.load(filename, bxeConfig.parseConfig, false);
	} catch(e) { bxe_catch_alert(e);}
	return true;
	
}

	
bxeConfig.parseConfig = function  (e) {
	
	if (e.isError) {
		alert("Error loading config file \n"+e.statusText);
		return false;
	} 
	if (e.document.documentElement.nodeName != "config") {
		alert("doesn't look like a BXE config file.\n Here's the full output:\n "+ e.document.saveXML(e.document));
		return false;
	}
		
		
	bxe_about_box.addText("Config Loaded");
	var bxe_config = e.td.bxeConfig;
	bxe_config.doc = e.document;
	
	bxe_config.xmlfile = bxe_config.getContent("/config/files/input/file[@name='BX_xmlfile']");
	bxe_config.xslfile = bxe_config.getContent("/config/files/input/file[@name='BX_xslfile']");
	bxe_config.xhtmlfile = bxe_config.getContent("/config/files/input/file[@name='BX_xhtmlfile']");
	bxe_config.validationfile = bxe_config.getContent("/config/files/input/file[@name='BX_validationfile']");
	bxe_config.exitdestination = bxe_config.getContent("/config/files/output/file[@name='BX_exitdestination']");
	
	bxe_config.cssfiles = bxe_config.getContentMultiple("/config/files/css/file");
	bxe_config.scriptfiles = bxe_config.getContentMultiple("/config/files/scripts/file");
	
	var ps = bxe_config.getPlugins();
	 
	for (var i=0; i < ps.length; i++) {
		bxe_config.scriptfiles.push("plugins/" + ps[i] + ".js");
	}
	
	var dSIC = bxe_config.doc.evaluate("/config/context[@type='dontShow']/element", bxe_config.doc, null, 0, null); 
	
	bxe_config.dontShowInContext = new Array();
	node = dSIC.iterateNext();
	while (node) {
		bxe_config.dontShowInContext[node.getAttribute("ns")+":"+node.getAttribute("name")] = true;
		node = dSIC.iterateNext();
	}
	
	var dSIC = bxe_config.doc.evaluate("/config/context[@type='dontShow']/attribute", bxe_config.doc, null, 0, null); 
	
	bxe_config.dontShowInAttributeDialog = new Array();
	node = dSIC.iterateNext();
	while (node) {
		bxe_config.dontShowInAttributeDialog[node.getAttribute("name")] = true;
		node = dSIC.iterateNext();
	}
	
	
	var callbackNodes = bxe_config.doc.evaluate("/config/callbacks/element", bxe_config.doc, null, 0, null);
	bxe_config.callbacks = new Array();
	
	node = callbackNodes.iterateNext();

	while (node) {
		var tmpArray = new Array();
		tmpArray["type"] = node.getAttribute("type");
		tmpArray["precheck"] = node.getAttribute("precheck");
		tmpArray["content"] = node.firstChild.data;
		bxe_config.callbacks[node.getAttribute("ns")+":"+node.getAttribute("name")] = tmpArray;
		node = callbackNodes.iterateNext();
	}

	var configOptions = bxe_config.doc.evaluate("/config/options/option", bxe_config.doc, null, 0, null);
	bxe_config.options = new Array();
	
	bxe_config.options[OPTION_DEFAULTTABLECLASS] = 'ornate';
	node = configOptions.iterateNext();

	while (node) {
		// ignore the attribute namespace
		bxe_config.options[node.getAttribute("name")] = node.firstChild.data;
		node = configOptions.iterateNext();
	}
	config_loaded(bxe_config);
}

bxeConfig.prototype.getButtons = function() {
	
	if (!this.buttons) {
		this.buttons = new Array();
		var node;
		var tmpArray = new Array();
		
		// get dimensions
		var result = this.doc.evaluate("/config/buttons/dimension", this.doc, null, 0, null);
		node = result.iterateNext();
		if (!node) {
			alert("no button definitions found in config.xml\nYour config.xml looks like this:\n" + this.doc.saveXML());
		}
		tmpArray.push(node.getAttribute("width"));
		tmpArray.push(node.getAttribute("height"));
		tmpArray.push(node.getAttribute("buttonwidth"));
		tmpArray.push(node.getAttribute("buttonheight"));
		
		this.buttons["Dimension"] = tmpArray;
		
		var result = this.doc.evaluate("/config/buttons/button", this.doc, null, 0, null);
		
		var i = 0;
		var ns;
		while (node = result.iterateNext())
		{
			tmpArray = new Array();
			tmpArray['col'] = node.getAttribute("col");
			tmpArray['row'] = node.getAttribute("row");
			tmpArray['action'] = node.getAttribute("action");
			tmpArray['type'] = node.getAttribute("type");
			ns = node.getAttribute("ns");
			if (ns !== null) {
				tmpArray['ns'] = ns;
			}
			else {
				tmpArray['ns'] = "";
			} 
			if(node.firstChild) {
				tmpArray['data'] = node.firstChild.data;
			}
			this.buttons[node.getAttribute("name")] = tmpArray;
		}
	}
	
	return this.buttons;
	
}

bxeConfig.prototype.getPlugins = function () {
	if (!this.plugins) {
		this.plugins = new Array();
		this.pluginOptions = new Array();
		var head = document.getElementsByTagName("head")[0];
		var result = this.doc.evaluate("/config/plugins/plugin", this.doc, null, 0, null);
		while (node = result.iterateNext()) {
			this.plugins.push(node.getAttribute("name"));
			this.pluginOptions[node.getAttribute("name")] = new Array();
			var options = this.doc.evaluate("option", node, null, 0, null);
			while (onode = options.iterateNext()) {
				this.pluginOptions[node.getAttribute("name")][onode.getAttribute("name")] = onode.firstChild.data;
			}
		}
	}
	return this.plugins;
}

bxeConfig.prototype.getPluginOptions = function(plugin) {
	if (!this.plugins) {
		this.getPlugins();
	}
	return this.pluginOptions[plugin];
}

bxeConfig.prototype.getContentMultiple = function (xpath)
{
    var result = this.doc.evaluate(xpath, this.doc, null, 0, null);
    var node;
    var resultArray = new Array();
    var i = 0;
    while (node = result.iterateNext())
    {
        resultArray[i] = this.translateUrl(node);
        i++;
    }
    return resultArray;

}


bxeConfig.prototype.translateUrl = function (node)
{
    var url;
	
	try {
		if (node.nodeType != 1) { //if nodeType is not a element (==1) return right away}
			return node.value;	
		}
	}
	catch (e) {
		return "";
	}
	
	if (node.getAttribute("isConfigParam") == "true") {
		 url = this.configParams[node.firstChild.data];
	}
    else if (node.getAttribute("isParam") == "true")
    {
        url = this.urlParams[node.firstChild.data];
    }
    else
    {
        url = node.firstChild.data;
    }
	
	//replace {BX_root_dir} with the corresponding value;
	
	//url = url.replace(/\{BX_root_dir\}/,BX_root_dir);
    if (node.getAttribute("prefix"))
    {
        url = node.getAttribute("prefix") + url;
    }
    return url;
}


bxeConfig.prototype.getContent= function (xpath)
{
    var result = this.doc.evaluate(xpath, this.doc, null, 0, null);
    var node = result.iterateNext();

	if (!node) {
		return null;
	} else {
		return this.translateUrl(node);
	}
}


bxeConfig.prototype.parseUrlParams = function () {
	this.urlParams = new Array ();
    var params = window.location.search.substring(1,window.location.search.length).split("&");
    var i = 0;
    for (var param in params)
    {
        var p = params[param].split("=");
		if (typeof p[1] != "undefined") {
			this.urlParams[p[0]] = p[1];
		} 
    }
}
