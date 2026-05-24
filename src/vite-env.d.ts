/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module 'swiper/css' { const content: string; export default content }
declare module 'swiper/css/effect-cube' { const content: string; export default content }

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}

declare module '*.md' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}

