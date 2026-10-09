import { ContentPanel } from '@oxy.so/bloom/content-panel'

export default function ContentPanelExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <ContentPanel><h3 className="text-lg font-medium">Your workspace</h3><p>Keep your ideas and projects together.</p></ContentPanel>
    </div>
  )
}
