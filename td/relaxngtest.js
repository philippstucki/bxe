// +----------------------------------------------------------------------+
// | Bitflux Editor													   |
// +----------------------------------------------------------------------+
// | Copyright (c) 2001,2002 Bitflux GmbH								 |
// +----------------------------------------------------------------------+
// | This software is published under the terms of the Apache Software	|
// | License a copy of which has been included with this distribution in  |
// | the LICENSE file and is available through the web at				 |
// | http://bitflux.ch/editor/license.html								|
// +----------------------------------------------------------------------+
// | Author: Christian Stocker <chregu@bitflux.ch>						|
// +----------------------------------------------------------------------+
//
// $Id: relaxngtest.js,v 1.1 2003/08/27 09:12:12 chregu Exp $
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
function BXE_TransportDriver_relaxng (parent)
{
	/**
	* XMLHttpRequest Object
	*
	* We use the same XMLHttpRequest in the whole instance
	* @type Object
	*/
	this.p = new XMLHttpRequest();
	
	/**
	* Parent Object
	*
	* This is normally the BXE_loader class
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

BXE_TransportDriver_relaxng.prototype.load = function(filename,callback) {
	var docu = document.implementation.createDocument("","",null);
	docu.loader = this.parent;
	if (callback) {
		docu.onload = callback; 
	}
	else {
		//this seems to be a static call, therefore we needed
		// the docu.loader aboive... have to check, how it's done in JS correctly
		docu.onload = this.parent.xmlloaded;  // set the callback when we are done loading
	}
	try {
	docu.load(filename);
	}
	catch (e) {
		alert("File " + filename + " could not be loaded:\n" + e.message);
	}
	docu.td = this;
	return docu;
	
}

/**
* Handles the response of the save method.
* This method is called, when the POST request from save has finished
* It displays a message, if it succeeded or failed
*
* @tparam Event e the event triggered after save
* @treturn void Nothing
*/

BXE_TransportDriver_relaxng.prototype._responseXML = function(e) {
	
	var p = e.target;
	var alerttext="";
	

	alert(alerttext + p.responseText) ;
}   



/**
* Save a file over http post. It just posts the whole xml file without variable
* assignment (in PHP you have to use $HTTP_RAW_POST_DATA for getting the content)
* See php/save.php for an example how to implement it in PHP.
* @tparam String filename the filename (can be http://... or just a relative path)
* @tparam Mixed options Not used here
* @treturn void Nothing
*/

BXE_TransportDriver_relaxng.prototype.check = function(filename,options, xml)
{
	var xmlstr = bxe_getXmlDocument();
	var relaxngstr =  bxe_getRelaxNGDocument();
	this.p.onload = this._responseXML;
	var poststr = "xml="+encodeURI(xmlstr)+"&relax="+encodeURI(relaxngstr);
	this.p.open("POST", "relaxngtest.php");
	this.p.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	
	this.p.send(poststr,true);
}


