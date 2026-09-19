/**
 * What the dashboard browser tests expose on the page.
 *
 * The three tests patch the component's source as it is served and read the
 * result back through `window`, so they share one declaration: a second,
 * differently shaped `Window` augmentation in the same project is a type error,
 * and `any` casts were what hid that.
 */

export interface TestUniform {
  value: { image?: { width?: number }; toArray?(): number[] }
}

export interface TestArcObject {
  uuid: string
  material: { uniforms: { dashTranslate: { value: number } } }
  __dashAnimateStep?: number
}

export interface TestSceneObject {
  __globeObjType?: string
  children: TestArcObject[]
  material?: { uniforms?: Record<string, TestUniform | undefined> }
}

export interface TestGlobe {
  scene(): { traverse(visit: (object: TestSceneObject) => void): void }
  controls(): { autoRotate: boolean; dispatchEvent(event: { type: string }): void }
  pointOfView(view: { lat: number; lng: number; altitude: number }, ms: number): void
}

export interface CameraFrame { t: number; lat: number; lng: number; altitude: number }

export interface ArcSnapshot { uuid: string; phase: number; moving: boolean }

declare global {
  interface Window {
    /** Set by the patched component once three-globe is ready. */
    __testGlobe?: TestGlobe
    /** The arcs the component last handed to three-globe. */
    __testArcs: { id: string; color: string }[]
    /** Camera positions recorded by the patched camera loop. */
    __cameraFrames: CameraFrame[]
    /** The fixture's setter for the current activity batch. */
    setCameraEvents: (events: Record<string, unknown>[]) => void
    __pulseAnimations: (Animation | undefined)[]
    __arcSnapshot: ArcSnapshot[]
  }
}
