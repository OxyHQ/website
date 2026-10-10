import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardDescription,
} from '@oxy.so/bloom/card';
import { Button } from '@oxy.so/bloom/button';
import type { BloomAppearance } from '@oxy.so/bloom/appearance';
import type { PlaygroundValues } from './_playground';

export const meta = {
  description: 'Container surface with optional header, body, and footer slots.',
};

export default function CardDemo() {
  return (
    <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
      <Card appearance="solid">
        <CardHeader>
          <CardTitle>Solid</CardTitle>
          <CardDescription>Soft drop shadow on a flat surface.</CardDescription>
        </CardHeader>
        <CardBody>
          <p>Cards group related information into a single tap target.</p>
        </CardBody>
        <CardFooter>
          <Button appearance="solid" tone="accent" size="sm">
            Action
          </Button>
        </CardFooter>
      </Card>
      <Card appearance="outline">
        <CardHeader>
          <CardTitle>Outline</CardTitle>
          <CardDescription>Border-only chrome for low emphasis.</CardDescription>
        </CardHeader>
        <CardBody>
          <p>Best for dense layouts where shadows are noisy.</p>
        </CardBody>
      </Card>
    </div>
  );
}

export function Playground({ values }: { values: PlaygroundValues }) {
  const appearance = values.appearance as BloomAppearance;
  const title = typeof values.title === 'string' ? values.title : 'Card title';
  const description = typeof values.description === 'string' ? values.description : '';
  const body = typeof values.body === 'string' ? values.body : '';
  return (
    <Card appearance={appearance} style={{ width: 320 }}>
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
  );
}
