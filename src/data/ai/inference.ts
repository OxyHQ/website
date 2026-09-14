/**
 * Editorial copy for `/ai/inference` — the service page a technical evaluator
 * reads before deciding whether to ask for access.
 *
 * Every capability below carries its own availability rather than the page
 * carrying one, because "supports vision" and "will support vision" are
 * different answers to the question the reader came with, and a section-level
 * badge cannot tell them apart.
 */
import type { Availability } from '../../lib/ai/availability'

export interface SurfaceCapability {
  key: string
  title: string
  description: string
  availability: Availability
}

/** Modalities and API features, each with the state the site can defend. */
export const inferenceCapabilities: SurfaceCapability[] = [
  {
    key: 'text',
    title: 'Text generation',
    description: 'Chat-completion and completion-shaped requests over the models in the catalogue.',
    availability: 'private_preview',
  },
  {
    key: 'streaming',
    title: 'Streaming and cancellation',
    description:
      'Server-sent token streams, with a cancelled request billed for what it produced rather than what it was asked for.',
    availability: 'private_preview',
  },
  {
    key: 'tools',
    title: 'Tools and function calling',
    description: 'Tool definitions and tool-call responses, in the OpenAI-compatible shape.',
    availability: 'private_preview',
  },
  {
    key: 'structured',
    title: 'Structured output',
    description: 'JSON-schema-constrained responses for models that support the constraint.',
    availability: 'private_preview',
  },
  {
    key: 'vision',
    title: 'Vision',
    description: 'Image inputs, on models whose catalogue entry declares the capability.',
    availability: 'coming_soon',
  },
  {
    key: 'audio',
    title: 'Audio',
    description: 'Audio input and output.',
    availability: 'coming_soon',
  },
  {
    key: 'images',
    title: 'Image generation',
    description: 'Image output models.',
    availability: 'coming_soon',
  },
  {
    key: 'embeddings',
    title: 'Embeddings and reranking',
    description: 'Vector embeddings and reranking endpoints.',
    availability: 'coming_soon',
  },
  {
    key: 'batch',
    title: 'Batches',
    description: 'Asynchronous batch submission for throughput-shaped workloads.',
    availability: 'coming_soon',
  },
]

export interface ConceptEntry {
  term: string
  definition: string
}

/**
 * The vocabulary the API and the catalogue share.
 *
 * These six distinctions are the ones that break integrations when they blur:
 * pinning a model instead of a revision, or treating a routing profile as a
 * model, changes behaviour without changing the request.
 */
export const inferenceConcepts: ConceptEntry[] = [
  {
    term: 'Model',
    definition:
      'A published model, identified by a canonical id of the form publisher/model. The id is what you send; it does not change when the serving path does.',
  },
  {
    term: 'Revision',
    definition:
      'An immutable version of a model. Pinning a revision is how a deployment stops changing underneath you; not pinning one means you follow the model forward.',
  },
  {
    term: 'Serving provider',
    definition:
      'Who runs the hardware for a request. One model can have several, and which one served a request is disclosed rather than hidden.',
  },
  {
    term: 'Deployment',
    definition:
      'One provider serving one model in one region under one policy. Regions, retention and price can all differ between deployments of the same model.',
  },
  {
    term: 'Routing profile',
    definition:
      'A policy over models — optimise for price, for latency, for throughput, or for a balance. A profile is never a model, and the catalogue renders the two differently on purpose.',
  },
  {
    term: 'Usage receipt',
    definition:
      'What a response reports about itself: the request id, the model and deployment that served it, the units consumed and what they cost.',
  },
]

export interface OperationalTopic {
  title: string
  body: string
}

export const operationalTopics: OperationalTopic[] = [
  {
    title: 'Errors, retries and rate limits',
    body:
      'Errors carry a stable code and the request id, so a retry is a decision rather than a guess. Rate limits are per credential and are reported on the response before they are enforced by it.',
  },
  {
    title: 'Scopes and credential environments',
    body:
      'A credential is scoped to an application and to what that application is allowed to do. Separate credentials for separate environments is the supported shape; sharing one across them is not.',
  },
  {
    title: 'Same-model and cross-model fallback',
    body:
      'Falling back to another deployment of the same model preserves the answer. Falling back to a different model does not, so it happens only where an application has explicitly authorised it.',
  },
  {
    title: 'Bring your own key',
    body:
      'Use an existing provider contract through the same API. The commercial relationship stays yours; the integration, the attribution and the limits stay in one place.',
  },
]

/** The account → application → credential → call path, as the reader walks it. */
export const gettingStartedSteps: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: 'An Oxy Account',
    body: 'The organization that owns the applications, the balance and the invoices.',
  },
  {
    title: 'An Application',
    body:
      'One integration. Limits, routing constraints and usage are attributed per application, so two workloads do not share a blast radius.',
  },
  {
    title: 'A credential',
    body:
      'The key the SDK sends. Issued in Oxy Console, scoped to the application, and revocable without touching the code.',
  },
  {
    title: 'A call',
    body:
      'Point an OpenAI-compatible client at the Oxy base URL, send a catalogue model id, and read the usage receipt that comes back.',
  },
]
