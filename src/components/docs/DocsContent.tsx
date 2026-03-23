import { docsCards } from '../../data/docs';

function CardIcon({ icon }: { icon: 'react' | 'server' | 'sparkles' }) {
  switch (icon) {
    case 'react':
      return (
        <svg className="h-6 w-6" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
          <circle cx="0" cy="0" r="2.05" />
          <g stroke="currentColor" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      );
    case 'server':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
          <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
          <line x1="6" x2="6.01" y1="6" y2="6" />
          <line x1="6" x2="6.01" y1="18" y2="18" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          <path d="M5 3v4" />
          <path d="M19 17v4" />
          <path d="M3 5h4" />
          <path d="M17 19h4" />
        </svg>
      );
  }
}

export default function DocsContent() {
  return (
    <div
      className="relative grow box-border flex-col w-full mx-auto px-1 lg:pl-[23.7rem] lg:-ml-12 xl:w-[calc(100%-28rem)]"
      id="content-area"
    >
      {/* Header */}
      <header id="header" className="relative leading-none">
        <div className="mt-0.5 space-y-2.5">
          <div className="eyebrow h-5 text-[#818cf8] text-sm font-semibold">Get started</div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center relative gap-2 min-w-0">
            <h1
              id="page-title"
              className="text-2xl sm:text-3xl text-gray-200 tracking-tight [overflow-wrap:anywhere] font-bold break-all"
            >
              Overview
            </h1>
          </div>
        </div>
        <div className="mt-2 text-lg prose prose-invert [&>*]:[overflow-wrap:anywhere]">
          <p>Start building Oxy Apps</p>
        </div>
      </header>

      {/* Content */}
      <div className="relative mt-8 mb-14 prose prose-invert [contain:inline-size] isolate">
        <p>
          Oxy is a revolutionary CRM platform which is highly customisable, incredibly powerful and
          data-driven. In these guides, you can find everything you need to build powerful
          integrations, automations and data pipelines on top of Oxy.
        </p>
        <p>
          Our docs cover guides, examples, references and code to help you build apps and share them
          with Oxy's customers or for your own workspace.
        </p>
        <p>The Oxy Developer Platform consists of three parts:</p>

        {docsCards.map((card) => (
          <div
            key={card.title}
            className="card block font-normal group relative my-2 ring-2 ring-transparent rounded-2xl bg-[#0f1117] border border-white/10 overflow-hidden w-full cursor-pointer hover:!border-[#818cf8]"
            tabIndex={0}
            role="link"
          >
            <div className="px-6 py-5 relative">
              <a
                href={card.href}
                tabIndex={-1}
                aria-hidden="true"
                style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }}
              >
                <div className="h-6 w-6 text-gray-100">
                  <CardIcon icon={card.icon} />
                </div>
                <div className="w-full">
                  <h2 className="not-prose font-semibold text-base text-white mt-4">
                    {card.title}
                  </h2>
                  <div className="prose mt-1 font-normal text-base leading-6 text-gray-400">
                    <p>{card.description}</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        ))}

        <p>You can use both the App SDK and REST API in your app to build rich experiences.</p>
      </div>

      {/* Footer */}
      <footer
        id="footer"
        className="flex gap-12 justify-between pt-10 border-t border-gray-800/50 sm:flex pb-28"
      >
        <div></div>
        <a
          href="#"
          className="group flex items-center gap-3 text-base font-semibold text-gray-300 hover:text-gray-100"
        >
          Quickstart
          <svg
            viewBox="0 0 3 6"
            className="overflow-visible w-auto h-1.5 text-gray-600 group-hover:text-gray-300"
          >
            <path
              d="M0 0L3 3L0 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </footer>
    </div>
  );
}
