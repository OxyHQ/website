import { useState } from 'react'
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
        <label htmlFor="profile-bio" className="text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= BIO_MAX_LENGTH) {
              setBio(e.target.value)
            }
          }}
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Tell the community about yourself..."
        />
        <p className={`text-right text-xs ${charsRemaining < 20 ? 'text-red-400' : 'text-muted-foreground'}`}>
          {charsRemaining} characters remaining
        </p>
      </div>

      {/* Show activity toggle */}
      <label htmlFor="profile-show-activity" className="flex cursor-pointer items-center gap-3">
        <input
          id="profile-show-activity"
          type="checkbox"
          checked={showActivity}
          onChange={(e) => setShowActivity(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary accent-primary"
        />
        <span className="text-sm text-foreground">Show my activity publicly</span>
      </label>

      {/* Error message */}
      {updateProfile.isError && (
        <p className="text-sm text-red-400">
          Failed to save changes. Please try again.
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={updateProfile.isPending}
          className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {updateProfile.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
