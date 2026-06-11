import { Dialog, useDialogControl } from '@oxyhq/bloom/dialog'
import { PrimaryButton } from '@oxyhq/bloom/button'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Centered modal with backdrop and declarative title, description and actions.',
}

export default function DialogDemo() {
  const control = useDialogControl()
  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton onPress={() => control.open()}>Open dialog</PrimaryButton>
      <Dialog
        control={control}
        title="Confirm action"
        description="This will remove the selected item. You can't undo this from the trash."
        actions={[
          { label: 'Cancel', color: 'cancel' },
          { label: 'Delete', color: 'destructive' },
        ]}
      />
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const title = typeof values.title === 'string' ? values.title : 'Confirm action'
  const description = typeof values.description === 'string' ? values.description : ''
  const confirmLabel = typeof values.confirmLabel === 'string' ? values.confirmLabel : 'Confirm'
  const cancelLabel = typeof values.cancelLabel === 'string' ? values.cancelLabel : 'Cancel'
  const control = useDialogControl()
  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton onPress={() => control.open()}>Open dialog</PrimaryButton>
      <Dialog
        control={control}
        title={title}
        description={description || undefined}
        actions={[
          { label: cancelLabel, color: 'cancel' },
          { label: confirmLabel, color: 'destructive' },
        ]}
      />
    </div>
  )
}
