/**
 * Web shim for `react-native/Libraries/Utilities/codegenNativeComponent`.
 *
 * `react-native-web` doesn't ship this path, but Bloom's BottomSheet (and
 * `react-native-svg`, transitively) imports it eagerly. On web the value is
 * never read because the consuming code branches on `Platform.OS === 'web'`
 * first — so returning a benign function is safe.
 */
function codegenNativeComponent<T = unknown>(name: string): T {
  void name
  // The shape consumers expect is a React component descriptor; an empty
  // function is fine because every callsite is dead on web.
  return (() => null) as unknown as T
}

export default codegenNativeComponent
