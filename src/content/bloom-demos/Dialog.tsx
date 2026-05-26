import * as Dialog from '@oxyhq/bloom/dialog'
import { PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Modal surface with backdrop, drag handle (sheet), and close affordance.',
}

export default function DialogDemo() {
  const control = Dialog.useDialogControl()
  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton onPress={() => control.open()}>Open dialog</PrimaryButton>
      <Dialog.Outer control={control}>
        <Dialog.Backdrop />
        <Dialog.Inner label="Confirm action">
          <Dialog.Handle />
          <div className="flex flex-col gap-3 p-2">
            <h3 className="text-base font-semibold text-foreground">Confirm action</h3>
            <p className="text-sm text-muted-foreground">
              This will remove the selected item. You can't undo this from the trash.
            </p>
            <div className="mt-2 flex justify-end gap-2">
              <SecondaryButton onPress={() => control.close()}>Cancel</SecondaryButton>
              <PrimaryButton onPress={() => control.close()}>Delete</PrimaryButton>
            </div>
          </div>
        </Dialog.Inner>
      </Dialog.Outer>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const title = typeof values.title === 'string' ? values.title : 'Confirm action'
  const description = typeof values.description === 'string' ? values.description : ''
  const confirmLabel = typeof values.confirmLabel === 'string' ? values.confirmLabel : 'Confirm'
  const cancelLabel = typeof values.cancelLabel === 'string' ? values.cancelLabel : 'Cancel'
  const control = Dialog.useDialogControl()
  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton onPress={() => control.open()}>Open dialog</PrimaryButton>
      <Dialog.Outer control={control}>
        <Dialog.Backdrop />
        <Dialog.Inner label={title}>
          <Dialog.Handle />
          <div className="flex flex-col gap-3 p-2">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
            <div className="mt-2 flex justify-end gap-2">
              <SecondaryButton onPress={() => control.close()}>{cancelLabel}</SecondaryButton>
              <PrimaryButton onPress={() => control.close()}>{confirmLabel}</PrimaryButton>
            </div>
          </div>
        </Dialog.Inner>
      </Dialog.Outer>
    </div>
  )
}
