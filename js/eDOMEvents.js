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



Node.prototype.doEvents = function(event) {
	event.currentTarget = this;
	
	if(this._events && this._events[event.eventType]) {
		for (var i in this._events[event.eventType]) {
			this._events[event.eventType][i](event);
		}
	}
	if (this.parentNode) {
		try {
			this.parentNode.doEvents(event);
		} catch(e) {
			dump("no checkEvents on parentNode " + this.parentNode);
		}
	}
}


function eDOMEvent () { }

eDOMEvent.prototype.initEvent = function (eventType) {
	this.eventType = eventType.toLowerCase();
	this.target.doEvents(this);
}

eDOMEvent.prototype.setTarget = function (target) {
	this.target = target;
}

function eDOMEventCall(eventType, target, addInfo) {
	dump("eDOMEevntCall: " + eventType + " " + target +"\n");
	dump("eDOMEevntCallParent: " + target.parentNode +"\n");

	var e = new eDOMEvent();
	if (addInfo) {
		e.additionalInfo = addInfo;
	}
	e.setTarget(target);
	e.initEvent(eventType);
	
}



	