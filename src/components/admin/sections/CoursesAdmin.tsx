import { useState } from 'react'
import {
  useCourses,
  useCategories,
  resolveCourseCategoryId,
  type CourseRecord,
  type CourseLesson,
  type CourseLevel,
  type CourseStatus,
} from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Switch } from '@oxyhq/bloom/switch'
import { Badge } from '@oxyhq/bloom/badge'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationFields } from '../TranslationEditor'
import MediaPicker from '../MediaPicker'

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function mediaIdString(cover: unknown): string {
  if (!cover) return ''
  if (typeof cover === 'string') return cover
  if (typeof cover === 'object' && cover !== null && '_id' in cover) {
    const id = (cover as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function stripRefsForEditing(course: CourseRecord): CourseRecord {
  return {
    ...course,
    coverImage: mediaIdString(course.coverImage) || null,
    category: resolveCourseCategoryId(course) || null,
  }
}

function emptyCourse(): CourseRecord {
  return {
    slug: '',
    title: '',
    summary: '',
    description: '',
    coverImage: null,
    category: null,
    level: 'beginner',
    durationMinutes: undefined,
    lessons: [],
    tags: [],
    featured: false,
    status: 'published',
    publishedAt: new Date().toISOString(),
    order: 0,
  }
}

function emptyLesson(order: number): CourseLesson {
  return {
    title: '',
    slug: '',
    content: '',
    order,
    videoUrl: '',
    durationMinutes: undefined,
  }
}

interface SavePayload {
  slug: string
  title: string
  summary: string
  description: string
  coverImage: string | null
  category: string | null
  level: CourseLevel
  durationMinutes?: number
  lessons: CourseLesson[]
  tags: string[]
  featured: boolean
  status: CourseStatus
  publishedAt: string
  order: number
}

function toPayload(course: CourseRecord): SavePayload {
  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    description: course.description,
    coverImage: mediaIdString(course.coverImage) || null,
    category: resolveCourseCategoryId(course) || null,
    level: course.level,
    durationMinutes: course.durationMinutes,
    lessons: course.lessons.map((lesson) => {
      const clean: CourseLesson = {
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        order: lesson.order,
      }
      if (lesson.videoUrl && lesson.videoUrl.length > 0) clean.videoUrl = lesson.videoUrl
      if (lesson.durationMinutes && lesson.durationMinutes > 0) clean.durationMinutes = lesson.durationMinutes
      return clean
    }),
    tags: course.tags,
    featured: course.featured,
    status: course.status,
    publishedAt: course.publishedAt,
    order: course.order,
  }
}

export default function CoursesAdmin() {
  const { data, refetch } = useCourses({ limit: 50, status: 'published' })
  const { data: draftData, refetch: refetchDrafts } = useCourses({ limit: 50, status: 'draft' })
  const { data: locales } = useLocales()
  const { data: categoriesData } = useCategories('generic')
  const categories = categoriesData ?? []
  const [editing, setEditing] = useState<CourseRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeLocale, setActiveLocale] = useState('')
  const [translating, setTranslating] = useState<CourseRecord | null>(null)

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'
  const courses = [...(data?.courses ?? []), ...(draftData?.courses ?? [])]
  const isDefault = !activeLocale || activeLocale === defaultLocale

  const refresh = async () => {
    await Promise.all([refetch(), refetchDrafts()])
  }

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload = toPayload(editing)
      if (editing._id) {
        await apiFetch(`/courses/${editing.slug}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/courses', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refresh()
      setEditing(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save course')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (slug: string) => {
    if (!confirm(`Delete course "${slug}"? This cannot be undone.`)) return
    await apiFetch(`/courses/${slug}`, { method: 'DELETE' })
    await refresh()
  }

  const updateLesson = (index: number, patch: Partial<CourseLesson>) => {
    if (!editing) return
    const nextLessons = editing.lessons.map((lesson, i) => i === index ? { ...lesson, ...patch } : lesson)
    setEditing({ ...editing, lessons: nextLessons })
  }

  const addLesson = () => {
    if (!editing) return
    setEditing({ ...editing, lessons: [...editing.lessons, emptyLesson(editing.lessons.length)] })
  }

  const removeLesson = (index: number) => {
    if (!editing) return
    const nextLessons = editing.lessons
      .filter((_, i) => i !== index)
      .map((lesson, i) => ({ ...lesson, order: i }))
    setEditing({ ...editing, lessons: nextLessons })
  }

  const moveLesson = (index: number, direction: -1 | 1) => {
    if (!editing) return
    const target = index + direction
    if (target < 0 || target >= editing.lessons.length) return
    const next = [...editing.lessons]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    setEditing({ ...editing, lessons: next.map((l, i) => ({ ...l, order: i })) })
  }

  if (editing) {
    const isNew = !editing._id
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isNew ? 'New course' : `Edit: ${editing.title}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Title"
              value={editing.title}
              onChange={(v) => setEditing({
                ...editing,
                title: v,
                ...(isNew && !editing.slug ? { slug: slugify(v) } : {}),
              })}
            />
            <Field
              label="Slug"
              value={editing.slug}
              onChange={(v) => setEditing({ ...editing, slug: slugify(v) })}
            />
          </div>

          <Field
            label="Summary"
            value={editing.summary}
            onChange={(v) => setEditing({ ...editing, summary: v })}
            textarea
          />
          <Field
            label="Description (Markdown)"
            value={editing.description}
            onChange={(v) => setEditing({ ...editing, description: v })}
            textarea
            rows={8}
          />

          <MediaPicker
            value={mediaIdString(editing.coverImage) || undefined}
            onChange={(id) => setEditing({ ...editing, coverImage: id ?? null })}
            label="Cover image"
            folder="academy"
            accept="image/*"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <select
                value={typeof editing.category === 'string' ? editing.category : ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value || null })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">— Select a category —</option>
                {categories.map((c) => (
                  <option key={c._id ?? c.slug} value={c._id ?? ''}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Level</Label>
              <select
                value={editing.level}
                onChange={(e) => setEditing({ ...editing, level: e.target.value as CourseLevel })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={editing.durationMinutes ?? ''}
                onChange={(e) => setEditing({
                  ...editing,
                  durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tags (comma-separated)"
              value={editing.tags.join(', ')}
              onChange={(v) => setEditing({ ...editing, tags: v.split(',').map((t) => t.trim()).filter(Boolean) })}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch value={editing.featured} onValueChange={(val) => setEditing({ ...editing, featured: val })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                value={editing.status === 'published'}
                onValueChange={(val) => setEditing({ ...editing, status: val ? 'published' : 'draft' })}
              />
              <Label>{editing.status === 'published' ? 'Published' : 'Draft'}</Label>
            </div>
          </div>

          {/* Lessons */}
          <div className="mt-2 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Lessons</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Embedded course lessons. Reorder with the arrows.
                </p>
              </div>
              <SecondaryButton onPress={addLesson} style={{ paddingBlock: 6, paddingInline: 12 }}>
                <span style={{ fontSize: 13 }}>Add lesson</span>
              </SecondaryButton>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {editing.lessons.length === 0 && (
                <p className="text-sm text-muted-foreground">No lessons yet.</p>
              )}
              {editing.lessons.map((lesson, index) => (
                <div key={index} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lesson {index + 1}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="small" onPress={() => moveLesson(index, -1)}>&uarr;</Button>
                      <Button variant="ghost" size="small" onPress={() => moveLesson(index, 1)}>&darr;</Button>
                      <Button variant="ghost" size="small" onPress={() => removeLesson(index)}>Remove</Button>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Field
                      label="Title"
                      value={lesson.title}
                      onChange={(v) => updateLesson(index, {
                        title: v,
                        ...(lesson.slug ? {} : { slug: slugify(v) }),
                      })}
                    />
                    <Field
                      label="Slug"
                      value={lesson.slug}
                      onChange={(v) => updateLesson(index, { slug: slugify(v) })}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Field
                      label="Video URL (optional)"
                      value={lesson.videoUrl ?? ''}
                      onChange={(v) => updateLesson(index, { videoUrl: v })}
                    />
                    <div className="flex flex-col gap-1.5">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={lesson.durationMinutes ?? ''}
                        onChange={(e) => updateLesson(index, {
                          durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                        })}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Content (Markdown)</Label>
                    <Textarea
                      value={lesson.content}
                      onChange={(e) => updateLesson(index, { content: e.target.value })}
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="mt-2 flex gap-3">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Publish' : 'Update'}
            </PrimaryButton>
            <SecondaryButton onPress={() => setEditing(null)}>Cancel</SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  if (translating && !isDefault) {
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setTranslating(null)}>&larr; Back</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Translate: {translating.title}</h2>
        <div className="mt-4">
          <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
        </div>
        <div className="mt-6">
          <TranslationFields
            collection="courses"
            documentId={translating._id ?? ''}
            locale={activeLocale}
            originalFields={translating}
            translatableFields={[
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'summary', label: 'Summary', type: 'textarea' },
              { key: 'description', label: 'Description (Markdown)', type: 'textarea' },
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">{courses.length} courses</p>
        </div>
        {isDefault && (
          <PrimaryButton onPress={() => setEditing(emptyCourse())}>New course</PrimaryButton>
        )}
      </div>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {courses.map((course) => {
          const categoryLabel = typeof course.category === 'object' && course.category?.label
            ? course.category.label
            : ''
          return (
            <div
              key={course._id ?? course.slug}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{course.title}</span>
                  {course.featured && <Badge color="primary">Featured</Badge>}
                  {course.status === 'draft' && <Badge color="warning">Draft</Badge>}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {categoryLabel && <span>{categoryLabel} &middot; </span>}
                  <span className="capitalize">{course.level}</span>
                  <span> &middot; {course.lessons.length} lessons</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDefault ? (
                  <>
                    <Button variant="ghost" size="small" onPress={() => setEditing(stripRefsForEditing(course))}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => remove(course.slug)}>Delete</Button>
                  </>
                ) : (
                  <Button variant="ghost" size="small" onPress={() => setTranslating(course)}>Translate</Button>
                )}
              </div>
            </div>
          )
        })}
        {courses.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No courses yet.</p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, rows }: {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {textarea
        ? <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 3} />
        : <Input value={value} onChange={(e) => onChange(e.target.value)} />
      }
    </div>
  )
}
