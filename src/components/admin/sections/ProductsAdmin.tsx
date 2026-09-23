import { useState } from 'react'
import { Link } from '../../../lib/navigation'
import {
  useProducts,
  useCategories,
  useMediaItem,
  resolveProductCategoryId,
  type ProductRecord,
  type ProductLifecycle,
} from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxy.so/bloom/button'
import { LabeledTextField } from '../LabeledTextField'
import { Textarea } from '@oxy.so/bloom/textarea'
import { Label } from '@oxy.so/bloom/label'
import ConfirmDialog from '../ConfirmDialog'
import { useConfirmAction } from '../useConfirmAction'
import MediaPicker from '../MediaPicker'
import OptionSelect from '../../ui/OptionSelect'

function mediaId(logo: unknown): string {
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (typeof logo === 'object' && logo !== null && '_id' in logo) {
    const id = (logo as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function mediaUrl(logo: unknown): string {
  if (!logo) return ''
  if (typeof logo === 'string') return logo.startsWith('http') || logo.startsWith('/') ? logo : ''
  if (typeof logo === 'object' && logo !== null) {
    const obj = logo as { url?: string; thumbnails?: { sm?: string; md?: string; lg?: string } }
    return obj.url || obj.thumbnails?.lg || obj.thumbnails?.md || obj.thumbnails?.sm || ''
  }
  return ''
}

function ProductMark({ product, size = 'md' }: { product: ProductRecord; size?: 'sm' | 'md' }) {
  // When logo is a plain id string (list view after normalizeLogo), pull the Media doc
  // so we can render the actual image instead of just the letter mark.
  const logoIdOrObject = product.logo
  const needsLookup = typeof logoIdOrObject === 'string' && logoIdOrObject.length > 0
  const { data: lookedUp } = useMediaItem(needsLookup ? (logoIdOrObject as string) : '')
  const directUrl = mediaUrl(logoIdOrObject)
  const logoUrl = directUrl || mediaUrl(lookedUp)
  const hasLogo = Boolean(logoUrl)
  const sizeClass = size === 'sm' ? 'size-10 rounded-xl text-sm' : 'size-11 rounded-2xl text-lg'
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden font-semibold tracking-tight ${sizeClass} ${
        hasLogo ? 'bg-surface border border-border/60' : ''
      }`}
      style={hasLogo ? undefined : { backgroundColor: product.brand, color: product.brandForeground || '#ffffff' }}
      aria-hidden="true"
    >
      {hasLogo ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        product.mark || '?'
      )}
    </span>
  )
}

function emptyProduct(): ProductRecord {
  return {
    productId: '',
    name: '',
    tagline: '',
    description: '',
    href: '',
    landingUrl: '',
    healthUrl: '',
    external: false,
    cta: 'Learn more',
    brand: '#7c3aed',
    brandForeground: '',
    mark: '',
    logo: null,
    category: null,
    section: 'apps',
    lifecycle: 'live',
    showOnProducts: true,
    showOnStatus: true,
    showInNav: true,
    navOpensApp: false,
    order: 0,
  }
}

// Only collapse populated refs to plain id strings when we're about to
// start editing — the list view keeps the full populated refs so we can
// render labels/logos instantly without round-trips.
function stripRefsForEditing(product: ProductRecord): ProductRecord {
  return {
    ...product,
    logo: mediaId(product.logo) || null,
    category: resolveProductCategoryId(product) || null,
  }
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function ProductsAdmin() {
  const { data, refetch } = useProducts()
  const { data: categoriesData } = useCategories('apps')
  const categories = categoriesData ?? []
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const products = data ?? []
  const liveProducts = products.filter((p) => p.lifecycle === 'live')
  const newProducts = products.filter((p) => p.lifecycle === 'in-development')

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload: Partial<ProductRecord> = { ...editing }
      if (!payload.brandForeground) delete payload.brandForeground
      if (!payload.healthUrl) delete payload.healthUrl
      if (!payload.landingUrl) delete payload.landingUrl
      if (editing._id) {
        await apiFetch(`/products/${editing.productId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) })
      }
      await refetch()
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const deleteAction = useConfirmAction<ProductRecord>({
    onConfirm: async (product) => {
      await apiFetch(`/products/${product.productId}`, { method: 'DELETE' })
      await refetch()
    },
  })

  if (editing) {
    const isNew = !editing._id
    return (
      <div>
        <div className="mb-4">
          <Button variant="ghost" size="small" onPress={() => setEditing(null)}>&larr; Back to list</Button>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isNew ? 'New product' : `Edit: ${editing.name}`}
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <LabeledTextField
              label="Name"
              value={editing.name}
              onValueChange={(name) => {
                setEditing({
                  ...editing,
                  name,
                  ...(isNew && !editing.productId ? { productId: slugify(name) } : {}),
                  ...(isNew && !editing.mark ? { mark: name.charAt(0).toUpperCase() } : {}),
                })
              }}
            />
            <div className="flex flex-col gap-1.5">
              <LabeledTextField
                label="Product id"
                value={editing.productId}
                onValueChange={(value) => setEditing({ ...editing, productId: slugify(value) })}
                disabled={!isNew}
              />
              {!isNew && <p className="text-xs text-muted-foreground">Id cannot be changed after creation.</p>}
            </div>
          </div>

          <LabeledTextField
            label="Tagline"
            value={editing.tagline}
            onValueChange={(tagline) => setEditing({ ...editing, tagline })}
            placeholder="Single-line tag shown above the title"
          />

          <Textarea
            label="Description"
            value={editing.description}
            onValueChange={(description) => setEditing({ ...editing, description })}
            rows={3}
          />

          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1.5">
              <LabeledTextField
                label="App URL"
                value={editing.href}
                onValueChange={(href) => setEditing({ ...editing, href })}
                placeholder="https://alia.onl/"
              />
              <p className="text-xs text-muted-foreground">The actual running app, where "Open" buttons go. External URL or internal path.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <LabeledTextField
                label="Landing page on oxy.so (optional)"
                value={editing.landingUrl ?? ''}
                onValueChange={(landingUrl) => setEditing({ ...editing, landingUrl })}
                placeholder="/alia"
              />
              <p className="text-xs text-muted-foreground">Local marketing/learn-more page on this site. When set, the /apps card and navbar link here first.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <LabeledTextField
                label="Health URL (optional)"
                value={editing.healthUrl ?? ''}
                onValueChange={(healthUrl) => setEditing({ ...editing, healthUrl })}
                placeholder="Defaults to App URL if empty"
              />
              <p className="text-xs text-muted-foreground">Used by /status. Point at an unauthenticated health endpoint when possible.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <LabeledTextField
              label="CTA label"
              value={editing.cta}
              onValueChange={(cta) => setEditing({ ...editing, cta })}
              placeholder="Explore Alia"
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                id="product-external"
                type="checkbox"
                checked={editing.external}
                onChange={(e) => setEditing({ ...editing, external: e.target.checked })}
                className="size-4 rounded border border-border"
              />
              <Label htmlFor="product-external">External link (opens in a new tab)</Label>
            </div>
          </div>

          {/* Logo picker */}
          <div className="flex flex-col gap-1.5">
            <Label>Logo</Label>
            <MediaPicker
              value={mediaId(editing.logo) || ''}
              onChange={(id) => setEditing({ ...editing, logo: id ?? null })}
              folder="products"
              accept="image/*"
            />
            <p className="text-xs text-muted-foreground">Upload or pick a square app icon. When set, it replaces the letter mark.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Brand color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editing.brand || '#000000'}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                  className="h-9 w-12 rounded border border-border"
                />
                <LabeledTextField
                  label="Brand color"
                  value={editing.brand}
                  onValueChange={(brand) => setEditing({ ...editing, brand })}
                  placeholder="#7c3aed"
                />
              </div>
            </div>
            <LabeledTextField
              label="Brand foreground (optional)"
              value={editing.brandForeground ?? ''}
              onValueChange={(brandForeground) => setEditing({ ...editing, brandForeground })}
              placeholder="#ffffff"
            />
            <LabeledTextField
              label="Mark letter (fallback)"
              value={editing.mark}
              maxLength={2}
              onValueChange={(mark) => setEditing({ ...editing, mark })}
              placeholder="A"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <OptionSelect
                label="Category"
                value={typeof editing.category === 'string' ? editing.category : ''}
                onValueChange={(value) => setEditing({ ...editing, category: value || null })}
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories.map((c) => ({ value: c._id ?? '', label: c.label })),
                ]}
                emptyIsPlaceholder
              />
              <p className="text-xs text-muted-foreground">
                Manage in <Link to="/admin/categories" className="underline underline-offset-2 hover:text-foreground">Categories</Link>.
                Drives grouping on /apps, /status, and the Ecosystem navbar dropdown.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lifecycle</Label>
              <OptionSelect
                label="Lifecycle"
                value={editing.lifecycle}
                onValueChange={(value) => setEditing({ ...editing, lifecycle: value as ProductLifecycle })}
                options={[
                  { value: 'live', label: 'Live (built and shipped)' },
                  { value: 'in-development', label: 'In development (new)' },
                ]}
              />
            </div>
            <LabeledTextField
              label="Order"
              inputMode="numeric"
              value={String(editing.order)}
              onValueChange={(value) => setEditing({ ...editing, order: Number(value) })}
            />
          </div>

          {/* Surface toggles */}
          <div className="rounded-xl border border-border p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Surfaces</div>
            <p className="mt-1 text-xs text-muted-foreground">Which public surfaces should this product appear on?</p>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.showOnProducts}
                  onChange={(e) => setEditing({ ...editing, showOnProducts: e.target.checked })}
                  className="size-4 rounded border border-border"
                />
                <span className="text-sm">/apps</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.showOnStatus}
                  onChange={(e) => setEditing({ ...editing, showOnStatus: e.target.checked })}
                  className="size-4 rounded border border-border"
                />
                <span className="text-sm">/status</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.showInNav}
                  onChange={(e) => setEditing({ ...editing, showInNav: e.target.checked })}
                  className="size-4 rounded border border-border"
                />
                <span className="text-sm">Navbar</span>
              </label>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={editing.navOpensApp}
                  onChange={(e) => setEditing({ ...editing, navOpensApp: e.target.checked })}
                  className="mt-0.5 size-4 rounded border border-border"
                />
                <span className="text-sm">
                  Navbar links straight to the app
                  <span className="block text-xs text-muted-foreground">
                    Off by default: the dropdown opens the local landing page (when set) so visitors stay on oxy.so first. Turn this on to skip the landing page and jump directly to the running app URL.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-2 flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <ProductMark product={editing} />
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{editing.tagline || 'tagline'}</div>
                <div className="text-lg font-medium text-foreground">{editing.name || 'Product name'}</div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-error-text">{error}</p>}

          <div className="flex items-center gap-2">
            <PrimaryButton onPress={save} disabled={saving}>
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
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">Single source of truth for every Oxy app. Powers /apps, /status, and the ecosystem navbar dropdown.</p>
        </div>
        <PrimaryButton onPress={() => setEditing(emptyProduct())}>Add product</PrimaryButton>
      </div>

      {[
        { label: 'Built and shipped', items: liveProducts },
        { label: 'New and in development', items: newProducts },
      ].map((group) => (
        <section key={group.label} className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
          {group.items.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing in this group yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
              {group.items.map((product) => {
                const categoryLabel = categories.find((c) => c.slug === product.section)?.label ?? product.section
                return (
                <div key={product.productId} className="flex items-center gap-4 px-4 py-3">
                  <ProductMark product={product} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{product.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{product.productId}</span> · {categoryLabel} · {product.href}
                    </div>
                  </div>
                  <div className="hidden shrink-0 gap-1 text-xs text-muted-foreground md:flex">
                    {product.showOnProducts && <span>prod</span>}
                    {product.showOnStatus && <span>· status</span>}
                    {product.showInNav && <span>· nav</span>}
                  </div>
                  <div className="shrink-0">
                    <Button variant="ghost" size="small" onPress={() => setEditing(stripRefsForEditing(product))}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => deleteAction.request(product)}>Delete</Button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </section>
      ))}

      <ConfirmDialog
        control={deleteAction.control}
        title={deleteAction.target ? `Delete “${deleteAction.target.name || deleteAction.target.productId}”?` : 'Delete product?'}
        description="This permanently removes the product entry. This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        busy={deleteAction.busy}
        error={deleteAction.error}
        onConfirm={deleteAction.confirm}
      />
    </div>
  )
}
