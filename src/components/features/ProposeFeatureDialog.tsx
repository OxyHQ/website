import { useState } from 'react'
import { Dialog } from '@oxyhq/bloom/dialog'
import { ExternalLink } from 'lucide-react'
import Button from '../ui/Button'
import { useProposeFeature, type FeatureAppOption, type FeatureAppsResponse } from '../../api/hooks'

interface ProposeFeatureDialogProps {
  open: boolean
  onClose: () => void
  apps: FeatureAppOption[]
  limits: FeatureAppsResponse['limits']
}

const fieldClasses =
  'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-muted-foreground'

/**
 * The proposal form.
 *
 * Submitting opens a real GitHub issue in the selected app's repository, so the
 * confirmation links straight to it: the board itself only picks the issue up
 * once GitHub's search index has it, which is not instant, and claiming
 * otherwise would look like the proposal had been lost.
 */
export default function ProposeFeatureDialog({ open, onClose, apps, limits }: ProposeFeatureDialogProps) {
  const targets = apps.filter((option) => option.acceptsProposals)
  const [chosenApp, setChosenApp] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const propose = useProposeFeature()

  // Derived rather than seeded into state: the apps arrive from a query, so
  // state initialised on the first render would keep an empty selection forever
  // when the dialog mounts before the list resolves.
  const app = chosenApp || targets[0]?.key || ''

  const trimmedTitle = title.trim()
  const trimmedBody = body.trim()
  const canSubmit =
    app !== '' &&
    trimmedTitle.length >= limits.titleMin &&
    trimmedTitle.length <= limits.titleMax &&
    trimmedBody.length >= limits.bodyMin &&
    trimmedBody.length <= limits.bodyMax &&
    !propose.isPending

  function handleClose() {
    setTitle('')
    setBody('')
    propose.reset()
    onClose()
  }

  function handleSubmit() {
    if (!canSubmit) return
    propose.mutate({ app, title: trimmedTitle, body: trimmedBody })
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={560}>
      <div className="w-full p-5 text-start">
        {propose.isSuccess ? (
          <div>
            <h2 className="text-start text-subheading-2">Proposal submitted</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              It is now issue #{propose.data.issueNumber} in {propose.data.app.displayName}. It joins the
              board once GitHub has indexed it, usually within a minute.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={propose.data.issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
              >
                View it on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Button variant="outline" size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-start text-subheading-2">Propose a feature</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This opens an issue on GitHub under your Oxy handle, where everyone can vote on it.
            </p>

            {targets.length === 0 ? (
              <p className="mt-5 text-sm text-muted-foreground">
                No app is accepting proposals from the website right now.
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">App</span>
                  <select
                    value={app}
                    onChange={(event) => setChosenApp(event.target.value)}
                    className={fieldClasses}
                  >
                    {targets.map((option) => (
                      <option key={option.key} value={option.key}>{option.displayName}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                    Title
                    <span className="text-xs font-normal text-muted-foreground">
                      {trimmedTitle.length}/{limits.titleMax}
                    </span>
                  </span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={limits.titleMax}
                    placeholder="What should we build?"
                    className={fieldClasses}
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between text-sm font-medium text-foreground">
                    Description
                    <span className="text-xs font-normal text-muted-foreground">
                      {trimmedBody.length}/{limits.bodyMax}
                    </span>
                  </span>
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={limits.bodyMax}
                    rows={7}
                    placeholder="What problem does it solve, and who has it? Markdown works."
                    className={`${fieldClasses} resize-y`}
                  />
                </label>

                {propose.isError && (
                  <p className="text-sm text-red-400">{propose.error.message}</p>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button variant="ghost" size="md" onClick={handleClose}>Cancel</Button>
                  <Button variant="primary" size="md" onClick={handleSubmit} disabled={!canSubmit}>
                    {propose.isPending ? 'Submitting…' : 'Submit proposal'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  )
}
