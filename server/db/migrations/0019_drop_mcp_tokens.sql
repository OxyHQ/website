-- MCP sign-in moved to Oxy's MCP OAuth: every request now carries a short-lived
-- token Oxy issued for this resource, checked live against Oxy. The static
-- tokens this table held are no longer accepted anywhere, so it goes, with the
-- hashes of every token ever issued from /admin/mcp-tokens.
DROP TABLE IF EXISTS "mcp_tokens";
