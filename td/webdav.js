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
// $Id: webdav.js,v 1.7 2003/09/08 06:37:55 chregu Exp $
/**
* @file
* Implements the http TransportDriver 
*
*/

/**
* http TransportDriver
* @ctor
* The constructor
* @tparam Object parent the "parent" Object (the loader)
* @see BXE_TransportDriver
*/
function BXE_TransportDriver_webdav (parent)
{
	
	this.p = new DavClient();
	/**
	* Parent Object
	*
	* This is normally the BXE_loader class
	* this has to be implemented with xbBrowser some day:
	* @type Object
	*/
	//check doku, if we can access parent otherwise
	this.parent = parent;
}

/*
* Loads a file over http get
* @tparam String filename the filename (can be http://... or just a relative path
* @tparam Function callback the function which is called after loading
* @treturn XMLDocument newly created xml document
*/

BXE_TransportDriver_webdav.prototype.load = function(filename, callback) {
	//docu.loader = this.parent;
	this.p.request.td = this;
	if (callback) {
		this.p.request.onload = callback;	
	}
	else {
		//this seems to be a static call, therefore we needed
		// the docu.loader aboive... have to check, how it's done in JS correctly
		this.p.request.onload = this.parent.xmlloaded;  // set the callback when we are done loading
	}
	this.p.td = this;
	this.p.GET(filename);
	
	//return docu;
	
}

/**
* Handles the response of the save method.
* This method is called, when the POST request from save has finished
* It displays a message, if it succeeded or failed
*
* @tparam Event e the event triggered after save
* @treturn void Nothing
*/

BXE_TransportDriver_webdav.prototype._responseXML = function(e) {
	
	var p = e.target;
	var alerttext="";
	if (p.status == 204) {
		alert("Save succeeded");
	}
	
	else if (p.responseXML) {
		if (p.responseXML.firstChild.nodeName == 'parsererror')
		{
			alerttext="Something went wrong during parsing of the response:\n\n";
			alerttext+=BX_show_xml(p.responseXML);
		}
		else
		{
			alerttext="Something went wrong during saving:\n\n" + p.status + "\n\n";
			alerttext += p.responseXML.saveXML(p.responseXML.documentElement);
		}
		alert(alerttext);
	}
	else {
		alerttext="Something went wrong during saving:\n\n";
		alert(alerttext + p.responseText) ;
	}
	if (p.Exit) {
		eDOMEventCall("Exit",document);
	}
}	



/**
* Save a file over http post. It just posts the whole xml file without variable
* assignment (in PHP you have to use $HTTP_RAW_POST_DATA for getting the content)
* See php/save.php for an example how to implement it in PHP.
* @tparam String filename the filename (can be http://... or just a relative path)
* @tparam Mixed options Not used here
* @treturn void Nothing
*/

BXE_TransportDriver_webdav.prototype.save = function(filename, content, callback)
{
	if(this.Exit) {
		this.p.request.Exit = this.Exit;
	}
	this.p.request.td = this;
	this.p.request.onload = this._responseXML;
	this.p.PUT(filename, content );
}

