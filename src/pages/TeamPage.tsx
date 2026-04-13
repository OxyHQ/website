import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import Button from '../components/ui/Button'
import KeepUpToDateSection from '../components/sections/KeepUpToDateSection'
import { useTeamMembers } from '../api/hooks'

function DashedHLine() {
  return (
    <svg width="100%" height="1" className="text-border">
      <line x1="0" y1="0.5" x2="100%" y2="0.5" stroke="currentColor" strokeDasharray="4 6" strokeLinecap="round" />
    </svg>
  )
}

export default function TeamPage() {
  const { data: members = [], isPending } = useTeamMembers()

  // Group by department
  const departments = members.reduce<Record<string, typeof members>>((acc, m) => {
    const dept = m.department || 'Team'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(m)
    return acc
  }, {})

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Team"
        description="Meet the people building Oxy. Our global, remote-first team is passionate about ethical technology and open source."
        canonicalPath="/company/team"
      />
      <Navbar />
      <main>
        {/* ═══ Hero ═══ */}
        <section className="container">
          <div className="lg:border-border lg:border-x">
            <header className="grid grid-cols-12 pt-40 pb-20 max-xl:pt-30 max-xl:pb-16 max-lg:pt-25 max-lg:pb-15 justify-items-center">
              <div className="col-[2/-2] flex flex-col items-center gap-4 text-center">
                <div className="inline-block w-fit rounded-[13px] border border-border bg-background px-3 py-1.5 font-medium text-[13px]/[1.4em] text-foreground mb-6">
                  Our Team
                </div>
                <h1 className="text-balance text-heading-responsive-lg max-w-[15em]">
                  The people behind Oxy
                </h1>
                <p className="mt-4 max-w-xl text-balance text-lg text-foreground lg:text-xl">
                  A global, remote-first team building ethical technology and open-source tools.
                </p>
                <div className="mt-7">
                  <Button variant="outline" size="md" responsive href="/company/careers">
                    Join us
                  </Button>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* ═══ Team Grid ═══ */}
        <section className="container">
          <div className="border-border border-x">
            <DashedHLine />

            {isPending ? (
              <div className="grid grid-cols-12">
                <div className="col-[2/-2] py-20">
                  <div className="grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="bg-background p-8">
                        <div className="size-16 animate-pulse rounded-full bg-surface" />
                        <div className="mt-4 h-4 w-32 animate-pulse rounded bg-surface" />
                        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-surface" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              Object.entries(departments).map(([dept, deptMembers]) => (
                <div key={dept}>
                  {/* Department header */}
                  <div className="grid grid-cols-12">
                    <div className="col-[2/-2] py-6">
                      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">{dept}</h2>
                    </div>
                  </div>
                  <DashedHLine />

                  {/* Members grid — pixel-gap pattern */}
                  <div className="grid grid-cols-12">
                    <div className="col-[2/-2] grid gap-px bg-border p-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {deptMembers.map((member) => (
                        <div key={member.slug} className="flex flex-col bg-background p-8">
                          <div className="size-16 shrink-0 rounded-full bg-surface border border-border overflow-hidden">
                            {member.avatar && (
                              <img src={member.avatar} alt={member.name} className="size-full object-cover" loading="lazy" />
                            )}
                          </div>
                          <h3 className="mt-4 font-medium text-foreground">{member.name}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{member.role}</p>
                          {member.bio && (
                            <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-3">{member.bio}</p>
                          )}
                          {member.socials && (
                            <div className="mt-4 flex gap-3">
                              {member.socials.linkedin && (
                                <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="LinkedIn">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M4.5 3C3.67 3 3 3.67 3 4.5S3.67 6 4.5 6 6 5.33 6 4.5 5.33 3 4.5 3zM3 8h3v9H3V8zm5.5 0H11v1.23C11.6 8.46 12.5 8 13.5 8c2.21 0 3.5 1.45 3.5 3.99V17h-3v-4.5c0-1.12-.5-1.75-1.5-1.75S11 11.38 11 12.5V17H8.5V8z" /></svg>
                                </a>
                              )}
                              {member.socials.github && (
                                <a href={member.socials.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="GitHub">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5A8.5 8.5 0 0 0 7.31 18c.43.08.58-.18.58-.4v-1.54c-2.36.51-2.86-1-2.86-1a2.26 2.26 0 0 0-.94-1.24c-.77-.53.06-.52.06-.52a1.78 1.78 0 0 1 1.3.87 1.8 1.8 0 0 0 2.46.7 1.8 1.8 0 0 1 .54-1.13c-1.89-.21-3.87-.94-3.87-4.2a3.28 3.28 0 0 1 .88-2.28 3.05 3.05 0 0 1 .08-2.25s.72-.23 2.35.87a8.11 8.11 0 0 1 4.27 0c1.63-1.1 2.35-.87 2.35-.87a3.05 3.05 0 0 1 .08 2.25 3.28 3.28 0 0 1 .88 2.28c0 3.27-1.99 3.99-3.88 4.2a2.01 2.01 0 0 1 .58 1.56v2.31c0 .23.15.49.59.4A8.5 8.5 0 0 0 10 1.5z" /></svg>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <DashedHLine />
                </div>
              ))
            )}

            <div className="h-20" aria-hidden="true" />
          </div>
        </section>

        <KeepUpToDateSection />
      </main>
      <Footer />
    </div>
  )
}
