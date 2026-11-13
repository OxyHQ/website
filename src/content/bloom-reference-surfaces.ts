/** Modules that need an app host or publish configuration, rather than a standalone visual. */
export const bloomReferenceSurfaces: Readonly<Record<string, string>> = {
  'agent-reply':
    'The pieces of an agent’s reply (bubble, who answered, actions, team profile) need a conversation with agents behind them. See Agent Chat for the composed conversation.',
  'agent-avatar/catalog':
    'The per-asset avatar catalog: an app builds one from only the characters it draws and hands it to AgentAvatarProvider, so it ships no other avatar assets. It returns a catalog rather than rendering; see Agent Avatar for the drawn avatars.',
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
  canvas:
    'An infinite pan-and-zoom canvas with a background and snapping panels. It needs a full-screen app layout around it, and its regions are measured on a real screen.',
  'chart-cards/bar-list':
    'The ranked bar-list card as its own import, for bundles that avoid the rest of Chart Cards. See Chart Cards for the rendered cards.',
  'chart-cards/header':
    'The chart header and headline pieces as their own import. See Chart Cards for the composed cards.',
  'chart-cards/line':
    'The line chart card as its own import, for bundles that avoid the rest of Chart Cards. See Chart Cards for the rendered cards.',
  'chart-cards/stat-tiles':
    'The row of stat tiles as its own import. See Chart Cards for the composed cards.',
  'chart-cards/surface':
    'The chart card surface (frame and padding) the other chart cards sit on. See Chart Cards for the composed cards.',
  'overlay/back':
    'Hardware and browser back handling for overlays. It follows the device’s back button and navigation history, so it needs an app around it; see Dialog for an overlay that uses it.',
  'color-swatch-picker':
    'A wrapping row of colour swatches with one chosen, built on Choice List (one keyboard stop, arrows move, Space or Return chooses). Pass it colors, value, onValueChange and names for the spoken name of each swatch.',
  notifications:
    'The notifications screen and the push-permission gate need your notification data and an operating-system permission adapter behind them. Pass them through props; the screen draws the rows and every loading, error and empty state.',
  storage:
    'A typed, best-effort JSON key-value store (createStorage) with no visual output. Use it for per-namespace preferences in your own app code.',
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
  'icons/BookmarkFillIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/BookmarkIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/GifAttachmentIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/LikeFillIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/LikeIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/MediaAttachmentIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/ReplyIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/RepostIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
  'icons/ShareIcon':
    'One engagement icon as its own import, for bundles that avoid the rest of Icons. See Icons for the rendered icons.',
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
  'preferences/haptics-setting-row':
    'A settings row for the haptics preference. It reads and writes your app’s own preference store; see Preferences for the composed settings.',
  'preferences/video-autoplay-setting-row':
    'A settings row for the video autoplay preference. It reads and writes your app’s own preference store; see Preferences for the composed settings.',
  'row-actions':
    'Icon buttons and a “⋮” menu for one list row. It needs the row’s own actions and menu entries from your screen; see Settings List for rows it sits in.',
  'settings-modal/select':
    'A select sized to sit inside a settings row. It must be placed inside a Settings Modal row; see Settings Modal Rows for the composed rows.',
};
