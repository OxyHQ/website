import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CareersHeroSection from '../components/careers/CareersHeroSection'
import CulturePhotosSection from '../components/careers/CulturePhotosSection'
import JoinTeamSection from '../components/careers/JoinTeamSection'
import TeamSizeSection from '../components/careers/TeamSizeSection'
import ValuesSection from '../components/careers/ValuesSection'
import OpenPositionsSection from '../components/careers/OpenPositionsSection'
import RightRoleSection from '../components/careers/RightRoleSection'
import KeepUpToDateSection from '../components/careers/KeepUpToDateSection'

export default function CareersPage() {
  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-primary-background">
      <Navbar />
      <main>
        <CareersHeroSection />
        <CulturePhotosSection />
        <JoinTeamSection />
        <TeamSizeSection />
        <ValuesSection />
        <OpenPositionsSection />
        <RightRoleSection />
        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
