import { NoteEditorHeader } from '@oxy.so/bloom/note-editor'

export default function NoteEditorExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <NoteEditorHeader title="A new idea" />
    </div>
  )
}
