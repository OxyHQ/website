/** DOM adaptation of FAIRWallet's NativeWind screens, not a connected wallet.
 * Reference: FairCoinOfficial/FAIRWallet@7f2cb20; see fairwallet-demo.sources.json.
 * Measurements are original app points on a 390px canvas, scaled by LandingPhone.
 */
import { FairCoinMark, WalletGlyph, WalletReceiveGlyph, WalletSendGlyph } from './FairWalletGlyph';

export function WalletHome({ activity = true }: { activity?: boolean }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center">
          <span className="mr-2.5 flex size-9 items-center justify-center rounded-xl bg-primary text-background">
            <WalletGlyph name="wallet" size={18} />
          </span>
          <span className="text-xl font-semibold">FAIRWallet</span>
          <WalletGlyph name="chevron-down" size={20} className="text-muted-foreground" />
        </div>
        <WalletGlyph name="cloud-check-outline" size={24} className="text-primary" />
      </div>
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-end">
          <FairCoinMark size={40} className="mr-1.5 mb-[11.52px]" />
          <span className="fairwallet-amount text-[64px] leading-[1.2] tracking-tight">512.7</span>
        </div>
        <p className="mt-1 text-base text-muted-foreground">≈ $251.65</p>
        <span className="mt-3 inline-block rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs font-bold text-muted-foreground">
          +0.0% today
        </span>
      </div>
      <div className="flex gap-2.5 px-4 pb-4">
        {(['Send', 'Receive', 'Buy', 'Pockets'] as const).map((label) => (
          <div
            key={label}
            className="flex min-w-0 flex-1 flex-col items-start rounded-3xl border border-border bg-surface px-3.5 py-4 text-primary"
          >
            {label === 'Send' ? (
              <WalletSendGlyph />
            ) : label === 'Receive' ? (
              <WalletReceiveGlyph />
            ) : (
              <WalletGlyph name={label === 'Buy' ? 'credit-card-plus' : 'wallet-bifold-outline'} />
            )}
            <span className="mt-1.5 text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-start gap-3 rounded-[28px] border border-border bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WalletGlyph name="bell-ring-outline" size={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Get paid alerts</p>
            <p className="mt-1 text-xs leading-4 text-muted-foreground">
              Turn on notifications to know the moment you receive FairCoin.
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-b border-border px-4 text-sm font-medium">
        {['Overview', 'Activity'].map((label, i) => (
          <span
            key={label}
            className={`px-4 py-3 border-b-2 ${Number(activity) === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            {label}
          </span>
        ))}
      </div>
      {activity ? <WalletActivity /> : <WalletOverview />}
    </>
  );
}

function WalletActivity() {
  return (
    <div className="pt-3">
      {[
        {
          day: 'Today',
          rows: [
            { type: 'Received', amount: '+12.5', address: 'fRa7Kw…9Jm2Qx', time: '2m ago' },
            { type: 'Sent', amount: '−4', address: 'fPq3Hs…8Vn6Bc', time: '1h ago' },
          ],
        },
        {
          day: 'Yesterday',
          rows: [
            { type: 'Received', amount: '+50', address: 'fLx9Dz…3Nk7Wr', time: '1d ago' },
            { type: 'Sent', amount: '−8.25', address: 'fHt6Jq…2Yp5Ms', time: '1d ago' },
          ],
        },
      ].map((group) => (
        <div key={group.day} className="mb-2">
          <p className="mb-1 px-4 text-xs font-semibold uppercase text-muted-foreground">
            {group.day}
          </p>
          {group.rows.map((row) => (
            <div key={row.address} className="flex items-center px-4 py-3.5">
              <span
                className={`mr-3 flex size-11 items-center justify-center rounded-full ${row.type === 'Received' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
              >
                <WalletGlyph name={row.type === 'Received' ? 'arrow-down' : 'arrow-up'} size={20} />
              </span>
              <div className="mr-3 flex-1">
                <p className="text-sm font-medium">{row.type}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.address}</p>
              </div>
              <div className="text-right">
                <p
                  className={`flex items-center justify-end gap-1 text-sm font-semibold ${row.type === 'Received' ? 'text-primary' : 'text-destructive'}`}
                >
                  {row.amount}
                  <FairCoinMark size={13} />
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{row.time}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function WalletOverview() {
  return (
    <div className="pt-3 pb-2">
      <div className="px-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          FairCoin price
        </p>
        <div className="mt-1.5 flex items-end gap-3">
          <p className="fairwallet-amount text-[40px] font-black leading-tight">$0.49</p>
          <span className="mb-2 text-base font-semibold text-muted-foreground">0.0%</span>
        </div>
      </div>
      <svg aria-hidden="true" viewBox="0 0 390 120" className="mt-5 h-[120px] w-full text-primary">
        <path
          d="M0 76 L18 71 34 75 50 67 70 72 90 62 110 68 130 59 150 65 170 57 190 62 210 54 230 60 250 52 270 57 290 48 310 54 330 50 350 55 370 49 390 52"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <circle cx="386" cy="51" r="4" fill="currentColor" />
      </svg>
      <div className="mx-5 my-7 h-px bg-border" />
      <div className="px-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Staking rewards
        </p>
        <p className="mt-2 text-[15px] leading-5 text-muted-foreground">
          Your staking rewards will appear here.
        </p>
      </div>
      <div className="mx-5 my-7 h-px bg-border" />
      <div className="px-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Network
        </p>
        <div className="mt-3 flex justify-between text-[15px]">
          <span className="text-muted-foreground">Connection</span>
          <span className="font-semibold">Synced</span>
        </div>
      </div>
    </div>
  );
}

export function WalletNavigation() {
  return (
    <div className="absolute inset-x-3 bottom-4 flex h-[58px] items-center justify-around rounded-full bg-background/55 p-1 backdrop-blur-[24px] backdrop-saturate-[180%]">
      {(['Wallet', 'Places', 'Buy', 'Settings'] as const).map((label, i) => (
        <div
          key={label}
          className={`flex h-[48px] w-[88px] flex-col items-center justify-center gap-0.5 rounded-full ${i === 0 ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
        >
          <WalletGlyph
            name={
              (['wallet', 'map-outline', 'credit-card-plus-outline', 'cog-outline'] as const)[i]
            }
            size={21}
          />
          <span className="text-[9.5px] font-medium leading-3">{label}</span>
        </div>
      ))}
    </div>
  );
}

export function WalletPockets() {
  return (
    <div className="absolute inset-0 bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <WalletGlyph name="arrow-left" size={24} />
        <h3 className="text-lg font-semibold">Pockets</h3>
        <span className="flex size-9 items-center justify-center rounded-full bg-surface">
          <WalletGlyph name="plus" size={20} />
        </span>
      </div>
      <div className="px-5 pt-2 pb-8">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total across pockets
          </p>
          <p className="mt-1 text-4xl font-bold">512.7 FAIR</p>
          <p className="mt-1.5 text-sm text-muted-foreground">3 pockets</p>
        </div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your pockets
          </p>
          <span className="text-[13px] font-semibold text-primary">Move coins</span>
        </div>
        {[
          { name: 'Main', balance: '312.7', initial: 'M', goal: false },
          { name: 'Community', balance: '100', initial: 'C', goal: true },
          { name: 'Shared plans', balance: '100', initial: 'S', goal: true },
        ].map((p, i) => (
          <div key={p.name} className="mb-3 flex items-center rounded-2xl bg-surface px-4 py-3.5">
            <span
              className={`mr-3.5 flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${i === 0 ? 'bg-primary text-primary-foreground' : i === 1 ? 'bg-secondary text-secondary-foreground' : 'bg-tertiary text-tertiary-foreground'}`}
            >
              {p.initial}
            </span>
            <div className="mr-3 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[15.5px] font-semibold">{p.name}</p>
                {!p.goal && (
                  <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                    Main
                  </span>
                )}
              </div>
              {p.goal ? (
                <div className="mt-2.5">
                  <div className="h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full w-1/2 rounded-full ${i === 1 ? 'bg-secondary' : 'bg-tertiary'}`}
                    />
                  </div>
                  <p className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>100 / 200 FAIR</span>
                    <span>50%</span>
                  </p>
                </div>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">Your day-to-day pocket</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-base font-bold">{p.balance}</p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">FAIR</p>
            </div>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-border px-4 py-3.5">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WalletGlyph name="plus" />
          </span>
          <div>
            <p className="text-[15px] font-semibold">Create a pocket</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Set money aside for what matters</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WalletSendSheet() {
  return (
    <>
      <div className="mx-auto mt-2 mb-5 h-1 w-10 rounded-full bg-muted-foreground/30" />
      <div className="mx-5 flex rounded-full bg-surface p-1 text-center text-sm font-semibold">
        <span className="flex-1 rounded-full bg-primary py-2.5 text-primary-foreground">Send</span>
        <span className="flex-1 py-2.5 text-muted-foreground">Receive</span>
      </div>
      <div className="space-y-6 px-5 pt-5 pb-6">
        <div className="flex flex-col items-center pt-2 pb-1">
          <div className="flex items-end justify-center">
            <FairCoinMark size={38} className="mr-1.5 mb-2.5" />
            <span className="fairwallet-amount text-[64px] font-black leading-[1.2]">12.5</span>
          </div>
          <span className="mt-3 rounded-full bg-surface px-4 py-1.5 text-xs font-bold tracking-wide text-primary">
            MAX
          </span>
          <p className="mt-3 text-sm text-muted-foreground">≈ $6.14</p>
          <p className="mt-1 text-xs text-muted-foreground">Available: 512.7 FAIR</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Send to
          </p>
          <div className="mt-2 rounded-2xl bg-surface px-4 py-3.5 text-base text-muted-foreground">
            FairCoin address
          </div>
          <div className="mt-2.5 flex gap-2">
            {(['Scan', 'Contacts', 'My wallets'] as const).map((label, i) => (
              <span
                key={label}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface px-3 py-2.5 text-xs font-semibold text-primary"
              >
                <WalletGlyph
                  name={(['qrcode-scan', 'account-outline', 'wallet-outline'] as const)[i]}
                  size={16}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Network fee
          </p>
          <div className="mt-2 flex gap-2">
            {['Low', 'Normal', 'High'].map((label, i) => (
              <div
                key={label}
                className={`flex-1 py-3 text-center ${i === 1 ? 'rounded-full bg-primary/15 text-primary' : 'rounded-2xl bg-surface'}`}
              >
                <p className="text-sm font-semibold">{label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {[1000, 2000, 4000][i]} m⊜
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-full bg-primary py-3 text-center text-base font-semibold text-primary-foreground">
          Send
        </div>
      </div>
    </>
  );
}

export function WalletLock({ filled }: { filled: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between bg-background px-6 pt-16 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center">
        <img
          src="/images/fairwallet/app-icon.png"
          alt=""
          className="mb-6 size-[88px] rounded-[20px]"
        />
        <p className="mb-8 text-xl font-semibold">Enter your passcode</p>
        <div className="flex gap-5">
          {[0, 1, 2, 3, 4, 5].map((position) => (
            <span
              key={position}
              className={`size-3.5 rounded-full ${position < filled ? 'bg-primary' : 'border-2 border-border'}`}
            />
          ))}
        </div>
        <div className="mt-4 h-12" />
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-4 pb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'back'].map((key) => (
          <span
            key={key}
            className="flex size-[72px] items-center justify-center rounded-full text-3xl font-light"
          >
            {key === 'bio' ? (
              <WalletGlyph name="fingerprint" size={28} className="text-primary" />
            ) : key === 'back' ? (
              <WalletGlyph name="backspace-outline" size={26} className="text-muted-foreground" />
            ) : (
              key
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
