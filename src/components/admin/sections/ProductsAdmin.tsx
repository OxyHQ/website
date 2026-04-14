import { useState } from 'react'
import { useProducts, type ProductRecord, type ProductLifecycle } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'
import MediaPicker from '../MediaPicker'

function mediaId(logo: unknown): string {
  if (!logo) return ''
  if (typeof logo === 'string') return logo
  if (typeof logo === 'object' && logo !== null && '_id' in logo) {
    const id = (logo as { _id?: unknown })._id
    return typeof id === 'string' ? id : ''
  }
  return ''
}

function emptyProduct(): ProductRecord {
  return {
    productId: '',
    name: '',
    tagline: '',
    description: '',
    href: '',
    healthUrl: '',
    external: false,
    cta: 'Learn more',
    brand: '#7c3aed',
    brandForeground: '',
    mark: '',
    logo: null,
    section: 'Apps',
    lifecycle: 'live',
    showOnProducts: true,
    showOnStatus: true,
    showInNav: true,
    order: 0,
  }
}

function normalizeLogo(product: ProductRecord): ProductRecord {
  return { ...product, logo: mediaId(product.logo) || null }
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const SECTION_SUGGESTIONS = [
  'Social & Communication',
  'Finance & Commerce',
  'Apps',
  'Infrastructure',
  'Developer',
]

export default function ProductsAdmin() {
  const { data, refetch } = useProducts()
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const products = (data ?? []).map(normalizeLogo)
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

  const remove = async (productId: string) => {
    if (!confirm(`Delete product "${productId}"? This cannot be undone.`)) return
    await apiFetch(`/products/${productId}`, { method: 'DELETE' })
    await refetch()
  }

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
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value
                  setEditing({
                    ...editing,
                    name,
                    ...(isNew && !editing.productId ? { productId: slugify(name) } : {}),
                    ...(isNew && !editing.mark ? { mark: name.charAt(0).toUpperCase() } : {}),
                  })
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Product id</Label>
              <Input
                value={editing.productId}
                onChange={(e) => setEditing({ ...editing, productId: slugify(e.target.value) })}
                disabled={!isNew}
                className="font-mono"
              />
              {!isNew && <p className="text-xs text-muted-foreground">Id cannot be changed after creation.</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tagline</Label>
            <Input
              value={editing.tagline}
              onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
              placeholder="Single-line tag shown above the title"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Href</Label>
              <Input
                value={editing.href}
                onChange={(e) => setEditing({ ...editing, href: e.target.value })}
                placeholder="/path or https://…"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Health URL (optional)</Label>
              <Input
                value={editing.healthUrl ?? ''}
                onChange={(e) => setEditing({ ...editing, healthUrl: e.target.value })}
                placeholder="Defaults to href if empty"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">Used by /status. Point at an unauthenticated health endpoint when possible.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>CTA label</Label>
              <Input
                value={editing.cta}
                onChange={(e) => setEditing({ ...editing, cta: e.target.value })}
                placeholder="Explore Alia"
              />
            </div>
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
                <Input
                  value={editing.brand}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                  placeholder="#7c3aed"
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Brand foreground (optional)</Label>
              <Input
                value={editing.brandForeground ?? ''}
                onChange={(e) => setEditing({ ...editing, brandForeground: e.target.value })}
                placeholder="#ffffff"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Mark letter (fallback)</Label>
              <Input
                value={editing.mark}
                maxLength={2}
                onChange={(e) => setEditing({ ...editing, mark: e.target.value })}
                placeholder="A"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Section</Label>
              <Input
                value={editing.section}
                onChange={(e) => setEditing({ ...editing, section: e.target.value })}
                list="product-sections"
              />
              <datalist id="product-sections">
                {SECTION_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Used by /products and /status grouping and the navbar.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Lifecycle</Label>
              <select
                value={editing.lifecycle}
                onChange={(e) => setEditing({ ...editing, lifecycle: e.target.value as ProductLifecycle })}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="live">Live (built and shipped)</option>
                <option value="in-development">In development (new)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Order</Label>
              <Input
                type="number"
                value={editing.order}
                onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })}
              />
            </div>
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
                <span className="text-sm">/products</span>
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
          </div>

          {/* Live preview */}
          <div className="mt-2 flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <span
                className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-semibold tracking-tight"
                style={{ backgroundColor: editing.brand, color: editing.brandForeground || '#ffffff' }}
                aria-hidden="true"
              >
                {editing.mark || '?'}
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{editing.tagline || 'tagline'}</div>
                <div className="text-lg font-medium text-foreground">{editing.name || 'Product name'}</div>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

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
          <p className="mt-1 text-sm text-muted-foreground">Single source of truth for every Oxy app. Powers /products, /status, and the ecosystem navbar dropdown.</p>
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
              {group.items.map((product) => (
                <div key={product.productId} className="flex items-center gap-4 px-4 py-3">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: product.brand, color: product.brandForeground || '#ffffff' }}
                    aria-hidden="true"
                  >
                    {product.mark}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{product.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{product.productId}</span> · {product.section} · {product.href}
                    </div>
                  </div>
                  <div className="hidden shrink-0 gap-1 text-xs text-muted-foreground md:flex">
                    {product.showOnProducts && <span>prod</span>}
                    {product.showOnStatus && <span>· status</span>}
                    {product.showInNav && <span>· nav</span>}
                  </div>
                  <div className="shrink-0">
                    <Button variant="ghost" size="small" onPress={() => setEditing(product)}>Edit</Button>
                    <Button variant="ghost" size="small" onPress={() => remove(product.productId)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
