import { useState } from 'react'
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native'
import { Button } from '@oxy.so/bloom/button'
import { Textarea } from '@oxy.so/bloom/textarea'
import { RiCloseLine } from '@oxy.so/bloom/icons/RiCloseLine'
import { RiSendPlaneLine } from '@oxy.so/bloom/icons/RiSendPlaneLine'
import { useCreateComment } from '../../api/hooks'

const MAX_LENGTH = 2000

interface CommentComposerProps {
  targetType: string
  targetId: string
  parentId?: string
  onSuccess?: () => void
  onCancel?: () => void
  autoFocus?: boolean
}

export default function CommentComposer({
  targetType,
  targetId,
  parentId,
  onSuccess,
  onCancel,
  autoFocus = false,
}: CommentComposerProps) {
  const [body, setBody] = useState('')
  const createComment = useCreateComment()

  const trimmed = body.trim()
  const remaining = MAX_LENGTH - trimmed.length
  const canSubmit = trimmed.length > 0 && remaining >= 0 && !createComment.isPending

  function handleSubmit() {
    if (!canSubmit) return
    createComment.mutate(
      { targetType, targetId, body: trimmed, parentId },
      {
        onSuccess: () => {
          setBody('')
          onSuccess?.()
        },
      },
    )
  }

  // On web the native event is the DOM KeyboardEvent, which carries the modifiers.
  function handleKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const { key, metaKey, ctrlKey } = e.nativeEvent as TextInputKeyPressEventData & Partial<Pick<KeyboardEvent, 'metaKey' | 'ctrlKey'>>
    if (key === 'Enter' && (metaKey || ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={body}
        onValueChange={setBody}
        onKeyPress={handleKeyPress}
        placeholder={parentId ? 'Write a reply...' : 'Join the discussion...'}
        autoFocus={autoFocus}
        rows={parentId ? 2 : 3}
        maxLength={MAX_LENGTH}
        resize="none"
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${remaining < 100 ? 'text-error-text' : 'text-muted-foreground'}`}
        >
          {remaining.toLocaleString()} characters remaining
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button appearance="plain" tone="neutral" leadingIcon={RiCloseLine} onPress={onCancel}>
              Cancel
            </Button>
          )}
          <Button appearance="solid" tone="accent" leadingIcon={RiSendPlaneLine} onPress={handleSubmit} disabled={!canSubmit}>
            {createComment.isPending ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  )
}
