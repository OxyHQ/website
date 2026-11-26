import { View } from 'react-native';
import { BlurIsland } from '@oxy.so/bloom/blur';
import { Button } from '@oxy.so/bloom/button';
import { RiFilterLine } from '@oxy.so/bloom/icons/RiFilterLine';
import { RiSearchLine } from '@oxy.so/bloom/icons/RiSearchLine';

export default function BlurExample() {
  return (
    <div className="w-full max-w-lg text-foreground">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BlurIsland>
          <Button
            iconOnly
            appearance="plain"
            material="shared"
            icon={RiFilterLine}
            accessibilityLabel="Filter"
          />
        </BlurIsland>
        <View style={{ flex: 1 }}>
          <BlurIsland style={{ alignSelf: 'stretch' }}>
            <Button appearance="plain" material="shared" style={{ flex: 1 }}>
              Inbox
            </Button>
          </BlurIsland>
        </View>
        <BlurIsland>
          <Button
            iconOnly
            appearance="plain"
            material="shared"
            icon={RiSearchLine}
            accessibilityLabel="Search"
          />
        </BlurIsland>
      </View>
    </div>
  );
}
