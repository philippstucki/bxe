<?php

$xmlfile = tempnam ("/tmp","bxetest");
$fd = fopen($xmlfile, "w");
fwrite($fd, stripslashes($_POST['xml']));
fclose($fd);

$relaxfile = tempnam ("/tmp","bxetest");
$fd = fopen($relaxfile, "w");
fwrite($fd, stripslashes($_POST['relax']));
fclose($fd);

print  passthru("xmllint -o /dev/null --relaxng $relaxfile $xmlfile 2>&1");
unlink($xmlfile);
unlink($relaxfile);
?>