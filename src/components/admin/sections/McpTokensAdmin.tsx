import { useState } from 'react'
import { useMcpTokens, useCreateMcpToken, useRevokeMcpToken } from '../../../api/hooks'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'

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
          <PrimaryButton onPress={() => setShowCreate(true)}>
            Generate token
          </PrimaryButton>
        )}
      </div>

      {/* New token display */}
      {newToken && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">Your new API token</p>
          <p className="mt-1 text-xs text-muted-foreground">Copy this token now. It won't be shown again.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground">{newToken}</code>
            <SecondaryButton size="small" onPress={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </SecondaryButton>
          </div>
          <div className="mt-3"><Button variant="ghost" size="small" onPress={handleDismissToken}>
            I've saved the token, dismiss
          </Button></div>
        </div>
      )}

      {/* Create form */}
      {showCreate && !newToken && (
        <div className="mt-6 rounded-lg border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">New token</h3>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Claude Web App"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Expires in (days)</Label>
              <Input
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                placeholder="Leave empty for no expiration"
                type="number"
                min="1"
              />
            </div>
            <div className="flex gap-3">
              <PrimaryButton onPress={handleCreate} disabled={!name.trim() || createMutation.isPending}>
                {createMutation.isPending ? 'Generating...' : 'Generate'}
              </PrimaryButton>
              <SecondaryButton onPress={() => setShowCreate(false)}>
                Cancel
              </SecondaryButton>
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
                {t.revoked && <Badge color="error">Revoked</Badge>}
                {!t.revoked && t.expiresAt && new Date(t.expiresAt) < new Date() && (
                  <Badge color="warning">Expired</Badge>
                )}
                {!t.revoked && (!t.expiresAt || new Date(t.expiresAt) >= new Date()) && (
                  <Badge color="success">Active</Badge>
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
              <Button variant="secondary" size="small" onPress={() => revokeMutation.mutate(t._id)} disabled={revokeMutation.isPending}>
                Revoke
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
