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
		if (options["librariesURI"]) {
			librariesURI = options["librariesURI"];
			
		}
		drawertool = new DrawerTool();
		var imagetool = new ImageToolBxe();
		var imagedrawer = new ImageDrawer(imagetool, mozile_root_dir +"/kupu/kupudrawers/imagedrawer.xsl", librariesURI, "kupu/kupudrawers/demolibrary1.xml");
		
		drawertool.registerDrawer('imagedrawer', imagedrawer);
		
		imagedrawer.editor = new Object();
		imagedrawer.editor.getBrowserName = function () {
			return "Mozilla";
		}
		
	}
	
	this.getScripts = function() {
		var ar = new Array();
		ar.push("kupu/sarissa.js");
		ar.push("kupu/kupuhelpers.js");
		ar.push("kupu/kupubasetools.js");
		ar.push("kupu/kupudrawertool.js");
		ar.push("kupu/kupulibrarydrawer.js");
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