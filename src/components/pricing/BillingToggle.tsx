import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'

interface BillingToggleProps {
  isAnnual: boolean
  onChange: (isAnnual: boolean) => void
}

export default function BillingToggle({ isAnnual, onChange }: BillingToggleProps) {
  return (
    <SegmentedControl
      label="Billing period"
      type="radio"
      value={isAnnual ? 'annual' : 'monthly'}
      onValueChange={(next) => onChange(next === 'annual')}
    >
      <SegmentedControlItem value="monthly">
        <SegmentedControlItemText>Monthly</SegmentedControlItemText>
      </SegmentedControlItem>
      <SegmentedControlItem value="annual">
        <SegmentedControlItemText>Annual</SegmentedControlItemText>
      </SegmentedControlItem>
    </SegmentedControl>
  )
}
