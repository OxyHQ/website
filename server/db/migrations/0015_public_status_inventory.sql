-- Production predates the canonical product ids. Preserve those CMS rows when
-- possible, and stop their aliases from appearing as duplicate status entries.
UPDATE "products" AS legacy
SET "product_id" = aliases.canonical, "updated_at" = now()
FROM (VALUES
  ('c', 'clarity'),
  ('i', 'inbox'),
  ('fairwallet', 'faircoin-wallet'),
  ('faircoinexplorer', 'faircoin-explorer'),
  ('marketplace', 'mercaria')
) AS aliases(legacy, canonical)
WHERE legacy."product_id" = aliases.legacy
  AND NOT EXISTS (
    SELECT 1 FROM "products" AS canonical
    WHERE canonical."product_id" = aliases.canonical
  );

UPDATE "products"
SET "show_on_status" = false, "updated_at" = now()
WHERE "product_id" IN ('c', 'i', 'fairwallet', 'faircoinexplorer', 'marketplace');

-- This is a data migration, not a seed assertion: old production databases
-- may contain only the original ten rows. Insert the complete canonical census
-- and make reruns converge on the same 28 status entries.
INSERT INTO "products" (
  "_id", "product_id", "name", "tagline", "description", "href", "health_url",
  "external", "cta", "brand", "mark", "section", "lifecycle",
  "show_on_products", "show_on_status", "show_in_nav", "order"
)
VALUES
  ('7c7cddbfd4e59c8d4e5e06e7', 'alia', 'Alia AI', 'Intelligent assistant', 'Your private AI assistant.', 'https://alia.onl/', 'https://api.alia.onl/health/ready', true, 'Open Alia', '#7c3aed', 'A', 'apps', 'live', true, true, true, 0),
  ('8b7fd94274da7fa3d50c7761', 'mention', 'Mention', 'Open social network', 'A social network built on respect.', 'https://mention.earth/', NULL, false, 'Explore Mention', '#0ea5e9', 'M', 'social-communication', 'live', true, true, true, 1),
  ('816e35ac12fe4d0cc20bc6de', 'allo', 'Allo', 'Private communication', 'Messaging and calling across the Oxy ecosystem.', 'https://allo.you', 'https://api.allo.you/api/health', true, 'Open Allo', '#2563eb', 'A', 'social-communication', 'live', true, true, true, 2),
  ('982e630d8393cb9876cbcab1', 'inbox', 'Oxy Inbox', 'Unified messaging', 'Unified messaging across Oxy.', 'https://inbox.oxy.so', NULL, false, 'Explore Inbox', '#1e40af', 'I', 'social-communication', 'live', true, true, true, 2),
  ('53a54584355e4e8184600fba', 'faircoin', 'FairCoin', 'Currency that cares', 'Cryptocurrency built for sustainability.', 'https://fairco.in/', NULL, true, 'Visit FairCoin', '#16a34a', 'F', 'finance-commerce', 'live', true, true, true, 0),
  ('922825de3f2d2663c2db4c89', 'faircoin-bridge', 'FairCoin Bridge', 'FairCoin on Base', 'The FairCoin bridge.', 'https://bridge.fairco.in', 'https://bridge.fairco.in/health', true, 'Bridge status', '#16a34a', 'B', 'finance-commerce', 'live', false, true, false, 3),
  ('75351f07b8a51cdc95e57f67', 'faircoin-buy', 'FairCoin Buy', 'Buy FAIR with crypto', 'The FairCoin buy service.', 'https://buy.fairco.in', 'https://bridge.fairco.in/health/buy', true, 'Buy FAIR', '#16a34a', 'B', 'finance-commerce', 'live', false, true, false, 4),
  ('56ccdeed3d24081752f67090', 'faircoin-wallet', 'FairCoin Wallet', 'Manage your FairCoin', 'Self-custodied FairCoin wallet.', 'https://fairco.in/wallet', NULL, true, 'Open wallet', '#16a34a', 'W', 'finance-commerce', 'live', true, true, true, 1),
  ('51a206d3c00421339cd9f04a', 'peable', 'Peable', 'Money that works harder', 'Money tools for everyday life.', '/peable', NULL, false, 'Explore Peable', '#16a34a', 'P', 'finance-commerce', 'in-development', true, true, true, 3),
  ('640a510ab3f64b3b9b82d2d9', 'faircoin-explorer', 'FairCoin Explorer', 'Blockchain explorer', 'Explore the FairCoin network.', 'https://explorer.fairco.in', 'https://explorer.fairco.in/api/mining-info?network=mainnet', true, 'Open explorer', '#16a34a', 'E', 'finance-commerce', 'live', true, true, true, 2),
  ('8193b34b386f23a6f3674dfd', 'homiio', 'Homiio', 'Rental made easy', 'Renting made fair.', 'https://homiio.com/', NULL, false, 'Explore Homiio', '#e11d48', 'H', 'apps', 'live', true, true, true, 0),
  ('e91c4fb508136a8d8fbd468a', 'nilo', 'Nilo', 'Workspace for docs and databases', 'Pages, blocks and typed databases.', 'https://nilo.so', 'https://api.nilo.so/health/ready', true, 'Open Nilo', '#0891b2', 'N', 'apps', 'in-development', true, true, true, 3),
  ('e84f26772d6f7a74834f9158', 'noted', 'Noted', 'Notes that stay yours', 'A private notes workspace.', 'https://noted.oxy.so', 'https://api.noted.oxy.so/health/ready', true, 'Open Noted', '#7c3aed', 'N', 'apps', 'live', true, true, true, 4),
  ('10a01d2dad6111f22bf4a029', 'moovo', 'Moovo', 'Move together', 'Mobility and transport services.', 'https://moovo.now', 'https://api.moovo.now/health/ready', true, 'Open Moovo', '#0d9488', 'M', 'apps', 'live', true, true, true, 5),
  ('2807e2674bac9c207abf1e3f', 'clarity', 'Clarity', 'AI answer engine', 'Answers with cited sources.', 'https://clarity.surf', 'https://api.clarity.surf/health/ready', true, 'Open Clarity', '#0ea5e9', 'C', 'apps', 'live', true, true, true, 1),
  ('7e894c62a37ad906dee782b3', 'kaana', 'Kaana', 'Oxy''s own inference provider', 'The Oxy inference data plane.', 'https://kaana.ai', 'https://kaana.ai/livez', true, 'Open Kaana', '#0033ff', 'K', 'apps', 'live', true, true, true, 0),
  ('cd7e13c5305630131aa070d8', 'codea', 'Codea', 'Open-source code editor', 'A professional AI code editor.', '/codea', NULL, false, 'Explore Codea', '#0f172a', 'C', 'developer', 'live', true, true, true, 2),
  ('1c8485f575e547e80dc4074f', 'oxyos', 'Oxy OS', 'Operating system', 'An operating system built around privacy.', 'https://os.oxy.so', NULL, false, 'Explore Oxy OS', '#f97316', 'X', 'infrastructure', 'live', true, true, true, 3),
  ('bf2c07aa843daefbee31b9d9', 'oxy-ai', 'Oxy AI', 'Models, API and SDKs', 'Privacy-first AI for developers.', '/ai', NULL, false, 'Explore Oxy AI', '#dc2626', 'O', 'developer', 'live', true, true, false, 0),
  ('8eae4819466242bf9b1b8b9d', 'oxy-api', 'Oxy API', 'Core identity and platform API', 'The core Oxy API.', 'https://api.oxy.so', 'https://api.oxy.so/health', true, 'API reference', '#475569', 'A', 'infrastructure', 'live', false, true, false, 0),
  ('538f1001d76d2efab13c7aad', 'website-api', 'Website API', 'Powers oxy.so content and MCP', 'The oxy.so content API.', 'https://website-api.oxy.so', 'https://website-api.oxy.so/api/health', true, 'Status', '#475569', 'W', 'infrastructure', 'live', false, true, false, 1),
  ('90990b495116adc8c5d3c71a', 'accounts', 'Accounts', 'Sign-in, profile and billing', 'Manage your Oxy identity.', 'https://accounts.oxy.so', NULL, true, 'Open accounts', '#475569', 'A', 'infrastructure', 'live', false, true, false, 2),
  ('6ebd66838ff27f723725f207', 'tnp', 'TNP', 'Alternative namespace', 'The Network Protocol.', '/tnp', NULL, false, 'Explore TNP', '#10b981', 'T', 'infrastructure', 'live', true, true, true, 3),
  ('ab902563ee2cb9aae64d2f2b', 'astro', 'Astro', 'AI browser', 'Browse the web with AI.', '/astro', NULL, false, 'Explore Astro', '#a855f7', 'A', 'apps', 'in-development', true, true, true, 0),
  ('6bcf5525384a0c9cf34d87b0', 'codex-extension', 'Codex Extension', 'Codea everywhere you code', 'Bring Codea into the editor.', '/codea/extension', NULL, false, 'Explore the extension', '#475569', 'E', 'developer', 'in-development', true, true, false, 1),
  ('aa40a02b10f1c1957e8f2823', 'syra', 'Syra', 'Music, artists and live', 'A home for music.', 'https://syra.fm', NULL, true, 'Open Syra', '#f43f5e', 'S', 'apps', 'in-development', true, true, true, 4),
  ('99ff0fb6c7c6c8944c44a215', 'mercaria', 'Mercaria', 'Buy and sell fairly', 'A fair marketplace.', 'https://mercaria.co', 'https://api.mercaria.co/health/ready', true, 'Open Mercaria', '#f59e0b', 'M', 'finance-commerce', 'in-development', true, true, true, 5),
  ('86d7e9c4c344de3f7ccd54c7', 'crowdsource', 'CrowdSource', 'Participatory moderation', 'Independent community moderation.', '/company/charter#6-governance-designed-for-fallible-people', 'https://api.crowdsource.oxy.so/health/ready', false, 'How it works', '#6366f1', 'C', 'infrastructure', 'in-development', true, true, false, 4)
ON CONFLICT ("product_id") DO UPDATE SET
  "health_url" = EXCLUDED."health_url",
  "show_on_status" = true,
  "updated_at" = now();

DO $$
DECLARE actual_count integer;
BEGIN
  SELECT count(*) INTO actual_count
  FROM "products"
  WHERE "show_on_status" = true
    AND "product_id" IN (
      'alia','mention','allo','inbox','faircoin','faircoin-bridge','faircoin-buy',
      'faircoin-wallet','peable','faircoin-explorer','homiio','nilo','noted',
      'moovo','clarity','kaana','codea','oxyos','oxy-ai','oxy-api','website-api',
      'accounts','tnp','astro','codex-extension','syra','mercaria','crowdsource'
    );
  IF actual_count <> 28 THEN
    RAISE EXCEPTION 'public status inventory has % canonical rows, expected 28', actual_count;
  END IF;
END $$;
