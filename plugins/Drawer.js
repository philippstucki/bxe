function BxeDrawer() {
	
	this.getCss = function() {
		var ar = new Array();
		ar.push("css/kupudrawerstyles.css");
		return ar;
	}
	this.init = function(options) {
		var body = document.getElementsByTagName("body")[0];
		var div = document.createElement("div");
		div.setAttribute("id","kupu-librarydrawer");
		body.appendChild(div);
		var librariesURI = mozile_root_dir + "kupu/kupudrawers/demolibraries.xml"; 
		
        if (options["imageLibrariesURI"]) {
			imageLibrariesURI = options["imageLibrariesURI"];
		}
		
        if (options['linkLibrariesURI']) {
            linkLibrariesURI = options['linkLibrariesURI'];
        }
        
        drawertool = new DrawerTool();
		 
        /* create and register the LinkLibrary-Drawer */
		var linktool = new LinkToolBxe();
        
        var liblinkdrawer = new LinkLibraryDrawer(linktool, mozile_root_dir+"/kupu/kupudrawers/librarydrawer.xsl", linkLibrariesURI, "kupu/kupudrawers/demolibrary1.xml");
        
        
        /* create and register the ImageDrawer */
        var imagetool = new ImageToolBxe();
        var imagedrawer = new ImageLibraryDrawer(imagetool, mozile_root_dir +"/kupu/kupudrawers/imagedrawer.xsl", imageLibrariesURI, "kupu/kupudrawers/demolibrary1.xml");
		
        
        drawertool.registerDrawer('imagedrawer', imagedrawer);
		drawertool.registerDrawer('liblinkdrawer', liblinkdrawer);
		
        
        liblinkdrawer.editor = new Object();
		liblinkdrawer.editor.getBrowserName = function () {
			return "Mozilla";
		}
		
		imagedrawer.editor = new Object();
        imagedrawer.editor.getBrowserName = function() {
            return "Mozilla";
        }
	}
	
	this.getScripts = function() {
		var ar = new Array();
		ar.push("kupu/sarissa.js");
		ar.push("kupu/kupuhelpers.js");
		ar.push("kupu/kupubasetools.js");
		//ar.push("kupu/kupudrawertool.js");
		//ar.push("kupu/kupulibrarydrawer.js");
        ar.push("kupu/kupudrawers.js");
		return ar;
	}
}

function ImageToolBxe() {
	/* Image tool to add images */
	
	this.initialize = function(editor) {
		/* attach the event handlers */
		this.editor = editor;
		this.editor.logMessage('Image tool initialized');
	};
	
	this.createImageHandler = function(event) {
		/* create an image according to a url entered in a popup */
		var imageWindow = openPopup('kupupopups/image.html', 300, 200);
		imageWindow.imagetool = this;
		imageWindow.focus();
	};
	
	this.createImage = function(url) {
		var xml = "<img xmlns='"+ XHTMLNS + "' alt='' src='" + url + "'/>";
		var sel = window.getSelection();
		sel.selectEditableRange(drawertool.cssr);
		return bxe_insertContent_async(xml, BXE_SELECTION);
		
	};
	
	this.createContextMenuElements = function(selNode, event) {
		return new Array(new ContextMenuElement('Create image', this.createImageHandler, this));
	};
}



function LinkToolBxe() {
    /* Add and update hyperlinks */
    
    this.initialize = function(editor) {
        this.editor = editor;
        this.editor.logMessage('Link tool initialized');
    };
    
    this.createLinkHandler = function(event) {
        /* create a link according to a url entered in a popup */
        var linkWindow = openPopup('kupupopups/link.html', 300, 200);
        linkWindow.linktool = this;
        linkWindow.focus();
    };
    
    // the order of the arguments is a bit odd here because of backward compatibility
    this.createLink = function(url, type, name, target) {
        
        var sel = window.getSelection();
        sel.selectEditableRange(drawertool.cssr);
        
        var xml = "<a xmlns='"+ XHTMLNS + "' href='"+url+"' target='"+target+"'>"+sel+"</a>";
        
        return bxe_insertContent(xml, BXE_SELECTION);
        
       
    };
    
    this.deleteLink = function() {
        /* delete the current link */
        var currnode = this.editor.getSelectedNode();
        var linkel = this.editor.getNearestParentOfType(currnode, 'a');
        if (!linkel) {
            this.editor.logMessage('Not inside link');
            return;
        };
        while (linkel.childNodes.length) {
            linkel.parentNode.insertBefore(linkel.childNodes[0], linkel);
        };
        linkel.parentNode.removeChild(linkel);
    };
    
    this.createContextMenuElements = function(selNode, event) {
        /* create the 'Create link' or 'Remove link' menu elements */
        var ret = new Array();
        var link = this.editor.getNearestParentOfType(selNode, 'a');
        if (link) {
            ret.push(new ContextMenuElement('Delete link', this.deleteLink, this));
        } else {
            ret.push(new ContextMenuElement('Create link', this.createLinkHandler, this));
        };
        return ret;
    };
}

