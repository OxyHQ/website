import { type ReactNode } from 'react'
import { View } from 'react-native'
import * as Dialog from '@oxyhq/bloom/dialog'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'

interface ConfirmDialogProps {
  /** Control returned by `Dialog.useDialogControl()`. */
  control: Dialog.DialogControlProps
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
  /** Called when the user clicks the confirm button. Dialog closes automatically afterwards. */
  onConfirm: () => void | Promise<void>
  /** Disable the confirm button (e.g. while a delete request is in flight). */
  busy?: boolean
}

/**
 * Reusable confirm dialog for the admin UI.
 *
 * Uses Bloom's Dialog primitives for the portal, backdrop, focus-trap and
 * scroll-lock plumbing — but renders Tailwind-styled DOM inside so it matches
 * the rest of the admin (rather than using Bloom's RN-styled Prompt.Basic
 * which would look out of place).
 *
 * Usage:
 *
 *   const confirmDelete = Dialog.useDialogControl()
 *   ...
 *   <Button onPress={() => confirmDelete.open()}>Delete</Button>
 *   <ConfirmDialog
 *     control={confirmDelete}
 *     title="Delete team member?"
 *     description="This cannot be undone."
 *     confirmLabel="Delete"
 *     tone="danger"
 *     onConfirm={() => deleteMember(id)}
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
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm()
    } finally {
      control.close()
    }
  }

  return (
    <Dialog.Outer control={control} webOptions={{ alignCenter: true }}>
      <Dialog.Inner label={label ?? title}>
        <View style={{ padding: 24 }}>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" size="small" onPress={() => control.close()} disabled={busy}>
                {cancelLabel}
              </Button>
              <PrimaryButton
                onPress={handleConfirm}
                disabled={busy}
                className={tone === 'danger' ? '!bg-rose-600 hover:!bg-rose-700' : undefined}
              >
                {busy ? 'Working…' : confirmLabel}
              </PrimaryButton>
            </div>
          </div>
        </View>
      </Dialog.Inner>
    </Dialog.Outer>
  )
}
