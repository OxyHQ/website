import { useCallback, useState } from 'react'
import * as Dialog from '@oxyhq/bloom/dialog'

interface UseConfirmActionOptions<T> {
  /** Called once the user confirms. Should perform the destructive action. */
  onConfirm: (target: T) => void | Promise<void>
}

interface UseConfirmActionResult<T> {
  /** Pass this to `<ConfirmDialog control={...} />`. */
  control: Dialog.DialogControlProps
  /** The item the user is being asked about (null until `request` is called). */
  target: T | null
  /** True while `onConfirm` is in-flight. */
  busy: boolean
  /** Message from the last failed `confirm`, or null. Cleared by `request` and by a retry. */
  error: string | null
  /** Open the dialog for a given item. */
  request: (target: T) => void
  /** Invoke `onConfirm(target)`, closing the dialog only on success. Wire this to ConfirmDialog.onConfirm. */
  confirm: () => Promise<void>
}

/**
 * Manages the "open confirm dialog -> run an async action -> close" lifecycle
 * for admin destructive operations. Pair with `<ConfirmDialog />`.
 *
 * The dialog closes ONLY when `onConfirm` resolves. If it throws, the dialog
 * stays open and the message lands in `error` so the user can read it and
 * retry — a failed delete must never look like a successful one.
 *
 * Usage:
 *
 *   const deleteAction = useConfirmAction<Member>({
 *     onConfirm: async (member) => {
 *       await apiFetch(`/team/${member._id}`, { method: 'DELETE' })
 *       await refetch()
 *     },
 *   })
 *
 *   <Button onPress={() => deleteAction.request(member)}>Delete</Button>
 *
 *   <ConfirmDialog
 *     control={deleteAction.control}
 *     title={deleteAction.target ? `Delete ${deleteAction.target.name}?` : 'Delete?'}
 *     confirmLabel="Delete"
 *     tone="danger"
 *     busy={deleteAction.busy}
 *     error={deleteAction.error}
 *     onConfirm={deleteAction.confirm}
 *   />
 */
export function useConfirmAction<T>({ onConfirm }: UseConfirmActionOptions<T>): UseConfirmActionResult<T> {
  const control = Dialog.useDialogControl()
  const [target, setTarget] = useState<T | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = useCallback(
    (next: T) => {
      setTarget(next)
      setError(null)
      control.open()
    },
    [control],
  )

  const confirm = useCallback(async () => {
    if (target === null) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(target)
      setTarget(null)
      control.close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The action could not be completed.')
    } finally {
      setBusy(false)
    }
  }, [control, onConfirm, target])

  return { control, target, busy, error, request, confirm }
}
