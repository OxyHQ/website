import HomiioWheelHero from './HomiioWheelHero'
import HomiioSpiral from './HomiioSpiral'
import HomiioFAQ from './HomiioFAQ'

export default function HomiioContent() {
  return (
    <>
      <HomiioWheelHero />
      <HomiioSpiral />
      <div className="bg-[#FFF7D8]">
        <HomiioFAQ />
      </div>
    </>
  )
}
