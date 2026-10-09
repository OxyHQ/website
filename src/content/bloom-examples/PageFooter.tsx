import { PageFooter } from '@oxy.so/bloom/page-footer'
import { Button } from '@oxy.so/bloom/button'

export default function PageFooterExample() {
  
  return (<div className="w-full max-w-lg space-y-4 text-foreground"><div className="relative h-32"><PageFooter safeArea={false} actions={<Button>Save changes</Button>}><p>Ready to publish</p></PageFooter></div></div>)
}
