import { Carousel, CarouselItem } from '@oxy.so/bloom/carousel';

export default function CarouselExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Carousel accessibilityLabel="Featured landscapes">
        {['Morning light', 'Open skies', 'New horizons'].map((title) => (
          <CarouselItem key={title}>
            <div className="rounded-2xl bg-secondary p-8 text-secondary-foreground">{title}</div>
          </CarouselItem>
        ))}
      </Carousel>
    </div>
  );
}
