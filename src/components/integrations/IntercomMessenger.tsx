import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@oxyhq/services'
import { apiFetch } from '../../api/client'
import { isFairCoinHost } from '../../lib/host'

type IntercomSettings = {
  app_id: string
  current_url?: string
  intercom_user_jwt?: string
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
  const identifiedUserIdRef = useRef<string | null>(null)
  const identityRequestRef = useRef(0)
  const userId = isAuthenticated && user?.id ? String(user.id) : null

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

    installIntercom(appId)
  }, [appId, disabled])

  useEffect(() => {
    if (!appId || disabled || !isAuthResolved) return

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
      } catch (error) {
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
  }, [appId, canUsePrivateApi, disabled, isAuthResolved, userId])

  useEffect(() => {
    if (!appId || disabled) return
    window.Intercom?.('update', { current_url: window.location.href })
  }, [appId, disabled, pathname])

  return null
}
