function  bxeConfig (filename,fromUrl, configArray) {
	
	var td = new BXE_TransportDriver_http();
	td.Docu = this;
	this.parseUrlParams();
	this.configParams = configArray;
	if (fromUrl) {
		filename = this.urlParams[filename];
	}
	td.load(filename,bxeConfig.parseConfig);
	td.bxeConfig = this;
	return true;
}

bxeConfig.parseConfig = function  (e) {
	var bxe_config = e.currentTarget.td.bxeConfig;
	bxe_config.doc = this;
	var checkParser = this.checkParserError();
	if (checkParser != true) {
		alert(checkParser);
	}
	
	bxe_config.xmlfile = bxe_config.getContent("/config/files/input/file[@name='BX_xmlfile']");
	bxe_config.xslfile = bxe_config.getContent("/config/files/input/file[@name='BX_xslfile']");
	bxe_config.xhtmlfile = bxe_config.getContent("/config/files/input/file[@name='BX_xhtmlfile']");
	bxe_config.validationfile = bxe_config.getContent("/config/files/input/file[@name='BX_validationfile']");
	bxe_config.exitdestination = bxe_config.getContent("/config/files/output/file[@name='BX_exitdestination']");
	
	bxe_config.cssfiles = bxe_config.getContentMultiple("/config/files/css/file");
	bxe_config.scriptfiles = bxe_config.getContentMultiple("/config/files/scripts/file");
	bxe_config.getButtons();
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
			alert("no button definitions found in config.xml");
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
			tmpArray.push(node.getAttribute("col"));
			tmpArray.push(node.getAttribute("row"));
			tmpArray.push(node.getAttribute("action"));
			ns = node.getAttribute("ns");
			if (ns) {
				tmpArray.push(ns);
			}
			this.buttons[node.getAttribute("name")] = tmpArray;
		}
	}
	
	return this.buttons;
	
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
    return this.translateUrl(node);
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
