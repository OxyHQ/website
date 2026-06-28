const ALLOWED_HTML_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h2',
  'h3',
  'h4',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
])

const ALLOWED_GLOBAL_ATTRIBUTES = new Set(['aria-label', 'role', 'title'])
const ALLOWED_LINK_ATTRIBUTES = new Set(['href', 'target', 'rel'])
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true

  try {
    return SAFE_URL_PROTOCOLS.has(new URL(trimmed).protocol)
  } catch {
    return false
  }
}

function sanitizeAttributes(element: Element): void {
  for (const attribute of Array.from(element.attributes)) {
    const name = attribute.name.toLowerCase()
    const value = attribute.value
    const isAllowedLinkAttribute = element.tagName.toLowerCase() === 'a' && ALLOWED_LINK_ATTRIBUTES.has(name)

    if (!ALLOWED_GLOBAL_ATTRIBUTES.has(name) && !isAllowedLinkAttribute) {
      element.removeAttribute(attribute.name)
      continue
    }

    if (name === 'href' && !isSafeUrl(value)) {
      element.removeAttribute(attribute.name)
    }

    if (name === 'target' && value !== '_blank') {
      element.removeAttribute(attribute.name)
    }
  }

  if (element.tagName.toLowerCase() === 'a' && element.getAttribute('target') === '_blank') {
    element.setAttribute('rel', 'noopener noreferrer')
  }
}

function sanitizeNode(node: Node): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element
      const tagName = element.tagName.toLowerCase()

      if (!ALLOWED_HTML_TAGS.has(tagName)) {
        element.replaceWith(...Array.from(element.childNodes))
        sanitizeNode(node)
        continue
      }

      sanitizeAttributes(element)
      sanitizeNode(element)
      continue
    }

    if (child.nodeType !== Node.TEXT_NODE) {
      child.remove()
    }
  }
}

export function sanitizeCmsHtml(content: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return escapeHtml(content)
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(content, 'text/html')
  sanitizeNode(document.body)
  return document.body.innerHTML
}
