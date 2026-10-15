import { useEffect, useRef } from 'react';
import { AliaChatSheet, type AliaChatSheetRef } from '@alia.onl/sdk';
import { BLOOM_CHARACTER_RUNTIME_URL } from '../../lib/bloomCharacterRuntime';

interface AskAliaSheetProps {
  /** Bumped on every press of Ask Alia; each change presents the sheet. */
  askId: number;
  clientContext: string;
  welcomeSuggestions: { id: string; text: string }[];
}

/**
 * Alia's chat sheet, in its own module so the provider can load the SDK lazily
 * instead of shipping it in the entry chunk. It mounts on the first press, so the
 * first `present()` runs as soon as the sheet is ready. The avatar runtime is the
 * copy this site already serves (`bloomCharacterAssets`), not a cross-origin one.
 * Text only: no voice session, so `livekit` stays out of the bundle.
 */
export default function AskAliaSheet({
  askId,
  clientContext,
  welcomeSuggestions,
}: AskAliaSheetProps) {
  const ref = useRef<AliaChatSheetRef>(null);

  useEffect(() => {
    if (askId > 0) ref.current?.present();
  }, [askId]);

  return (
    <AliaChatSheet
      ref={ref}
      clientContext={clientContext}
      welcomeSuggestions={welcomeSuggestions}
      characterRuntimeUrl={BLOOM_CHARACTER_RUNTIME_URL}
    />
  );
}
