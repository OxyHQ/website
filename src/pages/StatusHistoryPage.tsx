import { useParams } from 'react-router-dom'
import { Link } from '../lib/navigation'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import SEO from '../components/SEO'
import { useIncidentHistory } from '../api/hooks'
import IncidentCard from '../components/status/IncidentCard'

export default function StatusHistoryPage() {
  const { page: pageParam } = useParams<{ page: string }>()
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const { data, isLoading } = useIncidentHistory(page)

  return (
    <div className="flex min-h-screen max-w-screen flex-col overflow-x-clip bg-background">
      <SEO
        title="Notice history"
        description="Monthly history of every Oxy incident and notice, with dated updates from investigation to resolution."
        canonicalPath={`/history/${page}`}
      />
      <Navbar />

      <main className="flex-1">
        <section className="container">
          <div>
            <div className="grid grid-cols-12">
              <div className="col-span-full pt-24 pb-10 max-lg:pt-20 max-lg:pb-8">
                <h1 className="text-heading-responsive-lg text-foreground">Notice history</h1>
                <p className="mt-3 max-w-2xl text-pretty text-lg text-muted-foreground">
                  {data?.label ?? (isLoading ? 'Loading…' : '')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 pb-20">
              <div className="col-span-full flex flex-col gap-4">
                {data && data.incidents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notices reported this month.</p>
                )}
                {(data?.incidents ?? []).map((incident) => (
                  <IncidentCard key={incident._id} incident={incident} />
                ))}
              </div>

              <div className="col-span-full mt-4 flex items-center justify-between border-t border-border pt-6">
                <Link
                  to={`/history/${page + 1}`}
                  className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  ← Older
                </Link>
                <span className="text-xs text-muted-foreground">
                  {data ? `${data.page} of ${data.pages}` : ''}
                </span>
                {page > 1 ? (
                  <Link
                    to={`/history/${page - 1}`}
                    className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Newer →
                  </Link>
                ) : (
                  <Link
                    to="/status"
                    className="text-sm font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    Current status →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
