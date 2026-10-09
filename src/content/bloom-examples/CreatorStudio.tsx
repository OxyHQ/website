import { useState } from 'react'
import { AudienceOverview } from '@oxy.so/bloom/creator-studio'

export default function CreatorStudioExample() {
  const [period,setPeriod]=useState("28d")
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><AudienceOverview period={period} onPeriodChange={setPeriod} metrics={[{kind:"listeners",label:"Listeners",value:"12,480",delta:"+18%",trend:"up",series:[4,7,5,9,8,12]}]} /></div>)
}
