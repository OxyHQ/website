import { PlaceAmenities } from '@oxy.so/bloom/place-details'

export default function PlaceDetailsExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><PlaceAmenities items={[{label:"Wi-Fi",description:"Free throughout the space"},{label:"Outdoor seating"},{label:"Step-free access"}]} /></div>)
}
