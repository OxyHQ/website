import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { BloomThemeProvider } from '@oxy.so/bloom/theme'
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
  const [isGlobe, setGlobe] = useState(false)
  return <><button onClick={() => setGlobe(!isGlobe)}>Toggle map</button><div style={{ width: 1200, height: 760 }}><MapContainer isGlobe={isGlobe} activityEvents={events} /></div></>
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById('root')!)
if (import.meta.hot) import.meta.hot.data.root = root
root.render(<BloomThemeProvider mode="dark"><Fixture /></BloomThemeProvider>)
