import type { NewsroomPost, NewsroomPostSummary } from '../src/data/newsroom'
import {
  NEWSROOM_BOOTSTRAP_ID,
  NEWSROOM_INDEX_BOOTSTRAP_ID,
  newsroomBootstrapPayload,
  newsroomIndexBootstrapPayload,
} from '../src/lib/newsroom-bootstrap'

export const NEWSROOM_PRERENDER_MARKER = '<meta data-prerender-kind="newsroom-post">'

const HTML_TEXT_ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtmlText(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_TEXT_ESCAPES[character] ?? character)
}

/**
 * An inert template keeps the full post in the initial document without
 * requiring an inline executable script (and therefore without weakening CSP).
 * Entity escaping is decoded back to the original JSON by `textContent` when
 * `seedNewsroomBootstrap` reads it in the browser.
 */
export function renderNewsroomBootstrapTemplate(post: NewsroomPost): string {
  const payload = JSON.stringify(newsroomBootstrapPayload(post))
  return `<template id="${NEWSROOM_BOOTSTRAP_ID}">${escapeHtmlText(payload)}</template>`
}

export function renderNewsroomIndexBootstrapTemplate(posts: NewsroomPostSummary[]): string {
  const payload = JSON.stringify(newsroomIndexBootstrapPayload(posts))
  return `<template id="${NEWSROOM_INDEX_BOOTSTRAP_ID}">${escapeHtmlText(payload)}</template>`
}
