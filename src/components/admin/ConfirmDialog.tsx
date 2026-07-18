import { type ReactNode } from 'react'
import { View } from 'react-native'
import { Dialog, type DialogControlProps } from '@oxyhq/bloom/dialog'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'

interface ConfirmDialogProps {
  /** Control returned by `useDialogControl()`. */
  control: DialogControlProps
  /** Optional `aria-label` describing the dialog purpose. */
  label?: string
  /** Heading shown in bold at the top. */
  title: string
  /** Body copy. Plain string or any React node (use a fragment for multi-line). */
  description?: ReactNode
  /** Label for the destructive / primary action. Defaults to "Confirm". */
  confirmLabel?: string
  /** Label for the dismiss action. Defaults to "Cancel". */
  cancelLabel?: string
  /**
   * Visual treatment for the confirm button. Use `'danger'` for delete-style
   * actions; defaults to `'primary'`.
   */
  tone?: 'primary' | 'danger'
  /**
   * Called when the user clicks the confirm button. The handler owns the dialog
   * lifecycle from here: it must close `control` itself once the action
   * succeeds, and report any failure through `error`. `useConfirmAction` does
   * both.
   */
  onConfirm: () => void | Promise<void>
  /** Disable the confirm button (e.g. while a delete request is in flight). */
  busy?: boolean
  /** Failure message from the last confirm attempt. Shown in place; the dialog stays open. */
  error?: string | null
}

/**
 * Reusable confirm dialog for the admin UI.
 *
 * Uses Bloom's unified `<Dialog>` (custom-children mode) for the portal,
 * backdrop, focus-trap and scroll-lock plumbing — but renders Tailwind-styled
 * DOM inside so it matches the rest of the admin (rather than using Bloom's
 * RN-styled declarative `title`/`actions` mode which would look out of place).
 *
 * Pair it with `useConfirmAction`, which owns the open/run/close lifecycle and
 * keeps the dialog open with an `error` when the action fails:
 *
 *   const deleteAction = useConfirmAction<Member>({
 *     onConfirm: (member) => apiFetch(`/team/${member._id}`, { method: 'DELETE' }),
 *   })
 *   ...
 *   <Button onPress={() => deleteAction.request(member)}>Delete</Button>
 *   <ConfirmDialog
 *     control={deleteAction.control}
 *     title="Delete team member?"
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     tone="danger"
 *     busy={deleteAction.busy}
 *     error={deleteAction.error}
 *     onConfirm={deleteAction.confirm}
 *   />
 */
export default function ConfirmDialog({
  control,
  label,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  busy = false,
  error = null,
}: ConfirmDialogProps) {
  return (
    <Dialog control={control} label={label ?? title}>
      <View style={{ padding: 24 }}>
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" size="small" onPress={() => control.close()} disabled={busy}>
              {cancelLabel}
            </Button>
            <PrimaryButton
              onPress={() => { void onConfirm() }}
              disabled={busy}
              className={tone === 'danger' ? '!bg-rose-600 hover:!bg-rose-700' : undefined}
            >
              {busy ? 'Working…' : confirmLabel}
            </PrimaryButton>
          </div>
        </div>
      </View>
    </Dialog>
  )
}
