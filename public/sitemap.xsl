<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sitemap xhtml"
>
  <xsl:output method="html" encoding="UTF-8" doctype-system="about:legacy-compat"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Oxy Sitemap</title>
        <style>
          :root { color-scheme: light dark; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: Canvas;
            color: CanvasText;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.5;
          }
          main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 72px 0; }
          header { max-width: 720px; margin-bottom: 40px; }
          .eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
          h1 { margin: 8px 0 12px; font-size: clamp(2.25rem, 7vw, 4.5rem); line-height: 1; letter-spacing: -0.055em; }
          p { margin: 0; opacity: 0.68; }
          .summary { margin-top: 20px; font-size: 0.875rem; }
          .table-wrap { overflow: hidden; border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
          th, td { padding: 14px 18px; text-align: left; border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent); }
          th { font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.58; }
          tr:last-child td { border-bottom: 0; }
          tbody tr:hover { background: color-mix(in srgb, currentColor 5%, transparent); }
          a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 3px; overflow-wrap: anywhere; }
          .meta { white-space: nowrap; opacity: 0.65; }
          @media (max-width: 700px) {
            main { padding: 40px 0; }
            .optional { display: none; }
            th, td { padding: 12px; }
          }
        </style>
      </head>
      <body>
        <main>
          <header>
            <div class="eyebrow">Oxy</div>
            <h1>Sitemap</h1>
            <p>This XML sitemap helps search engines discover the public pages available on oxy.so.</p>
            <p class="summary">
              <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong>
              <xsl:text> URLs indexed</xsl:text>
            </p>
          </header>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th class="optional">Last modified</th>
                  <th class="optional">Frequency</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></td>
                    <td class="meta optional">
                      <xsl:choose>
                        <xsl:when test="sitemap:lastmod"><xsl:value-of select="sitemap:lastmod"/></xsl:when>
                        <xsl:otherwise>—</xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <td class="meta optional"><xsl:value-of select="sitemap:changefreq"/></td>
                    <td class="meta"><xsl:value-of select="sitemap:priority"/></td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
