import { useState } from 'react'
import { Button } from '@oxy.so/bloom/button'
import { Checkbox } from '@oxy.so/bloom/checkbox'
import { Textarea } from '@oxy.so/bloom/textarea'
import { useUpdateMyProfile } from '../../api/hooks'

interface ProfileEditFormProps {
  currentBio: string
  currentShowActivity: boolean
  onSuccess: () => void
  onCancel: () => void
}

const BIO_MAX_LENGTH = 280

export default function ProfileEditForm({ currentBio, currentShowActivity, onSuccess, onCancel }: ProfileEditFormProps) {
  const [bio, setBio] = useState(currentBio)
  const [showActivity, setShowActivity] = useState(currentShowActivity)
  const updateProfile = useUpdateMyProfile()

  function handleSave() {
    updateProfile.mutate(
      { bio, showActivity },
      { onSuccess },
    )
  }

  const charsRemaining = BIO_MAX_LENGTH - bio.length

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface/50 p-6">
      <h2 className="text-lg font-semibold text-foreground">Edit profile</h2>

      {/* Bio textarea */}
      <div className="flex flex-col gap-1.5">
        <Textarea
          label="Bio"
          value={bio}
          onValueChange={(next) => {
            if (next.length <= BIO_MAX_LENGTH) {
              setBio(next)
            }
          }}
          rows={3}
          resize="none"
          placeholder="Tell the community about yourself..."
        />
        <p className={`text-right text-xs ${charsRemaining < 20 ? 'text-error-text' : 'text-muted-foreground'}`}>
          {charsRemaining} characters remaining
        </p>
      </div>

      {/* Show activity toggle */}
      <Checkbox
        label="Show my activity publicly"
        checked={showActivity}
        onCheckedChange={setShowActivity}
      />

      {/* Error message */}
      {updateProfile.isError && (
        <p className="text-sm text-error-text">
          Failed to save changes. Please try again.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button appearance="outline" tone="neutral" onPress={onCancel} disabled={updateProfile.isPending}>
          Cancel
        </Button>
        <Button appearance="solid" tone="accent" onPress={handleSave} disabled={updateProfile.isPending}>
          {updateProfile.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
