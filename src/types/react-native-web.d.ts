/**
 * Declaration shim for `react-native-web`. The package doesn't ship its own
 * `.d.ts` types. The website's `src/lib/reactNativeWebExtended.ts` shim
 * enumerates every named export it forwards to the Vite alias, so we
 * declare each one as a permissive `unknown` here. Consumers that need
 * proper typing pull primitives from `@oxyhq/bloom`'s typed subpaths
 * instead, never directly from `react-native`.
 */
declare module 'react-native-web' {
  const m: unknown
  export default m
  export const AccessibilityInfo: unknown
  export const ActivityIndicator: unknown
  export const Alert: unknown
  export const Animated: unknown
  export const AppRegistry: unknown
  export const AppState: unknown
  export const Appearance: unknown
  export const BackHandler: unknown
  export const Button: unknown
  export const CheckBox: unknown
  export const Clipboard: unknown
  export const DeviceEventEmitter: unknown
  export const Dimensions: unknown
  export const Easing: unknown
  export const FlatList: unknown
  export const I18nManager: unknown
  export const Image: unknown
  export const ImageBackground: unknown
  export const InteractionManager: unknown
  export const Keyboard: unknown
  export const KeyboardAvoidingView: unknown
  export const LayoutAnimation: unknown
  export const Linking: unknown
  export const LogBox: unknown
  export const Modal: unknown
  export const NativeEventEmitter: unknown
  export const NativeModules: unknown
  export const PanResponder: unknown
  export const Picker: unknown
  export const PixelRatio: unknown
  export const Platform: unknown
  export const Pressable: unknown
  export const ProgressBar: unknown
  export const RefreshControl: unknown
  export const SafeAreaView: unknown
  export const ScrollView: unknown
  export const SectionList: unknown
  export const Share: unknown
  export const StatusBar: unknown
  export const StyleSheet: unknown
  export const Switch: unknown
  export const Text: unknown
  export const TextInput: unknown
  export const Touchable: unknown
  export const TouchableHighlight: unknown
  export const TouchableNativeFeedback: unknown
  export const TouchableOpacity: unknown
  export const TouchableWithoutFeedback: unknown
  export const UIManager: unknown
  export const Vibration: unknown
  export const View: unknown
  export const VirtualizedList: unknown
  export const YellowBox: unknown
  export const findNodeHandle: unknown
  export const processColor: unknown
  export const render: unknown
  export const unmountComponentAtNode: unknown
  export const unstable_createElement: unknown
  export const useColorScheme: unknown
  export const useLocaleContext: unknown
  export const useWindowDimensions: unknown
}
