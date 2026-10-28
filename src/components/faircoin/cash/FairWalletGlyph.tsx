/** Original FAIRWallet glyphs from @expo/vector-icons / MaterialCommunityIcons.
 * Source: FairCoinOfficial/FAIRWallet at 7f2cb20 (MIT).
 */
const glyphs = {
  'bell-ring-outline': '\u{f009f}',
  wallet: '\udb81\udd84',
  'wallet-outline': '\udb82\udfdd',
  'wallet-bifold-outline': '\udb87\udc59',
  'chevron-down': '\udb80\udd40',
  'cloud-check-outline': '\udb86\udfec',
  'credit-card-plus': '\udb83\udff2',
  'credit-card-plus-outline': '\udb81\ude76',
  'arrow-up': '\udb80\udc5d',
  'arrow-down': '\udb80\udc45',
  'arrow-left': '\udb80\udc4d',
  plus: '\udb81\udc15',
  'map-outline': '\udb82\udd82',
  'cog-outline': '\udb82\udcbb',
  'qrcode-scan': '\udb81\udc33',
  'account-outline': '\udb80\udc13',
  fingerprint: '\udb80\ude37',
  'backspace-outline': '\udb82\udf5c',
  wifi: '\udb81\udda9',
  signal: '\udb81\udca2',
  battery: '\udb80\udc79',
  'shield-key-outline': '\udb82\udfc5',
} as const;
export function WalletGlyph({
  name,
  size = 22,
  className = '',
}: {
  name: keyof typeof glyphs;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`fairwallet-glyph shrink-0 ${className}`}
      style={{ fontSize: size, width: size, height: size, lineHeight: 1 }}
    >
      {glyphs[name]}
    </span>
  );
}

export function FairCoinMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="19.97 23.31 344.56 344.56"
      className={`shrink-0 text-primary ${className}`}
    >
      <path
        fill="currentColor"
        d="M 154.753906 28.324219 C 101.808594 38.011719 62.726562 65.066406 40.179688 107.988281 C 25.148438 136.382812 19.972656 161.769531 21.308594 199.847656 C 22.808594 246.28125 35.835938 279.351562 64.0625 308.578125 C 88.949219 334.464844 119.679688 349.832031 158.929688 355.675781 C 226.238281 365.863281 293.378906 342.984375 328.953125 297.886719 C 340.644531 283.023438 353.171875 257.304688 358.179688 237.929688 C 362.855469 220.058594 364.527344 181.144531 361.519531 160.765625 C 354.003906 109.160156 324.945312 66.902344 281.6875 45.191406 C 268.160156 38.34375 245.277344 31.164062 227.90625 28.324219 C 208.699219 25.316406 171.789062 25.316406 154.753906 28.324219 Z M 285.359375 109.660156 C 286.695312 115.339844 290.039062 149.746094 289.371094 150.246094 C 288.035156 151.414062 90.617188 186.320312 89.785156 185.484375 C 88.613281 184.484375 83.9375 142.5625 84.773438 141.558594 C 85.777344 140.726562 274.839844 106.320312 280.015625 106.152344 C 283.523438 105.984375 284.859375 106.820312 285.359375 109.660156 Z M 298.386719 218.222656 C 299.722656 231.414062 300.726562 242.273438 300.726562 242.273438 C 300.558594 242.4375 255.132812 250.789062 199.515625 260.8125 C 135.378906 272.335938 98.300781 278.347656 97.96875 277.34375 C 96.964844 272.835938 92.957031 232.082031 93.625 231.414062 C 94.292969 230.746094 288.199219 195.007812 293.210938 194.671875 C 295.382812 194.503906 296.21875 198.511719 298.386719 218.222656 Z M 298.386719 218.222656 "
      />
    </svg>
  );
}

export function WalletSendGlyph({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 text-primary ${className}`}
      style={{ transform: 'scaleX(-1)' }}
    >
      <path
        fill="currentColor"
        d="M22.513 3.576C21.826 2.552 20.617 2 19.384 2H4.621c-1.474 0-2.878.818-3.46 2.173-.6 1.398-.297 2.935.784 3.997l3.359 3.295a1 1 0 0 0 1.195.156l8.522-4.849a1 1 0 1 1 .988 1.738l-8.526 4.851a1 1 0 0 0-.477 1.104l1.218 5.038c.343 1.418 1.487 2.534 2.927 2.766.208.034.412.051.616.051 1.26 0 2.401-.644 3.066-1.763l7.796-13.118a3.572 3.572 0 0 0-.116-3.863Z"
      />
    </svg>
  );
}

export function WalletReceiveGlyph({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      className={`shrink-0 text-primary ${className}`}
    >
      <path
        fill="currentColor"
        d="M429.5-493.83 399-524q-14.83-14.83-35.08-14.83t-35.59 15.16Q312-508.5 312-488.75t16.32 36.04L444.5-336.83q14.98 15.16 35.44 15.16 20.45 0 35.89-15.16l116.34-116.34Q648-468 648.08-488.33q.09-20.34-16.08-35.67-15.17-15.33-35.42-15.33T561-524l-30.17 30.17V-608.5q0-20.78-14.83-35.64T480-659q-21.17 0-35.83 14.86-14.67 14.86-14.67 35.64v114.67Zm50.54 435.16q-87.61 0-164.44-32.93-76.82-32.93-133.96-90.16Q124.5-239 91.58-315.71q-32.91-76.71-32.91-164.25 0-88.28 32.93-165.11 32.93-76.82 90.16-133.79 57.24-56.97 133.95-90.06Q392.42-902 479.96-902q88.28 0 165.11 33.18 76.83 33.17 133.8 90.16 56.96 56.99 90.05 133.7Q902-568.24 902-480.04q0 87.61-33.1 164.44-33.09 76.82-90.16 133.96-57.07 57.14-133.78 90.06-76.72 32.91-164.92 32.91Z"
      />
    </svg>
  );
}
