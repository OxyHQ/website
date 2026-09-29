import { FaqList } from '../sections/FaqSection'
import { faqItems } from '../../data/pricing'

export default function PricingFaqSection() {
  return (
    <section>
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

              <FaqList
                items={faqItems}
                idPrefix="pricing-faq"
                questionClassName="font-semibold text-foreground"
                answerClassName="pt-3 pb-1 pr-2 text-base text-muted-foreground lg:pr-16"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
