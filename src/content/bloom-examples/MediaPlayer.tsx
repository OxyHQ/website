import { useState } from 'react'
import { TransportControls } from '@oxy.so/bloom/media-player'

export default function MediaPlayerExample() {
  const [playing,setPlaying]=useState(false)
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <TransportControls playing={playing} onPlayPause={()=>setPlaying(!playing)} />
    </div>
  )
}
