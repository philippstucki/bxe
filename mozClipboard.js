function mozClipboard () {
  this.clipboard = null
}

mozClipboard.prototype.__defineGetter__(
	"clipboard",
	function()
	{
		return this._clipboard;
	}
);

mozClipboard.prototype.__defineSetter__(
	"clipboard",
	function(value)
	{
		this._clipboard = value;
	}
);

mozClipboard.prototype.copy = function () {
	var sel = window.getSelection();
	alert(this.clipboard);
}

mozClipboard.prototype.paste = function () {
	
}


mozClipboard.prototype.cut = function () {
	
}


XMLDocument.prototype.clipboard = new mozClipboard();

HTMLDocument.prototype.clipboard = new mozClipboard();