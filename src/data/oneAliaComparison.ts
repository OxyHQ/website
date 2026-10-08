import catalogue from './one-alia-catalogue.json'

// Public Alia catalogue, checked 2026-10-09. Keep product features separate from
// One's monthly credits: a bundle includes an app tier, not a second AI allowance.
const GROUPS = [
  { title: 'Alia · AI assistance', features: ['File uploads & analysis', 'Agents', 'Skills', 'Roles & personas', 'Voice conversations'] },
  { title: 'Alia · Research & creation', features: ['Deep research', 'Shopping research', 'Web search & live data', 'Advanced research', 'Canvas', 'Extended thinking'] },
  { title: 'Alia · Automation & workflow', features: ['Custom instructions', 'Automations', 'File management', 'Memory import/export', 'Batch processing', 'Advanced automations'] },
  { title: 'Alia · Connected channels', features: ['WhatsApp', 'Discord'] },
] as const

export function getAliaComparisonGroups(tier: string) {
  const plan = catalogue.plans.find(plan => plan.name === tier)
  if (!plan) throw new Error(`No reviewed Alia catalogue for ${tier}`)
  const included = plan.features.flatMap(group => group.items)
  const allFeatures = catalogue.plans.flatMap(plan => plan.features.flatMap(group => group.items))
  const limit = (label: string, match: RegExp) => {
    const value = included.find(item => match.test(item.label))
    return { label, detail: value?.label ?? 'Not specified by Alia', confirmed: !!value }
  }
  return [
    ...GROUPS.map(group => ({
      title: group.title,
      items: group.features.map(label => {
        const feature = included.find(item => item.label === label)
        const description = allFeatures.find(item => item.label === label)?.description
        return { label, detail: feature ? description ?? 'Included' : 'Not included in this Alia tier', confirmed: !!feature }
      }),
    })),
    {
      title: 'Alia · Limits & support',
      items: [
        limit('Simultaneous tasks', /concurrent tasks$/),
        limit('Response length', /response length|output length/i),
        limit('Conversation context', /context windows/i),
        { label: 'Priority support', detail: included.some(item => item.label === 'Priority support') ? 'Faster responses from the Alia team' : 'Standard support', confirmed: included.some(item => item.label === 'Priority support') },
      ],
    },
  ]
}
