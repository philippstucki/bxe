Element.prototype.__defineGetter__(
	"allowedChildren", function() {
		for (bla in this.vdom._allowedChildren) {
			dump ("ha"+bla + " " + this.vdom._allowedChildren[bla]+"\n");
		}
	return this.vdom._allowedChildren;
}
)
