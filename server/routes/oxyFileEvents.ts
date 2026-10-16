import express, { Router } from 'express';
import { FileEventVerificationError, verifyFileEventSignature } from '@oxy.so/core/server';
import { config } from '../config.js';
import { applyFileEvent } from '../services/oxyFileEvents.js';

/**
 * The Oxy Website application's file-events endpoint (ADR 0041 D9), set in the
 * Oxy console as `https://website-api.oxy.so/api/oxy/file-events`.
 *
 * Mounted BEFORE `express.json()`: the signature covers the exact bytes Oxy
 * sent, so the body is read raw here and parsed only once it verified.
 */
const router = Router();

/** Generous for one event (a file and the site's references to it), tight for anything else. */
const MAX_EVENT_BYTES = '256kb';

router.post('/', express.raw({ type: () => true, limit: MAX_EVENT_BYTES }), async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  let verified: ReturnType<typeof verifyFileEventSignature>;
  try {
    verified = verifyFileEventSignature(body, req.headers, config.oxyFiles.webhookSecret);
  } catch (error) {
    if (!(error instanceof FileEventVerificationError)) throw error;
    // No secret yet: answer so Oxy retries (it backs off for days) rather than
    // dead-lettering an event the site could still have applied.
    if (!config.oxyFiles.webhookSecret) {
      console.error('[oxy-files] file event refused: OXY_FILES_WEBHOOK_SECRET is not set');
      return res.status(503).json({ error: 'File events are not configured' });
    }
    console.warn(`[oxy-files] file event refused: ${error.message}`);
    return res.status(401).json({ error: 'Invalid file event' });
  }

  // The endpoint's verification when it is set in the console: echo it.
  if (verified.type === 'webhook.challenge') return res.json({ challenge: verified.challenge });

  try {
    const applied = await applyFileEvent(verified);
    console.log(
      `[oxy-files:event] ${JSON.stringify({
        event: verified.id,
        type: verified.type,
        file: verified.file.id,
        duplicate: applied.duplicate,
        action: applied.action,
        media: applied.mediaIds,
      })}`,
    );
    return res.status(204).end();
  } catch (error) {
    // Not acknowledged: Oxy delivers it again.
    console.error(`[oxy-files] file event ${verified.id} could not be applied:`, error);
    return res.status(500).json({ error: 'The event could not be applied' });
  }
});

export default router;
