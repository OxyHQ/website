import { useState } from 'react';
import { RiCheckLine } from '@oxy.so/bloom/icons/RiCheckLine';
import { RiKey2Line } from '@oxy.so/bloom/icons/RiKey2Line';
import { RiShieldCheckLine } from '@oxy.so/bloom/icons/RiShieldCheckLine';
import { RiUserLine } from '@oxy.so/bloom/icons/RiUserLine';
import { COMMONS_APPS } from './commonsData';
import { CommonsMark, Fingerprint } from './CommonsIllustrations';
import { Link } from '../../lib/navigation';

/** Illustrative UI, based on the native app. Never requests or creates an identity. */
export default function CommonsPreviews() {
  const [flipped, setFlipped] = useState(false);
  return (
    <section
      id="commons-identity"
      className="commons-roadmap relative"
      aria-labelledby="commons-inside-heading"
    >
      <div
        className="commons-roadmap-heading mx-auto flex flex-col items-center gap-8 px-8 text-center"
        data-commons-reveal
      >
        <div className="flex flex-col items-center gap-6">
          <h2 id="commons-inside-heading" className="commons-serif commons-section-heading">
            A little app.
            <br />A whole lot of you.
          </h2>
          <p className="commons-body max-w-lg text-muted-foreground">
            Your Oxy ID, the people who vouch for you, and the access you approve. Together in
            Commons.
          </p>
        </div>
        <a href="#commons-faq" className="commons-pill">
          Get to know Commons
        </a>
      </div>
      <div className="commons-roadmap-artwork">
        <div className="commons-roadmap-canvas">
          <article className="commons-preview commons-preview-reputation" data-depth="0.85">
            <div className="flex items-center justify-between">
              <h3>Reputation</h3>
              <RiShieldCheckLine fill="currentColor" width={22} height={22} />
            </div>
            <div className="commons-preview-tabs">
              <span>Overview</span>
              <span>Activity</span>
            </div>
            <h4>Your standing</h4>
            <p className="commons-preview-description">Trust built through real connections.</p>
            <div className="commons-reputation-bars" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            {['Personhood', 'Attestations', 'Vouches', 'Validations'].map((label, i) => (
              <div className="commons-preview-row" key={label}>
                <span className="commons-small-symbol">
                  <RiCheckLine fill="currentColor" width={16} height={16} />
                </span>
                <span>{label}</span>
                <span className="ml-auto text-muted-foreground">0{i + 1}</span>
              </div>
            ))}
            <p className="commons-preview-caption">Illustrative preview</p>
          </article>
          <article className="commons-preview commons-preview-approval" data-depth="0.65">
            <img
              src={COMMONS_APPS[0].image}
              alt="Mention"
              className="mb-5 size-14 rounded-2xl"
              loading="lazy"
            />
            <h3>Sign in to Mention</h3>
            <p className="commons-preview-description">
              mention.earth
              <br />
              Chrome on your computer
            </p>
            <div className="commons-preview-permission">
              <RiShieldCheckLine fill="currentColor" width={22} height={22} />
              <div>
                <strong>You choose what to share</strong>
                <p>Review the app and its permissions.</p>
              </div>
            </div>
            <div className="commons-preview-action">
              <Fingerprint />
              Confirm identity
            </div>
            <p className="commons-preview-caption">Sign-in preview · no request is being made</p>
          </article>
          <article className="commons-preview commons-preview-credentials" data-depth="0.45">
            <h3>Your credentials</h3>
            <p className="commons-preview-description">The proofs that belong to you.</p>
            {['Identity', 'Personhood', 'Attestations'].map((label) => (
              <div key={label} className="commons-credential">
                <RiShieldCheckLine fill="currentColor" width={28} height={28} />
                <div>
                  <strong>{label}</strong>
                  <p>View credential details</p>
                </div>
                <RiCheckLine fill="currentColor" width={18} height={18} />
              </div>
            ))}
            <p className="commons-preview-caption">Illustrative preview</p>
          </article>
          <div className="commons-preview-id" data-depth="0.8">
            <button
              type="button"
              className="commons-id-button"
              onClick={() => setFlipped(!flipped)}
              aria-label={
                flipped ? 'Show the front of the example Oxy ID' : 'Turn over the example Oxy ID'
              }
              aria-pressed={flipped}
            >
              <span className="commons-id-flipper" data-flipped={flipped}>
                <span className="commons-id-face commons-id-front">
                  <span className="flex items-center justify-between">
                    <CommonsMark />
                    <span className="text-xs tracking-widest">IDENTITY CARD</span>
                  </span>
                  <span className="commons-id-portrait">
                    <RiUserLine fill="currentColor" width={60} height={60} />
                    <span>
                      <small>NAME</small>
                      <strong>You.</strong>
                      <small>TYPE</small>
                      <span>SELF-CUSTODY</span>
                    </span>
                  </span>
                  <span className="commons-id-field">
                    <small>YOUR IDENTITY</small>
                    <strong>Oxy ID</strong>
                  </span>
                  <span className="commons-id-field">
                    <small>CONTROLLED BY</small>
                    <strong>You, and only you.</strong>
                  </span>
                  <span className="commons-id-mrz">
                    {'IDOXY<<YOUR<IDENTITY<<<'}
                    <br />
                    {'YOURS<<TO<KEEP<<<<<<<<<'}
                  </span>
                  <span className="commons-id-specimen">EXAMPLE CARD · TAP TO FLIP</span>
                </span>
                <span className="commons-id-face commons-id-back">
                  <CommonsMark />
                  <strong>
                    Your identity.
                    <br />
                    Your key.
                  </strong>
                  <Fingerprint />
                  <span>
                    Your public identity can be verified.
                    <br />
                    Your private key stays with you.
                  </span>
                  <small>EXAMPLE CARD · TAP TO FLIP</small>
                </span>
              </span>
            </button>
          </div>
          <article className="commons-preview commons-preview-recovery" data-depth="0.55">
            <RiKey2Line fill="currentColor" width={30} height={30} />
            <h3>
              A new device.
              <br />
              The same identity.
            </h3>
            <p className="commons-preview-description">
              Keep your 12 recovery words safe and offline.
            </p>
            <div className="commons-recovery-grid" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>
                  <small>{i + 1}</small>••••••
                </span>
              ))}
            </div>
            <p className="commons-preview-caption">
              Never enter your recovery phrase on this website.
            </p>
          </article>
          <article className="commons-preview commons-preview-connections" data-depth="0.7">
            <h3>Your Oxy world</h3>
            {COMMONS_APPS.slice(0, 4).map((app) => (
              <div className="commons-preview-row" key={app.name}>
                <img src={app.image} alt="" loading="lazy" />
                <span>{app.name}</span>
                <span className="ml-auto">
                  <RiCheckLine fill="currentColor" width={18} height={18} />
                </span>
              </div>
            ))}
            <p className="commons-preview-caption">One identity across the ecosystem.</p>
          </article>
          <div className="commons-preview-human" data-depth="0.5">
            <img
              src="/images/landing/commons-night.webp"
              alt="Commons and Oxy lighting up a neighbourhood"
              loading="lazy"
            />
            <p>
              Your identity.
              <br />
              Your Oxy world.
            </p>
          </div>
          <div className="commons-preview-signature" data-depth="0.9">
            <Fingerprint />
            <span>Signed by you.</span>
            <RiCheckLine fill="currentColor" width={22} height={22} />
          </div>
          <Link to="/developers/docs/" className="commons-preview-developer" data-depth="0.6">
            <code>Sign in with Oxy</code>
            <span>Build with Commons ↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
