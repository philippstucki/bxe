document.addEventListener("click", bxehelper_mouse, false);

function bxehelper_mouse(e) {
	var target = e.target.parentElement;
	if(target && target.userModifiable ) {
		if(e.target.tagName=="tabbrowser") {
			return;
		}
		// if the target of the click is one of these, then don't change the status of the toolbar
		var protect = new Array( 'toolbar', 'toolbarbutton', 'menuitem', 'menu', 'colorpicker');
		for(var i=0; i<protect.length; i++) {
			if(e.target.tagName==protect[i]) {
				return;
			}
		}
		
		
		bxehelper_setCaret();
	} else {
		bxehelper_removeCaret();
	}

}

function bxehelper_removeCaret() {
	prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null);
	prefs.setBoolPref('accessibility.browsewithcaret', false);
}

function bxehelper_setCaret() {
	prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch(null);
	prefs.setBoolPref('accessibility.browsewithcaret', true);
}
