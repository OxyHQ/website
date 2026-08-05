import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { apiFetch } from '../../../api/client'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'

interface TrackedRepoRecord {
  _id: string
  owner: string
  repo: string
  displayName: string
  active: boolean
  featureBoard: boolean
  acceptsProposals: boolean
  lastSyncAt: string | null
  lastSyncError: string | null
}

interface NewRepoDraft {
  owner: string
  repo: string
  displayName: string
  active: boolean
  featureBoard: boolean
  acceptsProposals: boolean
}

function emptyDraft(): NewRepoDraft {
  return { owner: '', repo: '', displayName: '', active: false, featureBoard: true, acceptsProposals: true }
}

/**
 * The repositories the website tracks, and what each one is used for.
 *
 * One row drives two independent things, so each has its own switch: changelog
 * release sync, and the public feature board. They were never the same list,
 * and conflating them is how a repo added to publish releases would quietly
 * start accepting public issues.
 */
export default function ReposAdmin() {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<NewRepoDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ['tracked-repos'],
    queryFn: () => apiFetch<TrackedRepoRecord[]>('/changelog/repos'),
  })

  const repos = data ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tracked-repos'] })
    // The board's app list and its cached issues both come from these rows.
    queryClient.invalidateQueries({ queryKey: ['feature-apps'] })
    queryClient.invalidateQueries({ queryKey: ['admin-features'] })
  }

  const patch = async (repo: TrackedRepoRecord, fields: Partial<TrackedRepoRecord>) => {
    setError(null)
    setSavingId(repo._id)
    try {
      await apiFetch(`/changelog/repos/${repo._id}`, { method: 'PUT', body: JSON.stringify(fields) })
      invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update repository')
    } finally {
      setSavingId(null)
    }
  }

  const create = async () => {
    if (!draft) return
    setError(null)
    try {
      await apiFetch('/changelog/repos', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          displayName: draft.displayName.trim() || `${draft.owner}/${draft.repo}`,
        }),
      })
      invalidate()
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add repository')
    }
  }

  const deleteAction = useConfirmAction<TrackedRepoRecord>({
    onConfirm: async (repo) => {
      await apiFetch(`/changelog/repos/${repo._id}`, { method: 'DELETE' })
      invalidate()
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Repositories</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            GitHub repositories the site tracks. <span className="font-medium">Sync</span> pulls releases
            into the changelog. <span className="font-medium">Board</span> lists the repo's
            feature-request issues at /features and allows votes on them.{' '}
            <span className="font-medium">Proposals</span> lets signed-in visitors open an issue there
            from the site.
          </p>
        </div>
        {!draft && <PrimaryButton onPress={() => setDraft(emptyDraft())}>Add repository</PrimaryButton>}
      </div>

      {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {draft && (
        <div className="mt-6 rounded-2xl border border-border p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Owner</Label>
              <Input
                value={draft.owner}
                onChange={(e) => setDraft({ ...draft, owner: e.target.value.trim() })}
                placeholder="OxyHQ"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Repository</Label>
              <Input
                value={draft.repo}
                onChange={(e) => setDraft({ ...draft, repo: e.target.value.trim() })}
                placeholder="Mention"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Display name</Label>
              <Input
                value={draft.displayName}
                onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                placeholder="Mention"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              />
              Sync releases to the changelog
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={draft.featureBoard}
                onChange={(e) => setDraft({
                  ...draft,
                  featureBoard: e.target.checked,
                  acceptsProposals: e.target.checked && draft.acceptsProposals,
                })}
              />
              Show on the feature board
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={draft.acceptsProposals}
                disabled={!draft.featureBoard}
                onChange={(e) => setDraft({ ...draft, acceptsProposals: e.target.checked })}
              />
              Accept proposals from the site
            </label>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <PrimaryButton onPress={create} disabled={!draft.owner || !draft.repo}>Add</PrimaryButton>
            <SecondaryButton onPress={() => { setDraft(null); setError(null) }}>Cancel</SecondaryButton>
          </div>
        </div>
      )}

      {isPending && <p className="mt-6 text-sm text-muted-foreground">Loading...</p>}

      {!isPending && repos.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          No repositories tracked yet. Run <span className="font-mono">bun run seed:feature-board</span> to
          add the Oxy and FairCoin apps, or add one above.
        </p>
      )}

      {repos.length > 0 && (
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
          {repos.map((repo) => (
            <div key={repo._id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{repo.displayName}</div>
                <div className="truncate font-mono text-xs text-muted-foreground">
                  {repo.owner}/{repo.repo}
                </div>
                {repo.lastSyncError && (
                  <div className="truncate text-xs text-rose-600 dark:text-rose-400">{repo.lastSyncError}</div>
                )}
              </div>

              <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={repo.active}
                  disabled={savingId === repo._id}
                  onChange={(e) => patch(repo, { active: e.target.checked })}
                />
                Sync
              </label>
              <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={repo.featureBoard}
                  disabled={savingId === repo._id}
                  onChange={(e) => patch(repo, { featureBoard: e.target.checked })}
                />
                Board
              </label>
              <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={repo.acceptsProposals}
                  disabled={savingId === repo._id || !repo.featureBoard}
                  onChange={(e) => patch(repo, { acceptsProposals: e.target.checked })}
                />
                Proposals
              </label>

              <div className="shrink-0">
                <Button variant="ghost" size="small" onPress={() => deleteAction.request(repo)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Stop tracking ${deleteAction.target.displayName}?` : 'Stop tracking repository?'}
        description="Changelog entries already synced from it are kept. Its feature requests leave the board, and votes already cast on them are kept but stop being counted."
        confirmLabel="Remove"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
