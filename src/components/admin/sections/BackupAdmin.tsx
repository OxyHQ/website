import { useState, useRef } from 'react'
import { PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { getAuthHeaders } from '../../../api/client'

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api'

interface ImportResult {
  success: boolean
  imported: Record<string, number>
}

export default function BackupAdmin() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setExporting(true)
    setStatus(null)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/backup`, { headers })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Export failed (${res.status})` }))
        throw new Error(body.error ?? `Export failed (${res.status})`)
      }

      const blob = await res.blob()
      const date = new Date().toISOString().split('T')[0]
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `oxy-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setStatus({ type: 'success', message: 'Backup exported successfully.' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setStatus({ type: 'error', message })
    } finally {
      setExporting(false)
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected
    e.target.value = ''

    if (!confirm('Are you sure? This will replace ALL existing CMS data with the backup contents. This action cannot be undone.')) {
      return
    }

    setImporting(true)
    setStatus(null)
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('collections' in parsed) ||
        !('version' in parsed)
      ) {
        throw new Error('Invalid backup file: missing required fields (version, collections)')
      }

      const headers = await getAuthHeaders()
      const res = await fetch(`${API_BASE}/backup`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: text,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Import failed (${res.status})` }))
        throw new Error(body.error ?? `Import failed (${res.status})`)
      }

      const result: ImportResult = await res.json()
      const total = Object.values(result.imported).reduce((sum, n) => sum + n, 0)
      setStatus({
        type: 'success',
        message: `Import complete: ${total} documents across ${Object.keys(result.imported).length} collections.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed'
      setStatus({ type: 'error', message })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Backup &amp; Import</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Export all CMS data as a JSON file or restore from a previous backup.
      </p>

      {status && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Export</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Download a complete backup of all CMS collections (navigation, footer, pages, posts, pricing, settings, and more).
          </p>
          <div className="mt-4">
            <PrimaryButton onPress={handleExport} disabled={exporting || importing}>
              {exporting ? 'Exporting...' : 'Export Backup'}
            </PrimaryButton>
          </div>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-foreground">Import</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Restore from a previously exported backup file. This will replace all existing data in every collection included in the backup.
          </p>
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
            <SecondaryButton onPress={handleImport} disabled={exporting || importing}>
              {importing ? 'Importing...' : 'Import Backup'}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
