import { Card, CardHeader, CardBody, CardFooter, CardTitle, CardDescription } from '@oxyhq/bloom/card'
import { PrimaryButton } from '@oxyhq/bloom/button'
import type { CardVariant } from '@oxyhq/bloom/card'
import type { PlaygroundValues } from './_playground'

export const meta = {
  description: 'Container surface with optional header, body, and footer slots.',
}

export default function CardDemo() {
  return (
    <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Soft drop shadow on a flat surface.</CardDescription>
        </CardHeader>
        <CardBody>
          <p>Cards group related information into a single tap target.</p>
        </CardBody>
        <CardFooter>
          <PrimaryButton size="small">Action</PrimaryButton>
        </CardFooter>
      </Card>
      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Outlined</CardTitle>
          <CardDescription>Border-only chrome for low emphasis.</CardDescription>
        </CardHeader>
        <CardBody>
          <p>Best for dense layouts where shadows are noisy.</p>
        </CardBody>
      </Card>
    </div>
  )
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const variant = values.variant as CardVariant
  const title = typeof values.title === 'string' ? values.title : 'Card title'
  const description = typeof values.description === 'string' ? values.description : ''
  const body = typeof values.body === 'string' ? values.body : ''
  return (
    <Card variant={variant} style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {body ? (
        <CardBody>
          <p>{body}</p>
        </CardBody>
      ) : null}
    </Card>
  )
}
