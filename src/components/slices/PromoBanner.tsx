import UnderlineLink from './UnderlineLink'

interface PromoBannerProps {
  title: string
  paragraphs: string[]
  link?: { label: string; href: string; external?: boolean }
  image: { src: string; alt: string }
  /** Puts the artwork on the left from `md` up. */
  reversed?: boolean
}

/** Copy on one side, artwork on the other — the slice for spotlighting one thing. */
export default function PromoBanner({ title, paragraphs, link, image, reversed }: PromoBannerProps) {
  return (
    <section
      className={`text-gray-a1 layout-padding-top layout-px-large flex flex-col-reverse md:justify-between md:items-center gap-10 lg:gap-20 ${
        reversed ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}
    >
      <div className="flex flex-col">
        <h2 className="text-h4 md:max-w-150">{title}</h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-b1 pt-8 lg:pt-6 md:max-w-125">
            {paragraph}
          </p>
        ))}
        {link && (
          <UnderlineLink href={link.href} external={link.external} className="text-b1 w-fit mt-10 lg:mt-12">
            {link.label}
          </UnderlineLink>
        )}
      </div>
      <div className="max-md:flex max-md:justify-center shrink-0">
        <img
          alt={image.alt}
          loading="lazy"
          decoding="async"
          className="w-full lg:max-h-113 lg:w-auto 2xl:h-113 object-contain"
          src={image.src}
        />
      </div>
    </section>
  )
}
