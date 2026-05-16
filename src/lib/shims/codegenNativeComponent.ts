/**
 * Web shim for `react-native/Libraries/Utilities/codegenNativeComponent`.
 *
 * Some React Native libraries (notably `react-native-safe-area-context`, which
 * Bloom UI's Dialog primitives depend on) import this RN-only helper at the
 * top of their files. The `react-native-web` shim doesn't ship it, so the
 * Vite/Rolldown production build fails with "No such file or directory".
 *
 * On the web the codegen path is never actually invoked at runtime — the web
 * fork of those libraries swaps the native view for a regular `<View>` long
 * before the codegen path matters. So we just return a placeholder factory.
 */
export default function codegenNativeComponent<T>(_name: string): T {
  // Returning an empty object is enough for the static evaluation phase. Any
  // codepath that actually uses the native component value won't run on web.
  return {} as T
}
