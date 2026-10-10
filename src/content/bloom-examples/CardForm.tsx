import { CardFormName, CardFormExpiry } from '@oxy.so/bloom/card-form';

export default function CardFormExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <>
        <CardFormName />
        <CardFormExpiry />
      </>
    </div>
  );
}
