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
  /** Open the dialog for a given item. */
  request: (target: T) => void
  /** Invoke `onConfirm(target)` then close the dialog. Wire this to ConfirmDialog.onConfirm. */
  confirm: () => Promise<void>
}

/**
 * Manages the "open confirm dialog -> run an async action -> close" lifecycle
 * for admin destructive operations. Pair with `<ConfirmDialog />`.
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
 *     onConfirm={deleteAction.confirm}
 *   />
 */
export function useConfirmAction<T>({ onConfirm }: UseConfirmActionOptions<T>): UseConfirmActionResult<T> {
  const control = Dialog.useDialogControl()
  const [target, setTarget] = useState<T | null>(null)
  const [busy, setBusy] = useState(false)

  const request = useCallback(
    (next: T) => {
      setTarget(next)
      control.open()
    },
    [control],
  )

  const confirm = useCallback(async () => {
    if (target === null) return
    setBusy(true)
    try {
      await onConfirm(target)
      setTarget(null)
    } finally {
      setBusy(false)
    }
  }, [onConfirm, target])

  return { control, target, busy, request, confirm }
}
