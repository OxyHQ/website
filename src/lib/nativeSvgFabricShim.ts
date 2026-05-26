/**
 * Web shim for `react-native-svg`'s Fabric (new architecture) native
 * modules. The package eagerly imports
 * `react-native-svg/lib/module/fabric/NativeSvg{Renderable,View}Module`,
 * which calls `TurboModuleRegistry.getEnforcing(...)` — but
 * `react-native-web` doesn't export `TurboModuleRegistry`, so the build
 * blows up before any svg ever renders.
 *
 * The svg primitives that consume these modules (`Shape.measure*`,
 * `LocalSvg`, …) never run on web because their callsites are gated on
 * `Platform.OS === 'ios' | 'android'`. So a `null` default export is a
 * safe stand-in that lets the bundle succeed and the web svg pipeline
 * (which has its own DOM-based implementation) keep working.
 */

export default null as unknown as never
