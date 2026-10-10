import { useState } from 'react';
import { Button } from '@oxy.so/bloom/button';
import { RiAddLine } from '@oxy.so/bloom/icons/RiAddLine';
import { RiArrowLeftLine } from '@oxy.so/bloom/icons/RiArrowLeftLine';
import { TextFieldInput } from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import { LabeledTextField } from '../LabeledTextField';
import { usePage, useUpdatePage, type PageData, type PageSection } from '../../../api/hooks';

const PAGE_SLUGS = ['home', 'pricing', 'partners', 'help', 'ai', 'codea', 'os', 'newsroom'];

export default function PagesAdmin() {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  if (activeSlug) {
    return (
      <div>
        <Button
          appearance="plain"
          tone="neutral"
          leadingIcon={RiArrowLeftLine}
          onPress={() => setActiveSlug(null)}
          style={{ marginBottom: 16 }}
        >
          Back to pages
        </Button>
        <PageEditor slug={activeSlug} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground">Pages</h2>
      <p className="mt-1 text-sm text-muted-foreground">Edit page content and sections.</p>
      <div className="mt-6 flex flex-col gap-2">
        {PAGE_SLUGS.map((slug) => (
          <button
            key={slug}
            onClick={() => setActiveSlug(slug)}
            className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="text-sm font-medium text-foreground capitalize">{slug}</span>
            <span className="text-xs text-muted-foreground">/{slug === 'home' ? '' : slug}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PageEditor({ slug }: { slug: string }) {
  const { data, refetch } = usePage(slug);
  const updatePage = useUpdatePage(slug);
  const [form, setForm] = useState<PageData | null>(null);
  const [saving, setSaving] = useState(false);

  if (data && !form) setForm(JSON.parse(JSON.stringify(data)) as PageData);
  if (!form) return <p className="text-sm text-muted-foreground">Loading page...</p>;

  const save = async () => {
    setSaving(true);
    await updatePage.mutateAsync(form);
    await refetch();
    setSaving(false);
  };

  const updateSection = (
    idx: number,
    field: 'heading' | 'subheading' | 'content',
    value: string,
  ) => {
    const next: PageData = { ...form, sections: [...form.sections] };
    next.sections[idx] = { ...next.sections[idx], [field]: value };
    setForm(next);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground capitalize">{slug} page</h2>
      <div className="mt-6 flex flex-col gap-4">
        <LabeledTextField
          label="Title"
          value={form.title ?? ''}
          onValueChange={(title) => setForm({ ...form, title })}
        />
        <Textarea
          label="Description"
          value={form.description ?? ''}
          onValueChange={(description) => setForm({ ...form, description })}
          rows={2}
        />

        <h3 className="mt-4 text-sm font-semibold text-foreground">Prompt Phrases</h3>
        <p className="text-xs text-muted-foreground">
          Rotating placeholder text shown in the prompt input on this page.
        </p>
        {(() => {
          const phrases: string[] = form.promptPhrases ?? [];
          const setPhrases = (next: string[]) => setForm({ ...form, promptPhrases: next });
          return (
            <div className="flex flex-col gap-2">
              {phrases.map((phrase: string, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <TextFieldInput
                      label={`Prompt phrase ${i + 1}`}
                      value={phrase}
                      onValueChange={(value) => {
                        const next = [...phrases];
                        next[i] = value;
                        setPhrases(next);
                      }}
                      placeholder="Enter a prompt phrase…"
                    />
                  </div>
                  <Button
                    appearance="plain"
                    tone="neutral"
                    onPress={() => {
                      const next = [...phrases];
                      next.splice(i, 1);
                      setPhrases(next);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                appearance="plain"
                tone="accent"
                leadingIcon={RiAddLine}
                onPress={() => setPhrases([...phrases, ''])}
                style={{ alignSelf: 'flex-start' }}
              >
                Add phrase
              </Button>
            </div>
          );
        })()}

        <h3 className="mt-4 text-sm font-semibold text-foreground">Sections</h3>
        {(form.sections ?? []).map((section: PageSection, i: number) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">{section.type}</span>
              <span className="text-xs text-muted-foreground">order: {section.order}</span>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <TextFieldInput
                label="Heading"
                value={section.heading ?? ''}
                onValueChange={(v) => updateSection(i, 'heading', v)}
                placeholder="Heading"
              />
              <TextFieldInput
                label="Subheading"
                value={section.subheading ?? ''}
                onValueChange={(v) => updateSection(i, 'subheading', v)}
                placeholder="Subheading"
              />
              <Textarea
                accessibilityLabel="Content"
                value={section.content ?? ''}
                onValueChange={(v) => updateSection(i, 'content', v)}
                placeholder="Content"
                rows={3}
              />
            </div>
          </div>
        ))}

        <Button
          appearance="solid"
          tone="accent"
          onPress={save}
          disabled={saving}
          style={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
