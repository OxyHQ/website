import HomiioWheelHero from './HomiioWheelHero'
import HomiioFAQ from './HomiioFAQ'

export default function HomiioContent() {
  return (
    <>
      <HomiioWheelHero />
      <div className="bg-[#FFF7D8]">
        <HomiioFAQ />
      </div>
    </>
  )
}
