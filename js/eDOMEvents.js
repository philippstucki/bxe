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
// $Id: eDOMEvents.js,v 1.6 2003/11/18 21:41:10 chregu Exp $

Node.prototype.eDOMaddEventListener = function (eventType, func, captures) {
	if (!this._events) {
		this._events = new Array();
	}
	eventType = eventType.toLowerCase();
	if (!this._events[eventType]) {
		this._events[eventType] = new Array();
	}
	
	var funcname = func.name
	
	if (! funcname) {
		funcname = this._events[eventType].length;
	}
	
	this._events[eventType][funcname] = func;
}


Node.prototype.eDOMremoveEventListener = function (eventType, func, captures) {
	var funcname = func.name
	eventType = eventType.toLowerCase();
	if (! funcname) {
		funcname = this._events[eventType].length;
	}
	if (this._events && this._events[eventType] && this._events[eventType][funcname]) {
		this._events[eventType][funcname] = null;
	}
}
Node.prototype.doEvents = function(event) {
	event.currentTarget = this;
	if(this._events && this._events[event.eventType]) {
		for (var i in this._events[event.eventType]) {
			if (this._events[event.eventType][i]) {
				
				this._events[event.eventType][i](event);
			}
		}
	}
	if (this.parentNode) {
		try {
			this.parentNode.doEvents(event);
		} catch(e) {
			//dump("no checkEvents on parentNode " + this.parentNode);
		}
	}
}


function eDOMEvent () { }

eDOMEvent.prototype.initEvent = function (eventType) {
	this.eventType = eventType.toLowerCase();
	dump ("Event: " + eventType + " " + this.target + " "  + this.additionalInfo  +"\n");
	this.target.doEvents(this);
}

eDOMEvent.prototype.setTarget = function (target) {
	this.target = target;
}

function eDOMEventCall(eventType, target, addInfo) {

	var e = new eDOMEvent();
	if (addInfo) {
		e.additionalInfo = addInfo;
	}
	e.setTarget(target);
	e.initEvent(eventType);
	
}



	