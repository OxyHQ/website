import type { PageSection } from '../api/hooks'

/**
 * Read one field of the first CMS page section of a given `type`, falling back
 * to the page's hard-coded copy when the section is missing or the field is
 * empty — an empty CMS entry still has to produce a complete page.
 */
function sectionField(
  sections: PageSection[] | undefined,
  type: string,
  field: 'heading' | 'subheading' | 'content',
  fallback: string,
): string {
  return sections?.find((s) => s.type === type)?.[field] || fallback
}

export function sectionHeading(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sectionField(sections, type, 'heading', fallback)
}

export function sectionSubheading(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sectionField(sections, type, 'subheading', fallback)
}

export function sectionContent(sections: PageSection[] | undefined, type: string, fallback: string): string {
  return sectionField(sections, type, 'content', fallback)
}
