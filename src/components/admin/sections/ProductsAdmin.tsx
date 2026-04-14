import { useState } from 'react'
import { useProducts, type ProductRecord, type ProductCategory } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton, SecondaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Textarea } from '../../ui/shadcn/textarea'
import { Label } from '../../ui/shadcn/label'

function emptyProduct(): ProductRecord {
  return {
    productId: '',
    name: '',
    tagline: '',
    description: '',
    href: '',
    external: false,
    cta: 'Learn more',
    brand: '#7c3aed',
    brandForeground: '',
    mark: '',
    category: 'live',
    order: 0,
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ProductsAdmin() {
  const { data, refetch } = useProducts()
  const [editing, setEditing] = useState<ProductRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const products = data ?? []
  const liveProducts = products.filter((p) => p.category === 'live')
  const newProducts = products.filter((p) => p.category === 'in-development')

  const save = async () => {
    if (!editing) return
    setError(null)
    setSaving(true)
    try {
      const payload: Partial<ProductRecord> = { ...editing }
      if (!payload.brandForeground) delete payload.brandForeground
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
              <Label>CTA label</Label>
              <Input
                value={editing.cta}
                onChange={(e) => setEditing({ ...editing, cta: e.target.value })}
                placeholder="Explore Alia"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="product-external"
              type="checkbox"
              checked={editing.external}
              onChange={(e) => setEditing({ ...editing, external: e.target.checked })}
              className="size-4 rounded border border-border"
            />
            <Label htmlFor="product-external">External link (opens in a new tab)</Label>
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
              <Label>Mark letter</Label>
              <Input
                value={editing.mark}
                maxLength={2}
                onChange={(e) => setEditing({ ...editing, mark: e.target.value })}
                placeholder="A"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <select
                value={editing.category}
                onChange={(e) => setEditing({ ...editing, category: e.target.value as ProductCategory })}
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

          {/* Live preview */}
          <div className="mt-4 flex flex-col gap-2">
            <Label>Preview</Label>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
              <span
                className="flex size-11 items-center justify-center rounded-2xl text-lg font-semibold tracking-tight"
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
          <p className="mt-1 text-sm text-muted-foreground">Every card that appears on /products. Edit, reorder, or delete each one.</p>
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
                      <span className="font-mono">{product.productId}</span> · {product.href}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">#{product.order}</div>
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
