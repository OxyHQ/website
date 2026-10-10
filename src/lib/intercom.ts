/** Explicit user intent, handled by the existing authenticated Messenger integration. */
export const INTERCOM_CONVERSATION_EVENT = 'oxy:intercom-conversation';

export interface IntercomConversationRequest {
  message: string;
  signal: AbortSignal;
  resolve: () => void;
  reject: (error: Error) => void;
}

export function startIntercomConversation(message: string): Promise<void> {
  if (!message.trim()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    // Intercom's ready callback has no failure callback or timeout. Cancel the
    // request too, so a late SDK load cannot send a message after we reported failure.
    const timer = window.setTimeout(() => {
      controller.abort();
      reject(new Error('Intercom did not become ready'));
    }, 20_000);
    const request: IntercomConversationRequest = {
      message,
      signal: controller.signal,
      resolve: () => {
        window.clearTimeout(timer);
        resolve();
      },
      reject: (error) => {
        window.clearTimeout(timer);
        controller.abort();
        reject(error);
      },
    };
    const event = new CustomEvent(INTERCOM_CONVERSATION_EVENT, {
      detail: request,
      cancelable: true,
    });
    window.dispatchEvent(event);
    if (!event.defaultPrevented) request.reject(new Error('Intercom is unavailable'));
  });
}
