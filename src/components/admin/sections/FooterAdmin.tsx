import { useState, useEffect } from 'react'
import { useFooter } from '../../../api/hooks'
import { apiFetch } from '../../../api/client'
import { Button, PrimaryButton } from '@oxyhq/bloom/button'
import { Input } from '../../ui/shadcn/input'
import { Label } from '../../ui/shadcn/label'
import LocaleSwitcher, { useLocales } from '../LocaleSwitcher'
import { TranslationJsonEditor } from '../TranslationEditor'
import { type FooterColumn } from '../../../data/content'

interface FooterForm {
  _id?: string
  columns: FooterColumn[]
  socialLinks: unknown[]
  copyright: string
}

export default function FooterAdmin() {
  const { data, refetch } = useFooter()
  const { data: locales } = useLocales()
  const [form, setForm] = useState<FooterForm>({ columns: [], socialLinks: [], copyright: '' })
  const [saving, setSaving] = useState(false)
  const [activeLocale, setActiveLocale] = useState('')

  const defaultLocale = locales?.find(l => l.isDefault)?.code ?? 'en'

  useEffect(() => {
    if (data) setForm(JSON.parse(JSON.stringify(data)))
  }, [data])

  useEffect(() => {
    if (defaultLocale && !activeLocale) setActiveLocale(defaultLocale)
  }, [defaultLocale, activeLocale])

  const save = async () => {
    setSaving(true)
    await apiFetch('/footer', { method: 'PUT', body: JSON.stringify(form) })
    await refetch()
    setSaving(false)
  }

  const updateLink = (colIdx: number, linkIdx: number, field: string, value: string | boolean) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: [...next.columns[colIdx].links] }
    next.columns[colIdx].links[linkIdx] = { ...next.columns[colIdx].links[linkIdx], [field]: value }
    setForm(next)
  }

  const addLink = (colIdx: number) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: [...next.columns[colIdx].links, { label: '', href: '/' }] }
    setForm(next)
  }

  const removeLink = (colIdx: number, linkIdx: number) => {
    const next = { ...form, columns: [...form.columns] }
    next.columns[colIdx] = { ...next.columns[colIdx], links: next.columns[colIdx].links.filter((_, i) => i !== linkIdx) }
    setForm(next)
  }

  const isDefault = !activeLocale || activeLocale === defaultLocale

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Footer</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit footer columns and links.</p>

      <div className="mt-4">
        <LocaleSwitcher activeLocale={activeLocale} onLocaleChange={setActiveLocale} />
      </div>

      {!isDefault ? (
        <div className="mt-6">
          <TranslationJsonEditor
            collection="footer"
            documentId={data?._id ?? ''}
            locale={activeLocale}
          >
            {({ fields, setFields, save: saveTranslation, saving: savingTranslation }) => (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Editing <span className="font-medium text-foreground">{activeLocale.toUpperCase()}</span> translation.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>Copyright</Label>
                  <Input value={fields.copyright ?? ''} onChange={(e) => setFields({ ...fields, copyright: e.target.value })} placeholder={form.copyright} />
                </div>

                {form.columns.map((col, ci) => (
                  <div key={ci} className="rounded-xl border border-border p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Column: {col.title}</p>
                    <div className="flex flex-col gap-1.5">
                      <Label>Title</Label>
                      <Input
                        value={(fields.columns?.[ci]?.title) ?? ''}
                        onChange={(e) => {
                          const columns = [...(fields.columns ?? [])]
                          while (columns.length <= ci) columns.push({})
                          columns[ci] = { ...columns[ci], title: e.target.value }
                          setFields({ ...fields, columns })
                        }}
                        placeholder={col.title}
                      />
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {col.links.map((link, li) => (
                        <div key={li} className="flex flex-col gap-1">
                          <Label className="text-xs">Link: {link.label}</Label>
                          <Input
                            value={(fields.columns?.[ci]?.links?.[li]?.label) ?? ''}
                            onChange={(e) => {
                              const columns = [...(fields.columns ?? [])]
                              while (columns.length <= ci) columns.push({})
                              const links = [...(columns[ci]?.links ?? [])]
                              while (links.length <= li) links.push({})
                              links[li] = { ...links[li], label: e.target.value }
                              columns[ci] = { ...columns[ci], links }
                              setFields({ ...fields, columns })
                            }}
                            placeholder={link.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="mt-2 self-start">
                  <PrimaryButton onPress={saveTranslation} disabled={savingTranslation}>
                    {savingTranslation ? 'Saving...' : 'Save translation'}
                  </PrimaryButton>
                </div>
              </div>
            )}
          </TranslationJsonEditor>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Copyright text</Label>
            <Input value={form.copyright} onChange={(e) => setForm({ ...form, copyright: e.target.value })} />
          </div>

          {form.columns.map((col, ci) => (
            <div key={ci} className="rounded-xl border border-border p-4">
              <Input value={col.title} onChange={(e) => { const next = { ...form, columns: [...form.columns] }; next.columns[ci] = { ...col, title: e.target.value }; setForm(next) }} className="text-sm font-medium text-foreground bg-transparent border-none outline-none w-full shadow-none" />
              <div className="mt-2 flex flex-col gap-2">
                {col.links.map((link, li) => (
                  <div key={li} className="flex items-center gap-2">
                    <Input value={link.label} onChange={(e) => updateLink(ci, li, 'label', e.target.value)} placeholder="Label" className="flex-1 bg-transparent border-none text-sm text-foreground outline-none shadow-none" />
                    <Input value={link.href} onChange={(e) => updateLink(ci, li, 'href', e.target.value)} placeholder="/path" className="flex-1 bg-transparent border-none text-xs text-muted-foreground outline-none font-mono shadow-none" />
                    <Button variant="ghost" size="small" onPress={() => removeLink(ci, li)}>Remove</Button>
                  </div>
                ))}
                <div className="self-start"><Button variant="ghost" size="small" onPress={() => addLink(ci)}>+ Add link</Button></div>
              </div>
            </div>
          ))}

          <div className="self-start">
            <PrimaryButton onPress={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
