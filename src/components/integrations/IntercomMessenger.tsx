import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@oxy.so/services/ui/client'
import { apiFetch } from '../../api/client'
import { INTERCOM_CONVERSATION_EVENT, type IntercomConversationRequest } from '../../lib/intercom'
import { isFairCoinHost } from '../../lib/host'

type IntercomSettings = {
  app_id: string
  current_url?: string
  intercom_user_jwt?: string
  auth_tokens?: {
    security_token: string
  }
}

type IntercomFunction = ((command: string, ...args: unknown[]) => void) & {
  q?: unknown[][]
  c?: (args: unknown[]) => void
}

// Intercom app IDs are public workspace identifiers, not secrets. Keep the
// supplied production ID as the local/build fallback while allowing each
// environment to override it through Vite.
const INTERCOM_APP_ID = 'o7sm3qkc'

declare global {
  interface Window {
    Intercom?: IntercomFunction
    intercomSettings?: IntercomSettings
  }
}

function installIntercom(appId: string) {
  window.intercomSettings = {
    ...window.intercomSettings,
    app_id: appId,
    current_url: window.location.href,
  }

  if (typeof window.Intercom === 'function') {
    window.Intercom('reattach_activator')
    window.Intercom('update', window.intercomSettings)
    return
  }

  const intercom = ((...args: unknown[]) => {
    intercom.c?.(args)
  }) as IntercomFunction
  intercom.q = []
  intercom.c = (args) => {
    intercom.q?.push(args)
  }
  window.Intercom = intercom

  if (document.querySelector('script[data-intercom-loader]')) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://widget.intercom.io/widget/${encodeURIComponent(appId)}`
  script.dataset.intercomLoader = 'true'
  document.head.appendChild(script)
}

