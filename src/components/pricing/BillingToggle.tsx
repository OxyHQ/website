import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control'
import type { StyleProp, ViewStyle } from 'react-native'

interface BillingToggleProps {
  isAnnual: boolean
  onChange: (isAnnual: boolean) => void
  style?: StyleProp<ViewStyle>
}

export default function BillingToggle({ isAnnual, onChange, style }: BillingToggleProps) {
  return (
    <SegmentedControl
      label="Billing period"
      style={style}
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
