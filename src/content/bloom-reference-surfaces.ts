/** Modules that need an app host or publish configuration, rather than a standalone visual. */
export const bloomReferenceSurfaces: Readonly<Record<string, string>> = {
  'agent-reply':
    'The pieces of an agent’s reply (bubble, who answered, actions, team profile) need a conversation with agents behind them. See Agent Chat for the composed conversation.',
  'avatar-flight':
    'Avatars that fly between anchors measure two places on a real screen. It needs an app layout with anchors; the Alia chat sheet is its reference host.',
  'checkout-sheet':
    'The checkout sheet walks a customer through an authoritative quote from your backend (items, tax, payment methods) and reports the result. It needs a host that supplies that quote.',
  'checkout-sheet/model':
    'The checkout view model: step order, sections and an empty draft, with no visual output. Use it beside the Checkout Sheet it drives.',
  'color-engine':
    'The React-free colour engine for servers and build scripts: theme roles from a seed colour, and seeds from image pixels. It returns values rather than rendering.',
  'conversation-sidebar':
    'A sidebar of conversations needs the account’s chats and agents. See Sidebar for the live panel it is built on.',
  voice:
    'Voice mode drives a live audio session (levels, transcript, mute). Pass it the state of your own voice session.',
  'app-shell/hooks':
    'Lightweight readers of the surrounding App Shell and its panels, for lists and route screens. They need a shell around them; see App Shell for the layout they read.',
  appearance:
    'Appearance scope inherited by the live component examples. Configure it around your app or a component subtree.',
  'color-presets': 'Colour preset definitions. See the colour recipes page for rendered palettes.',
  'connection-status':
    'Connection notifications and useNetworkStatus() (online, metered) follow the device’s connectivity, from one shared subscription. Integrate them with a toast host to preview network transitions.',
  'design-tokens': 'Design token values and CSS exports, used by every live example.',
  fonts:
    'Font loading infrastructure. It supplies typography rather than rendering a standalone control.',
  hooks:
    'Behaviour hooks for use inside your app: haptics, controllable state, reduced motion, roving focus, clipboard, keyboard visibility, textarea autosize, browser title and openHref.',
  'markdown/inline':
    'React-free inline Markdown parsing, visible-length counting and truncation for server and data pipelines. See Markdown for the rendered output.',
  'image-aspect-ratio-cache': 'Image measurement cache with no standalone visual output.',
  'image-resolver':
    'Image resolution provider. Wrap image components with your application’s resolver.',
  layout: 'Screen edge and scroll contexts used by app layouts.',
  locale:
    'Locale context for the labels rendered by Bloom components, and the number formatters (formatNumber, formatCurrency, formatPercent and more) they format with.',
  overlay:
    'Overlay hosts, backdrops and inert boundaries. See Dialog and Popover for interactive compositions.',
  portal:
    'Portal hosts render content supplied by other components. See Dialog for a complete example.',
  'panel-routing':
    'Route matching and slots that let an App Shell panel host its own routes. It needs an application router and a panel layout; see App Shell for the panels it fills.',
  'panel-routing/expo-router':
    'Panel routing adapter for an Expo Router application. This documentation uses React Router.',
  'preset-vars': 'Resolved preset variables for styling and server rendering.',
  provider: 'The app-level provider used by these live examples.',
  scroll: 'Scroll restoration requires a router adapter and navigation history.',
  'settings-modal/modal':
    'Modal-only import of SettingsModal. See Settings Modal for the interactive application settings example.',
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
  'video-view':
    'Inline video surface backed by the optional expo-video peer and an application-owned player. See Media Surface for the surrounding media composition.',
  viewport:
    'Visibility hooks and viewport bindings for application scroll containers. They coordinate offscreen rendering without a standalone visual.',
  'ambient-photo':
    'Web fork of the cross-fading ambient photo layer. It needs a stream of photos from your own source and a full-screen ambient screen to sit behind.',
  concentric:
    'Concentric radius helpers for nesting rounded shapes. They return values for your own layout rather than rendering a standalone control.',
  'drop-zone':
    'A drop target that takes what a user drags in. Pass it your own handlers for the files or items it should accept.',
  'engagement-bar':
    'A post action bar (reply, repost, like, vote) bound to your own counts and handlers. See Item for the rows it usually sits under.',
  'expandable-text':
    'Collapsible long text that measures its own clamp on a real screen. Give it the content and a line limit from your own feed.',
  'fact-strip':
    'A strip of key facts for a detail screen. It renders the values your own data supplies.',
  'icons/shared':
    'Shared icon building blocks used by the icon sets. See Icons for the rendered icons.',
  lockup: 'Brand lockup composition for a product header. It takes your own mark and wordmark.',
  'platform-surface':
    'Platform surface context that BloomProvider mounts from its platform prop. Set it on the provider rather than rendering it.',
  'share-sheet':
    'The share sheet drives the system share or a host-supplied target list. It needs an app host to hand the shared content to.',
  'tab-pager':
    'Pager navigation for an app shell, bound to a tab pager provider. It needs your destinations and an app layout; see App Shell for the layout it drives.',
  'tab-pager/expo-router':
    'Tab pager adapter for an Expo Router application. This documentation uses React Router.',
  'video-playback':
    'The app-wide authority that decides which video may play. It needs players and a scrolling list or pager in your own screens.',
  window:
    'Window chrome (controls and drag region) for a desktop-style app shell. It needs a real window host; see App Shell for the shell that mounts it.',
};
