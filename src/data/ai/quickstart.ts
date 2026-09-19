/**
 * The published quickstart snippets, in one place.
 *
 * One module rather than a string per page, because a snippet that appears on
 * `/ai` and again on `/ai/inference` and again on `/developers` is one contract
 * with three chances to drift. `scripts/ai-quickstart.test.ts` asserts the
 * shape every snippet has to keep: the documented base URL, an environment
 * variable for the credential, and never a literal key.
 *
 * The snippets describe the OpenAI-compatible surface because that is what the
 * service exposes; they do not imply the service is open for self-service
 * signup. The page's availability badge is what says that, from
 * `OXY_INFERENCE_AVAILABILITY`.
 */
import { INFERENCE_API_BASE } from './taxonomy'

export interface CodeSample {
  key: string
  label: string
  /** Highlighter hint; the site renders plain `<pre>`, so this is advisory. */
  language: string
  code: string
}

/** The environment variable every sample reads its credential from. */
export const CREDENTIAL_ENV_VAR = 'OXY_API_KEY'

export const quickstartSamples: CodeSample[] = [
  {
    key: 'curl',
    label: 'cURL',
    language: 'bash',
    code: `curl ${INFERENCE_API_BASE}/chat/completions \\
  -H "Authorization: Bearer $${CREDENTIAL_ENV_VAR}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "<publisher>/<model>",
    "messages": [{ "role": "user", "content": "Summarise this changelog." }]
  }'`,
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    language: 'typescript',
    code: `import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${INFERENCE_API_BASE}',
  apiKey: process.env.${CREDENTIAL_ENV_VAR},
})

const response = await client.chat.completions.create({
  model: '<publisher>/<model>',
  messages: [{ role: 'user', content: 'Summarise this changelog.' }],
})

console.log(response.choices[0]?.message.content)`,
  },
  {
    key: 'python',
    label: 'Python',
    language: 'python',
    code: `import os
from openai import OpenAI

client = OpenAI(
    base_url="${INFERENCE_API_BASE}",
    api_key=os.environ["${CREDENTIAL_ENV_VAR}"],
)

response = client.chat.completions.create(
    model="<publisher>/<model>",
    messages=[{"role": "user", "content": "Summarise this changelog."}],
)

print(response.choices[0].message.content)`,
  },
]

/** Secondary samples, so the first snippet stays the shortest thing that works. */
export const advancedSamples: CodeSample[] = [
  {
    key: 'streaming',
    label: 'Streaming',
    language: 'typescript',
    code: `const stream = await client.chat.completions.create({
  model: '<publisher>/<model>',
  messages: [{ role: 'user', content: 'Write a release note.' }],
  stream: true,
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}`,
  },
  {
    key: 'tools',
    label: 'Tools',
    language: 'typescript',
    code: `const response = await client.chat.completions.create({
  model: '<publisher>/<model>',
  messages: [{ role: 'user', content: 'What is the status of build 4182?' }],
  tools: [
    {
      type: 'function',
      function: {
        name: 'get_build',
        description: 'Look up a CI build by number',
        parameters: {
          type: 'object',
          properties: { number: { type: 'integer' } },
          required: ['number'],
        },
      },
    },
  ],
})`,
  },
  {
    key: 'structured',
    label: 'Structured output',
    language: 'typescript',
    code: `const response = await client.chat.completions.create({
  model: '<publisher>/<model>',
  messages: [{ role: 'user', content: 'Extract the release version and date.' }],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'release',
      schema: {
        type: 'object',
        properties: { version: { type: 'string' }, date: { type: 'string' } },
        required: ['version', 'date'],
        additionalProperties: false,
      },
    },
  },
})`,
  },
]

/**
 * The model id placeholder the samples use.
 *
 * It is a placeholder on purpose: no model name is published until the
 * catalogue is, and a snippet naming one would be the site inventing a model.
 * Once the catalogue has entries, `/ai/models` hands over a real id to copy.
 */
export const MODEL_ID_PLACEHOLDER = '<publisher>/<model>'
