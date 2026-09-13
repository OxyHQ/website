import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { BloomThemeProvider } from '@oxy.so/bloom/theme'
import TrafficLegend from '../../src/components/dashboard/TrafficLegend'
import MapContainer from '../../src/components/dashboard/MapContainer'
import type { PlatformActivityEvent } from '../../src/api/platformActivityStore'
import '../../src/index.css'

const now = new Date().toISOString()
const base = { region: 'us-west-2', service: 'oxy-api', requests: 2, windowStartedAt: now, emittedAt: now }
const events: PlatformActivityEvent[] = [
  { ...base, sourceRegion: 'edge-mad', targetRegion: 'us-west-2', direction: 'inbound', scope: 'external', activityType: 'media' },
  { ...base, sourceRegion: 'us-west-2', targetRegion: 'edge-mad', direction: 'outbound', scope: 'external', activityType: 'media' },
  { ...base, sourceRegion: 'us-west-2', targetRegion: 'us-west-2', sourceService: 'alia', targetService: 'oxy-api', direction: 'inbound', scope: 'internal', activityType: 'ai' },
  { ...base, sourceRegion: 'us-west-2', targetRegion: 'us-west-2', sourceService: 'oxy-api', targetService: 'alia', direction: 'outbound', scope: 'internal', activityType: 'ai' },
]
function Fixture() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isGlobe, setGlobe] = useState(false)
  const [activity, setActivity] = useState(events)
  return <BloomThemeProvider mode={theme}><><button onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}>Toggle theme</button><button onClick={() => setGlobe(!isGlobe)}>Toggle map</button><button onClick={() => setActivity(current => [...current, ...current.slice(-4).map(event => ({ ...event, requests: 20, emittedAt: new Date(Date.parse(event.emittedAt) + 2_000).toISOString() }))])}>Next bucket</button><div style={{ width: 1200, height: 760 }}><TrafficLegend /><MapContainer isGlobe={isGlobe} activityEvents={activity} /></div></></BloomThemeProvider>
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<Fixture />)
