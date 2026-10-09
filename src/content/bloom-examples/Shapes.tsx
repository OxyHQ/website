import { Image } from '@oxy.so/bloom/shapes'

export default function ShapesExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><div className="flex gap-4"><Image size={96} shape="circle" source={{uri:"/images/pricing/oxy-one-hero.png"}} alt="Circular Oxy artwork" /><Image size={96} shape="squircle" source={{uri:"/images/pricing/oxy-one-hero.png"}} alt="Squircle Oxy artwork" /></div></div>)
}
