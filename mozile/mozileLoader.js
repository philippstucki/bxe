/* ***** BEGIN LICENSE BLOCK *****
 * Licensed under Version: MPL 1.1/GPL 2.0/LGPL 2.1
 * Full Terms at http://mozile.mozdev.org/license.html
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Playsophy code.
 *
 * The Initial Developer of the Original Code is Playsophy
 * Portions created by the Initial Developer are Copyright (C) 2002-2003
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *	James A. Overton <james@overton.ca>
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * mozileLoader V0.5
 *
 * Loads mozile for a page if in a Geiko browser. This is the only javascript
 * file that a user needs to explicitly include in a page. This shields Mozile
 * from IE. Ultimately it would only load Mozile if it wasn't already loaded
 * locally - though perhaps it would always load "mozileModify" or "per page"
 * customization mechanism.
 *
 * Methods: http://devedge.netscape.com/viewsource/2002/browser-detection/
 *          http://devedge.netscape.com/library/manuals/2001/xpinstall/1.0/Chap4.html#1005439
 *
 * POST05:
 * - distinguish old Geiko browsers (once tested to see which have 
 * problems)
 * - if IE:
 *   - put up msg to upgrade to Geiko based browser
 *   - load IE toolbar
 */
mozile_js_files = new Array();
mozile_js_files.push("eDOM.js");
mozile_js_files.push("eDOMXHTML.js");
mozile_js_files.push("domlevel3.js");
mozile_js_files.push("mozCE.js");
mozile_js_files.push("mozWrappers.js");
mozile_js_files.push("mozIECE.js");
mozile_js_files.push("mozilekb.js");
mozile_js_files.push("mozileSave.js");

var mozile_root_dir = "chrome://mozile/content/"; // default location of mozile is in an extension

// Detect Gecko but exclude Safari (for now); for now, only support XHTML
if((navigator.product == 'Gecko') && (navigator.userAgent.indexOf("Safari") == -1))
{
	// navigator.productSub > '20020801' (test to see what the date should be)

	// POST04: if document.documentElement != HTML then ... or no "head" ...
	var head = document.getElementsByTagName("head")[0];

	if(head)
	{
		// if there is no Mozile installed already then use a remote Mozile hosted along with this Loader file
		if(!InstallTrigger.getVersion("mozile"))
		{
			// get the location of this script and reuse it for the others
			for(var i=0; i<head.childNodes.length; i++)
			{
				var mozileLoaderRE = /(.*)mozileLoader.js$/;
				if(head.childNodes[i].nodeName == "SCRIPT")
				{
					var src = head.childNodes[i].src;
					var result = mozileLoaderRE.exec(src);
					if(result)
					{
						mozile_root_dir = result[1];
						break;
					}
				}
			}

			// remote has an in-page toolbar: the chrome version has the toolbar in the browser itself
			mozile_js_files.push("mozilehtmltb.js");
		}
	
		for (var i=0; i < mozile_js_files.length; i++) 
		{
			var scr = document.createElementNS("http://www.w3.org/1999/xhtml","script");
			var src = mozile_root_dir + mozile_js_files[i];
			scr.setAttribute("src", src);
			scr.setAttribute("language","JavaScript");
			head.appendChild(scr);
		}
	}
	else
		alert("*** ALERT: MozileLoader only works in XHTML - load Mozile JS explicitly in XML files");
}