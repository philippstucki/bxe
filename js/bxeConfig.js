function  bxeConfig (filename,fromUrl) {
	
	var td = new BXE_TransportDriver_http();
	td.Docu = this;
	this.parseUrlParams();
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
	config_loaded(bxe_config);
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
	

    if (node.getAttribute("isParam") == "true")
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
    node = result.iterateNext();
    return this.translateUrl(node);
}


bxeConfig.prototype.parseUrlParams = function () {
	this.urlParams = new Array ();
    var params = window.location.search.substring(1,window.location.search.length).split("&");
    var i = 0;
    for (var param in params)
    {
        var p = params[param].split("=");
        this.urlParams[p[0]] = p[1];
    }
}
