import { useState } from 'react'
import { useMcpTokens, useCreateMcpToken, useRevokeMcpToken } from '../../../api/hooks'

export default function McpTokensAdmin() {
  const { data, isLoading } = useMcpTokens()
  const createMutation = useCreateMcpToken()
  const revokeMutation = useRevokeMcpToken()

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [expiresIn, setExpiresIn] = useState('')
  const [newToken, setNewToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const tokens = data ?? []

  const handleCreate = async () => {
    if (!name.trim()) return
    let expiresAt: string | undefined
    if (expiresIn) {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(expiresIn))
      expiresAt = d.toISOString()
    }
    const result = await createMutation.mutateAsync({ name: name.trim(), expiresAt })
    setNewToken((result as any).token)
    setName('')
    setExpiresIn('')
  }

  const handleCopy = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDismissToken = () => {
    setNewToken(null)
    setShowCreate(false)
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">API Tokens</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate tokens for MCP server access</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            Generate token
          </button>
        )}
      </div>

      {/* New token display */}
      {newToken && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">Your new API token</p>
          <p className="mt-1 text-xs text-muted-foreground">Copy this token now. It won't be shown again.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">{newToken}</code>
            <button onClick={handleCopy} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={handleDismissToken} className="mt-3 text-xs text-muted-foreground hover:text-foreground">
            I've saved the token, dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && !newToken && (
        <div className="mt-6 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">New token</h3>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude Web App"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Expires in (days)</span>
              <input
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                placeholder="Leave empty for no expiration"
                type="number"
                min="1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!name.trim() || createMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Generating...' : 'Generate'}
              </button>
              <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="mt-6 flex flex-col gap-2">
        {isLoading && <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && tokens.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No tokens yet. Generate one to connect your MCP client.</p>
        )}
        {tokens.map((t: any) => (
          <div key={t._id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                {t.revoked && <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-xs text-red-500">Revoked</span>}
                {!t.revoked && t.expiresAt && new Date(t.expiresAt) < new Date() && (
                  <span className="rounded bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-600">Expired</span>
                )}
                {!t.revoked && (!t.expiresAt || new Date(t.expiresAt) >= new Date()) && (
                  <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-600">Active</span>
                )}
              </div>
              <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                <span>Created by {t.createdBy}</span>
                <span>Created {formatDate(t.createdAt)}</span>
                <span>Last used {formatDate(t.lastUsedAt)}</span>
                {t.expiresAt && <span>Expires {formatDate(t.expiresAt)}</span>}
              </div>
            </div>
            {!t.revoked && (
              <button
                onClick={() => revokeMutation.mutate(t._id)}
                disabled={revokeMutation.isPending}
                className="shrink-0 rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
