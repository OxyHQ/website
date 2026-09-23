import HomiioWheelHero from './HomiioWheelHero'
import HomiioSpiral from './HomiioSpiral'
import HomiioFAQ from './HomiioFAQ'

export default function HomiioContent() {
  return (
    <>
      {/* The illustrated scenes are one fixed daytime picture, light whatever
          the site's toggle says (`.homiio-landing-theme` in src/theme/brands.ts).
          The FAQ below is ordinary page content and follows the toggle. */}
      <div className="homiio-landing-theme">
        <HomiioWheelHero />
        <HomiioSpiral />
      </div>
      <HomiioFAQ />
    </>
  )
}
