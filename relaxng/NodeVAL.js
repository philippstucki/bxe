

XMLNode.prototype.isNodeValid = function(deep, wFValidityCheckLevel ) {
	
	if (this._isNodeValid(deep,wFValidityCheckLevel).isError) {
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
//	dump ("Node._isNodeValid");
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
	
	var ctxt = new ContextVDOM(this,this.vdom);
	if (ctxt.node) {
	do {
		//dump( ctxt.vdom.nodeName + "\n");
		if (ctxt.node.nodeType == "3" && ctxt.node.isWhitespaceOnly) {
			continue;
		} 	
		if (ctxt.node.nodeType == Node.COMMENT_NODE) {
			continue;
		}
		if (ctxt.isValid()) {
			if(ctxt.node.hasChildNodes()) {
				var retctxt = ctxt.node._isNodeValid(deep,  wFValidityCheckLevel )
				if (retctxt.isError) {
					ctxt.addErrorMessages(retctxt.errormsg);
				}
			}
			if(ctxt.node.hasAttributes()) {
				for( var i = 0; i < ctxt.node.attributes.length; i++) {
					 ctxt.node.attributes[i]._isNodeValid( wFValidityCheckLevel);
				}
			}
		} else {
				if (ctxt.node.parentNode.isAllowedChild(ctxt.node)) {
					ctxt.setErrorMessage(ctxt.node.localName + " is not allowed at this position as child of  " + this.localName );
				
				}
				else {
					ctxt.setErrorMessage(ctxt.node.localName + " is not allowed as child of  " + this.localName );
				}
		}
	} while (ctxt.next())
	}
	if (ctxt.isError) {
		ctxt.dumpErrorMessages();
	} 
	return ctxt;
	
}

function ContextVDOM (node,vdom) {
	this.node = node.firstChild;
	if (typeof vdom.firstChild != "undefined") {
		this.vdom = vdom.firstChild;
	} else {
		this.vdom = null;
	}
	this.isError = false;
	this.errormsg = new Array();
	
}

ContextVDOM.prototype.next = function() {
	
	if (this.node.nextSibling) {
		this.node = this.node.nextSibling;
		return this.node;
	} else {
		return null;
	}
}
ContextVDOM.prototype.setErrorMessage = function(text) {
	
	if (!this.errormsg) {
		this.errormsg = new Array();
	}
	this.isError = true;
	this.errormsg.push(text);
}

ContextVDOM.prototype.addErrorMessages = function(msgs) {
	this.isError = true;
	this.errormsg = this.errormsg.concat(msgs);
}

ContextVDOM.prototype.getErrorMessagesAsText = function() {
	var out = "";
	for (i in this.errormsg) {
		out += this.errormsg[i] + "\n";
	}
	return out;
}

ContextVDOM.prototype.dumpErrorMessages = function() {
	dump("Error :\n" + this.getErrorMessagesAsText());
}

ContextVDOM.prototype.nextVDOM = function() {
	
	if (this.vdom.nextSibling) {
		
		this.vdom = this.vdom.nextSibling;
		return this.vdom;
	} else {
		return null;
	}
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


	
