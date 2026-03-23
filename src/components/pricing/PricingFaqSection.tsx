import { useState } from 'react'
import { faqItems } from '../../data/pricing'

export default function PricingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="">
      <div className="container">
        <div className="border-border grid grid-cols-12 gap-x-6 pt-20 lg:pt-32 xl:pt-44 pb-16 lg:pb-24 xl:pb-32">
          <div className="col-span-12 xl:col-start-2 xl:col-end-12">
            <div className="space-y-4 lg:space-y-6 mx-auto max-w-2xl">
              <h2
                id="faq"
                className="pr-6 text-heading-responsive-md text-foreground"
              >
                Frequently asked questions.
              </h2>

              <div data-orientation="vertical">
                {faqItems.map((item, index) => {
                  const isOpen = openIndex === index
                  return (
                    <div
                      key={index}
                      data-state={isOpen ? 'open' : 'closed'}
                      data-orientation="vertical"
                      className="relative border-border border-b py-7 text-base"
                    >
                      <h3 data-orientation="vertical" data-state={isOpen ? 'open' : 'closed'}>
                        <button
                          onClick={() => toggle(index)}
                          className="group -mx-2 -my-1.5 flex w-[calc(100%+12px)] cursor-pointer items-start justify-between gap-x-6 rounded-xl px-2 py-1.5 text-left outline-hidden focus-visible:ring-3"
                        >
                          <span className="font-semibold text-foreground">
                            {item.question}
                          </span>
                          <svg
                            width="19.2"
                            height="12"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="mt-1.25 shrink-0 text-muted-foreground transition-colors duration-400 ease-in-out group-hover:text-foreground group-hover:duration-150 group-active:text-foreground group-active:duration-50 group-data-open:text-foreground"
                          >
                            <line x1="0" y1="0.75" x2="20%" y2="0.75" />
                            <line x1="0.75" y1="0" x2="0.75" y2="100%" />
                            <line x1="0" y1="11.25" x2="20%" y2="11.25" />
                            <line x1="6" y1="50%" x2="13.2" y2="50%" />
                            <line
                              x1="50%"
                              y1="2.4"
                              x2="50%"
                              y2="9.6"
                              className="origin-center transition-scale ease-in-out"
                              style={{
                                transitionDuration: '0.4s',
                                transform: isOpen ? 'scaleY(0)' : 'scaleY(1)',
                              }}
                            />
                            <line x1="80%" y1="0.75" x2="100%" y2="0.75" />
                            <line x1="18.45" y1="0" x2="18.45" y2="100%" />
                            <line x1="80%" y1="11.25" x2="100%" y2="11.25" />
                          </svg>
                        </button>
                      </h3>
                      <div
                        className="pr-2 lg:pr-16 overflow-hidden"
                        style={{
                          display: 'grid',
                          gridTemplateRows: isOpen ? '1fr' : '0fr',
                          transition: 'grid-template-rows 0.4s ease-in-out',
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div className="pt-3 pb-1">
                            <p className="text-muted-foreground">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
