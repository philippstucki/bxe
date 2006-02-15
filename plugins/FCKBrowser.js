var dbforms2_fBrowserLastLocation = '';

function BxeFCKBrowser() {
	
	this.init = function (options) {
		bx_webroot = options['webroot'];
		
	}
	
	this.start = function() {
		//register event
		document.eDOMaddEventListener( "ClipboardPasteDialog" , BxeTextClipboard_OpenDialog , false);
		
	}
	this.getCss = function() {
		return new Array();
	}
	
	this.getScripts = function() {
		return new Array();
	}
	
	
}

function BxeFCKBrowser_Open(e) {
	var fBrowserUrl = bx_webroot + 'webinc/fck/editor/filemanager/browser/default/browser.html?Type=files&amp;Connector=connectors/php/connector.php';

    BxeFCKBrowser.cssr = window.getSelection().getEditableRange();
	
	var currentFile = '';
    if (dbforms2_fBrowserLastLocation) {
        currentFile = dbforms2_fBrowserLastLocation;
    }
    var filesDir = '/files';
    sParentFolderPath = currentFile.substring(filesDir.length, currentFile.lastIndexOf('/', currentFile.length - 2) + 1);

    if(sParentFolderPath != '' && (sParentFolderPath.indexOf('/') != -1)) {
        fBrowserUrl += '&RootPath=' + escape(sParentFolderPath);
    }
	fBrowserUrl = fBrowserUrl.replace(/&amp;/,"&");
    if(typeof fBrowserWindow != 'undefined' && !fBrowserWindow.closed) {
        fBrowserWindow.location.href = fBrowserUrl;
    } else {
		
        fBrowserWindow = window.open(fBrowserUrl, 'fBrowser', 'width=800,height=600,location=no,menubar=no');
    }

    fBrowserWindow.focus();

    
    SetUrl = function(url) {
		     
        var sel = window.getSelection();
        sel.selectEditableRange(BxeFCKBrowser.cssr);
        //make string
		var te = "" + sel;
		te = te.replace(/</,"&lt;");
		if (typeof target == "object") {
			var xml = "<a xmlns='"+ XHTMLNS + "' href='"+url+"'>"+te+"</a>";
		} else {
			var xml = "<a xmlns='"+ XHTMLNS + "' href='"+url+"' target='"+target+"'>"+te+"</a>";
		}
        
        return bxe_insertContent(xml, BXE_SELECTION);
    }
    
}

	

