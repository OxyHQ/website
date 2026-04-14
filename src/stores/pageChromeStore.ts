import { create } from 'zustand'

interface PageChromeState {
  heroVisible: boolean
  footerVisible: boolean
  setHeroVisible: (visible: boolean) => void
  setFooterVisible: (visible: boolean) => void
}

/**
 * Shared UI-chrome state. Surfaces (hero banner, footer) publish their
 * in-view status here; chrome that floats over the page (the fixed prompt
 * bar) reads it to decide when to hide itself. Pure zustand store — no
 * provider, no effects in consumers.
 */
export const usePageChromeStore = create<PageChromeState>((set) => ({
  heroVisible: false,
  footerVisible: false,
  setHeroVisible: (visible) => set({ heroVisible: visible }),
  setFooterVisible: (visible) => set({ footerVisible: visible }),
}))