export default function IntercomMessenger() {
  const { pathname } = useLocation()
  const { user, isAuthenticated, isAuthResolved, canUsePrivateApi } = useAuth()
  const appId = (import.meta.env.VITE_INTERCOM_APP_ID as string | undefined)?.trim() || INTERCOM_APP_ID
  const disabled = isFairCoinHost() || pathname === '/admin' || pathname.startsWith('/admin/')
  const [activated, setActivated] = useState(false)
  const [conversation, setConversation] = useState<IntercomConversationRequest | null>(null)
  const [identityReadyFor, setIdentityReadyFor] = useState<{ userId: string } | null>(null)
  const [identityFailedFor, setIdentityFailedFor] = useState<string | null>(null)
  const pendingConversation = useRef<IntercomConversationRequest | null>(null)
  const identifiedUserIdRef = useRef<string | null>(null)
  const identityRequestRef = useRef(0)
  const userId = isAuthenticated && user?.id ? String(user.id) : null
  const ready = activated || isAuthenticated

  useEffect(() => {
    const receive = (event: Event) => {
      const request = (event as CustomEvent<IntercomConversationRequest>).detail
      event.preventDefault()
      if (disabled || !appId || (pendingConversation.current && !pendingConversation.current.signal.aborted)) {
        request.reject(new Error('Intercom is unavailable or already opening'))
        return
      }
      pendingConversation.current = request
      setConversation(request)
      setActivated(true)
    }
    window.addEventListener(INTERCOM_CONVERSATION_EVENT, receive)
    return () => {
      window.removeEventListener(INTERCOM_CONVERSATION_EVENT, receive)
      pendingConversation.current?.reject(new Error('Intercom was closed'))
      pendingConversation.current = null
    }
  }, [appId, disabled, userId])

  useEffect(() => {
    if (!appId || disabled || ready) return

    // The messenger is support UI, not page content. Anonymous visitors should
    // not pay its network and parse cost until they show intent to interact.
    const activate = () => setActivated(true)
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    for (const event of events) {
      window.addEventListener(event, activate, { once: true, passive: true })
    }
    return () => {
      for (const event of events) window.removeEventListener(event, activate)
    }
  }, [appId, disabled, ready])

  useEffect(() => {
    if (!appId) return

    if (disabled) {
      window.Intercom?.('hide')
      if (identifiedUserIdRef.current) {
        window.Intercom?.('shutdown')
        identifiedUserIdRef.current = null
      }
      return
    }

    if (!ready) return
    installIntercom(appId)
  }, [appId, disabled, ready])

  useEffect(() => {
    if (!appId || disabled || !ready || !isAuthResolved) return

    const requestId = ++identityRequestRef.current
    let cancelled = false

    const bootAnonymous = () => {
      window.Intercom?.('boot', {
        app_id: appId,
        current_url: window.location.href,
      })
    }

    const syncIdentity = async () => {
      if (!userId || !canUsePrivateApi) return

      try {
        const { token } = await apiFetch<{ token: string }>('/intercom/user-jwt')
        if (cancelled || requestId !== identityRequestRef.current || !token) return

        const settings: IntercomSettings = {
          app_id: appId,
          current_url: window.location.href,
          intercom_user_jwt: token,
          // Fin Data connectors use a dedicated User authentication token.
          // It is refreshed alongside Messenger Security and is intentionally
          // sent through auth_tokens rather than relying on intercom_user_jwt.
          auth_tokens: { security_token: token },
        }

        // A visitor session may already be booted by the loader. Intercom
        // requires a clean shutdown before switching that session to a user.
        if (identifiedUserIdRef.current !== userId) {
          window.Intercom?.('shutdown')
          window.Intercom?.('boot', settings)
          identifiedUserIdRef.current = userId
        } else {
          // JWTs are short-lived; updating periodically keeps long sessions
          // authenticated without exposing the Messenger secret to the client.
          window.Intercom?.('update', settings)
        }
        window.Intercom?.('setAuthTokens', { security_token: token })
        setIdentityFailedFor(null)
        setIdentityReadyFor({ userId })
      } catch (error) {
        if (!cancelled && requestId === identityRequestRef.current) setIdentityFailedFor(userId)
        // A missing production secret should not break the website or turn
        // into a noisy console error for visitors. The backend returns 503
        // until Intercom Messenger Security is configured.
        if (import.meta.env.DEV && !cancelled) {
          console.warn('Intercom user authentication is unavailable', error)
        }
      }
    }

    if (!userId) {
      if (identifiedUserIdRef.current) {
        window.Intercom?.('shutdown')
        identifiedUserIdRef.current = null
        bootAnonymous()
      }
      return () => {
        cancelled = true
      }
    }

    if (!canUsePrivateApi) {
      return () => {
        cancelled = true
      }
    }

    void syncIdentity()
    const refreshTimer = window.setInterval(() => {
      void syncIdentity()
    }, 8 * 60 * 1000)

    return () => {
      cancelled = true
      window.clearInterval(refreshTimer)
    }
  }, [appId, canUsePrivateApi, disabled, isAuthResolved, ready, userId])

  useEffect(() => {
    if (!appId || disabled || !ready) return
    window.Intercom?.('update', { current_url: window.location.href })
  }, [appId, disabled, pathname, ready])

  useEffect(() => {
    if (!conversation || !ready || !isAuthResolved || disabled) return
    const request = conversation
    const finish = () => {
      if (pendingConversation.current === request) pendingConversation.current = null
      setConversation(current => current === request ? null : current)
    }
    if (request.signal.aborted) { finish(); return }
    if (userId && identityFailedFor === userId) {
      request.reject(new Error('Intercom identity could not be verified'))
      finish()
      return
    }
    if (userId && (identityReadyFor?.userId !== userId || identifiedUserIdRef.current !== userId)) return
    let active = true
    const cancel = () => { active = false; finish() }
    request.signal.addEventListener('abort', cancel, { once: true })
    window.Intercom?.('ready', () => {
      if (!active || request.signal.aborted) return
      // A ready callback may survive a session switch; never send it twice.
      active = false
      try {
        window.Intercom?.('show')
        window.Intercom?.('startConversation', request.message)
        request.resolve()
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error('Intercom could not start the conversation'))
      }
      finish()
    })
    return () => {
      active = false
      request.signal.removeEventListener('abort', cancel)
    }
  }, [conversation, disabled, identityFailedFor, identityReadyFor, isAuthResolved, ready, userId])

  return null
}
