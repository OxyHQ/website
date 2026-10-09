import { NotificationCenter } from '@oxy.so/bloom/notification-center'

export default function NotificationCenterExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><NotificationCenter notifications={[{id:"1",category:"mentions",group:"Today",title:"Alex mentioned you",description:"The new collection is ready to review.",timestamp:"5m",unread:true,avatar:{name:"Alex Rivera"}}]} /></div>)
}
