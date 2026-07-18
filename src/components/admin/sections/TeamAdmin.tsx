import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMediaItem } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import MediaPicker from '../MediaPicker'

/** Raw team member shape as returned by /api/team with avatar populated. */
interface TeamMemberRaw {
  _id?: string
  name: string
  slug: string
  role: string
  department: string
  bio: string
  avatar: string | { _id?: string; url?: string; thumbnails?: { sm?: string; md?: string; lg?: string } } | null
  order: number
  active: boolean
  socials: {
    linkedin?: string
    twitter?: string
    github?: string
    website?: string
  }
}

function mediaId(avatar: TeamMemberRaw['avatar']): string {
  if (!avatar) return ''
  if (typeof avatar === 'string') return avatar
  if (typeof avatar === 'object' && '_id' in avatar) {
    const id = avatar._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function mediaUrl(avatar: TeamMemberRaw['avatar']): string {
  if (!avatar) return ''
  if (typeof avatar === 'string') return avatar.startsWith('http') || avatar.startsWith('/') ? avatar : ''
  if (typeof avatar === 'object') {
    return avatar.thumbnails?.md || avatar.thumbnails?.sm || avatar.thumbnails?.lg || avatar.url || ''
  }
  return ''
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function emptyMember(): TeamMemberRaw {
  return {
    name: '',
    slug: '',
    role: '',
    department: '',
    bio: '',
    avatar: null,
    order: 0,
    active: true,
    socials: { linkedin: '', twitter: '', github: '', website: '' },
  }
}

/** Collapse populated avatar ref to a plain id string when starting to edit. */
function stripRefsForEditing(member: TeamMemberRaw): TeamMemberRaw {
  return { ...member, avatar: mediaId(member.avatar) || null }
}

/** Renders an avatar chip — when `avatar` is a plain id string it looks up the Media doc. */
function MemberAvatar({ member, size = 'md' }: { member: TeamMemberRaw; size?: 'sm' | 'md' }) {
  // When avatar is a plain id string (after stripRefsForEditing), pull the Media doc
  // so the preview renders the actual image.
  const avatarIdOrObject = member.avatar
  const needsLookup = typeof avatarIdOrObject === 'string' && avatarIdOrObject.length > 0 && !avatarIdOrObject.startsWith('http') && !avatarIdOrObject.startsWith('/')
  const { data: lookedUp } = useMediaItem(needsLookup ? avatarIdOrObject : '')
  const directUrl = mediaUrl(avatarIdOrObject)
  const lookedUpUrl = lookedUp ? (lookedUp.thumbnails?.md || lookedUp.thumbnails?.sm || lookedUp.url || '') : ''
  const url = directUrl || lookedUpUrl
  const sizeClass = size === 'sm' ? 'size-10' : 'size-12'
  const initials = member.name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || '?'

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-xs font-semibold text-muted-foreground ${sizeClass}`}
      aria-hidden="true"
    >
      {url ? (
        <img src={url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}

function SocialIcons({ socials }: { socials: TeamMemberRaw['socials'] }) {
  if (!socials) return null
  const entries: Array<{ key: keyof TeamMemberRaw['socials']; label: string }> = [
    { key: 'linkedin', label: 'in' },
    { key: 'twitter', label: 'tw' },
    { key: 'github', label: 'gh' },
    { key: 'website', label: 'www' },
  ]
  const present = entries.filter((e) => Boolean(socials[e.key]))
  if (present.length === 0) return null
  return (
    <div className="hidden items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground md:flex">
      {present.map((e) => (
        <span key={e.key} className="rounded border border-border px-1.5 py-0.5">{e.label}</span>
      ))}
    </div>
  )
}

export default function TeamAdmin() {
  // Fetch raw docs (bypassing the hook's `select` transform) so we keep the
  // populated avatar Media ref, which gives us both the _id for MediaPicker
  // and the thumbnail url for list previews without extra round-trips.
  const { data, refetch } = useQuery<TeamMemberRaw[]>({
    queryKey: ['team', 'admin', 'raw'],
    queryFn: () => apiFetch<TeamMemberRaw[]>('/team'),
    staleTime: 30_000,
  })

  const members = useMemo(() => data ?? [], [data])
  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const m of members) {
      if (m.department) set.add(m.department)
    }
    return [...set].sort()
  }, [members])

  const grouped = useMemo(() => {
    const map = new Map<string, TeamMemberRaw[]>()
    for (const m of members) {
      const key = m.department || 'Team'
      const list = map.get(key) ?? []
      list.push(m)
      map.set(key, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [members])

  const [editing, setEditing] = useState<TeamMemberRaw | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAction = useConfirmAction<TeamMemberRaw>({
    onConfirm: async (member) => {
      if (!member._id) return
      setError(null)
      try {
        await apiFetch(`/team/${member._id}`, { method: 'DELETE' })
        await refetch()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete team member')
      }
    },
  })

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: editing.name,
        slug: editing.slug,
        role: editing.role,
        department: editing.department,
        bio: editing.bio,
        avatar: mediaId(editing.avatar) || null,
        order: editing.order,
        active: editing.active,
        socials: {
          linkedin: editing.socials?.linkedin ?? '',
          twitter: editing.socials?.twitter ?? '',
          github: editing.socials?.github ?? '',
          website: editing.socials?.website ?? '',
        },
      }
      // Drop empty optional string fields before sending.
      if (!payload.department) delete payload.department
      if (!payload.bio) delete payload.bio
      if (!payload.avatar) delete payload.avatar
      const socials = payload.socials as Record<string, string>
      for (const key of Object.keys(socials)) {
        if (!socials[key]) delete socials[key]
      }
      if (Object.keys(socials).length === 0) delete payload.socials

      if (editing._id) {
        await apiFetch(`/team/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/team', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refetch()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team member')
    } finally {
      setSaving(false)
    }
  }

  const requestDelete = (member: TeamMemberRaw) => {
    if (!member._id) return
    deleteAction.request(member)
  }

  if (editing) {
    const isNew = !editing._id
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isNew ? 'New team member' : `Edit: ${editing.name}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value
                  setEditing({
                    ...editing,
                    name,
                    ...(isNew ? { slug: slugify(name) } : {}),
                  })
                }}
                placeholder="Ada Lovelace"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Slug</Label>
              <Input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                disabled={!isNew}
                className="font-mono"
              />
              {!isNew && <p className="text-xs text-muted-foreground">Slug is locked after creation.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Input
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                placeholder="Software Engineer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Department</Label>
              <Input
                list="team-departments"
                value={editing.department}
                onChange={(e) => setEditing({ ...editing, department: e.target.value })}
                placeholder="Engineering"
              />
              <datalist id="team-departments">
                {departments.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">Used to group members on the public /company/team page.</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Bio</Label>
            <Textarea
              value={editing.bio}
              onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
              rows={4}
              placeholder="Short paragraph describing this person's background and focus."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Avatar</Label>
            <MediaPicker
              value={mediaId(editing.avatar) || ''}
              onChange={(id) => setEditing({ ...editing, avatar: id ?? null })}
              folder="team"
              accept="image/*"
            />
            <p className="text-xs text-muted-foreground">Square portrait works best. Leave empty to show initials.</p>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Socials</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>LinkedIn</Label>
                <Input
                  value={editing.socials?.linkedin ?? ''}
                  onChange={(e) => setEditing({ ...editing, socials: { ...editing.socials, linkedin: e.target.value } })}
                  placeholder="https://linkedin.com/in/…"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Twitter / X</Label>
                <Input
                  value={editing.socials?.twitter ?? ''}
                  onChange={(e) => setEditing({ ...editing, socials: { ...editing.socials, twitter: e.target.value } })}
                  placeholder="https://x.com/…"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>GitHub</Label>
                <Input
                  value={editing.socials?.github ?? ''}
                  onChange={(e) => setEditing({ ...editing, socials: { ...editing.socials, github: e.target.value } })}
                  placeholder="https://github.com/…"
                  className="font-mono text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Website</Label>
                <Input
                  value={editing.socials?.website ?? ''}
                  onChange={(e) => setEditing({ ...editing, socials: { ...editing.socials, website: e.target.value } })}
                  placeholder="https://…"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first within a department.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Visibility</Label>
              <div className="flex h-9 items-center gap-2">
                <Switch value={editing.active} onValueChange={(val) => setEditing({ ...editing, active: val })} />
                <span className="text-sm text-muted-foreground">{editing.active ? 'Shown on /company/team' : 'Hidden'}</span>
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-2 flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <MemberAvatar member={editing} />
              <div>
                <div className="text-base font-medium text-foreground">{editing.name || 'Full name'}</div>
                <div className="text-sm text-muted-foreground">{editing.role || 'Role'}</div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex items-center gap-2">
            <PrimaryButton onPress={save} disabled={saving || !editing.name || !editing.role}>
              {saving ? 'Saving…' : 'Save changes'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Team</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? 'member' : 'members'} · powers the public /company/team page.
          </p>
        </div>
        <PrimaryButton onPress={() => setEditing(emptyMember())}>Add member</PrimaryButton>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

      {grouped.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        grouped.map(([dept, deptMembers]) => (
          <section key={dept} className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dept}</h3>
            <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {deptMembers.map((member) => (
                <div key={member._id ?? member.slug} className="flex items-center gap-4 px-4 py-3">
                  <MemberAvatar member={member} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{member.name}</span>
                      {!member.active && (
                        <span className="rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{member.slug}</span> · {member.role}
                    </div>
                  </div>
                  <SocialIcons socials={member.socials} />
                  <div className="shrink-0">
                    <Button variant="ghost" size="small" onPress={() => setEditing(stripRefsForEditing(member))}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => requestDelete(member)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete ${deleteAction.target.name}?` : 'Delete team member?'}
        description="This will remove the team member from the public /company/team page. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
