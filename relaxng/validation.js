/*************************************************************************************************************

 *************************************************************************************************************/



/*
 * validation method  method from DocumentLS
 * http://www.w3.org/TR/2003/WD-DOM-Level-3-Val-20030205/validation.html#VAL-Interfaces-ElementEditVAL
 */
 


function BX_debug(object)
{
	var win = window.open("","debug");
	bla = "";
	for (b in object)
	{

		bla += b;
		try {

			bla +=  ": "+object.eval(b) ;
		}
		catch(e)
		{
			bla += ": NOT EVALED";
		};
		bla += "\n";
	}
	win.document.innerHTML = "";

	win.document.writeln("<pre>");
	win.document.writeln(bla);
	win.document.writeln("<hr>");
}


