const BXE_VALID_NOMESSAGE = 1;

XMLNode.prototype.isNodeValid = function(deep, wFValidityCheckLevel ) {
	
	var c  = this._isNodeValid(deep,wFValidityCheckLevel);
	
	if (c.isError) {
		c.dumpErrorMessages();
		
		for (i in c.errormsg) {
			if (c.errormsg[i]["node"]._node.nodeType == 1) {
				c.errormsg[i]["node"]._node.setAttribute("__bxe_invalid","true");
			} 
		}
		if (!(wFValidityCheckLevel & 1)) {
			bxe_validationAlert(c.errormsg);
		}
		return false;
	} else {
		return true;
	}
		
}

Attr.prototype._isNodeValid = function(wFValidityCheckLevel ) {
	//dump("Attr Check: " + this.name + "\n");
}

XMLNode.prototype._isNodeValid = function(deep,wFValidityCheckLevel ) {
	// if it's a root node.
	if(this.parentNode && this.parentNode.nodeType == 9) {
		if (!this.vdom.canBeRoot) {
			alert("root element is not allowed to be root");
			return false;
		}
	} else {
		if (this.nodeType == 1) {
		// TODO: test if this node is valid, we do only check childrens for the moment..	
		}
	}
	debug ("_isNodeValid " + this.nodeName );
	try {
		if (this.vdom) {
			debug ("just before new ContextVDOM (NodeVAL.js line 43)");
			var ctxt = new ContextVDOM(this, this.vdom);
		} else {
			return false;
		}
	
	} catch (e) { bxe_catch_alert(e); debug ("couldn't make new context..");}
	if (ctxt && ctxt.node) {
	do {
		
		if (ctxt.node.nodeType == "3" && ctxt.node.isWhitespaceOnly) {
			continue;
		} 	
		if (ctxt.node.nodeType == Node.COMMENT_NODE) {
			continue;
		}
		//FIXME: check CDATA_SECTIONS AS WELL
		if (ctxt.node.nodeType == Node.CDATA_SECTION_NODE) {
			continue;
		}
		
		if (  ctxt.isValid()) {
			if(ctxt.node.hasChildNodes() && deep) {
				var refsPosition = ctxt.refs.length;
				//var oldVdom = ctxt.node.vdom;
				oldVdom = ctxt.vdom;	
				debug(oldVdom.nodeName + " ..... ");
				debug("*****Go deeper " + ctxt.node.nodeName);
				var retctxt = ctxt.node._isNodeValid(deep,  wFValidityCheckLevel )
				
				debug("*****back deeper " + ctxt.node.nodeName);
				if (retctxt.isError) {
					ctxt.addErrorMessages(retctxt.errormsg);
				} else {
//					ctxt.setVDOM(oldVdom, refsPosition);
				}
				
			}
			if(ctxt.node.hasAttributes()) {
				for( var i = 0; i < ctxt.node.attributes.length; i++) {
					 ctxt.node.attributes[i]._isNodeValid( wFValidityCheckLevel);
				}
			}
		} else {
				/*if (ctxt.node.parentNode.isAllowedChild(ctxt.node)) {
					ctxt.setErrorMessage(ctxt.node.localName +"("+ctxt.node.namespaceURI+ ") is not allowed at this position as child of  " + this.localName );
				}
				else {*/
					ctxt.setErrorMessage(ctxt.node.localName +"("+ctxt.node.namespaceURI+ ")"+ " is not allowed as child of  " + this.localName +"("+this.namespaceURI+ ")");
				//}
		}
		//debug ("---------");
	} while (ctxt.next())

	
		}
	return ctxt;
	
}
ctxtcounter = 0;
function ContextVDOM (node,vdom) {
	this.node = node.firstChild;
	this.nr = ctxtcounter++;
	debug (node.nodeName);
/*	debug (vdom.nodeName);
*/	this.isError = false;
	this.errormsg = new Array();
	this.refs = new Array();

	if (vdom && typeof vdom.firstChild != "undefined") {
		this.vdom = vdom.getFirstChild(this);
	} else {
		this.vdom = null;
	}
	
	
}

