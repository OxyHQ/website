import { EarningsSummary } from '@oxy.so/bloom/earnings'

export default function EarningsExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><EarningsSummary periods={[{id:"week",label:"This week",total:"€482.00",deltaRatio:0.12,bars:[{label:"Mon",value:70,amount:"€70"},{label:"Tue",value:95,amount:"€95"},{label:"Wed",value:65,amount:"€65"},{label:"Thu",value:112,amount:"€112"},{label:"Fri",value:140,amount:"€140"}]}]} /></div>)
}
