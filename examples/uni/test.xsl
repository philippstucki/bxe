<?xml version="1.0" encoding="iso-8859-1"?>
<!-- $Id: test.xsl,v 1.2 2003/08/26 09:50:10 chregu Exp $ -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
 xmlns:xhtml="http://www.w3.org/1999/xhtml"
 xmlns:lenya="http://apache.org/cocoon/lenya/page-envelope/1.0" 
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:unizh="http://unizh.ch/doctypes/elements/1.0" 
>
<xsl:output method="xml" encoding="iso-8859-1" />

<xsl:template match="/">
    <div>test div</div>
    <xsl:apply-templates select="/xhtml:html/xhtml:body"/>
    <h1>h1 test</h1>
    
    <div >hhhh</div>
</xsl:template>
<xsl:template match="*">
    <xsl:copy-of select="."/>
</xsl:template>

</xsl:stylesheet>
