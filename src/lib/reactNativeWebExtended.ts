/**
 * Re-export of `react-native-web` augmented with the legacy native-only
 * exports that some React Native packages (notably `react-native-svg` and
 * `react-native-safe-area-context`) eagerly import even on the web target.
 *
 * The augmentations are minimal noops — every callsite that consumes
 * them branches on `Platform.OS === 'ios' | 'android'` first, so the web
 * code path never reads the augmented values. Providing them keeps the
 * bundler happy without introducing runtime behaviour changes.
 *
 * Types for `react-native-web` aren't shipped; the ambient declaration in
 * `src/types/react-native-web.d.ts` keeps `tsc` quiet for the few named
 * exports that the bundler actually needs to walk.
 *
 * The wildcard re-export below intentionally avoids `export *` (which
 * rolldown can't statically expand through `react-native-web`'s ESM
 * barrel) by enumerating every public name we know callers reach for.
 */

export {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  AppRegistry,
  AppState,
  Appearance,
  BackHandler,
  Button,
  CheckBox,
  Clipboard,
  DeviceEventEmitter,
  Dimensions,
  Easing,
  FlatList,
  I18nManager,
  Image,
  ImageBackground,
  InteractionManager,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  LogBox,
  Modal,
  NativeEventEmitter,
  NativeModules,
  PanResponder,
  Picker,
  PixelRatio,
  Platform,
  Pressable,
  ProgressBar,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  SectionList,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Touchable,
  TouchableHighlight,
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  Vibration,
  View,
  VirtualizedList,
  YellowBox,
  findNodeHandle,
  processColor,
  render,
  unmountComponentAtNode,
  unstable_createElement,
  useColorScheme,
  useLocaleContext,
  useWindowDimensions,
} from 'react-native-web'

interface TurboModuleProxy {
  get(name: string): unknown
  getEnforcing(name: string): unknown
}

const noopTurboModule = new Proxy(
  {},
  {
    get: () => undefined,
  },
)

/**
 * Stand-in for `react-native/Libraries/TurboModule/TurboModuleRegistry`.
 * Returns a benign module for any name. Web code paths never read from
 * the returned object — the call exists purely so eagerly-imported
 * native specs don't throw at bundle resolution time.
 */
export const TurboModuleRegistry: TurboModuleProxy = {
  get(name: string): unknown {
    void name
    return noopTurboModule
  },
  getEnforcing(name: string): unknown {
    void name
    return noopTurboModule
  },
}
