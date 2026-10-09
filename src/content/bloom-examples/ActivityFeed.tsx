import { ActivityFeed } from '@oxy.so/bloom/activity-feed'

export default function ActivityFeedExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ActivityFeed entries={[{id:"1",kind:"note",title:"Design review",actor:{name:"Alex Rivera"},day:"Today",timestamp:"10:30",body:"The new navigation is ready to review."},{id:"2",kind:"task",title:"Updated the component library",actor:{name:"Sam Chen"},day:"Today",timestamp:"09:15"}]} />
    </div>
  )
}