ContextVDOM.prototype.next = function() {
	debug ("ctxt.next " + typeof this.node +  " " + this.node.nodeName);
	debug ("ctxt.VDOM " + this.vdom.nodeName +  " " + this.vdom.name);
	debug ("data " + this.node._node);
	if (this.node.nextSibling) {
		
		this.node = this.node.nextSibling;
		if (this.node._node.nodeType == 3 ) {
			debug("ctxt.next next.nodeName is null...");
			return this.next();
		}
		return this.node;
	} else {
		debug ("no next sibling...");
		return null;
	}
}
ContextVDOM.prototype.setErrorMessage = function(text) {
	
	if (!this.errormsg) {
		this.errormsg = new Array();
	}
	this.isError = true;
	var tmpArr = new Array();
	tmpArr["text"] = text;
	tmpArr["node"] = this.node;
	this.errormsg.push(tmpArr);
}

ContextVDOM.prototype.addErrorMessages = function(msgs) {
	this.isError = true;
	this.errormsg = this.errormsg.concat(msgs);
}

ContextVDOM.prototype.getErrorMessagesAsText = function() {
	var out = "";
	for (i in this.errormsg) {
		out += this.errormsg[i]["text"] + "\n";
	}
	return out;
}

ContextVDOM.prototype.dumpErrorMessages = function() {
	dump("Error :\n" + this.getErrorMessagesAsText());
}

ContextVDOM.prototype.nextVDOM = function() {
	var startVdom =this.vdom;
	var nextSib = this.vdom.getNextSibling(this);
	if (nextSib) {
		debug("nextVDOM " + nextSib.nodeName);
		
		debug("... " +  nextSib.name);
		debug("=> " + this.node.nodeName);
		this.vdom = nextSib;
	} /*else if (this.vdom.parentNode && this.vdom.parentNode.nodeName == "RELAXNG_DEFINE") {
		debug ("nextVDOM parent DEFINE " + this.vdom.nodeName + this.vdom.parentNode.name);
		return null;
	} */else {
		debug("nextVDOM == null");
		return null;
	}


	return this.vdom;
}

ContextVDOM.prototype.isValid = function() {
	if (this.vdom) {
//		dump("this.vdom " +this.vdom  +"\n");
		return this.vdom.isValid(this);
	} else {
		if (this.node.hasChildNodes()) {
			//dump(this.node.nodeName + " is not allowed to have children \n");
			this.setErrorMessage(this.node.nodeName + " is not allowed to have children")
			return false;
		} else {
			this.node.vdom = this.vdom;
			return true;
		}
	}
}


ContextVDOM.prototype.setVDOM = function(vdom, refsPosition) {

	if (refsPosition && this.refs.length >  0 ) {
		debug("//////// setVDOM " + vdom.nodeName);
		debug("////////         " + this.refs[this.refs.length -1].name);
		while (this.refs.length > refsPosition) {
			var bla = this.refs.pop();
			debug ("this.refs.pop" + bla.name);
			 
		}
		debug("last refs " + this.refs[this.refs.length -1].name);
	}
	this.vdom = vdom;
	debug("this.vdom " + this.vdom.nodeName);
}

XMLNode.prototype.__defineGetter__(
	"vdom", function () {
		if (typeof this._vdom == "undefined" || !this._vdom) {
			// if documentElement
			if (this.parentNode.nodeType == 9) {
				if (this.localName == this.ownerDocument.vdom.firstChild.localName) {
					this._vdom = this.ownerDocument.vdom.firstChild;
				} else {
					alert(" Document has root node named " + this.localName + "\n RelaxNG expects  " +this.ownerDocument.vdom.firstChild.nodeName);
					this._vdom = null;
				}
			} else {
				this._vdom = this.parentNode.vdom.getVdomForChild(this);
				 
			}
		}
		return this._vdom;
	}
	)


XMLNode.prototype.__defineSetter__(
	"vdom", function (value) {
		this._vdom = value;
	}
	)


	
