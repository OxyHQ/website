import { JobCard } from '@oxy.so/bloom/job-board'

export default function JobBoardExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><JobCard job={{id:"1",load:"Two small parcels",pay:"€24.00",pickup:{title:"Central studio"},dropoff:{title:"Riverside workshop"},distance:"4.2 km",duration:"20 minutes"}} /></div>)
}
