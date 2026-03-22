import type { ReactNode } from 'react'
import Container from './Container'

interface SectionProps {
  children: ReactNode
  className?: string
  containerClassName?: string
  withBorders?: boolean
  id?: string
}

export default function Section({
  children,
  className = '',
  containerClassName = '',
  withBorders = false,
  id,
}: SectionProps) {
  return (
    <section className={className} id={id}>
      <Container className={containerClassName}>
        {withBorders ? (
          <div className="border-x border-subtle-stroke px-6 lg:px-10">
            {children}
          </div>
        ) : (
          children
        )}
      </Container>
    </section>
  )
}
