import { AdmonitionRoot, AdmonitionRow, AdmonitionIcon, AdmonitionContent, AdmonitionText } from '@oxy.so/bloom/admonition'

export default function AdmonitionExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <AdmonitionRoot type="tip"><AdmonitionRow><AdmonitionIcon /><AdmonitionContent><AdmonitionText>Your changes are saved automatically.</AdmonitionText></AdmonitionContent></AdmonitionRow></AdmonitionRoot>
    </div>
  )
}
