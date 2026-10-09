import { ZoomableMediaGallery } from '@oxy.so/bloom/zoomable-media-gallery'
import { Button } from '@oxy.so/bloom/button'
import { useRef } from 'react'
import type { ZoomableMediaGalleryHandle } from '@oxy.so/bloom/zoomable-media-gallery'

export default function ZoomableMediaGalleryExample() {
  const gallery=useRef<ZoomableMediaGalleryHandle>(null)
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><Button onPress={()=>gallery.current?.open([{uri:"/images/pricing/oxy-one-hero.png",alt:"Oxy artwork"}],0)}>Open image gallery</Button><ZoomableMediaGallery ref={gallery} /></div>)
}
