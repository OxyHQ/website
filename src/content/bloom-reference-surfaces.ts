/** Modules that need an app host or publish configuration, rather than a standalone visual. */
export const bloomReferenceSurfaces: Readonly<Record<string, string>> = {
  appearance:
    'Appearance scope inherited by the live component examples. Configure it around your app or a component subtree.',
  'color-presets': 'Colour preset definitions. See the colour recipes page for rendered palettes.',
  'connection-status':
    'Connection notifications subscribe to your app’s connectivity state. Integrate them with a toast host to preview network transitions.',
  'design-tokens': 'Design token values and CSS exports, used by every live example.',
  fonts:
    'Font loading infrastructure. It supplies typography rather than rendering a standalone control.',
  hooks: 'Behaviour hooks and haptic configuration for use inside your app.',
  'image-aspect-ratio-cache': 'Image measurement cache with no standalone visual output.',
  'image-resolver':
    'Image resolution provider. Wrap image components with your application’s resolver.',
  layout: 'Screen edge and scroll contexts used by app layouts.',
  locale: 'Locale context for the labels rendered by Bloom components.',
  overlay:
    'Overlay hosts, backdrops and inert boundaries. See Dialog and Popover for interactive compositions.',
  portal:
    'Portal hosts render content supplied by other components. See Dialog for a complete example.',
  'preset-vars': 'Resolved preset variables for styling and server rendering.',
  provider: 'The app-level provider used by these live examples.',
  scroll: 'Scroll restoration requires a router adapter and navigation history.',
  'scroll/expo-router':
    'Scroll adapter for an Expo Router application. This documentation uses React Router.',
  styles: 'Styling utilities and surface-level context used by visual components.',
  surfaces: 'Application surface hosts. See Dialog and Bottom Sheet for interactive surfaces.',
  'tab-bar/expo-router':
    'Navigation adapter for Expo Router. See Tab Bar for the router-independent live component.',
  'tabs/expo-router':
    'Tabs adapter for Expo Router. See Tabs for the router-independent live component.',
  'tailwind-preset': 'Tailwind configuration exports with no standalone visual output.',
  teleport: 'Named portal hosts transport content between parts of an application.',
  theme:
    'Theme providers used by every live example. The website theme picker changes their appearance.',
};
