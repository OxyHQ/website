import { CarrierQuoteCard } from '@oxy.so/bloom/carrier-quote'

export default function CarrierQuoteExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><CarrierQuoteCard quote={{id:"1",carrier:{id:"alex",name:"Alex Rivera",rating:4.9,vehicle:"Cargo bike"},price:"€18.00",eta:"25 minutes",pickupWindow:"Today, 14:00–15:00"}} /></div>)
}
