
/**
* @file
* Implements the http TransportDriver 
*
*/

function mozileTransportDriver_http () {

	/**
	* XMLHttpRequest Object
	*
	* We use the same XMLHttpRequest in the whole instance
	* @type Object
	*/
	
}

/*
* Loads a file over http get
* @tparam String filename the filename (can be http://... or just a relative path
*/

mozileTransportDriver_http.prototype.load = function(filename, td, async) {
	if (typeof async == "undefined") {
		async = true;
	}
	var docu = document.implementation.createDocument("","",null);
	docu.loader = this.parent;
	docu.td = td;
	bxe_config.td = td;
	docu.onload = this.loadCallback;
	
	docu.async = async;
	try {
		docu.load(filename);
	}
	catch (e) {
		var reqObj = new Object();
		reqObj.document = docu;
		reqObj.isError = true;
		reqObj.status = 404;
		reqObj.statusText = filename + " could not be loaded\n" + e.message;
		td.loadCallback(reqObj);
	}
	return docu;
}

mozileTransportDriver_http.prototype.loadCallback = function (e) {
	var reqObj = new Object();
	reqObj.document = e.currentTarget;
	reqObj.isError = false;
	reqObj.status = 200;
	reqObj.statusText = "OK";
	var td = e.currentTarget.td;
	if (!td) {
		debug("td was not in e.currentTarget!!! Get it from global var");
		td = bxe_config.td;
	}
	td.loadCallback(reqObj);
}



/**
* Save a file over http post. It just posts the whole xml file without variable
* assignment (in PHP you have to use $HTTP_RAW_POST_DATA or php://input for getting the content)
*/

mozileTransportDriver_http.prototype.save = function(filename, content, td)
{
	this.p = new XMLHttpRequest();
	this.p.onload = this.saveCallback;
	this.p.td = td;
	this.p.open("POST",filename );
	this.p.send(content,true);
}

mozileTransportDriver_http.prototype.saveCallback = function (e) {
	var p = e.currentTarget;
	var td = p.td;
	var reqObj = new Object();
	// status code = 204, then it's ok
	if (p.status == 204) {
		reqObj.document = p.responseXML;
		reqObj.isError = false;
		reqObj.status = 200;
		reqObj.statusText = "OK";
	} 
	else if (p.status == 201) {
		reqObj.document = p.responseXML;
		reqObj.isError = false;
		reqObj.status = 201;
		reqObj.statusText = "Created";
	}
	else if (p.responseXML) {
		reqObj = td.parseResponseXML(p.responseXML, p.status);
	} else {
		reqObj = td.parseResponseText(p.responseText, p.status);
	}
	reqObj.originalStatus = p.status;
	reqObj.originalStatusTest = p.statusText;
	td.saveCallback(reqObj);
}




